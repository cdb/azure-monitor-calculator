import { PRICING } from './pricing-data';
import type { CommitmentTier } from './pricing-data';
import type { CalculatorState } from './state';

export interface MonthlyCostBreakdown {
  // Volumes
  auxiliaryGbPerDay: number;
  basicGbPerDay: number;
  analyticsGbPerDay: number;

  // Ingestion costs (before discount)
  auxiliaryIngestion: number;
  auxiliaryLogProcessing: number;
  basicIngestion: number;
  analyticsIngestion: number;
  selectedTier: CommitmentTier | null; // null = PAYG
  analyticsEffectivePerGb: number;

  // Retention costs
  analyticsInteractiveRetention: number;
  analyticsLongTermRetention: number;
  basicLongTermRetention: number;
  auxiliaryLongTermRetention: number;

  // Query & Export
  queryCost: number;
  searchJobsCost: number;
  dataExportCost: number;
  platformLogsCost: number;

  // Totals
  subtotal: number;
  discountAmount: number;
  total: number;
}

export interface ProjectionMonth {
  month: number;           // 1-indexed
  label: string;           // "Month 1", "Month 2", etc.
  growthFactor: number;    // cumulative growth multiplier
  gbPerDay: number;        // volume at this month
  breakdown: MonthlyCostBreakdown;
  cumulativeTotal: number;
  isQuarterEnd: boolean;
  isYearEnd: boolean;
}

export interface ProjectionResult {
  months: ProjectionMonth[];
  quarterlyTotals: number[];
  annualTotals: number[];
  grandTotal: number;
}

const DAYS_PER_MONTH = 30;

/**
 * Find the optimal commitment tier for a given daily Analytics volume.
 */
export function findOptimalTier(analyticsGbPerDay: number): CommitmentTier | null {
  if (analyticsGbPerDay <= 0) return null;

  const tiers = PRICING.ingestion.analytics.commitmentTiers;
  const paygMonthlyCost = analyticsGbPerDay * DAYS_PER_MONTH * PRICING.ingestion.analytics.payg.perGb;

  let bestTier: CommitmentTier | null = null;
  let bestCost = paygMonthlyCost;

  for (const tier of tiers) {
    // Commitment tier: you pay the daily rate regardless of whether you use the full amount
    // Overage above the tier is billed at the effective per-GB rate
    const baseDailyCost = tier.dailyPrice;
    const overageGb = Math.max(0, analyticsGbPerDay - tier.gbPerDay);
    const overageDailyCost = overageGb * tier.effectivePerGb;
    const monthlyCost = (baseDailyCost + overageDailyCost) * DAYS_PER_MONTH;

    if (monthlyCost < bestCost) {
      bestCost = monthlyCost;
      bestTier = tier;
    }
  }

  return bestTier;
}

/**
 * Calculate monthly cost breakdown for a given state and optional volume override.
 */
