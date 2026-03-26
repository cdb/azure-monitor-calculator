import type { MonthlyCostBreakdown } from '../engine';
import { PRICING } from '../pricing-data';
import { currency, percent } from '../format';
import { copyTsvToClipboard, downloadCsv } from '../export';
import type { TableData } from '../export';

function buildRows(breakdown: MonthlyCostBreakdown): [string, string, number][] {
  const tierLabel = breakdown.selectedTier
    ? `${breakdown.selectedTier.gbPerDay} GB/day ($${breakdown.selectedTier.effectivePerGb}/GB)`
    : `PAYG ($${PRICING.ingestion.analytics.payg.perGb}/GB)`;

  return [
    ['Ingestion', 'Auxiliary Logs', breakdown.auxiliaryIngestion],
    ['Ingestion', 'Auxiliary Log Processing', breakdown.auxiliaryLogProcessing],
    ['Ingestion', 'Basic Logs', breakdown.basicIngestion],
    ['Ingestion', `Analytics Logs (${tierLabel})`, breakdown.analyticsIngestion],
    ['Retention', 'Analytics Interactive', breakdown.analyticsInteractiveRetention],
    ['Retention', 'Analytics Long-Term', breakdown.analyticsLongTermRetention],
    ['Retention', 'Basic Long-Term', breakdown.basicLongTermRetention],
    ['Retention', 'Auxiliary Long-Term', breakdown.auxiliaryLongTermRetention],
    ['Query', 'Basic/Auxiliary Queries', breakdown.queryCost],
    ['Query', 'Search Jobs', breakdown.searchJobsCost],
    ['Export', 'Data Export', breakdown.dataExportCost],
    ['Export', 'Platform Logs', breakdown.platformLogsCost],
  ];
}

