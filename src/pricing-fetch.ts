import type { PricingData, CommitmentTier } from './pricing-data';
import { computeSavings } from './pricing-data';

const API_BASE = 'https://prices.azure.com/api/retail/prices';

const cache: Record<string, PricingData> = {};

interface PriceItem {
  meterName: string;
  unitPrice: number;
  retailPrice: number;
  tierMinimumUnits: number;
  unitOfMeasure: string;
  productName: string;
}

interface PriceResponse {
  Items: PriceItem[];
  NextPageLink: string | null;
}

async function fetchAllPages(filter: string): Promise<PriceItem[]> {
  const items: PriceItem[] = [];
  let url: string | null =
    `${API_BASE}?$filter=${encodeURIComponent(filter)}`;

  while (url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Azure pricing API returned ${resp.status}`);
    const data: PriceResponse = await resp.json();
    items.push(...data.Items);
    url = data.NextPageLink;
  }
  return items;
}

function findMeter(items: PriceItem[], meterName: string, tierMin?: number): PriceItem | undefined {
  return items.find(
    (i) =>
      i.meterName === meterName &&
      (tierMin === undefined || i.tierMinimumUnits === tierMin),
  );
}

function price(item: PriceItem | undefined): number {
  return item?.retailPrice ?? 0;
}

export async function fetchRegionPricing(regionId: string): Promise<PricingData> {
  if (cache[regionId]) return cache[regionId];

  const baseFilter = `currencyCode eq 'USD' and priceType eq 'Consumption'`;

  const [monitorItems, laItems] = await Promise.all([
    fetchAllPages(
      `${baseFilter} and serviceName eq 'Azure Monitor' and armRegionName eq '${regionId}'`,
    ),
    fetchAllPages(
      `${baseFilter} and serviceName eq 'Log Analytics' and armRegionName eq '${regionId}'`,
    ),
  ]);

  const allItems = [...monitorItems, ...laItems];

  // Analytics PAYG — tiered meter, price at 5 GB+
  const analyticsPAYG = findMeter(allItems, 'Analytics Logs Data Ingestion', 5.0);
  const paygPerGb = price(analyticsPAYG);

  // Commitment tiers
  const gbLevels = [100, 200, 300, 400, 500, 1000, 2000, 5000, 10000, 25000, 50000];
  const commitmentTiers: CommitmentTier[] = gbLevels
    .map((gb) => {
      const meter = findMeter(allItems, `${gb} GB Commitment Tier Capacity Reservation`);
      if (!meter) return null;
      const dailyPrice = meter.retailPrice;
      const effectivePerGb = Math.round((dailyPrice / gb) * 1000) / 1000;
      return {
        gbPerDay: gb,
        dailyPrice,
        effectivePerGb,
        savingsPercent: paygPerGb > 0 ? computeSavings(dailyPrice, gb, paygPerGb) : 0,
      };
    })
    .filter((t): t is CommitmentTier => t !== null);

  // Basic & Auxiliary
  const basicPerGb = price(findMeter(allItems, 'Basic Logs Data Ingestion'));
  const auxPerGb = price(findMeter(allItems, 'Auxiliary Logs Data Ingestion'));

  // Retention
  const interactiveRetention = price(findMeter(allItems, 'Analytics Logs Data Retention'));
  // Long-term retention: look for a dedicated meter, else estimate as 20% of interactive
  const longTermMeter = findMeter(allItems, 'Analytics Logs Long Term Retention');
  const longTermRetention = longTermMeter
    ? price(longTermMeter)
    : interactiveRetention > 0
      ? Math.round(interactiveRetention * 0.2 * 1000) / 1000
      : 0.02;

  // Query
  const searchQueriesPerGb = price(findMeter(allItems, 'Search Queries Scanned'));
  const searchJobsPerGb = price(findMeter(allItems, 'Search Jobs Scanned'));

  // Export & platform
  const dataExportMeter = findMeter(allItems, 'Log Analytics data export Data Exported');
  const dataExportPerGb = dataExportMeter ? price(dataExportMeter) : 0.10;
  const platformLogsPerGb = price(findMeter(allItems, 'Platform Logs Data Processed'));
  const replicationPerGb = price(findMeter(allItems, 'Data Replication Data Replicated'));
  const emissionPerGb = price(findMeter(allItems, 'Logs Emitted From Cloud Pipeline Data Emitted'));

  // Data restore meter (not currently in PricingData but captured for future use)
  // const dataRestorePerGb = price(findMeter(allItems, 'Data Restore'));

  const regionLabel =
    analyticsPAYG?.productName?.replace(' - ', ' ').replace('Azure Monitor', '').trim() ||
    regionId;

  const data: PricingData = {
    region: regionLabel,
    currency: 'USD',
    lastUpdated: new Date().toISOString().slice(0, 10),
    ingestion: {
      auxiliary: { perGb: auxPerGb, logProcessingPerGb: auxPerGb },
      basic: { perGb: basicPerGb },
      analytics: {
        payg: { perGb: paygPerGb, freeGbPerMonth: 5 },
        commitmentTiers,
      },
    },
    retention: {
      interactive: {
        perGbPerMonth: interactiveRetention,
        description: 'Analytics logs beyond 31 days, up to 2 years',
      },
      longTerm: {
        perGbPerMonth: longTermRetention,
        description: 'All plans, up to 12 years',
      },
      included: { auxiliaryDays: 30, basicDays: 30, analyticsDays: 31 },
    },
    query: {
      basicAuxiliaryPerGb: searchQueriesPerGb || searchJobsPerGb,
      searchJobsPerGb,
    },
    exportCosts: {
      dataExportPerGb,
      platformLogsPerGb,
      workspaceReplicationPerGb: replicationPerGb,
      logEmissionPerGb: emissionPerGb,
    },
  };

  cache[regionId] = data;
  return data;
}
