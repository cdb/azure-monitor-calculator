// Azure Monitor Logs pricing data sourced from Azure Retail Pricing API
// Region: East US | Currency: USD | Last updated: 2026-03-26
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
      analyticsSentinelDays: number;
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

export const PRICING: PricingData = {
  region: 'East US',
  currency: 'USD',
  lastUpdated: '2026-03-26',

  ingestion: {
    auxiliary: {
      perGb: 0.05,
      logProcessingPerGb: 0.05,
    },
    basic: {
      perGb: 0.50,
    },
    analytics: {
      payg: {
        perGb: 2.30,
        freeGbPerMonth: 5,
      },
      commitmentTiers: [
        { gbPerDay: 100, dailyPrice: 196, effectivePerGb: 1.96, savingsPercent: 15 },
        { gbPerDay: 200, dailyPrice: 368, effectivePerGb: 1.84, savingsPercent: 20 },
        { gbPerDay: 300, dailyPrice: 540, effectivePerGb: 1.80, savingsPercent: 22 },
        { gbPerDay: 400, dailyPrice: 704, effectivePerGb: 1.76, savingsPercent: 23 },
        { gbPerDay: 500, dailyPrice: 865, effectivePerGb: 1.73, savingsPercent: 25 },
        { gbPerDay: 1000, dailyPrice: 1700, effectivePerGb: 1.70, savingsPercent: 26 },
        { gbPerDay: 2000, dailyPrice: 3320, effectivePerGb: 1.66, savingsPercent: 28 },
        { gbPerDay: 5000, dailyPrice: 8050, effectivePerGb: 1.61, savingsPercent: 30 },
        { gbPerDay: 10000, dailyPrice: 15640, effectivePerGb: 1.564, savingsPercent: 32 },
        { gbPerDay: 25000, dailyPrice: 37950, effectivePerGb: 1.518, savingsPercent: 34 },
        { gbPerDay: 50000, dailyPrice: 73600, effectivePerGb: 1.472, savingsPercent: 36 },
      ],
    },
  },

  retention: {
    interactive: {
      perGbPerMonth: 0.10,
      description: 'Analytics logs beyond included 31/90 days, up to 2 years',
    },
    longTerm: {
      perGbPerMonth: 0.02,
      description: 'All plans, up to 12 years',
    },
    included: {
      auxiliaryDays: 30,
      basicDays: 30,
      analyticsDays: 31,
      analyticsSentinelDays: 90,
    },
  },

  query: {
    basicAuxiliaryPerGb: 0.005,
    searchJobsPerGb: 0.005,
  },

  exportCosts: {
    dataExportPerGb: 0.10,
    platformLogsPerGb: 0.25,
    workspaceReplicationPerGb: 0.25,
    logEmissionPerGb: 0.15,
  },
};
