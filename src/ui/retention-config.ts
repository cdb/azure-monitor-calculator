import type { CalculatorState } from '../state';
import { PRICING } from '../pricing-data';

export type StateChangeCallback = (state: CalculatorState) => void;

export function renderRetentionConfig(
  container: HTMLElement,
  state: CalculatorState,
  onChange: StateChangeCallback,
): void {
  const includedAnalytics = state.sentinelEnabled
    ? PRICING.retention.included.analyticsSentinelDays
    : PRICING.retention.included.analyticsDays;

  // Convert long-term days to months for display (round to nearest month)
  const anaLtMonths = Math.round(state.retentionAnalyticsLongTermDays / 30);
  const basLtMonths = Math.round(state.retentionBasicLongTermDays / 30);
  const auxLtMonths = Math.round(state.retentionAuxiliaryLongTermDays / 30);

  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header">
        <h3 class="Box-title">Retention</h3>
      </div>
      <div class="Box-body">
        <p class="text-small color-fg-muted mb-3">
          Configure retention <strong>beyond</strong> the free included period.
          Interactive: $${PRICING.retention.interactive.perGbPerMonth}/GB/month &middot;
          Long-term: $${PRICING.retention.longTerm.perGbPerMonth}/GB/month
        </p>

        <div class="d-flex flex-wrap" style="gap: 32px;">

          <!-- Analytics -->
          <div style="flex: 1; min-width: 250px;">
            <h4 class="f5 mb-2"><span style="color: #8250df;">●</span> Analytics Logs</h4>
            <p class="text-small color-fg-muted mb-2">Included free: ${includedAnalytics} days</p>

            <div class="mb-3">
              <label class="text-small d-block mb-1">
                Extra interactive retention:
                <strong id="ret-ana-int-label">${state.retentionAnalyticsInteractiveDays} days</strong>
                <span class="color-fg-muted">(total ${includedAnalytics + state.retentionAnalyticsInteractiveDays} days)</span>
              </label>
              <input type="range" id="ret-ana-int" min="0" max="${730 - includedAnalytics}" step="1"
                value="${state.retentionAnalyticsInteractiveDays}"
                style="width: 100%; accent-color: #8250df;">
              <div class="d-flex flex-justify-between text-small color-fg-muted">
                <span>0</span><span>${730 - includedAnalytics} days</span>
              </div>
            </div>

            <div>
              <label class="text-small d-block mb-1">
                Long-term retention:
                <strong id="ret-ana-lt-label">${anaLtMonths} months</strong>
                <span class="color-fg-muted">(${(anaLtMonths / 12).toFixed(1)} years)</span>
              </label>
              <input type="range" id="ret-ana-lt" min="0" max="144" step="1"
                value="${anaLtMonths}"
                style="width: 100%; accent-color: #8250df;">
              <div class="d-flex flex-justify-between text-small color-fg-muted">
                <span>0</span><span>144 months (12 yr)</span>
              </div>
            </div>
          </div>

          <!-- Basic -->
          <div style="flex: 1; min-width: 200px;">
            <h4 class="f5 mb-2"><span style="color: #1a7f37;">●</span> Basic Logs</h4>
            <p class="text-small color-fg-muted mb-2">Included free: ${PRICING.retention.included.basicDays} days</p>

            <div>
              <label class="text-small d-block mb-1">
                Long-term retention:
                <strong id="ret-bas-lt-label">${basLtMonths} months</strong>
                <span class="color-fg-muted">(${(basLtMonths / 12).toFixed(1)} years)</span>
              </label>
              <input type="range" id="ret-bas-lt" min="0" max="144" step="1"
                value="${basLtMonths}"
                style="width: 100%; accent-color: #1a7f37;">
              <div class="d-flex flex-justify-between text-small color-fg-muted">
                <span>0</span><span>144 months (12 yr)</span>
              </div>
            </div>
          </div>

          <!-- Auxiliary -->
          <div style="flex: 1; min-width: 200px;">
            <h4 class="f5 mb-2"><span style="color: #0969da;">●</span> Auxiliary Logs</h4>
            <p class="text-small color-fg-muted mb-2">Included free: ${PRICING.retention.included.auxiliaryDays} days</p>

            <div>
              <label class="text-small d-block mb-1">
                Long-term retention:
                <strong id="ret-aux-lt-label">${auxLtMonths} months</strong>
                <span class="color-fg-muted">(${(auxLtMonths / 12).toFixed(1)} years)</span>
              </label>
              <input type="range" id="ret-aux-lt" min="0" max="144" step="1"
                value="${auxLtMonths}"
                style="width: 100%; accent-color: #0969da;">
              <div class="d-flex flex-justify-between text-small color-fg-muted">
                <span>0</span><span>144 months (12 yr)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const retAnaInt = container.querySelector('#ret-ana-int') as HTMLInputElement;
  const retAnaIntLabel = container.querySelector('#ret-ana-int-label') as HTMLElement;
  const retAnaLt = container.querySelector('#ret-ana-lt') as HTMLInputElement;
  const retAnaLtLabel = container.querySelector('#ret-ana-lt-label') as HTMLElement;
  const retBasLt = container.querySelector('#ret-bas-lt') as HTMLInputElement;
  const retBasLtLabel = container.querySelector('#ret-bas-lt-label') as HTMLElement;
  const retAuxLt = container.querySelector('#ret-aux-lt') as HTMLInputElement;
  const retAuxLtLabel = container.querySelector('#ret-aux-lt-label') as HTMLElement;

  function updateLabels() {
    const intDays = parseInt(retAnaInt.value) || 0;
    retAnaIntLabel.parentElement!.innerHTML = `
      Extra interactive retention:
      <strong id="ret-ana-int-label">${intDays} days</strong>
      <span class="color-fg-muted">(total ${includedAnalytics + intDays} days)</span>
    `;

    const anaMonths = parseInt(retAnaLt.value) || 0;
    retAnaLtLabel.textContent = `${anaMonths} months`;
    retAnaLtLabel.parentElement!.querySelector('.color-fg-muted')!.textContent = `(${(anaMonths / 12).toFixed(1)} years)`;

    const basMonths = parseInt(retBasLt.value) || 0;
    retBasLtLabel.textContent = `${basMonths} months`;
    retBasLtLabel.parentElement!.querySelector('.color-fg-muted')!.textContent = `(${(basMonths / 12).toFixed(1)} years)`;

    const auxMonths = parseInt(retAuxLt.value) || 0;
    retAuxLtLabel.textContent = `${auxMonths} months`;
    retAuxLtLabel.parentElement!.querySelector('.color-fg-muted')!.textContent = `(${(auxMonths / 12).toFixed(1)} years)`;
  }

  const sync = () => {
    state.retentionAnalyticsInteractiveDays = parseInt(retAnaInt.value) || 0;
    state.retentionAnalyticsLongTermDays = (parseInt(retAnaLt.value) || 0) * 30;
    state.retentionBasicLongTermDays = (parseInt(retBasLt.value) || 0) * 30;
    state.retentionAuxiliaryLongTermDays = (parseInt(retAuxLt.value) || 0) * 30;
    updateLabels();
    onChange(state);
  };

  retAnaInt.addEventListener('input', sync);
  retAnaLt.addEventListener('input', sync);
  retBasLt.addEventListener('input', sync);
  retAuxLt.addEventListener('input', sync);
}
