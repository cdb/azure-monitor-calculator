import { Chart, registerables } from 'chart.js';
import type { ProjectionResult } from '../engine';
import type { MonthlyCostBreakdown } from '../engine';
import { currency } from '../format';

Chart.register(...registerables);

let breakdownChart: Chart | null = null;
let monthlyChart: Chart | null = null;
let cumulativeChart: Chart | null = null;

export function renderCharts(
  container: HTMLElement,
  breakdown: MonthlyCostBreakdown,
  projection: ProjectionResult,
  discountPercent: number,
): void {
  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header">
        <h3 class="Box-title">Charts</h3>
      </div>
      <div class="Box-body">
        <div class="d-flex flex-wrap" style="gap: 24px; margin-bottom: 24px;">
          <div style="flex: 1; min-width: 280px; max-width: 360px; position: relative; height: 300px;">
            <h4 class="f5 mb-2 text-center">Monthly Cost Breakdown</h4>
            <canvas id="breakdown-chart"></canvas>
          </div>
          <div style="flex: 2; min-width: 400px; position: relative; height: 300px;">
            <h4 class="f5 mb-2 text-center">Monthly Cost Over Time</h4>
            <canvas id="monthly-chart"></canvas>
          </div>
        </div>
        <div style="position: relative; height: 280px;">
          <h4 class="f5 mb-2 text-center">Cumulative Spend</h4>
          <canvas id="cumulative-chart"></canvas>
        </div>
      </div>
    </div>
  `;

  renderBreakdownChart(container, breakdown, discountPercent);
  renderMonthlyChart(container, projection);
  renderCumulativeChart(container, projection);
}

function renderBreakdownChart(
  container: HTMLElement,
  breakdown: MonthlyCostBreakdown,
  _discountPercent: number,
): void {
  const canvas = container.querySelector('#breakdown-chart') as HTMLCanvasElement;
  if (!canvas) return;

  if (breakdownChart) { breakdownChart.destroy(); breakdownChart = null; }

  const items: { label: string; value: number; color: string }[] = [
    { label: 'Analytics Ingestion', value: breakdown.analyticsIngestion, color: '#8250df' },
    { label: 'Basic Ingestion', value: breakdown.basicIngestion, color: '#1a7f37' },
    { label: 'Auxiliary Ingestion', value: breakdown.auxiliaryIngestion + breakdown.auxiliaryLogProcessing, color: '#0969da' },
    { label: 'Interactive Retention', value: breakdown.analyticsInteractiveRetention, color: '#bf8700' },
    { label: 'Long-Term Retention', value: breakdown.analyticsLongTermRetention + breakdown.basicLongTermRetention + breakdown.auxiliaryLongTermRetention, color: '#cf222e' },
    { label: 'Query & Search', value: breakdown.queryCost + breakdown.searchJobsCost, color: '#0550ae' },
    { label: 'Export & Platform', value: breakdown.dataExportCost + breakdown.platformLogsCost, color: '#6e7781' },
  ].filter(i => i.value > 0);

  breakdownChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: items.map(i => i.label),
      datasets: [{
        data: items.map(i => Math.round(i.value * 100) / 100),
        backgroundColor: items.map(i => i.color),
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 8 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${currency(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

function renderMonthlyChart(
  container: HTMLElement,
  projection: ProjectionResult,
): void {
  const canvas = container.querySelector('#monthly-chart') as HTMLCanvasElement;
  if (!canvas) return;

  if (monthlyChart) { monthlyChart.destroy(); monthlyChart = null; }

  const labels = projection.months.map(m => m.label);
  const monthlyCosts = projection.months.map(m => Math.round(m.breakdown.total * 100) / 100);

  monthlyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Monthly Cost',
        data: monthlyCosts,
        backgroundColor: 'rgba(130, 80, 223, 0.6)',
        borderColor: '#8250df',
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Monthly Cost: ${currency(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => `$${Number(value).toLocaleString()}` },
        },
        x: {
          ticks: {
            maxTicksLimit: 12,
            font: { size: 10 },
          },
        },
      },
    },
  });
}

function renderCumulativeChart(
  container: HTMLElement,
  projection: ProjectionResult,
): void {
  const canvas = container.querySelector('#cumulative-chart') as HTMLCanvasElement;
  if (!canvas) return;

  if (cumulativeChart) { cumulativeChart.destroy(); cumulativeChart = null; }

  const labels = projection.months.map(m => m.label);
  const cumulativeCosts = projection.months.map(m => Math.round(m.cumulativeTotal * 100) / 100);

  cumulativeChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Cumulative Spend',
        data: cumulativeCosts,
        borderColor: '#0969da',
        backgroundColor: 'rgba(9, 105, 218, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Cumulative: ${currency(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => `$${Number(value).toLocaleString()}` },
        },
        x: {
          ticks: {
            maxTicksLimit: 12,
            font: { size: 10 },
          },
        },
      },
    },
  });
}
