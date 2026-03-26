import type { CalculatorState } from '../state';
import { PRICING } from '../pricing-data';
import { number as fmtNum } from '../format';
import { renderUnitInput, wireUnitInput } from './unit-input';

export type ScenarioBOverrides = Partial<CalculatorState>;
export type OverrideChangeCallback = (overrides: ScenarioBOverrides) => void;

/**
 * Renders the Scenario B overrides panel.
 * Each field has a checkbox — unchecked = inherit from A.
 */
export function renderScenarioB(
  container: HTMLElement,
  stateA: CalculatorState,
  overrides: ScenarioBOverrides,
  onChange: OverrideChangeCallback,
): void {
  const tiers = PRICING.ingestion.analytics.commitmentTiers;

  // Effective values: override or fallback to A
  const disc = overrides.discountPercent ?? stateA.discountPercent;
  const grow = overrides.growthPercent ?? stateA.growthPercent;
  const vol = overrides.totalGbPerDay ?? stateA.totalGbPerDay;
  const ana = overrides.analyticsPercent ?? stateA.analyticsPercent;
  const bas = overrides.basicPercent ?? stateA.basicPercent;
  const aux = overrides.auxiliaryPercent ?? stateA.auxiliaryPercent;
  const tier = overrides.commitmentTier ?? stateA.commitmentTier;
  const retAnaInt = overrides.retentionAnalyticsInteractiveDays ?? stateA.retentionAnalyticsInteractiveDays;
  const retAnaLt = overrides.retentionAnalyticsLongTermDays ?? stateA.retentionAnalyticsLongTermDays;
  const retBasLt = overrides.retentionBasicLongTermDays ?? stateA.retentionBasicLongTermDays;
  const retAuxLt = overrides.retentionAuxiliaryLongTermDays ?? stateA.retentionAuxiliaryLongTermDays;
  const qba = overrides.queryBasicAuxGbPerMonth ?? stateA.queryBasicAuxGbPerMonth;
  const sj = overrides.searchJobsGbPerMonth ?? stateA.searchJobsGbPerMonth;
  const exp = overrides.dataExportGbPerMonth ?? stateA.dataExportGbPerMonth;
  const plat = overrides.platformLogsGbPerMonth ?? stateA.platformLogsGbPerMonth;

  const includedAnalytics = PRICING.retention.included.analyticsDays;

  function field(key: string, label: string, content: string): string {
    const isOverridden = key in overrides;
    return `
      <div class="mb-3 p-2 rounded-2" style="border: 1px solid ${isOverridden ? '#bf8700' : 'transparent'}; background: ${isOverridden ? 'rgba(191,135,0,0.04)' : 'transparent'};">
        <label class="d-flex flex-items-center text-small mb-1" style="gap: 6px; cursor: pointer;">
          <input type="checkbox" class="sb-toggle" data-key="${key}" ${isOverridden ? 'checked' : ''}>
          <strong>${label}</strong>
          ${!isOverridden ? '<span class="color-fg-muted">(inherits from A)</span>' : '<span style="color: #bf8700;">overridden</span>'}
        </label>
        <div class="sb-field" data-key="${key}" style="${isOverridden ? '' : 'opacity: 0.4; pointer-events: none;'}">
          ${content}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="Box mb-3" style="border-color: #bf8700;">
      <div class="Box-header" style="background: rgba(191,135,0,0.08);">
        <h3 class="Box-title">🅱️ Scenario B — Overrides</h3>
        <p class="text-small color-fg-muted mb-0">Check a field to override it. Unchecked fields inherit from Scenario A.</p>
      </div>
      <div class="Box-body">
        <div class="d-flex flex-wrap" style="gap: 16px;">

          <div style="flex: 1; min-width: 220px;">
            <h4 class="f6 color-fg-muted mb-2">Global</h4>

            ${field('discountPercent', 'Discount %', `
              <input class="form-control input-sm" type="number" id="sb-disc" min="0" max="100" step="1" value="${disc}" style="width: 80px;">
            `)}

            ${field('growthPercent', 'MoM Growth %', `
              <input class="form-control input-sm" type="number" id="sb-grow" min="0" max="100" step="0.5" value="${grow}" style="width: 80px;">
            `)}
          </div>

          <div style="flex: 1; min-width: 280px;">
            <h4 class="f6 color-fg-muted mb-2">Ingestion</h4>

            ${field('totalGbPerDay', 'Total Volume', renderUnitInput('sb-vol', '', vol, { suffix: '/day' }))}

            ${field('analyticsPercent', 'Plan Split', `
              <div class="d-flex flex-wrap" style="gap: 12px;">
                <div>
                  <label class="text-small">Analytics %</label>
                  <input class="form-control input-sm" type="number" id="sb-ana" min="0" max="100" value="${ana}" style="width: 70px;">
                </div>
                <div>
                  <label class="text-small">Basic %</label>
                  <input class="form-control input-sm" type="number" id="sb-bas" min="0" max="100" value="${bas}" style="width: 70px;">
                </div>
                <div>
                  <label class="text-small">Auxiliary %</label>
                  <input class="form-control input-sm" type="number" id="sb-aux" min="0" max="100" value="${aux}" style="width: 70px;">
                </div>
              </div>
            `)}

            ${field('commitmentTier', 'Commitment Tier', `
              <select class="form-select input-sm" id="sb-tier" style="max-width: 280px;">
                <option value="auto" ${tier === 'auto' ? 'selected' : ''}>Auto (best price)</option>
                <option value="payg" ${tier === 'payg' ? 'selected' : ''}>Pay-As-You-Go</option>
                ${tiers.map(t => `
                  <option value="${t.gbPerDay}" ${tier === t.gbPerDay ? 'selected' : ''}>
                    ${fmtNum(t.gbPerDay, 0)} GB/day ($${t.effectivePerGb}/GB)
                  </option>
                `).join('')}
              </select>
            `)}
          </div>

          <div style="flex: 1; min-width: 280px;">
            <h4 class="f6 color-fg-muted mb-2">Retention</h4>

            ${field('retentionAnalyticsInteractiveDays', 'Analytics Interactive', `
              <div class="d-flex flex-items-center" style="gap: 8px;">
                <input type="range" id="sb-ret-ana-int" min="${includedAnalytics}" max="730" value="${includedAnalytics + retAnaInt}" style="flex: 1; accent-color: #bf8700;">
                <span class="text-small text-mono" id="sb-ret-ana-int-label">${includedAnalytics + retAnaInt} days</span>
              </div>
            `)}

            ${field('retentionAnalyticsLongTermDays', 'Analytics Long-Term', `
              <div class="d-flex flex-items-center" style="gap: 8px;">
                <input type="range" id="sb-ret-ana-lt" min="0" max="144" value="${Math.round(retAnaLt / 30)}" style="flex: 1; accent-color: #bf8700;">
                <span class="text-small text-mono" id="sb-ret-ana-lt-label">${Math.round(retAnaLt / 30)} mo</span>
              </div>
            `)}

            ${field('retentionBasicLongTermDays', 'Basic Long-Term', `
              <div class="d-flex flex-items-center" style="gap: 8px;">
                <input type="range" id="sb-ret-bas-lt" min="1" max="144" value="${1 + Math.round(retBasLt / 30)}" style="flex: 1; accent-color: #bf8700;">
                <span class="text-small text-mono" id="sb-ret-bas-lt-label">${1 + Math.round(retBasLt / 30)} mo</span>
              </div>
            `)}

            ${field('retentionAuxiliaryLongTermDays', 'Auxiliary Long-Term', `
              <div class="d-flex flex-items-center" style="gap: 8px;">
                <input type="range" id="sb-ret-aux-lt" min="1" max="144" value="${1 + Math.round(retAuxLt / 30)}" style="flex: 1; accent-color: #bf8700;">
                <span class="text-small text-mono" id="sb-ret-aux-lt-label">${1 + Math.round(retAuxLt / 30)} mo</span>
              </div>
            `)}
          </div>

          <div style="flex: 1; min-width: 220px;">
            <h4 class="f6 color-fg-muted mb-2">Query &amp; Export</h4>
            ${field('queryBasicAuxGbPerMonth', 'Query scanned', renderUnitInput('sb-qba', '', qba))}
            ${field('searchJobsGbPerMonth', 'Search jobs', renderUnitInput('sb-sj', '', sj))}
            ${field('dataExportGbPerMonth', 'Data export', renderUnitInput('sb-exp', '', exp))}
            ${field('platformLogsGbPerMonth', 'Platform logs', renderUnitInput('sb-plat', '', plat))}
          </div>
        </div>
      </div>
    </div>
  `;

  // --- Wire up override toggles ---
  const toggles = container.querySelectorAll<HTMLInputElement>('.sb-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      const key = toggle.dataset.key!;
      if (!toggle.checked) {
        delete (overrides as any)[key];
        // If removing plan split, remove all three
        if (key === 'analyticsPercent') {
          delete overrides.basicPercent;
          delete overrides.auxiliaryPercent;
        }
      } else {
        // Initialize override with current A value
        (overrides as any)[key] = (stateA as any)[key];
        if (key === 'analyticsPercent') {
          overrides.basicPercent = stateA.basicPercent;
          overrides.auxiliaryPercent = stateA.auxiliaryPercent;
        }
      }
      // Re-render to update visual state
      renderScenarioB(container, stateA, overrides, onChange);
      onChange(overrides);
    });
  });

  // --- Wire up value inputs (only fire if overridden) ---

  // Global: Discount
  if ('discountPercent' in overrides) {
    const discInput = container.querySelector('#sb-disc') as HTMLInputElement;
    discInput?.addEventListener('input', () => {
      overrides.discountPercent = parseFloat(discInput.value) || 0;
      onChange(overrides);
    });
  }

  // Global: Growth
  if ('growthPercent' in overrides) {
    const growInput = container.querySelector('#sb-grow') as HTMLInputElement;
    growInput?.addEventListener('input', () => {
      overrides.growthPercent = parseFloat(growInput.value) || 0;
      onChange(overrides);
    });
  }

  // Volume
  if ('totalGbPerDay' in overrides) {
    wireUnitInput(container, 'sb-vol', (gb) => {
      overrides.totalGbPerDay = gb;
      onChange(overrides);
    });
  }

  // Plan split
  if ('analyticsPercent' in overrides) {
    const anaInput = container.querySelector('#sb-ana') as HTMLInputElement;
    const basInput = container.querySelector('#sb-bas') as HTMLInputElement;
    const auxInput = container.querySelector('#sb-aux') as HTMLInputElement;
    [anaInput, basInput, auxInput].forEach(input => {
      input?.addEventListener('input', () => {
        overrides.analyticsPercent = parseInt(anaInput.value) || 0;
        overrides.basicPercent = parseInt(basInput.value) || 0;
        overrides.auxiliaryPercent = parseInt(auxInput.value) || 0;
        onChange(overrides);
      });
    });
  }

  // Commitment tier
  if ('commitmentTier' in overrides) {
    const tierSel = container.querySelector('#sb-tier') as HTMLSelectElement;
    tierSel?.addEventListener('change', () => {
      const v = tierSel.value;
      overrides.commitmentTier = v === 'auto' || v === 'payg' ? v : parseFloat(v);
      onChange(overrides);
    });
  }

  // Retention sliders
  const retentionMap: [string, string, string, number][] = [
    ['retentionAnalyticsInteractiveDays', 'sb-ret-ana-int', 'sb-ret-ana-int-label', -includedAnalytics],
    ['retentionAnalyticsLongTermDays', 'sb-ret-ana-lt', 'sb-ret-ana-lt-label', 0],
    ['retentionBasicLongTermDays', 'sb-ret-bas-lt', 'sb-ret-bas-lt-label', -1],
    ['retentionAuxiliaryLongTermDays', 'sb-ret-aux-lt', 'sb-ret-aux-lt-label', -1],
  ];

  retentionMap.forEach(([key, sliderId, labelId, offset]) => {
    if (!(key in overrides)) return;
    const slider = container.querySelector(`#${sliderId}`) as HTMLInputElement;
    const label = container.querySelector(`#${labelId}`) as HTMLElement;
    slider?.addEventListener('input', () => {
      const raw = parseInt(slider.value) || 0;
      if (key === 'retentionAnalyticsInteractiveDays') {
        (overrides as any)[key] = Math.max(0, raw + offset);
        label.textContent = `${raw} days`;
      } else {
        (overrides as any)[key] = Math.max(0, raw + offset) * 30;
        label.textContent = `${raw} mo`;
      }
      onChange(overrides);
    });
  });

  // Query & Export
  const qeMap: [string, string][] = [
    ['queryBasicAuxGbPerMonth', 'sb-qba'],
    ['searchJobsGbPerMonth', 'sb-sj'],
    ['dataExportGbPerMonth', 'sb-exp'],
    ['platformLogsGbPerMonth', 'sb-plat'],
  ];
  qeMap.forEach(([key, id]) => {
    if (!(key in overrides)) return;
    wireUnitInput(container, id, (gb) => {
      (overrides as any)[key] = gb;
      onChange(overrides);
    });
  });
}
