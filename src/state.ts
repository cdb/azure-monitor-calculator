// All user-configurable parameters that define a scenario
export interface CalculatorState {
  // Global
  discountPercent: number;       // 0–100
  growthPercent: number;         // month-over-month growth rate
  projectionMonths: number;      // 12, 24, or 36
  billableRatio: number;         // 0–100, percentage of raw volume that is billable (default 75%)

  // Volume
  totalGbPerDay: number;
  auxiliaryPercent: number;       // must sum to 100 with basic + analytics
  basicPercent: number;
  analyticsPercent: number;

  // Commitment tier: 'auto' or a specific GB/day number
  commitmentTier: 'auto' | 'payg' | number;

  // Retention (days beyond included)
  retentionAnalyticsInteractiveDays: number; // extra days beyond 31/90
  retentionAnalyticsLongTermDays: number;
  retentionBasicLongTermDays: number;
  retentionAuxiliaryLongTermDays: number;

  // Query & Export (GB/month)
  queryBasicAuxGbPerMonth: number;
  searchJobsGbPerMonth: number;
  dataExportGbPerMonth: number;
  platformLogsGbPerMonth: number;
}

export const DEFAULT_STATE: CalculatorState = {
  discountPercent: 0,
  growthPercent: 0,
  projectionMonths: 12,
  billableRatio: 75,

  totalGbPerDay: 1000,
  auxiliaryPercent: 0,
  basicPercent: 50,
  analyticsPercent: 50,

  commitmentTier: 'auto',

  retentionAnalyticsInteractiveDays: 0,
  retentionAnalyticsLongTermDays: 0,
  retentionBasicLongTermDays: 0,
  retentionAuxiliaryLongTermDays: 0,

  queryBasicAuxGbPerMonth: 0,
  searchJobsGbPerMonth: 0,
  dataExportGbPerMonth: 0,
  platformLogsGbPerMonth: 0,
};
