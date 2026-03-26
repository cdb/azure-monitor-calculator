import '@primer/css/dist/primer.css';
import type { CalculatorState } from './state';
import { setRegion } from './pricing-data';
import type { RegionId } from './pricing-data';
import { readStateFromUrl, readScenarioBFromUrl, writeStateToUrl, copyLinkToClipboard } from './url-state';
import { calculateMonthlyCost, generateProjection } from './engine';
import { currency } from './format';
import { renderGlobalSettings } from './ui/global-settings';
import { renderVolumeConfig } from './ui/volume-config';
import { renderRetentionConfig } from './ui/retention-config';
import { renderQueryExport } from './ui/query-export';
import { renderCostSummary } from './ui/cost-summary';
import { renderProjectionTable } from './ui/projection-table';
import { renderCharts } from './ui/charts';
import { renderScenarioB } from './ui/scenario-b';
import type { ScenarioBOverrides } from './ui/scenario-b';

// Read region from URL (default: eastus)
const params = new URLSearchParams(window.location.search);
let currentRegion: RegionId = (params.get('region') as RegionId) || 'eastus';
setRegion(currentRegion);

let state: CalculatorState = readStateFromUrl();
const scenarioBFromUrl = readScenarioBFromUrl();
let scenarioEnabled = scenarioBFromUrl.enabled;
let scenarioBOverrides: ScenarioBOverrides = scenarioBFromUrl.overrides;

const globalSettingsEl = document.querySelector<HTMLElement>('#global-settings')!;
const volumeConfigEl = document.querySelector<HTMLElement>('#volume-config')!;
const retentionConfigEl = document.querySelector<HTMLElement>('#retention-config')!;
const queryExportEl = document.querySelector<HTMLElement>('#query-export')!;
const costSummaryEl = document.querySelector<HTMLElement>('#cost-summary')!;
const chartsEl = document.querySelector<HTMLElement>('#charts')!;
const projectionTableEl = document.querySelector<HTMLElement>('#projection-table')!;
const copyLinkBtn = document.querySelector<HTMLButtonElement>('#copy-link')!;
const stickyTotalEl = document.querySelector<HTMLElement>('#sticky-total-value')!;
const stickyTotalBEl = document.querySelector<HTMLElement>('#sticky-total-b')!;
const stickyTotalBValueEl = document.querySelector<HTMLElement>('#sticky-total-b-value')!;
const scenarioToggle = document.querySelector<HTMLInputElement>('#scenario-toggle')!;
const scenarioBPanel = document.querySelector<HTMLElement>('#scenario-b-panel')!;

function recalculate() {
  writeStateToUrl(state, scenarioEnabled, scenarioBOverrides, currentRegion);

  const breakdownA = calculateMonthlyCost(state);
  stickyTotalEl.textContent = currency(breakdownA.total);

  let breakdownB = undefined;
  if (scenarioEnabled) {
    const stateB: CalculatorState = { ...state, ...scenarioBOverrides };
    breakdownB = calculateMonthlyCost(stateB);
    stickyTotalBEl.style.display = '';
    stickyTotalBValueEl.textContent = currency(breakdownB.total);

    const projectionA = generateProjection(state);
    const projectionB = generateProjection(stateB);
    renderCostSummary(costSummaryEl, breakdownA, state.discountPercent, breakdownB);
    renderCharts(chartsEl, breakdownA, projectionA, state.discountPercent, breakdownB, projectionB);
    renderProjectionTable(projectionTableEl, projectionA, projectionB);
  } else {
    stickyTotalBEl.style.display = 'none';
    renderCostSummary(costSummaryEl, breakdownA, state.discountPercent);
    const projectionA = generateProjection(state);
    renderCharts(chartsEl, breakdownA, projectionA, state.discountPercent);
    renderProjectionTable(projectionTableEl, projectionA);
  }
}

function onStateChange(updated: CalculatorState) {
  state = updated;
  if (scenarioEnabled) {
    renderScenarioB(scenarioBPanel, state, scenarioBOverrides, onScenarioBChange);
  }
  recalculate();
}

function onScenarioBChange(overrides: ScenarioBOverrides) {
  scenarioBOverrides = overrides;
  recalculate();
}

function onRegionChange(regionId: RegionId) {
  currentRegion = regionId;
  // Re-render everything since pricing data changed
  renderVolumeConfig(volumeConfigEl, state, onStateChange);
  renderRetentionConfig(retentionConfigEl, state, onStateChange);
  renderQueryExport(queryExportEl, state, onStateChange);
  if (scenarioEnabled) {
    renderScenarioB(scenarioBPanel, state, scenarioBOverrides, onScenarioBChange);
  }
  recalculate();
}

// Toggle scenario mode
scenarioToggle.addEventListener('change', () => {
  scenarioEnabled = scenarioToggle.checked;
  scenarioBPanel.style.display = scenarioEnabled ? '' : 'none';
  if (scenarioEnabled) {
    renderScenarioB(scenarioBPanel, state, scenarioBOverrides, onScenarioBChange);
  } else {
    scenarioBOverrides = {};
  }
  recalculate();
});

// Initial render
renderGlobalSettings(globalSettingsEl, state, currentRegion, onStateChange, onRegionChange);
renderVolumeConfig(volumeConfigEl, state, onStateChange);
renderRetentionConfig(retentionConfigEl, state, onStateChange);
renderQueryExport(queryExportEl, state, onStateChange);

if (scenarioEnabled) {
  scenarioToggle.checked = true;
  scenarioBPanel.style.display = '';
  renderScenarioB(scenarioBPanel, state, scenarioBOverrides, onScenarioBChange);
  const scenarioSection = document.querySelector<HTMLDetailsElement>('#scenario-section');
  if (scenarioSection) scenarioSection.open = true;
}

recalculate();

copyLinkBtn.addEventListener('click', async () => {
  if (await copyLinkToClipboard()) {
    copyLinkBtn.textContent = '✓ Link Copied!';
    setTimeout(() => { copyLinkBtn.textContent = '🔗 Copy Link'; }, 2000);
  }
});
