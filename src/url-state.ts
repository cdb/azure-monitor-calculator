import type { CalculatorState } from './state';
import { DEFAULT_STATE } from './state';

const PARAM_MAP: Record<keyof CalculatorState, string> = {
  discountPercent: 'disc',
  growthPercent: 'grow',
  projectionMonths: 'period',
  billableRatio: 'bill_ratio',
  totalGbPerDay: 'vol',
  auxiliaryPercent: 'aux',
  basicPercent: 'bas',
  analyticsPercent: 'ana',
  commitmentTier: 'tier',
  retentionAnalyticsInteractiveDays: 'ret_ai',
  retentionAnalyticsLongTermDays: 'ret_alt',
  retentionBasicLongTermDays: 'ret_blt',
  retentionAuxiliaryLongTermDays: 'ret_xlt',
  queryBasicAuxGbPerMonth: 'q_ba',
  searchJobsGbPerMonth: 'q_sj',
  dataExportGbPerMonth: 'exp',
  platformLogsGbPerMonth: 'plat',
};

const REVERSE_MAP: Record<string, keyof CalculatorState> = {};
for (const [stateKey, shortKey] of Object.entries(PARAM_MAP)) {
  REVERSE_MAP[shortKey] = stateKey as keyof CalculatorState;
}

function parseValue(stateKey: string, value: string): any {
  if (stateKey === 'commitmentTier') {
    if (value === 'auto' || value === 'payg') return value;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

export function readStateFromUrl(): CalculatorState {
  const params = new URLSearchParams(window.location.search);
  const state = { ...DEFAULT_STATE };

  for (const [shortKey, stateKey] of Object.entries(REVERSE_MAP)) {
    const value = params.get(shortKey);
    if (value === null) continue;
    const parsed = parseValue(stateKey, value);
    if (parsed !== undefined) (state as any)[stateKey] = parsed;
  }

  return state;
}

export function readScenarioBFromUrl(): { enabled: boolean; overrides: Partial<CalculatorState> } {
  const params = new URLSearchParams(window.location.search);
  const enabled = params.get('sb') === '1';
  const overrides: Partial<CalculatorState> = {};

  if (!enabled) return { enabled, overrides };

  for (const [stateKey, shortKey] of Object.entries(PARAM_MAP)) {
    const value = params.get(`sb_${shortKey}`);
    if (value === null) continue;
    const parsed = parseValue(stateKey, value);
    if (parsed !== undefined) (overrides as any)[stateKey] = parsed;
  }

  return { enabled, overrides };
}

export function writeStateToUrl(
  state: CalculatorState,
  scenarioEnabled?: boolean,
  scenarioBOverrides?: Partial<CalculatorState>,
  region?: string,
): void {
  const params = new URLSearchParams();

  if (region && region !== 'eastus') {
    params.set('region', region);
  }

  for (const [stateKey, shortKey] of Object.entries(PARAM_MAP)) {
    const value = (state as any)[stateKey];
    const defaultValue = (DEFAULT_STATE as any)[stateKey];
    if (value !== defaultValue) {
      params.set(shortKey, String(value));
    }
  }

  if (scenarioEnabled && scenarioBOverrides) {
    params.set('sb', '1');
    for (const [stateKey, shortKey] of Object.entries(PARAM_MAP)) {
      if (stateKey in scenarioBOverrides) {
        params.set(`sb_${shortKey}`, String((scenarioBOverrides as any)[stateKey]));
      }
    }
  }

  const search = params.toString();
  const newUrl = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;

  window.history.replaceState(null, '', newUrl);
}

export async function copyLinkToClipboard(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    const input = document.createElement('input');
    input.value = window.location.href;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return true;
  }
}
