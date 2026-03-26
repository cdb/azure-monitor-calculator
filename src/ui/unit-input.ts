/**
 * Shared helper for inputs with GB/TB/PB unit dropdowns.
 * Internally all values are stored as GB.
 */

export type Unit = 'GB' | 'TB' | 'PB';

const MULTIPLIERS: Record<Unit, number> = {
  GB: 1,
  TB: 1_000,
  PB: 1_000_000,
};

const STEPS: Record<Unit, string> = {
  GB: '10',
  TB: '0.1',
  PB: '0.001',
};

/** Pick a sensible default display unit for a value in GB. */
export function autoUnit(gb: number): Unit {
  if (gb >= 500_000) return 'PB';
  if (gb >= 500) return 'TB';
  return 'GB';
}

/** Convert GB to display value in the given unit. */
export function gbToDisplay(gb: number, unit: Unit): number {
  return gb / MULTIPLIERS[unit];
}

/** Convert display value in the given unit to GB. */
export function displayToGb(value: number, unit: Unit): number {
  return value * MULTIPLIERS[unit];
}

/** Get the appropriate step for an input in the given unit. */
export function stepForUnit(unit: Unit): string {
  return STEPS[unit];
}

/**
 * Render an inline number input + unit dropdown.
 * Returns HTML string. Caller must wire up events using the returned IDs.
 */
export function renderUnitInput(
  id: string,
  label: string,
  gbValue: number,
  options?: { suffix?: string },
): string {
  const unit = autoUnit(gbValue);
  const displayVal = gbToDisplay(gbValue, unit);
  const suffix = options?.suffix ?? '/month';

  return `
    <div class="form-group" style="min-width: 220px;">
      <div class="form-group-header">
        <label for="${id}">${label}</label>
      </div>
      <div class="form-group-body d-flex flex-items-center" style="gap: 6px;">
        <input class="form-control input-sm" type="number" id="${id}"
          min="0" step="${stepForUnit(unit)}" value="${displayVal}"
          style="width: 120px;">
        <select class="form-select input-sm" id="${id}-unit" style="width: 100px;">
          <option value="GB" ${unit === 'GB' ? 'selected' : ''}>GB${suffix}</option>
          <option value="TB" ${unit === 'TB' ? 'selected' : ''}>TB${suffix}</option>
          <option value="PB" ${unit === 'PB' ? 'selected' : ''}>PB${suffix}</option>
        </select>
      </div>
    </div>
  `;
}

/**
 * Wire up a unit input to sync its value back to GB.
 * Returns a function that reads the current GB value.
 */
export function wireUnitInput(
  container: HTMLElement,
  id: string,
  onChange: (gbValue: number) => void,
): () => number {
  const input = container.querySelector(`#${id}`) as HTMLInputElement;
  const unitSelect = container.querySelector(`#${id}-unit`) as HTMLSelectElement;

  function currentGb(): number {
    const val = parseFloat(input.value) || 0;
    return displayToGb(val, unitSelect.value as Unit);
  }

  input.addEventListener('input', () => onChange(currentGb()));

  unitSelect.addEventListener('change', () => {
    // Re-display the current GB value in the new unit
    const gb = currentGb();
    const newUnit = unitSelect.value as Unit;
    // Recalc from the stored GB, not the input (avoids drift)
    input.value = String(gbToDisplay(gb, newUnit));
    input.step = stepForUnit(newUnit);
    // Value hasn't changed in GB, no need to call onChange
  });

  return currentGb;
}
