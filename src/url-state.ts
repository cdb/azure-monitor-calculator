import type { CalculatorState } from './state';
import { DEFAULT_STATE } from './state';

// Compact URL parameter keys
const PARAM_MAP: Record<keyof CalculatorState, string> = {
  discountPercent: 'disc',
  growthPercent: 'grow',
  projectionMonths: 'period',
  sentinelEnabled: 'sentinel',
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

// Reverse map: short key -> state key
const REVERSE_MAP: Record<string, keyof CalculatorState> = {};
for (const [stateKey, shortKey] of Object.entries(PARAM_MAP)) {
  REVERSE_MAP[shortKey] = stateKey as keyof CalculatorState;
}

/**
 * Read state from URL query parameters, falling back to defaults.
 */
export function readStateFromUrl(): CalculatorState {
  const params = new URLSearchParams(window.location.search);
  const state = { ...DEFAULT_STATE };

  for (const [shortKey, stateKey] of Object.entries(REVERSE_MAP)) {
    const value = params.get(shortKey);
    if (value === null) continue;

    if (stateKey === 'sentinelEnabled') {
      (state as any)[stateKey] = value === '1' || value === 'true';
    } else if (stateKey === 'commitmentTier') {
      if (value === 'auto' || value === 'payg') {
        state.commitmentTier = value;
      } else {
        const num = parseFloat(value);
        if (!isNaN(num)) state.commitmentTier = num;
      }
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        (state as any)[stateKey] = num;
      }
    }
  }

  return state;
}

/**
 * Write state to URL query parameters without page reload.
 */
export function writeStateToUrl(state: CalculatorState): void {
  const params = new URLSearchParams();

  for (const [stateKey, shortKey] of Object.entries(PARAM_MAP)) {
    const value = (state as any)[stateKey];
    const defaultValue = (DEFAULT_STATE as any)[stateKey];

    // Only include non-default values to keep URLs compact
    if (value !== defaultValue) {
      if (stateKey === 'sentinelEnabled') {
        params.set(shortKey, value ? '1' : '0');
      } else {
        params.set(shortKey, String(value));
      }
    }
  }

  const search = params.toString();
  const newUrl = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;

  window.history.replaceState(null, '', newUrl);
}

/**
 * Copy current URL to clipboard.
 */
export async function copyLinkToClipboard(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    // Fallback
    const input = document.createElement('input');
    input.value = window.location.href;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return true;
  }
}