export function calculateMonthlyCost(
  state: CalculatorState,
  volumeOverrideGbPerDay?: number,
): MonthlyCostBreakdown {
  const rawGbPerDay = volumeOverrideGbPerDay ?? state.totalGbPerDay;
  // Apply billable ratio: Azure bills on a reduced representation (~75% of raw JSON payload)
  const billableRatio = (state.billableRatio ?? 100) / 100;
  const totalGbPerDay = rawGbPerDay * billableRatio;
  const auxGbPerDay = totalGbPerDay * (state.auxiliaryPercent / 100);
  const basicGbPerDay = totalGbPerDay * (state.basicPercent / 100);
  const analyticsGbPerDay = totalGbPerDay * (state.analyticsPercent / 100);

  // --- Ingestion ---
  const auxIngestionMonthly = auxGbPerDay * DAYS_PER_MONTH * PRICING.ingestion.auxiliary.perGb;
  const auxLogProcessingMonthly = auxGbPerDay * DAYS_PER_MONTH * PRICING.ingestion.auxiliary.logProcessingPerGb;
  const basicIngestionMonthly = basicGbPerDay * DAYS_PER_MONTH * PRICING.ingestion.basic.perGb;

  // Analytics: determine tier
  let selectedTier: CommitmentTier | null = null;
  let analyticsEffectivePerGb: number;
  let analyticsIngestionMonthly: number;

  if (state.commitmentTier === 'payg') {
    analyticsEffectivePerGb = PRICING.ingestion.analytics.payg.perGb;
    const billableGb = Math.max(0, analyticsGbPerDay * DAYS_PER_MONTH - PRICING.ingestion.analytics.payg.freeGbPerMonth);
    analyticsIngestionMonthly = billableGb * analyticsEffectivePerGb;
  } else if (state.commitmentTier === 'auto') {
    selectedTier = findOptimalTier(analyticsGbPerDay);
    if (selectedTier) {
      const baseDailyCost = selectedTier.dailyPrice;
      const overageGb = Math.max(0, analyticsGbPerDay - selectedTier.gbPerDay);
      const overageDailyCost = overageGb * selectedTier.effectivePerGb;
      analyticsIngestionMonthly = (baseDailyCost + overageDailyCost) * DAYS_PER_MONTH;
      analyticsEffectivePerGb = analyticsGbPerDay > 0
        ? analyticsIngestionMonthly / (analyticsGbPerDay * DAYS_PER_MONTH)
        : 0;
    } else {
      analyticsEffectivePerGb = PRICING.ingestion.analytics.payg.perGb;
      const billableGb = Math.max(0, analyticsGbPerDay * DAYS_PER_MONTH - PRICING.ingestion.analytics.payg.freeGbPerMonth);
      analyticsIngestionMonthly = billableGb * analyticsEffectivePerGb;
    }
  } else {
    // Specific tier selected
    const tier = PRICING.ingestion.analytics.commitmentTiers.find(t => t.gbPerDay === state.commitmentTier);
    if (tier) {
      selectedTier = tier;
      const baseDailyCost = tier.dailyPrice;
      const overageGb = Math.max(0, analyticsGbPerDay - tier.gbPerDay);
      const overageDailyCost = overageGb * tier.effectivePerGb;
      analyticsIngestionMonthly = (baseDailyCost + overageDailyCost) * DAYS_PER_MONTH;
      analyticsEffectivePerGb = analyticsGbPerDay > 0
        ? analyticsIngestionMonthly / (analyticsGbPerDay * DAYS_PER_MONTH)
        : 0;
    } else {
      analyticsEffectivePerGb = PRICING.ingestion.analytics.payg.perGb;
      const billableGb = Math.max(0, analyticsGbPerDay * DAYS_PER_MONTH - PRICING.ingestion.analytics.payg.freeGbPerMonth);
      analyticsIngestionMonthly = billableGb * analyticsEffectivePerGb;
    }
  }

  // --- Retention ---
  // Stored data = daily volume × retention days. Retention cost is per GB/month.
  // Interactive retention (Analytics only)
  const analyticsInteractiveRetention = state.retentionAnalyticsInteractiveDays > 0
    ? (analyticsGbPerDay * state.retentionAnalyticsInteractiveDays / DAYS_PER_MONTH) * PRICING.retention.interactive.perGbPerMonth
    : 0;

  // Long-term retention (all plans)
  const analyticsLtRetention = state.retentionAnalyticsLongTermDays > 0
    ? (analyticsGbPerDay * state.retentionAnalyticsLongTermDays / DAYS_PER_MONTH) * PRICING.retention.longTerm.perGbPerMonth
    : 0;
  const basicLtRetention = state.retentionBasicLongTermDays > 0
    ? (basicGbPerDay * state.retentionBasicLongTermDays / DAYS_PER_MONTH) * PRICING.retention.longTerm.perGbPerMonth
    : 0;
  const auxLtRetention = state.retentionAuxiliaryLongTermDays > 0
    ? (auxGbPerDay * state.retentionAuxiliaryLongTermDays / DAYS_PER_MONTH) * PRICING.retention.longTerm.perGbPerMonth
    : 0;

  // --- Query & Export ---
  const queryCost = state.queryBasicAuxGbPerMonth * PRICING.query.basicAuxiliaryPerGb;
  const searchJobsCost = state.searchJobsGbPerMonth * PRICING.query.searchJobsPerGb;
  const dataExportCost = state.dataExportGbPerMonth * PRICING.exportCosts.dataExportPerGb;
  const platformLogsCost = state.platformLogsGbPerMonth * PRICING.exportCosts.platformLogsPerGb;

  // --- Totals ---
  const subtotal = auxIngestionMonthly + auxLogProcessingMonthly +
    basicIngestionMonthly + analyticsIngestionMonthly +
    analyticsInteractiveRetention + analyticsLtRetention +
    basicLtRetention + auxLtRetention +
    queryCost + searchJobsCost + dataExportCost + platformLogsCost;

  const discountAmount = subtotal * (state.discountPercent / 100);
  const total = subtotal - discountAmount;

  return {
    auxiliaryGbPerDay: auxGbPerDay,
    basicGbPerDay: basicGbPerDay,
    analyticsGbPerDay: analyticsGbPerDay,
    auxiliaryIngestion: auxIngestionMonthly,
    auxiliaryLogProcessing: auxLogProcessingMonthly,
    basicIngestion: basicIngestionMonthly,
    analyticsIngestion: analyticsIngestionMonthly,
    selectedTier,
    analyticsEffectivePerGb,
    analyticsInteractiveRetention,
    analyticsLongTermRetention: analyticsLtRetention,
    basicLongTermRetention: basicLtRetention,
    auxiliaryLongTermRetention: auxLtRetention,
    queryCost,
    searchJobsCost,
    dataExportCost,
    platformLogsCost,
    subtotal,
    discountAmount,
    total,
  };
}

