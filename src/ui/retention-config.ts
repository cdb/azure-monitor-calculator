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
  const includedBasicDays = PRICING.retention.included.basicDays;
  const includedAuxDays = PRICING.retention.included.auxiliaryDays;

  // Total values for sliders (free + extra)
  const anaIntTotal = includedAnalytics + state.retentionAnalyticsInteractiveDays;
  const anaLtMonths = Math.round(state.retentionAnalyticsLongTermDays / 30);
  const basLtTotalMonths = Math.round(includedBasicDays / 30) + Math.round(state.retentionBasicLongTermDays / 30);
  const auxLtTotalMonths = Math.round(includedAuxDays / 30) + Math.round(state.retentionAuxiliaryLongTermDays / 30);

  const basFreeMo = Math.round(includedBasicDays / 30);
  const auxFreeMo = Math.round(includedAuxDays / 30);

  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header">
        <h3 class="Box-title">Retention</h3>
      </div>
      <div class="Box-body">
        <p class="text-small color-fg-muted mb-3">
          Slide to set total retention period. The free included portion is shown — you only pay for time beyond it.
          Interactive: $${PRICING.retention.interactive.perGbPerMonth}/GB/month &middot;
          Long-term: $${PRICING.retention.longTerm.perGbPerMonth}/GB/month
        </p>

        <div class="d-flex flex-wrap" style="gap: 32px;">

          <!-- Analytics -->
          <div style="flex: 1; min-width: 250px;">
            <h4 class="f5 mb-2"><span style="color: #8250df;">●</span> Analytics Logs</h4>

            <div class="mb-3">
              <label class="text-small d-block mb-1">
                Interactive retention:
                <strong id="ret-ana-int-label">${anaIntTotal} days</strong>
                <span class="color-fg-muted" id="ret-ana-int-context">(${includedAnalytics} free${state.retentionAnalyticsInteractiveDays > 0 ? ` + ${state.retentionAnalyticsInteractiveDays} billed` : ''})</span>
              </label>
              <input type="range" id="ret-ana-int" min="${includedAnalytics}" max="730" step="1"
                value="${anaIntTotal}"
                style="width: 100%; accent-color: #8250df;">
              <div class="d-flex flex-justify-between text-small color-fg-muted">
                <span>${includedAnalytics} days (free)</span><span>730 days</span>
              </div>
            </div>

            <div>
              <label class="text-small d-block mb-1">
                Long-term retention:
                <strong id="ret-ana-lt-label">${anaLtMonths} months</strong>
                <span class="color-fg-muted" id="ret-ana-lt-context">${anaLtMonths > 0 ? `(${(anaLtMonths / 12).toFixed(1)} yr, all billed)` : '(none)'}</span>
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

            <div>
              <label class="text-small d-block mb-1">
                Total retention:
                <strong id="ret-bas-lt-label">${basLtTotalMonths} months</strong>
                <span class="color-fg-muted" id="ret-bas-lt-context">(${basFreeMo} free${state.retentionBasicLongTermDays > 0 ? ` + ${Math.round(state.retentionBasicLongTermDays / 30)} billed` : ''})</span>
              </label>
              <input type="range" id="ret-bas-lt" min="${basFreeMo}" max="144" step="1"
                value="${basLtTotalMonths}"
                style="width: 100%; accent-color: #1a7f37;">
              <div class="d-flex flex-justify-between text-small color-fg-muted">
                <span>${basFreeMo} mo (free)</span><span>144 months (12 yr)</span>
              </div>
            </div>
          </div>

          <!-- Auxiliary -->
          <div style="flex: 1; min-width: 200px;">
            <h4 class="f5 mb-2"><span style="color: #0969da;">●</span> Auxiliary Logs</h4>

            <div>
              <label class="text-small d-block mb-1">
                Total retention:
                <strong id="ret-aux-lt-label">${auxLtTotalMonths} months</strong>
                <span class="color-fg-muted" id="ret-aux-lt-context">(${auxFreeMo} free${state.retentionAuxiliaryLongTermDays > 0 ? ` + ${Math.round(state.retentionAuxiliaryLongTermDays / 30)} billed` : ''})</span>
              </label>
              <input type="range" id="ret-aux-lt" min="${auxFreeMo}" max="144" step="1"
                value="${auxLtTotalMonths}"
                style="width: 100%; accent-color: #0969da;">
              <div class="d-flex flex-justify-between text-small color-fg-muted">
                <span>${auxFreeMo} mo (free)</span><span>144 months (12 yr)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const retAnaInt = container.querySelector('#ret-ana-int') as HTMLInputElement;
  const retAnaLt = container.querySelector('#ret-ana-lt') as HTMLInputElement;
  const retBasLt = container.querySelector('#ret-bas-lt') as HTMLInputElement;
  const retAuxLt = container.querySelector('#ret-aux-lt') as HTMLInputElement;

  function updateLabels() {
    const intTotal = parseInt(retAnaInt.value) || includedAnalytics;
    const intExtra = intTotal - includedAnalytics;
    const intLabel = container.querySelector('#ret-ana-int-label') as HTMLElement;
    const intCtx = container.querySelector('#ret-ana-int-context') as HTMLElement;
    if (intLabel) intLabel.textContent = `${intTotal} days`;
    if (intCtx) intCtx.textContent = `(${includedAnalytics} free${intExtra > 0 ? ` + ${intExtra} billed` : ''})`;

    const anaLt = parseInt(retAnaLt.value) || 0;
    const anaLtLabel = container.querySelector('#ret-ana-lt-label') as HTMLElement;
    const anaLtCtx = container.querySelector('#ret-ana-lt-context') as HTMLElement;
    if (anaLtLabel) anaLtLabel.textContent = `${anaLt} months`;
    if (anaLtCtx) anaLtCtx.textContent = anaLt > 0 ? `(${(anaLt / 12).toFixed(1)} yr, all billed)` : '(none)';

    const basTotal = parseInt(retBasLt.value) || basFreeMo;
    const basExtra = basTotal - basFreeMo;
    const basLabel = container.querySelector('#ret-bas-lt-label') as HTMLElement;
    const basCtx = container.querySelector('#ret-bas-lt-context') as HTMLElement;
    if (basLabel) basLabel.textContent = `${basTotal} months`;
    if (basCtx) basCtx.textContent = `(${basFreeMo} free${basExtra > 0 ? ` + ${basExtra} billed` : ''})`;

    const auxTotal = parseInt(retAuxLt.value) || auxFreeMo;
    const auxExtra = auxTotal - auxFreeMo;
    const auxLabel = container.querySelector('#ret-aux-lt-label') as HTMLElement;
    const auxCtx = container.querySelector('#ret-aux-lt-context') as HTMLElement;
    if (auxLabel) auxLabel.textContent = `${auxTotal} months`;
    if (auxCtx) auxCtx.textContent = `(${auxFreeMo} free${auxExtra > 0 ? ` + ${auxExtra} billed` : ''})`;
  }

  const sync = () => {
    // Convert total slider values back to "extra beyond free" for state
    state.retentionAnalyticsInteractiveDays = Math.max(0, (parseInt(retAnaInt.value) || includedAnalytics) - includedAnalytics);
    state.retentionAnalyticsLongTermDays = (parseInt(retAnaLt.value) || 0) * 30;
    state.retentionBasicLongTermDays = Math.max(0, ((parseInt(retBasLt.value) || basFreeMo) - basFreeMo)) * 30;
    state.retentionAuxiliaryLongTermDays = Math.max(0, ((parseInt(retAuxLt.value) || auxFreeMo) - auxFreeMo)) * 30;
    updateLabels();
    onChange(state);
  };

  retAnaInt.addEventListener('input', sync);
  retAnaLt.addEventListener('input', sync);
  retBasLt.addEventListener('input', sync);
  retAuxLt.addEventListener('input', sync);
}
