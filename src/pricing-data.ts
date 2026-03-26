// Azure Monitor Logs pricing data sourced from Azure Retail Pricing API
// Currency: USD | Last fetched: 2026-03-26
// API: https://prices.azure.com/api/retail/prices
// Embedded because the API does not support CORS for browser fetch.

export const PRICING_LAST_FETCHED = '2026-03-26';

export interface CommitmentTier {
  gbPerDay: number;
  dailyPrice: number;
  effectivePerGb: number;
  savingsPercent: number;
}

export interface PricingData {
  region: string;
  currency: string;
  lastUpdated: string;

  ingestion: {
    auxiliary: { perGb: number; logProcessingPerGb: number };
    basic: { perGb: number };
    analytics: {
      payg: { perGb: number; freeGbPerMonth: number };
      commitmentTiers: CommitmentTier[];
    };
  };

  retention: {
    interactive: { perGbPerMonth: number; description: string };
    longTerm: { perGbPerMonth: number; description: string };
    included: {
      auxiliaryDays: number;
      basicDays: number;
      analyticsDays: number;
    };
  };

  query: {
    basicAuxiliaryPerGb: number;
    searchJobsPerGb: number;
  };

  exportCosts: {
    dataExportPerGb: number;
    platformLogsPerGb: number;
    workspaceReplicationPerGb: number;
    logEmissionPerGb: number;
  };
}

export function computeSavings(dailyPrice: number, gbPerDay: number, paygPerGb: number): number {
  const effectivePerGb = dailyPrice / gbPerDay;
  return Math.round((1 - effectivePerGb / paygPerGb) * 100);
}

export function buildTiers(paygPerGb: number, dailyPrices: number[]): CommitmentTier[] {
  const gbLevels = [100, 200, 300, 400, 500, 1000, 2000, 5000, 10000, 25000, 50000];
  return gbLevels.map((gb, i) => ({
    gbPerDay: gb,
    dailyPrice: dailyPrices[i],
    effectivePerGb: Math.round((dailyPrices[i] / gb) * 1000) / 1000,
    savingsPercent: computeSavings(dailyPrices[i], gb, paygPerGb),
  }));
}

// Compact raw format for embedding per-region pricing
interface RawRegionPricing {
  payg: number;
  basic: number;
  aux: number;
  retention_int: number;
  retention_lt: number;
  search_q: number;
  search_j: number;
  platform: number;
  replication: number;
  emission: number;
  tiers: Record<string, number>;
}

function buildPricingData(_regionId: string, label: string, raw: RawRegionPricing): PricingData {
  const gbLevels = [100, 200, 300, 400, 500, 1000, 2000, 5000, 10000, 25000, 50000];
  const dailyPrices = gbLevels.map((gb) => raw.tiers[String(gb)]);
  return {
    region: label,
    currency: 'USD',
    lastUpdated: PRICING_LAST_FETCHED,
    ingestion: {
      auxiliary: { perGb: raw.aux, logProcessingPerGb: raw.aux },
      basic: { perGb: raw.basic },
      analytics: {
        payg: { perGb: raw.payg, freeGbPerMonth: 5 },
        commitmentTiers: buildTiers(raw.payg, dailyPrices),
      },
    },
    retention: {
      interactive: { perGbPerMonth: raw.retention_int, description: 'Analytics logs beyond 31 days, up to 2 years' },
      longTerm: { perGbPerMonth: raw.retention_lt, description: 'All plans, up to 12 years' },
      included: { auxiliaryDays: 30, basicDays: 30, analyticsDays: 31 },
    },
    query: { basicAuxiliaryPerGb: raw.search_q, searchJobsPerGb: raw.search_j },
    exportCosts: {
      dataExportPerGb: 0.10,
      platformLogsPerGb: raw.platform,
      workspaceReplicationPerGb: raw.replication,
      logEmissionPerGb: raw.emission,
    },
  };
}