/**
 * Generate a multi-month projection with growth.
 */
export function generateProjection(state: CalculatorState): ProjectionResult {
  const months: ProjectionMonth[] = [];
  let cumulativeTotal = 0;

  for (let i = 0; i < state.projectionMonths; i++) {
    const growthFactor = Math.pow(1 + state.growthPercent / 100, i);
    const gbPerDay = state.totalGbPerDay * growthFactor;
    const breakdown = calculateMonthlyCost(state, gbPerDay);

    cumulativeTotal += breakdown.total;

    months.push({
      month: i + 1,
      label: `Month ${i + 1}`,
      growthFactor,
      gbPerDay,
      breakdown,
      cumulativeTotal,
      isQuarterEnd: (i + 1) % 3 === 0,
      isYearEnd: (i + 1) % 12 === 0,
    });
  }

  // Calculate quarterly totals
  const quarterlyTotals: number[] = [];
  for (let q = 0; q < Math.ceil(state.projectionMonths / 3); q++) {
    const start = q * 3;
    const end = Math.min(start + 3, state.projectionMonths);
    let qTotal = 0;
    for (let i = start; i < end; i++) {
      qTotal += months[i].breakdown.total;
    }
    quarterlyTotals.push(qTotal);
  }

  // Calculate annual totals
  const annualTotals: number[] = [];
  for (let y = 0; y < Math.ceil(state.projectionMonths / 12); y++) {
    const start = y * 12;
    const end = Math.min(start + 12, state.projectionMonths);
    let yTotal = 0;
    for (let i = start; i < end; i++) {
      yTotal += months[i].breakdown.total;
    }
    annualTotals.push(yTotal);
  }

  return {
    months,
    quarterlyTotals,
    annualTotals,
    grandTotal: cumulativeTotal,
  };
}
