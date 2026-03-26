# Azure Monitor Logs Cost Calculator

Interactive budgeting tool for Azure Monitor logging costs. Built with TypeScript, Vite, and GitHub Primer CSS.

## Features

- **Plan split modeling** — Allocate volume across Auxiliary ($0.05/GB), Basic ($0.50/GB), and Analytics ($2.30/GB PAYG + commitment tiers) with interactive sliders
- **Commitment tier auto-selection** — Automatically recommends the optimal Analytics commitment tier based on volume
- **Retention configuration** — Interactive and long-term retention per plan with cost impact
- **Internal discount** — Apply a global discount percentage (for internal Microsoft pricing)
- **Growth projection** — Configure month-over-month growth rate with monthly/quarterly/annual roll-ups
- **URL sharing** — All parameters reflected in the URL; copy and share scenarios with colleagues
- **Excel export** — "Copy for Excel" (TSV clipboard) and "Download CSV" buttons on all tables
- **Charts** — Doughnut chart for cost breakdown, line chart for cost projection over time

## Pricing Data

Sourced from the [Azure Retail Pricing API](https://prices.azure.com/) for the **East US** region (USD). Last updated: 2026-03-26.

## Development

```bash
npm install
npm run dev     # Start dev server at http://localhost:5173
npm run build   # Build to dist/
```

## Deploy to GitHub Pages

```bash
npm run build
# Push dist/ contents to gh-pages branch, or configure GitHub Pages to deploy from Actions
```

## Tech Stack

- [Vite](https://vite.dev/) — Build tool
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [@primer/css](https://primer.style/css) — GitHub's design system
- [Chart.js](https://www.chartjs.org/) — Charts
