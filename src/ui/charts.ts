import { Chart, registerables } from 'chart.js';
import type { ProjectionResult } from '../engine';
import type { MonthlyCostBreakdown } from '../engine';
import { currency } from '../format';

Chart.register(...registerables);

let breakdownChart: Chart | null = null;
let projectionChart: Chart | null = null;

/**
 * Render cost breakdown pie/bar chart and projection line chart.
 */
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
        <div class="d-flex flex-wrap" style="gap: 24px;">
          <div style="flex: 1; min-width: 300px; max-width: 400px;">
            <h4 class="f5 mb-2 text-center">Monthly Cost Breakdown</h4>
            <canvas id="breakdown-chart" height="250"></canvas>
          </div>
          <div style="flex: 2; min-width: 400px;">
            <h4 class="f5 mb-2 text-center">Cost Projection Over Time</h4>
            <canvas id="projection-chart" height="250"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  renderBreakdownChart(container, breakdown, discountPercent);
  renderProjectionChart(container, projection);
}

function renderBreakdownChart(
  container: HTMLElement,
  breakdown: MonthlyCostBreakdown,
  _discountPercent: number,
): void {
  const canvas = container.querySelector('#breakdown-chart') as HTMLCanvasElement;
  if (!canvas) return;

  // Destroy previous chart instance
  if (breakdownChart) {
    breakdownChart.destroy();
    breakdownChart = null;
  }

  const items: { label: string; value: number; color: string }[] = [
    { label: 'Auxiliary Ingestion', value: breakdown.auxiliaryIngestion + breakdown.auxiliaryLogProcessing, color: '#0969da' },
    { label: 'Basic Ingestion', value: breakdown.basicIngestion, color: '#1a7f37' },
    { label: 'Analytics Ingestion', value: breakdown.analyticsIngestion, color: '#8250df' },
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

function renderProjectionChart(
  container: HTMLElement,
  projection: ProjectionResult,
): void {
  const canvas = container.querySelector('#projection-chart') as HTMLCanvasElement;
  if (!canvas) return;

  if (projectionChart) {
    projectionChart.destroy();
    projectionChart = null;
  }

  const labels = projection.months.map(m => m.label);
  const monthlyCosts = projection.months.map(m => Math.round(m.breakdown.total * 100) / 100);
  const cumulativeCosts = projection.months.map(m => Math.round(m.cumulativeTotal * 100) / 100);

  projectionChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Monthly Cost',
          data: monthlyCosts,
          borderColor: '#8250df',
          backgroundColor: 'rgba(130, 80, 223, 0.1)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y',
        },
        {
          label: 'Cumulative Cost',
          data: cumulativeCosts,
          borderColor: '#0969da',
          backgroundColor: 'rgba(9, 105, 218, 0.05)',
          fill: false,
          tension: 0.3,
          borderDash: [5, 5],
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 8 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${currency(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Monthly Cost ($)' },
          ticks: {
            callback: (value) => `$${Number(value).toLocaleString()}`,
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Cumulative ($)' },
          ticks: {
            callback: (value) => `$${Number(value).toLocaleString()}`,
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}
