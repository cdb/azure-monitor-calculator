import type { CalculatorState } from '../state';
import { REGIONS } from '../regions';

export type StateChangeCallback = (state: CalculatorState) => void;

export function renderGlobalSettings(
  container: HTMLElement,
  state: CalculatorState,
  currentRegion: string,
  onChange: StateChangeCallback,
  onRegionChange: (regionId: string) => void,
): void {
  const groups: Record<string, string> = {
    primary: 'US Regions',
    active: 'Your Active Regions',
  };

  const optgroups = (['primary', 'active'] as const)
    .map((g) => {
      const opts = REGIONS.filter((r) => r.group === g)
        .map(
          (r) =>
            `<option value="${r.id}" ${r.id === currentRegion ? 'selected' : ''}>${r.label}</option>`,
        )
        .join('');
      return `<optgroup label="${groups[g]}">${opts}</optgroup>`;
    })
    .join('');

  container.innerHTML = `
    <div class="Box mb-3">
      <div class="Box-header">
        <h3 class="Box-title">Global Settings</h3>
      </div>
      <div class="Box-body">
        <div class="d-flex flex-wrap" style="gap: 24px;">
          <div class="form-group" style="min-width: 180px;">
            <div class="form-group-header">
              <label for="region">Azure Region</label>
            </div>
            <div class="form-group-body">
              <select class="form-select input-sm" id="region">
                ${optgroups}
              </select>

            </div>
          </div>

          <div class="form-group" style="min-width: 180px;">
            <div class="form-group-header">
              <label for="discount">Internal Discount %</label>
            </div>
            <div class="form-group-body d-flex flex-items-center" style="gap: 8px;">
              <input class="form-control input-sm" type="number" id="discount"
                min="0" max="100" step="1" value="${state.discountPercent}"
                style="width: 80px;">
              <input type="range" id="discount-slider" min="0" max="100" step="1"
                value="${state.discountPercent}" style="flex: 1;">
            </div>
          </div>

          <div class="form-group" style="min-width: 180px;">
            <div class="form-group-header">
              <label for="growth">MoM Growth %</label>
            </div>
            <div class="form-group-body d-flex flex-items-center" style="gap: 8px;">
              <input class="form-control input-sm" type="number" id="growth"
                min="0" max="100" step="0.5" value="${state.growthPercent}"
                style="width: 80px;">
              <input type="range" id="growth-slider" min="0" max="50" step="0.5"
                value="${state.growthPercent}" style="flex: 1;">
            </div>
          </div>

          <div class="form-group" style="min-width: 160px;">
            <div class="form-group-header">
              <label for="period">Projection Period</label>
            </div>
            <div class="form-group-body">
              <select class="form-select input-sm" id="period">
                <option value="12" ${state.projectionMonths === 12 ? 'selected' : ''}>12 months</option>
                <option value="24" ${state.projectionMonths === 24 ? 'selected' : ''}>24 months</option>
                <option value="36" ${state.projectionMonths === 36 ? 'selected' : ''}>36 months</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const regionSelect = container.querySelector('#region') as HTMLSelectElement;
  const discountInput = container.querySelector('#discount') as HTMLInputElement;
  const discountSlider = container.querySelector('#discount-slider') as HTMLInputElement;
  const growthInput = container.querySelector('#growth') as HTMLInputElement;
  const growthSlider = container.querySelector('#growth-slider') as HTMLInputElement;
  const periodSelect = container.querySelector('#period') as HTMLSelectElement;

  const sync = () => {
    state.discountPercent = parseFloat(discountInput.value) || 0;
    state.growthPercent = parseFloat(growthInput.value) || 0;
    state.projectionMonths = parseInt(periodSelect.value) || 12;
    onChange(state);
  };

  regionSelect.addEventListener('change', () => {
    onRegionChange(regionSelect.value);
  });

  discountInput.addEventListener('input', () => { discountSlider.value = discountInput.value; sync(); });
  discountSlider.addEventListener('input', () => { discountInput.value = discountSlider.value; sync(); });
  growthInput.addEventListener('input', () => { growthSlider.value = growthInput.value; sync(); });
  growthSlider.addEventListener('input', () => { growthInput.value = growthSlider.value; sync(); });
  periodSelect.addEventListener('change', sync);
}
