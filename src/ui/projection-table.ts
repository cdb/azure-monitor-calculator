import type { ProjectionResult } from '../engine';
import { currency, currencyCompact, number as fmtNum } from '../format';
import { copyTsvToClipboard, downloadCsv } from '../export';
import type { TableData } from '../export';

/**
 * Render the multi-month projection table with quarterly/annual roll-ups.
 */
export function renderProjectionTable(
  container: HTMLElement,
  projection: ProjectionResult,
): void {
  const { months, quarterlyTotals, annualTotals, grandTotal } = projection;

  let tableRows = '';
  let currentQuarter = 0;

  for (const m of months) {
    tableRows += `
      <tr>
        <td class="p-2 text-mono">${m.label}</td>
        <td class="p-2 text-right text-mono">${fmtNum(m.gbPerDay)}</td>
        <td class="p-2 text-right text-mono">${currency(m.breakdown.subtotal)}</td>
        <td class="p-2 text-right text-mono">${currency(m.breakdown.discountAmount)}</td>
        <td class="p-2 text-right text-mono" style="font-weight: 600;">${currency(m.breakdown.total)}</td>
        <td class="p-2 text-right text-mono color-fg-muted">${currency(m.cumulativeTotal)}</td>
      </tr>
    `;

    if (m.isQuarterEnd && currentQuarter < quarterlyTotals.length) {
      tableRows += `
        <tr class="color-bg-attention-muted" style="font-weight: 600;">
          <td class="p-2" colspan="4">Q${currentQuarter + 1} Total</td>
          <td class="p-2 text-right text-mono">${currency(quarterlyTotals[currentQuarter])}</td>
          <td class="p-2 text-right text-mono color-fg-muted">${currency(m.cumulativeTotal)}</td>
        </tr>
      `;
      currentQuarter++;
    }

    if (m.isYearEnd) {
      const yearIndex = Math.floor((m.month - 1) / 12);
      tableRows += `
        <tr class="color-bg-accent-muted" style="font-weight: 700;">
          <td class="p-2" colspan="4">Year ${yearIndex + 1} Total</td>
          <td class="p-2 text-right text-mono">${currency(annualTotals[yearIndex])}</td>
          <td class="p-2 text-right text-mono color-fg-muted">${currency(m.cumulativeTotal)}</td>
        </tr>
      `;
    }
  }

  // If projection doesn't end on quarter boundary, show partial quarter
  if (months.length % 3 !== 0) {
    const lastQuarter = quarterlyTotals.length - 1;
    const lastMonth = months[months.length - 1];
    tableRows += `
      <tr class="color-bg-attention-muted" style="font-weight: 600;">
        <td class="p-2" colspan="4">Q${lastQuarter + 1} Total (partial)</td>
        <td class="p-2 text-right text-mono">${currency(quarterlyTotals[lastQuarter])}</td>
        <td class="p-2 text-right text-mono color-fg-muted">${currency(lastMonth.cumulativeTotal)}</td>
      </tr>
    `;
  }

  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header d-flex flex-items-center flex-justify-between">
        <h3 class="Box-title">Cost Projection</h3>
        <div class="d-flex" style="gap: 8px;">
          <button class="btn btn-sm" id="copy-projection" title="Copy as TSV for Excel">
            📋 Copy for Excel
          </button>
          <button class="btn btn-sm" id="download-projection" title="Download as CSV">
            ⬇ Download CSV
          </button>
        </div>
      </div>
      <div class="Box-body p-0">
        <div style="max-height: 600px; overflow-y: auto;">
          <table class="width-full">
            <thead>
              <tr class="color-bg-subtle" style="position: sticky; top: 0; z-index: 1;">
                <th class="p-2 text-left">Month</th>
                <th class="p-2 text-right">GB/day</th>
                <th class="p-2 text-right">Subtotal</th>
                <th class="p-2 text-right">Discount</th>
                <th class="p-2 text-right">Total</th>
                <th class="p-2 text-right">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr style="font-weight: 700; font-size: 1.1em; border-top: 2px solid var(--borderColor-default, #d0d7de);">
                <td class="p-2" colspan="4">Grand Total (${months.length} months)</td>
                <td class="p-2 text-right text-mono">${currency(grandTotal)}</td>
                <td class="p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="Box-footer color-bg-subtle">
        <div class="d-flex flex-wrap" style="gap: 16px;">
          ${annualTotals.map((t, i) => `
            <span><strong>Year ${i + 1}:</strong> ${currencyCompact(t)}</span>
          `).join('')}
          <span><strong>Grand Total:</strong> ${currencyCompact(grandTotal)}</span>
        </div>
      </div>
    </div>
  `;

  // Build export data
  const tableData: TableData = {
    headers: ['Month', 'GB/day', 'Subtotal', 'Discount', 'Total', 'Cumulative'],
    rows: [],
  };

  let qIdx = 0;
  for (const m of months) {
    tableData.rows.push([
      m.label,
      Math.round(m.gbPerDay * 10) / 10,
      Math.round(m.breakdown.subtotal * 100) / 100,
      Math.round(m.breakdown.discountAmount * 100) / 100,
      Math.round(m.breakdown.total * 100) / 100,
      Math.round(m.cumulativeTotal * 100) / 100,
    ]);

    if (m.isQuarterEnd && qIdx < quarterlyTotals.length) {
      tableData.rows.push([`Q${qIdx + 1} Total`, '', '', '', Math.round(quarterlyTotals[qIdx] * 100) / 100, Math.round(m.cumulativeTotal * 100) / 100]);
      qIdx++;
    }

    if (m.isYearEnd) {
      const yi = Math.floor((m.month - 1) / 12);
      tableData.rows.push([`Year ${yi + 1} Total`, '', '', '', Math.round(annualTotals[yi] * 100) / 100, Math.round(m.cumulativeTotal * 100) / 100]);
    }
  }

  if (months.length % 3 !== 0) {
    const lastQ = quarterlyTotals.length - 1;
    tableData.rows.push([`Q${lastQ + 1} Total (partial)`, '', '', '', Math.round(quarterlyTotals[lastQ] * 100) / 100, Math.round(grandTotal * 100) / 100]);
  }

  tableData.rows.push([`Grand Total (${months.length} months)`, '', '', '', Math.round(grandTotal * 100) / 100, '']);

  container.querySelector('#copy-projection')?.addEventListener('click', async () => {
    const btn = container.querySelector('#copy-projection') as HTMLButtonElement;
    const ok = await copyTsvToClipboard(tableData);
    if (ok) {
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy for Excel'; }, 2000);
    }
  });

  container.querySelector('#download-projection')?.addEventListener('click', () => {
    downloadCsv(tableData, 'azure-monitor-projection.csv');
  });
}
