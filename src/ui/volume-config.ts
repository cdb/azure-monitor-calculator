import type { CalculatorState } from '../state';
import { PRICING } from '../pricing-data';
import { number as fmtNum } from '../format';
import { findOptimalTier } from '../engine';
import { autoUnit, gbToDisplay, displayToGb, stepForUnit } from './unit-input';
import type { Unit } from './unit-input';

export type StateChangeCallback = (state: CalculatorState) => void;

const PLAN_DESCRIPTIONS: Record<string, string> = {
  analytics: 'Full KQL, alerts, insights, dashboards. Best for data you query frequently.',
  basic: 'Single-table KQL, alerting, 30-day interactive query. Lower cost for moderate-access data.',
  auxiliary: 'Cheapest ingestion. Search jobs for older data. Best for compliance and archive.',
};

export function renderVolumeConfig(
  container: HTMLElement,
  state: CalculatorState,
  onChange: StateChangeCallback,
): void {
  const tiers = PRICING.ingestion.analytics.commitmentTiers;

  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header">
        <h3 class="Box-title">Log Volume &amp; Plan Split</h3>
      </div>
      <div class="Box-body">
        <div class="form-group mb-3">
          <div class="form-group-header">
            <label for="total-volume">Total Daily Log Volume</label>
          </div>
          <div class="form-group-body d-flex flex-items-center" style="gap: 8px;">
            <input class="form-control" type="number" id="total-volume"
              min="0" step="${stepForUnit(autoUnit(state.totalGbPerDay))}"
              value="${gbToDisplay(state.totalGbPerDay, autoUnit(state.totalGbPerDay))}"
              style="max-width: 160px;">
            <select class="form-select input-sm" id="volume-unit" style="width: 100px;">
              <option value="GB" ${autoUnit(state.totalGbPerDay) === 'GB' ? 'selected' : ''}>GB/day</option>
              <option value="TB" ${autoUnit(state.totalGbPerDay) === 'TB' ? 'selected' : ''}>TB/day</option>
              <option value="PB" ${autoUnit(state.totalGbPerDay) === 'PB' ? 'selected' : ''}>PB/day</option>
            </select>
          </div>
        </div>

        <div class="d-flex flex-wrap" style="gap: 24px;">
          ${renderPlanSlider('analytics', 'Analytics Logs', state.analyticsPercent, '#8250df', PLAN_DESCRIPTIONS.analytics)}
          ${renderPlanSlider('basic', 'Basic Logs', state.basicPercent, '#1a7f37', PLAN_DESCRIPTIONS.basic)}
          ${renderPlanSlider('auxiliary', 'Auxiliary Logs', state.auxiliaryPercent, '#0969da', PLAN_DESCRIPTIONS.auxiliary)}
        </div>

        <div id="plan-split-bar" class="mt-3 mb-2" style="height: 24px; border-radius: 6px; overflow: hidden; display: flex; border: 1px solid var(--borderColor-default, #d0d7de);">
        </div>
        <p class="text-small color-fg-muted" id="split-summary"></p>

        <div class="form-group mt-3">
          <div class="form-group-header">
            <label for="commitment-tier">Analytics Commitment Tier</label>
          </div>
          <div class="form-group-body">
            <select class="form-select" id="commitment-tier" style="max-width: 300px;">
              <option value="auto" ${state.commitmentTier === 'auto' ? 'selected' : ''}>Auto (best price)</option>
              <option value="payg" ${state.commitmentTier === 'payg' ? 'selected' : ''}>Pay-As-You-Go ($${PRICING.ingestion.analytics.payg.perGb}/GB)</option>
              ${tiers.map(t => `
                <option value="${t.gbPerDay}" ${state.commitmentTier === t.gbPerDay ? 'selected' : ''}>
                  ${fmtNum(t.gbPerDay, 0)} GB/day — $${fmtNum(t.dailyPrice, 0)}/day ($${t.effectivePerGb}/GB, ${t.savingsPercent}% savings)
                </option>
              `).join('')}
            </select>
            <p class="note" id="tier-recommendation"></p>
          </div>
        </div>
      </div>
    </div>
  `;

  const totalInput = container.querySelector('#total-volume') as HTMLInputElement;
  const unitSelect = container.querySelector('#volume-unit') as HTMLSelectElement;
  const auxInput = container.querySelector('#auxiliary-pct') as HTMLInputElement;
  const auxSlider = container.querySelector('#auxiliary-slider') as HTMLInputElement;
  const basInput = container.querySelector('#basic-pct') as HTMLInputElement;
  const basSlider = container.querySelector('#basic-slider') as HTMLInputElement;
  const anaInput = container.querySelector('#analytics-pct') as HTMLInputElement;
  const anaSlider = container.querySelector('#analytics-slider') as HTMLInputElement;
  const tierSelect = container.querySelector('#commitment-tier') as HTMLSelectElement;

  function getDisplayValue(): number {
    return parseFloat(totalInput.value) || 0;
  }

  function currentUnit(): Unit {
    return unitSelect.value as Unit;
  }

  function formatVolume(gb: number): string {
    const unit = currentUnit();
    return `${fmtNum(gbToDisplay(gb, unit), unit === 'GB' ? 1 : 2)} ${unit}/day`;
  }

  function updateSplitBar() {
    const bar = container.querySelector('#plan-split-bar') as HTMLElement;
    const summary = container.querySelector('#split-summary') as HTMLElement;
    const total = state.totalGbPerDay;

    bar.innerHTML = `
      <div style="width: ${state.analyticsPercent}%; background: #8250df; transition: width 0.2s;" title="Analytics: ${state.analyticsPercent}%"></div>
      <div style="width: ${state.basicPercent}%; background: #1a7f37; transition: width 0.2s;" title="Basic: ${state.basicPercent}%"></div>
      <div style="width: ${state.auxiliaryPercent}%; background: #0969da; transition: width 0.2s;" title="Auxiliary: ${state.auxiliaryPercent}%"></div>
    `;

    summary.innerHTML = `
      <span style="color: #8250df;">■</span> Analytics: ${formatVolume(total * state.analyticsPercent / 100)} (${state.analyticsPercent}%)
      &nbsp;&nbsp;
      <span style="color: #1a7f37;">■</span> Basic: ${formatVolume(total * state.basicPercent / 100)} (${state.basicPercent}%)
      &nbsp;&nbsp;
      <span style="color: #0969da;">■</span> Auxiliary: ${formatVolume(total * state.auxiliaryPercent / 100)} (${state.auxiliaryPercent}%)
    `;
  }

  function updateEffectivePrice() {
    const el = container.querySelector('#analytics-price-label') as HTMLElement;
    if (!el) return;
    const analyticsGbPerDay = state.totalGbPerDay * (state.analyticsPercent / 100);

    if (state.commitmentTier === 'payg' || analyticsGbPerDay <= 0) {
      el.textContent = `($${PRICING.ingestion.analytics.payg.perGb.toFixed(2)}/GB)`;
      return;
    }

    const tier = state.commitmentTier === 'auto'
      ? findOptimalTier(analyticsGbPerDay)
      : PRICING.ingestion.analytics.commitmentTiers.find(t => t.gbPerDay === state.commitmentTier) ?? null;

    if (tier) {
      el.textContent = `(~$${tier.effectivePerGb.toFixed(2)}/GB)`;
    } else {
      el.textContent = `($${PRICING.ingestion.analytics.payg.perGb.toFixed(2)}/GB)`;
    }
  }

  function handlePlanChange(changed: 'auxiliary' | 'basic' | 'analytics') {
    const fields = { auxiliary: auxInput, basic: basInput, analytics: anaInput };
    const sliders = { auxiliary: auxSlider, basic: basSlider, analytics: anaSlider };
    const changedVal = Math.min(100, Math.max(0, parseFloat(fields[changed].value) || 0));
    const remaining = 100 - changedVal;

    const others = (['auxiliary', 'basic', 'analytics'] as const).filter(k => k !== changed);
    const otherSum = others.reduce((s, k) => s + (state as any)[`${k}Percent`], 0);

    if (otherSum > 0) {
      others.forEach(k => {
        const ratio = (state as any)[`${k}Percent`] / otherSum;
        const newVal = Math.round(remaining * ratio);
        (state as any)[`${k}Percent`] = newVal;
        fields[k].value = String(newVal);
        sliders[k].value = String(newVal);
      });
    } else {
      const each = Math.round(remaining / others.length);
      others.forEach((k, i) => {
        const val = i === 0 ? remaining - each : each;
        (state as any)[`${k}Percent`] = val;
        fields[k].value = String(val);
        sliders[k].value = String(val);
      });
    }

    (state as any)[`${changed}Percent`] = changedVal;
    fields[changed].value = String(changedVal);
    sliders[changed].value = String(changedVal);

    const sum = state.auxiliaryPercent + state.basicPercent + state.analyticsPercent;
    if (sum !== 100) {
      const diff = 100 - sum;
      const fixTarget = others[0];
      (state as any)[`${fixTarget}Percent`] += diff;
      fields[fixTarget].value = String((state as any)[`${fixTarget}Percent`]);
      sliders[fixTarget].value = String((state as any)[`${fixTarget}Percent`]);
    }

    updateSplitBar();
    updateEffectivePrice();
    onChange(state);
  }

  totalInput.addEventListener('input', () => {
    state.totalGbPerDay = displayToGb(getDisplayValue(), currentUnit());
    updateSplitBar();
    updateEffectivePrice();
    onChange(state);
  });

  unitSelect.addEventListener('change', () => {
    const gb = state.totalGbPerDay;
    const unit = currentUnit();
    totalInput.value = String(gbToDisplay(gb, unit));
    totalInput.step = stepForUnit(unit);
    updateSplitBar();
  });

  (['auxiliary', 'basic', 'analytics'] as const).forEach(plan => {
    const input = container.querySelector(`#${plan}-pct`) as HTMLInputElement;
    const slider = container.querySelector(`#${plan}-slider`) as HTMLInputElement;
    input.addEventListener('input', () => { slider.value = input.value; handlePlanChange(plan); });
    slider.addEventListener('input', () => { input.value = slider.value; handlePlanChange(plan); });
  });

  tierSelect.addEventListener('change', () => {
    const val = tierSelect.value;
    if (val === 'auto' || val === 'payg') {
      state.commitmentTier = val;
    } else {
      state.commitmentTier = parseFloat(val);
    }
    updateEffectivePrice();
    onChange(state);
  });

  updateSplitBar();
  updateEffectivePrice();
}