export function renderCostSummary(
  container: HTMLElement,
  breakdownA: MonthlyCostBreakdown,
  discountPercent: number,
  breakdownB?: MonthlyCostBreakdown,
): void {
  const rowsA = buildRows(breakdownA);
  const rowsB = breakdownB ? buildRows(breakdownB) : null;
  const hasB = !!rowsB && !!breakdownB;

  // Merge active rows: show row if non-zero in either scenario
  const activeIndices: number[] = [];
  for (let i = 0; i < rowsA.length; i++) {
    if (rowsA[i][2] > 0 || (rowsB && rowsB[i][2] > 0)) {
      activeIndices.push(i);
    }
  }

  function diffClass(a: number, b: number): string {
    if (b < a) return 'color: #1a7f37;'; // cheaper = green
    if (b > a) return 'color: #cf222e;'; // more expensive = red
    return '';
  }

  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header d-flex flex-items-center flex-justify-between">
        <h3 class="Box-title">Monthly Cost Breakdown</h3>
        <div class="d-flex" style="gap: 8px;">
          <button class="btn btn-sm" id="copy-breakdown">📋 Copy for Excel</button>
          <button class="btn btn-sm" id="download-breakdown">⬇ Download CSV</button>
        </div>
      </div>
      <div class="Box-body p-0">
        <table class="width-full">
          <thead>
            <tr class="color-bg-subtle">
              <th class="p-2 text-left">Category</th>
              <th class="p-2 text-left">Item</th>
              <th class="p-2 text-right">${hasB ? 'A' : 'Monthly Cost'}</th>
              <th class="p-2 text-right" style="width: 55px;">%</th>
              ${hasB ? `
                <th class="p-2 text-right" style="border-left: 2px solid #bf8700;">B</th>
                <th class="p-2 text-right" style="width: 55px;">%</th>
                <th class="p-2 text-right" style="width: 80px;">Δ</th>
              ` : ''}
            </tr>
          </thead>
          <tbody>
            ${activeIndices.map(i => {
              const [cat, item, costA] = rowsA[i];
              const costB = rowsB ? rowsB[i][2] : 0;
              const delta = costB - costA;
              return `
                <tr>
                  <td class="p-2 text-small color-fg-muted">${cat}</td>
                  <td class="p-2">${item}</td>
                  <td class="p-2 text-right text-mono">${currency(costA)}</td>
                  <td class="p-2 text-right text-mono text-small color-fg-muted">${breakdownA.subtotal > 0 ? percent(costA / breakdownA.subtotal * 100, 1) : '—'}</td>
                  ${hasB ? `
                    <td class="p-2 text-right text-mono" style="border-left: 2px solid rgba(191,135,0,0.2);">${currency(costB)}</td>
                    <td class="p-2 text-right text-mono text-small color-fg-muted">${breakdownB!.subtotal > 0 ? percent(costB / breakdownB!.subtotal * 100, 1) : '—'}</td>
                    <td class="p-2 text-right text-mono text-small" style="${diffClass(costA, costB)}">${delta === 0 ? '—' : (delta > 0 ? '+' : '') + currency(delta)}</td>
                  ` : ''}
                </tr>
              `;
            }).join('')}

            <tr class="color-bg-subtle" style="font-weight: 600;">
              <td class="p-2" colspan="2">Subtotal</td>
              <td class="p-2 text-right text-mono">${currency(breakdownA.subtotal)}</td>
              <td class="p-2 text-right text-mono text-small">100%</td>
              ${hasB ? `
                <td class="p-2 text-right text-mono" style="border-left: 2px solid rgba(191,135,0,0.2);">${currency(breakdownB!.subtotal)}</td>
                <td class="p-2 text-right text-mono text-small">100%</td>
                <td class="p-2 text-right text-mono text-small" style="${diffClass(breakdownA.subtotal, breakdownB!.subtotal)}">${breakdownB!.subtotal - breakdownA.subtotal === 0 ? '—' : (breakdownB!.subtotal > breakdownA.subtotal ? '+' : '') + currency(breakdownB!.subtotal - breakdownA.subtotal)}</td>
              ` : ''}
            </tr>

            ${discountPercent > 0 ? `
              <tr class="color-fg-success">
                <td class="p-2" colspan="2">Discount (${percent(discountPercent, 0)})</td>
                <td class="p-2 text-right text-mono">-${currency(breakdownA.discountAmount)}</td>
                <td class="p-2"></td>
                ${hasB ? `
                  <td class="p-2 text-right text-mono" style="border-left: 2px solid rgba(191,135,0,0.2);">-${currency(breakdownB!.discountAmount)}</td>
                  <td class="p-2" colspan="2"></td>
                ` : ''}
              </tr>
            ` : ''}

            <tr style="font-weight: 700; font-size: 1.1em; border-top: 2px solid var(--borderColor-default, #d0d7de);">
              <td class="p-2" colspan="2">Total Monthly Cost</td>
              <td class="p-2 text-right text-mono">${currency(breakdownA.total)}</td>
              <td class="p-2"></td>
              ${hasB ? `
                <td class="p-2 text-right text-mono" style="border-left: 2px solid rgba(191,135,0,0.2);">${currency(breakdownB!.total)}</td>
                <td class="p-2"></td>
                <td class="p-2 text-right text-mono" style="${diffClass(breakdownA.total, breakdownB!.total)}">${breakdownB!.total - breakdownA.total === 0 ? '—' : (breakdownB!.total > breakdownA.total ? '+' : '') + currency(breakdownB!.total - breakdownA.total)}</td>
              ` : ''}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Export data
  const headers = hasB
    ? ['Category', 'Item', 'A Cost', 'A %', 'B Cost', 'B %', 'Delta']
    : ['Category', 'Item', 'Monthly Cost', '% of Total'];

  const allRows = buildRows(breakdownA);
  const allRowsB = breakdownB ? buildRows(breakdownB) : null;

  const tableData: TableData = {
    headers,
    rows: [
      ...allRows.map((r, i) => {
        const base = [r[0], r[1], Math.round(r[2] * 100) / 100, breakdownA.subtotal > 0 ? `${(r[2] / breakdownA.subtotal * 100).toFixed(1)}%` : ''] as (string | number)[];
        if (allRowsB && breakdownB) {
          const cb = allRowsB[i][2];
          base.push(Math.round(cb * 100) / 100);
          base.push(breakdownB.subtotal > 0 ? `${(cb / breakdownB.subtotal * 100).toFixed(1)}%` : '');
          base.push(Math.round((cb - r[2]) * 100) / 100);
        }
        return base;
      }),
      (() => {
        const base: (string | number)[] = ['', 'TOTAL', Math.round(breakdownA.total * 100) / 100, ''];
        if (breakdownB) {
          base.push(Math.round(breakdownB.total * 100) / 100, '', Math.round((breakdownB.total - breakdownA.total) * 100) / 100);
        }
        return base;
      })(),
    ],
  };

  container.querySelector('#copy-breakdown')?.addEventListener('click', async () => {
    const btn = container.querySelector('#copy-breakdown') as HTMLButtonElement;
    if (await copyTsvToClipboard(tableData)) {
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy for Excel'; }, 2000);
    }
  });

  container.querySelector('#download-breakdown')?.addEventListener('click', () => {
    downloadCsv(tableData, 'azure-monitor-monthly-breakdown.csv');
  });
}
