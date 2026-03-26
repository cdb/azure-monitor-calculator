import type { CalculatorState } from '../state';
import { PRICING } from '../pricing-data';

export type StateChangeCallback = (state: CalculatorState) => void;

/**
 * Build the retention configuration panel.
 */
export function renderRetentionConfig(
  container: HTMLElement,
  state: CalculatorState,
  onChange: StateChangeCallback,
): void {
  const includedAnalytics = state.sentinelEnabled
    ? PRICING.retention.included.analyticsSentinelDays
    : PRICING.retention.included.analyticsDays;

  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header">
        <h3 class="Box-title">Retention Configuration</h3>
      </div>
      <div class="Box-body">
        <p class="text-small color-fg-muted mb-3">
          Configure retention days <strong>beyond</strong> the free included period.
          Interactive retention: $${PRICING.retention.interactive.perGbPerMonth}/GB/month.
          Long-term retention: $${PRICING.retention.longTerm.perGbPerMonth}/GB/month.
        </p>

        <div class="d-flex flex-wrap" style="gap: 24px;">
          <div style="flex: 1; min-width: 250px;">
            <h4 class="f5 mb-2"><span style="color: #8250df;">●</span> Analytics Logs</h4>
            <p class="text-small color-fg-muted mb-2">Included: ${includedAnalytics} days free</p>

            <div class="form-group mb-2">
              <div class="form-group-header">
                <label for="ret-ana-int">Extra interactive retention (days)</label>
              </div>
              <div class="form-group-body">
                <input class="form-control input-sm" type="number" id="ret-ana-int"
                  min="0" max="${730 - includedAnalytics}" step="1"
                  value="${state.retentionAnalyticsInteractiveDays}" style="width: 100px;">
                <p class="note">Up to ${730 - includedAnalytics} additional days (total ${730} days max)</p>
              </div>
            </div>

            <div class="form-group">
              <div class="form-group-header">
                <label for="ret-ana-lt">Long-term retention (days)</label>
              </div>
              <div class="form-group-body">
                <input class="form-control input-sm" type="number" id="ret-ana-lt"
                  min="0" max="4380" step="30"
                  value="${state.retentionAnalyticsLongTermDays}" style="width: 100px;">
                <p class="note">Up to 12 years (4,380 days)</p>
              </div>
            </div>
          </div>

          <div style="flex: 1; min-width: 200px;">
            <h4 class="f5 mb-2"><span style="color: #1a7f37;">●</span> Basic Logs</h4>
            <p class="text-small color-fg-muted mb-2">Included: ${PRICING.retention.included.basicDays} days free</p>

            <div class="form-group">
              <div class="form-group-header">
                <label for="ret-bas-lt">Long-term retention (days)</label>
              </div>
              <div class="form-group-body">
                <input class="form-control input-sm" type="number" id="ret-bas-lt"
                  min="0" max="4380" step="30"
                  value="${state.retentionBasicLongTermDays}" style="width: 100px;">
              </div>
            </div>
          </div>

          <div style="flex: 1; min-width: 200px;">
            <h4 class="f5 mb-2"><span style="color: #0969da;">●</span> Auxiliary Logs</h4>
            <p class="text-small color-fg-muted mb-2">Included: ${PRICING.retention.included.auxiliaryDays} days free</p>

            <div class="form-group">
              <div class="form-group-header">
                <label for="ret-aux-lt">Long-term retention (days)</label>
              </div>
              <div class="form-group-body">
                <input class="form-control input-sm" type="number" id="ret-aux-lt"
                  min="0" max="4380" step="30"
                  value="${state.retentionAuxiliaryLongTermDays}" style="width: 100px;">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Wire events
  const retAnaInt = container.querySelector('#ret-ana-int') as HTMLInputElement;
  const retAnaLt = container.querySelector('#ret-ana-lt') as HTMLInputElement;
  const retBasLt = container.querySelector('#ret-bas-lt') as HTMLInputElement;
  const retAuxLt = container.querySelector('#ret-aux-lt') as HTMLInputElement;

  const sync = () => {
    state.retentionAnalyticsInteractiveDays = parseInt(retAnaInt.value) || 0;
    state.retentionAnalyticsLongTermDays = parseInt(retAnaLt.value) || 0;
    state.retentionBasicLongTermDays = parseInt(retBasLt.value) || 0;
    state.retentionAuxiliaryLongTermDays = parseInt(retAuxLt.value) || 0;
    onChange(state);
  };

  retAnaInt.addEventListener('input', sync);
  retAnaLt.addEventListener('input', sync);
  retBasLt.addEventListener('input', sync);
  retAuxLt.addEventListener('input', sync);
}
