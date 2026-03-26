import type { CalculatorState } from '../state';
import { renderUnitInput, wireUnitInput } from './unit-input';

export type StateChangeCallback = (state: CalculatorState) => void;

export function renderQueryExport(
  container: HTMLElement,
  state: CalculatorState,
  onChange: StateChangeCallback,
): void {
  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header">
        <h3 class="Box-title">Query &amp; Export Costs</h3>
      </div>
      <div class="Box-body">
        <p class="text-small color-fg-muted mb-3">
          Querying Basic/Auxiliary logs costs $0.005/GB scanned.
          These inputs are optional — leave at 0 if not applicable.
        </p>
        <div class="d-flex flex-wrap" style="gap: 24px;">
          ${renderUnitInput('query-ba', 'Basic/Auxiliary query scanned', state.queryBasicAuxGbPerMonth)}
          ${renderUnitInput('search-jobs', 'Search jobs scanned', state.searchJobsGbPerMonth)}
          ${renderUnitInput('data-export', 'Data export', state.dataExportGbPerMonth)}
          ${renderUnitInput('platform-logs', 'Platform logs to Storage/EventHub', state.platformLogsGbPerMonth)}
        </div>
      </div>
    </div>
  `;

  const sync = () => onChange(state);

  wireUnitInput(container, 'query-ba', (gb) => { state.queryBasicAuxGbPerMonth = gb; sync(); });
  wireUnitInput(container, 'search-jobs', (gb) => { state.searchJobsGbPerMonth = gb; sync(); });
  wireUnitInput(container, 'data-export', (gb) => { state.dataExportGbPerMonth = gb; sync(); });
  wireUnitInput(container, 'platform-logs', (gb) => { state.platformLogsGbPerMonth = gb; sync(); });
}
