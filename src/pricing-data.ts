// Azure Monitor Logs pricing data sourced from Azure Retail Pricing API
// Currency: USD | Last updated: 2026-03-26
// API: https://prices.azure.com/api/retail/prices

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

export type RegionId = 'eastus' | 'centralus';

function computeSavings(dailyPrice: number, gbPerDay: number, paygPerGb: number): number {
  const effectivePerGb = dailyPrice / gbPerDay;
  return Math.round((1 - effectivePerGb / paygPerGb) * 100);
}

function buildTiers(paygPerGb: number, dailyPrices: number[]): CommitmentTier[] {
  const gbLevels = [100, 200, 300, 400, 500, 1000, 2000, 5000, 10000, 25000, 50000];
  return gbLevels.map((gb, i) => ({
    gbPerDay: gb,
    dailyPrice: dailyPrices[i],
    effectivePerGb: Math.round((dailyPrices[i] / gb) * 1000) / 1000,
    savingsPercent: computeSavings(dailyPrices[i], gb, paygPerGb),
  }));
}

const PRICING_EAST_US: PricingData = {
  region: 'East US',
  currency: 'USD',
  lastUpdated: '2026-03-26',
  ingestion: {
    auxiliary: { perGb: 0.05, logProcessingPerGb: 0.05 },
    basic: { perGb: 0.50 },
    analytics: {
      payg: { perGb: 2.30, freeGbPerMonth: 5 },
      commitmentTiers: buildTiers(2.30, [196, 368, 540, 704, 865, 1700, 3320, 8050, 15640, 37950, 73600]),
    },
  },
  retention: {
    interactive: { perGbPerMonth: 0.10, description: 'Analytics logs beyond 31 days, up to 2 years' },
    longTerm: { perGbPerMonth: 0.02, description: 'All plans, up to 12 years' },
    included: { auxiliaryDays: 30, basicDays: 30, analyticsDays: 31 },
  },
  query: { basicAuxiliaryPerGb: 0.005, searchJobsPerGb: 0.005 },
  exportCosts: { dataExportPerGb: 0.10, platformLogsPerGb: 0.25, workspaceReplicationPerGb: 0.25, logEmissionPerGb: 0.15 },
};

const PRICING_CENTRAL_US: PricingData = {
  region: 'Central US',
  currency: 'USD',
  lastUpdated: '2026-03-26',
  ingestion: {
    auxiliary: { perGb: 0.06, logProcessingPerGb: 0.06 },
    basic: { perGb: 0.615 },
    analytics: {
      payg: { perGb: 2.76, freeGbPerMonth: 5 },
      commitmentTiers: buildTiers(2.76, [219.52, 412.16, 604.80, 788.48, 968.80, 1904.00, 3718.40, 9016.00, 17986.00, 43642.50, 84640.00]),
    },
  },
  retention: {
    interactive: { perGbPerMonth: 0.12, description: 'Analytics logs beyond 31 days, up to 2 years' },
    longTerm: { perGbPerMonth: 0.024, description: 'All plans, up to 12 years' },
    included: { auxiliaryDays: 30, basicDays: 30, analyticsDays: 31 },
  },
  query: { basicAuxiliaryPerGb: 0.0062, searchJobsPerGb: 0.0062 },
  exportCosts: { dataExportPerGb: 0.123, platformLogsPerGb: 0.308, workspaceReplicationPerGb: 0.3075, logEmissionPerGb: 0.18 },
};

export const REGIONS: Record<RegionId, PricingData> = {
  eastus: PRICING_EAST_US,
  centralus: PRICING_CENTRAL_US,
};

export const REGION_LABELS: Record<RegionId, string> = {
  eastus: 'East US',
  centralus: 'Central US',
};

// Mutable current pricing — updated when region changes
export let PRICING: PricingData = PRICING_EAST_US;

export function setRegion(regionId: RegionId): void {
  PRICING = REGIONS[regionId];
}
