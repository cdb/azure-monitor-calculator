import type { CalculatorState } from '../state';

export type StateChangeCallback = (state: CalculatorState) => void;

/**
 * Build the query & export cost inputs panel.
 */
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
          <div class="form-group" style="min-width: 200px;">
            <div class="form-group-header">
              <label for="query-ba">Basic/Auxiliary query (GB scanned/month)</label>
            </div>
            <div class="form-group-body">
              <input class="form-control input-sm" type="number" id="query-ba"
                min="0" step="100" value="${state.queryBasicAuxGbPerMonth}" style="width: 140px;">
            </div>
          </div>

          <div class="form-group" style="min-width: 200px;">
            <div class="form-group-header">
              <label for="search-jobs">Search jobs (GB scanned/month)</label>
            </div>
            <div class="form-group-body">
              <input class="form-control input-sm" type="number" id="search-jobs"
                min="0" step="100" value="${state.searchJobsGbPerMonth}" style="width: 140px;">
            </div>
          </div>

          <div class="form-group" style="min-width: 200px;">
            <div class="form-group-header">
              <label for="data-export">Data export (GB/month)</label>
            </div>
            <div class="form-group-body">
              <input class="form-control input-sm" type="number" id="data-export"
                min="0" step="100" value="${state.dataExportGbPerMonth}" style="width: 140px;">
            </div>
          </div>

          <div class="form-group" style="min-width: 200px;">
            <div class="form-group-header">
              <label for="platform-logs">Platform logs to Storage/EventHub (GB/month)</label>
            </div>
            <div class="form-group-body">
              <input class="form-control input-sm" type="number" id="platform-logs"
                min="0" step="100" value="${state.platformLogsGbPerMonth}" style="width: 140px;">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const queryBa = container.querySelector('#query-ba') as HTMLInputElement;
  const searchJobs = container.querySelector('#search-jobs') as HTMLInputElement;
  const dataExport = container.querySelector('#data-export') as HTMLInputElement;
  const platformLogs = container.querySelector('#platform-logs') as HTMLInputElement;

  const sync = () => {
    state.queryBasicAuxGbPerMonth = parseFloat(queryBa.value) || 0;
    state.searchJobsGbPerMonth = parseFloat(searchJobs.value) || 0;
    state.dataExportGbPerMonth = parseFloat(dataExport.value) || 0;
    state.platformLogsGbPerMonth = parseFloat(platformLogs.value) || 0;
    onChange(state);
  };

  queryBa.addEventListener('input', sync);
  searchJobs.addEventListener('input', sync);
  dataExport.addEventListener('input', sync);
  platformLogs.addEventListener('input', sync);
}
