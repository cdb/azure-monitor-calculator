import '@primer/css/dist/primer.css';
import type { CalculatorState } from './state';
import { readStateFromUrl, writeStateToUrl, copyLinkToClipboard } from './url-state';
import { calculateMonthlyCost, generateProjection } from './engine';
import { renderGlobalSettings } from './ui/global-settings';
import { renderVolumeConfig } from './ui/volume-config';
import { renderRetentionConfig } from './ui/retention-config';
import { renderQueryExport } from './ui/query-export';
import { renderCostSummary } from './ui/cost-summary';
import { renderProjectionTable } from './ui/projection-table';
import { renderCharts } from './ui/charts';

// Read initial state from URL or use defaults
let state: CalculatorState = readStateFromUrl();

// Container references
const globalSettingsEl = document.querySelector<HTMLElement>('#global-settings')!;
const volumeConfigEl = document.querySelector<HTMLElement>('#volume-config')!;
const retentionConfigEl = document.querySelector<HTMLElement>('#retention-config')!;
const queryExportEl = document.querySelector<HTMLElement>('#query-export')!;
const costSummaryEl = document.querySelector<HTMLElement>('#cost-summary')!;
const chartsEl = document.querySelector<HTMLElement>('#charts')!;
const projectionTableEl = document.querySelector<HTMLElement>('#projection-table')!;
const copyLinkBtn = document.querySelector<HTMLButtonElement>('#copy-link')!;

/**
 * Recalculate and re-render output sections.
 * Input sections are only re-rendered on initial load (they manage their own state).
 */
function recalculate() {
  writeStateToUrl(state);

  const breakdown = calculateMonthlyCost(state);
  renderCostSummary(costSummaryEl, breakdown, state.discountPercent);

  const projection = generateProjection(state);
  renderCharts(chartsEl, breakdown, projection, state.discountPercent);
  renderProjectionTable(projectionTableEl, projection);
}

function onStateChange(_updated: CalculatorState) {
  state = _updated;
  recalculate();
}

// Initial render
renderGlobalSettings(globalSettingsEl, state, onStateChange);
renderVolumeConfig(volumeConfigEl, state, onStateChange);
renderRetentionConfig(retentionConfigEl, state, onStateChange);
renderQueryExport(queryExportEl, state, onStateChange);
recalculate();

// Copy Link button
copyLinkBtn.addEventListener('click', async () => {
  const ok = await copyLinkToClipboard();
  if (ok) {
    copyLinkBtn.textContent = '✓ Link Copied!';
    setTimeout(() => { copyLinkBtn.textContent = '🔗 Copy Link'; }, 2000);
  }
});