function renderPlanSlider(id: string, label: string, value: number, color: string, description: string): string {
  const prices: Record<string, string> = {
    analytics: `$${PRICING.ingestion.analytics.payg.perGb}/GB PAYG`,
    basic: `$${PRICING.ingestion.basic.perGb}/GB`,
    auxiliary: `$${PRICING.ingestion.auxiliary.perGb}/GB`,
  };
  const price = prices[id] || '';
  const priceId = id === 'analytics' ? ' id="analytics-price-label"' : '';
  return `
    <div class="form-group" style="min-width: 200px; flex: 1;">
      <div class="form-group-header">
        <label for="${id}-pct"><span style="color: ${color};">●</span> ${label} <span class="text-small color-fg-muted"${priceId}>(${price})</span></label>
      </div>
      <p class="text-small color-fg-muted mb-1" style="margin-top: -4px; line-height: 1.3;">${description}</p>
      <div class="form-group-body d-flex flex-items-center" style="gap: 8px;">
        <input class="form-control input-sm" type="number" id="${id}-pct"
          min="0" max="100" step="1" value="${value}" style="width: 70px;">
        <input type="range" id="${id}-slider" min="0" max="100" step="1"
          value="${value}" style="flex: 1; accent-color: ${color};">
      </div>
    </div>
  `;
}
