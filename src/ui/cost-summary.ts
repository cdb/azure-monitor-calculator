import type { MonthlyCostBreakdown } from '../engine';
import { currency, percent } from '../format';
import { copyTsvToClipboard, downloadCsv } from '../export';
import type { TableData } from '../export';

/**
 * Render the monthly cost breakdown summary.
 */
export function renderCostSummary(
  container: HTMLElement,
  breakdown: MonthlyCostBreakdown,
  discountPercent: number,
): void {
  const tierLabel = breakdown.selectedTier
    ? `${breakdown.selectedTier.gbPerDay} GB/day commitment ($${breakdown.selectedTier.effectivePerGb}/GB, ${breakdown.selectedTier.savingsPercent}% savings)`
    : 'Pay-As-You-Go ($2.30/GB)';

  const rows: [string, string, number][] = [
    ['Ingestion', 'Auxiliary Logs', breakdown.auxiliaryIngestion],
    ['Ingestion', 'Auxiliary Log Processing', breakdown.auxiliaryLogProcessing],
    ['Ingestion', 'Basic Logs', breakdown.basicIngestion],
    ['Ingestion', `Analytics Logs (${tierLabel})`, breakdown.analyticsIngestion],
    ['Retention', 'Analytics Interactive Retention', breakdown.analyticsInteractiveRetention],
    ['Retention', 'Analytics Long-Term Retention', breakdown.analyticsLongTermRetention],
    ['Retention', 'Basic Long-Term Retention', breakdown.basicLongTermRetention],
    ['Retention', 'Auxiliary Long-Term Retention', breakdown.auxiliaryLongTermRetention],
    ['Query', 'Basic/Auxiliary Queries', breakdown.queryCost],
    ['Query', 'Search Jobs', breakdown.searchJobsCost],
    ['Export', 'Data Export', breakdown.dataExportCost],
    ['Export', 'Platform Logs', breakdown.platformLogsCost],
  ];

  // Filter out zero rows for cleaner display
  const activeRows = rows.filter(([, , cost]) => cost > 0);

  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header d-flex flex-items-center flex-justify-between">
        <h3 class="Box-title">Monthly Cost Breakdown</h3>
        <div class="d-flex" style="gap: 8px;">
          <button class="btn btn-sm" id="copy-breakdown" title="Copy as TSV for Excel">
            📋 Copy for Excel
          </button>
          <button class="btn btn-sm" id="download-breakdown" title="Download as CSV">
            ⬇ Download CSV
          </button>
        </div>
      </div>
      <div class="Box-body p-0">
        <table class="width-full">
          <thead>
            <tr class="color-bg-subtle">
              <th class="p-2 text-left">Category</th>
              <th class="p-2 text-left">Item</th>
              <th class="p-2 text-right">Monthly Cost</th>
              <th class="p-2 text-right" style="width: 70px;">% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${activeRows.map(([cat, item, cost]) => `
              <tr>
                <td class="p-2 text-small color-fg-muted">${cat}</td>
                <td class="p-2">${item}</td>
                <td class="p-2 text-right text-mono">${currency(cost)}</td>
                <td class="p-2 text-right text-mono text-small color-fg-muted">${breakdown.subtotal > 0 ? percent(cost / breakdown.subtotal * 100, 1) : '—'}</td>
              </tr>
            `).join('')}
            <tr class="color-bg-subtle" style="font-weight: 600;">
              <td class="p-2" colspan="2">Subtotal (before discount)</td>
              <td class="p-2 text-right text-mono">${currency(breakdown.subtotal)}</td>
              <td class="p-2 text-right text-mono text-small">100%</td>
            </tr>
            ${discountPercent > 0 ? `
              <tr class="color-fg-success">
                <td class="p-2" colspan="2">Internal Discount (${percent(discountPercent, 0)})</td>
                <td class="p-2 text-right text-mono">-${currency(breakdown.discountAmount)}</td>
                <td class="p-2"></td>
              </tr>
            ` : ''}
            <tr style="font-weight: 700; font-size: 1.1em; border-top: 2px solid var(--borderColor-default, #d0d7de);">
              <td class="p-2" colspan="2">Total Monthly Cost</td>
              <td class="p-2 text-right text-mono">${currency(breakdown.total)}</td>
              <td class="p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Build table data for export
  const tableData: TableData = {
    headers: ['Category', 'Item', 'Monthly Cost', '% of Total'],
    rows: [
      ...rows.map(([cat, item, cost]) => [cat, item, Math.round(cost * 100) / 100, breakdown.subtotal > 0 ? `${(cost / breakdown.subtotal * 100).toFixed(1)}%` : ''] as (string | number)[]),
      ['', 'Subtotal', Math.round(breakdown.subtotal * 100) / 100, '100%'],
      ...(discountPercent > 0
        ? [['', `Discount (${discountPercent}%)`, -Math.round(breakdown.discountAmount * 100) / 100, ''] as (string | number)[]]
        : []),
      ['', 'TOTAL', Math.round(breakdown.total * 100) / 100, ''],
    ],
  };

  container.querySelector('#copy-breakdown')?.addEventListener('click', async () => {
    const btn = container.querySelector('#copy-breakdown') as HTMLButtonElement;
    const ok = await copyTsvToClipboard(tableData);
    if (ok) {
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy for Excel'; }, 2000);
    }
  });

  container.querySelector('#download-breakdown')?.addEventListener('click', () => {
    downloadCsv(tableData, 'azure-monitor-monthly-breakdown.csv');
  });
}