// Raw pricing keyed by region ID
const RAW: Record<string, { label: string; data: RawRegionPricing }> = {
  eastus: { label: 'East US', data: { payg: 2.3, basic: 0.5, aux: 0.05, retention_int: 0.1, retention_lt: 0.02, search_q: 0.005, search_j: 0.005, platform: 0.25, replication: 0.25, emission: 0.15, tiers: { '100': 196.0, '200': 368.0, '300': 540.0, '400': 704.0, '500': 865.0, '1000': 1700.0, '2000': 3320.0, '5000': 8050.0, '10000': 15640.0, '25000': 37950.0, '50000': 73600.0 } } },
  eastus2: { label: 'East US 2', data: { payg: 2.76, basic: 0.5, aux: 0.05, retention_int: 0.12, retention_lt: 0.024, search_q: 0.005, search_j: 0.005, platform: 0.25, replication: 0.25, emission: 0.15, tiers: { '100': 196.0, '200': 368.0, '300': 540.0, '400': 704.0, '500': 865.0, '1000': 1700.0, '2000': 3320.0, '5000': 8050.0, '10000': 15640.0, '25000': 37950.0, '50000': 73600.0 } } },
  centralus: { label: 'Central US', data: { payg: 2.76, basic: 0.615, aux: 0.06, retention_int: 0.12, retention_lt: 0.024, search_q: 0.00615, search_j: 0.00615, platform: 0.308, replication: 0.3075, emission: 0.18, tiers: { '100': 219.52, '200': 412.16, '300': 604.8, '400': 788.48, '500': 968.8, '1000': 1904.0, '2000': 3718.4, '5000': 9016.0, '10000': 17986.0, '25000': 43642.5, '50000': 84640.0 } } },
  westus: { label: 'West US', data: { payg: 2.99, basic: 0.65, aux: 0.07, retention_int: 0.13, retention_lt: 0.026, search_q: 0.0065, search_j: 0.0065, platform: 0.325, replication: 0.325, emission: 0.2, tiers: { '100': 219.52, '200': 412.16, '300': 604.8, '400': 788.48, '500': 968.8, '1000': 1904.0, '2000': 3718.4, '5000': 9016.0, '10000': 18455.2, '25000': 44781.0, '50000': 86848.0 } } },
  westus2: { label: 'West US 2', data: { payg: 2.3, basic: 0.5, aux: 0.05, retention_int: 0.1, retention_lt: 0.02, search_q: 0.005, search_j: 0.005, platform: 0.25, replication: 0.25, emission: 0.15, tiers: { '100': 196.0, '200': 368.0, '300': 540.0, '400': 704.0, '500': 865.0, '1000': 1700.0, '2000': 3320.0, '5000': 8050.0, '10000': 15640.0, '25000': 37950.0, '50000': 73600.0 } } },
  westus3: { label: 'West US 3', data: { payg: 2.3, basic: 0.5, aux: 0.05, retention_int: 0.1, retention_lt: 0.02, search_q: 0.005, search_j: 0.005, platform: 0.25, replication: 0.25, emission: 0.15, tiers: { '100': 196.0, '200': 368.0, '300': 540.0, '400': 704.0, '500': 865.0, '1000': 1700.0, '2000': 3320.0, '5000': 8050.0, '10000': 15640.0, '25000': 37950.0, '50000': 73600.0 } } },
  northcentralus: { label: 'North Central US', data: { payg: 2.76, basic: 0.6, aux: 0.06, retention_int: 0.12, retention_lt: 0.024, search_q: 0.006, search_j: 0.006, platform: 0.3, replication: 0.3, emission: 0.18, tiers: { '100': 219.52, '200': 412.16, '300': 604.8, '400': 788.48, '500': 968.8, '1000': 1904.0, '2000': 3718.4, '5000': 9016.0, '10000': 17986.0, '25000': 43642.5, '50000': 84640.0 } } },
  southcentralus: { label: 'South Central US', data: { payg: 2.76, basic: 0.6, aux: 0.06, retention_int: 0.12, retention_lt: 0.024, search_q: 0.006, search_j: 0.006, platform: 0.3, replication: 0.3, emission: 0.18, tiers: { '100': 219.52, '200': 412.16, '300': 604.8, '400': 788.48, '500': 968.8, '1000': 1904.0, '2000': 3718.4, '5000': 9016.0, '10000': 17986.0, '25000': 43642.5, '50000': 84640.0 } } },
  westcentralus: { label: 'West Central US', data: { payg: 2.76, basic: 0.6, aux: 0.06, retention_int: 0.12, retention_lt: 0.024, search_q: 0.006, search_j: 0.006, platform: 0.3, replication: 0.3, emission: 0.18, tiers: { '100': 219.52, '200': 412.16, '300': 604.8, '400': 788.48, '500': 968.8, '1000': 1904.0, '2000': 3718.4, '5000': 9016.0, '10000': 17986.0, '25000': 43642.5, '50000': 84640.0 } } },
  australiaeast: { label: 'Australia East', data: { payg: 3.34, basic: 0.725, aux: 0.07, retention_int: 0.15, retention_lt: 0.03, search_q: 0.00725, search_j: 0.00725, platform: 0.362, replication: 0.3625, emission: 0.22, tiers: { '100': 274.4, '200': 515.2, '300': 756.0, '400': 985.6, '500': 1211.0, '1000': 2380.0, '2000': 4648.0, '5000': 11270.0, '10000': 22208.8, '25000': 53889.0, '50000': 104512.0 } } },
  canadacentral: { label: 'Canada Central', data: { payg: 2.76, basic: 0.6, aux: 0.06, retention_int: 0.12, retention_lt: 0.024, search_q: 0.006, search_j: 0.006, platform: 0.3, replication: 0.3, emission: 0.18, tiers: { '100': 219.52, '200': 412.16, '300': 604.8, '400': 788.48, '500': 968.8, '1000': 1904.0, '2000': 3718.4, '5000': 9016.0, '10000': 17986.0, '25000': 43642.5, '50000': 84640.0 } } },
  japanwest: { label: 'Japan West', data: { payg: 3.57, basic: 0.775, aux: 0.08, retention_int: 0.16, retention_lt: 0.032, search_q: 0.00775, search_j: 0.00775, platform: 0.388, replication: 0.3875, emission: 0.22, tiers: { '100': 303.8, '200': 570.4, '300': 837.0, '400': 1091.2, '500': 1340.75, '1000': 2635.0, '2000': 5146.0, '5000': 12477.5, '10000': 24242.0, '25000': 58822.5, '50000': 114080.0 } } },
  koreacentral: { label: 'Korea Central', data: { payg: 3.11, basic: 0.675, aux: 0.07, retention_int: 0.14, retention_lt: 0.028, search_q: 0.00675, search_j: 0.00675, platform: 0.338, replication: 0.3375, emission: 0.2, tiers: { '100': 264.6, '200': 496.8, '300': 729.0, '400': 950.4, '500': 1167.75, '1000': 2295.0, '2000': 4482.0, '5000': 10867.5, '10000': 21114.0, '25000': 51232.5, '50000': 99360.0 } } },
  swedencentral: { label: 'Sweden Central', data: { payg: 2.99, basic: 0.645, aux: 0.07, retention_int: 0.13, retention_lt: 0.026, search_q: 0.00645, search_j: 0.00645, platform: 0.25, replication: 0.325, emission: 0.2, tiers: { '100': 252.84, '200': 474.72, '300': 696.6, '400': 908.16, '500': 1115.85, '1000': 2193.0, '2000': 4282.8, '5000': 10384.5, '10000': 20175.6, '25000': 48955.5, '50000': 94944.0 } } },
  westeurope: { label: 'West Europe', data: { payg: 2.99, basic: 0.65, aux: 0.07, retention_int: 0.13, retention_lt: 0.026, search_q: 0.0065, search_j: 0.0065, platform: 0.325, replication: 0.325, emission: 0.21, tiers: { '100': 252.84, '200': 474.72, '300': 696.6, '400': 908.16, '500': 1115.85, '1000': 2193.0, '2000': 4282.8, '5000': 10384.5, '10000': 20175.6, '25000': 48955.5, '50000': 94944.0 } } },
};

// Build full PricingData for every region
export const ALL_REGION_PRICING: Record<string, PricingData> = Object.fromEntries(
  Object.entries(RAW).map(([id, { label, data }]) => [id, buildPricingData(id, label, data)]),
);

export const FALLBACK_PRICING: PricingData = ALL_REGION_PRICING['eastus'];

// Mutable current pricing — updated when region changes
export let PRICING: PricingData = FALLBACK_PRICING;

export function setPricing(regionId: string): void {
  PRICING = ALL_REGION_PRICING[regionId] ?? FALLBACK_PRICING;
}
