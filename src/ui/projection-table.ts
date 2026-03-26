import type { ProjectionResult } from '../engine';
import { currency, currencyCompact } from '../format';
import { copyTsvToClipboard, downloadCsv } from '../export';
import type { TableData } from '../export';

const r = (v: number) => Math.round(v * 100) / 100;

/**
 * Render the multi-month projection table with quarterly/annual roll-ups.
 */
export function renderProjectionTable(
  container: HTMLElement,
  projection: ProjectionResult,
  projectionB?: ProjectionResult,
): void {
  const { months, quarterlyTotals, annualTotals, grandTotal } = projection;
  const hasB = !!projectionB;
  const bBorder = 'border-left: 2px solid rgba(191,135,0,0.2);';

  let tableRows = '';
  let currentQuarter = 0;

  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const mb = projectionB?.months[i];
    tableRows += `
      <tr>
        <td class="p-2 text-mono">${m.label}</td>
        <td class="p-2 text-right text-mono">${currency(m.breakdown.total)}</td>
        <td class="p-2 text-right text-mono color-fg-muted">${currency(m.cumulativeTotal)}</td>
        ${hasB && mb ? `
          <td class="p-2 text-right text-mono" style="${bBorder}">${currency(mb.breakdown.total)}</td>
          <td class="p-2 text-right text-mono color-fg-muted">${currency(mb.cumulativeTotal)}</td>
          <td class="p-2 text-right text-mono text-small" style="${mb.breakdown.total < m.breakdown.total ? 'color:#1a7f37;' : mb.breakdown.total > m.breakdown.total ? 'color:#cf222e;' : ''}">${mb.breakdown.total === m.breakdown.total ? '—' : (mb.breakdown.total > m.breakdown.total ? '+' : '') + currency(mb.breakdown.total - m.breakdown.total)}</td>
        ` : ''}
      </tr>
    `;

    if (m.isQuarterEnd && currentQuarter < quarterlyTotals.length) {
      const qbTotal = projectionB?.quarterlyTotals[currentQuarter];
      const qbCum = projectionB?.months[i]?.cumulativeTotal;
      tableRows += `
        <tr class="color-bg-attention-muted" style="font-weight: 600;">
          <td class="p-2">Q${currentQuarter + 1} Total</td>
          <td class="p-2 text-right text-mono">${currency(quarterlyTotals[currentQuarter])}</td>
          <td class="p-2 text-right text-mono color-fg-muted">${currency(m.cumulativeTotal)}</td>
          ${hasB && qbTotal != null ? `
            <td class="p-2 text-right text-mono" style="${bBorder}">${currency(qbTotal)}</td>
            <td class="p-2 text-right text-mono color-fg-muted">${currency(qbCum!)}</td>
            <td class="p-2"></td>
          ` : ''}
        </tr>
      `;
      currentQuarter++;
    }

    if (m.isYearEnd) {
      const yearIndex = Math.floor((m.month - 1) / 12);
      const ybTotal = projectionB?.annualTotals[yearIndex];
      const ybCum = projectionB?.months[i]?.cumulativeTotal;
      tableRows += `
        <tr class="color-bg-accent-muted" style="font-weight: 700;">
          <td class="p-2">Year ${yearIndex + 1} Total</td>
          <td class="p-2 text-right text-mono">${currency(annualTotals[yearIndex])}</td>
          <td class="p-2 text-right text-mono color-fg-muted">${currency(m.cumulativeTotal)}</td>
          ${hasB && ybTotal != null ? `
            <td class="p-2 text-right text-mono" style="${bBorder}">${currency(ybTotal)}</td>
            <td class="p-2 text-right text-mono color-fg-muted">${currency(ybCum!)}</td>
            <td class="p-2"></td>
          ` : ''}
        </tr>
      `;
    }
  }

  if (months.length % 3 !== 0) {
    const lastQuarter = quarterlyTotals.length - 1;
    const lastMonth = months[months.length - 1];
    const qbTotal = projectionB?.quarterlyTotals[lastQuarter];
    tableRows += `
      <tr class="color-bg-attention-muted" style="font-weight: 600;">
        <td class="p-2">Q${lastQuarter + 1} Total (partial)</td>
        <td class="p-2 text-right text-mono">${currency(quarterlyTotals[lastQuarter])}</td>
        <td class="p-2 text-right text-mono color-fg-muted">${currency(lastMonth.cumulativeTotal)}</td>
        ${hasB && qbTotal != null ? `
          <td class="p-2 text-right text-mono" style="${bBorder}">${currency(qbTotal)}</td>
          <td class="p-2 text-right text-mono color-fg-muted">${currency(projectionB!.grandTotal)}</td>
          <td class="p-2"></td>
        ` : ''}
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
                <th class="p-2 text-right">${hasB ? 'A Total' : 'Total'}</th>
                <th class="p-2 text-right">${hasB ? 'A Cumul.' : 'Cumulative'}</th>
                ${hasB ? `
                  <th class="p-2 text-right" style="${bBorder}">B Total</th>
                  <th class="p-2 text-right">B Cumul.</th>
                  <th class="p-2 text-right">Δ</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr style="font-weight: 700; font-size: 1.1em; border-top: 2px solid var(--borderColor-default, #d0d7de);">
                <td class="p-2">Grand Total (${months.length} mo)</td>
                <td class="p-2 text-right text-mono">${currency(grandTotal)}</td>
                <td class="p-2"></td>
                ${hasB ? `
                  <td class="p-2 text-right text-mono" style="${bBorder}">${currency(projectionB!.grandTotal)}</td>
                  <td class="p-2"></td>
                  <td class="p-2 text-right text-mono" style="${projectionB!.grandTotal < grandTotal ? 'color:#1a7f37;' : projectionB!.grandTotal > grandTotal ? 'color:#cf222e;' : ''}">${projectionB!.grandTotal === grandTotal ? '—' : (projectionB!.grandTotal > grandTotal ? '+' : '') + currency(projectionB!.grandTotal - grandTotal)}</td>
                ` : ''}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="Box-footer color-bg-subtle">
        <div class="d-flex flex-wrap" style="gap: 16px;">
          ${annualTotals.map((t, i) => `
            <span><strong>Year ${i + 1}:</strong> ${currencyCompact(t)}${hasB ? ` / <span style="color:#bf8700;">${currencyCompact(projectionB!.annualTotals[i])}</span>` : ''}</span>
          `).join('')}
          <span><strong>Grand Total:</strong> ${currencyCompact(grandTotal)}${hasB ? ` / <span style="color:#bf8700;">${currencyCompact(projectionB!.grandTotal)}</span>` : ''}</span>
        </div>
      </div>
    </div>
  `;

  // Build export data
  const headers = hasB
    ? ['Month', 'A Total', 'A Cumulative', 'B Total', 'B Cumulative', 'Delta']
    : ['Month', 'Total', 'Cumulative'];

  const tableData: TableData = { headers, rows: [] };

  let qIdx = 0;
  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const row: (string | number)[] = [m.label, r(m.breakdown.total), r(m.cumulativeTotal)];
    if (hasB) {
      const mb = projectionB!.months[i];
      row.push(r(mb.breakdown.total), r(mb.cumulativeTotal), r(mb.breakdown.total - m.breakdown.total));
    }
    tableData.rows.push(row);

    if (m.isQuarterEnd && qIdx < quarterlyTotals.length) {
      const qRow: (string | number)[] = [`Q${qIdx + 1} Total`, r(quarterlyTotals[qIdx]), r(m.cumulativeTotal)];
      if (hasB) qRow.push(r(projectionB!.quarterlyTotals[qIdx]), r(projectionB!.months[i].cumulativeTotal), '');
      tableData.rows.push(qRow);
      qIdx++;
    }

    if (m.isYearEnd) {
      const yi = Math.floor((m.month - 1) / 12);
      const yRow: (string | number)[] = [`Year ${yi + 1} Total`, r(annualTotals[yi]), r(m.cumulativeTotal)];
      if (hasB) yRow.push(r(projectionB!.annualTotals[yi]), r(projectionB!.months[i].cumulativeTotal), '');
      tableData.rows.push(yRow);
    }
  }

  if (months.length % 3 !== 0) {
    const lastQ = quarterlyTotals.length - 1;
    const pRow: (string | number)[] = [`Q${lastQ + 1} Total (partial)`, r(quarterlyTotals[lastQ]), r(grandTotal)];
    if (hasB) pRow.push(r(projectionB!.quarterlyTotals[lastQ]), r(projectionB!.grandTotal), '');
    tableData.rows.push(pRow);
  }

  const gRow: (string | number)[] = [`Grand Total (${months.length} mo)`, r(grandTotal), ''];
  if (hasB) gRow.push(r(projectionB!.grandTotal), '', r(projectionB!.grandTotal - grandTotal));
  tableData.rows.push(gRow);

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
