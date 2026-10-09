// Boîte des filtres à réglages (`<dialog id="filter-dialog">`) : un curseur par réglage, et un aperçu en direct.

export interface FilterSetting {
  key: string;
  label: string;
  min: number;
  max: number;
  initial: number;
  unit: string;
}

export type FilterValues = Record<string, number>;

export interface FilterDialog {
  /**
   * Ouvre la boîte ; `preview` est rappelé avec les valeurs du moment, au plus une fois par image affichée.
   * Donne les valeurs choisies (Apply), ou null (Cancel, Échap).
   */
  ask(title: string, settings: readonly FilterSetting[], preview: (values: FilterValues) => void): Promise<FilterValues | null>;
}

export function initFilterDialog(dialog: HTMLElement): FilterDialog {
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new Error('#filter-dialog must be a <dialog> in index.html');
  }
  const title = query<HTMLElement>(dialog, '#filter-title');
  const fields = query<HTMLElement>(dialog, '#filter-fields');
  query<HTMLButtonElement>(dialog, '#filter-cancel').addEventListener('click', () => dialog.close());

  return {
    ask(titleText, settings, preview) {
      title.textContent = titleText;
      const inputs = settings.map((setting) => {
        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(setting.min);
        input.max = String(setting.max);
        input.step = '1';
        input.valueAsNumber = setting.initial;
        const value = document.createElement('span');
        value.className = 'dialog-value';
        const label = document.createElement('label');
        label.className = 'dialog-slider';
        label.append(setting.label, input, value);
        return { setting, input, value, label };
      });
      fields.replaceChildren(...inputs.map(({ label }) => label));

      const values = (): FilterValues =>
        Object.fromEntries(inputs.map(({ setting, input }) => [setting.key, input.valueAsNumber]));

      // Comme requestRender (#4) : un filtre peut être lent sur une grande image, on ne le recalcule
      // qu'une fois par image affichée, avec les valeurs les plus récentes. Plus rien après la fermeture.
      let previewScheduled = false;
      const schedulePreview = (): void => {
        inputs.forEach(({ setting, input, value }) => (value.textContent = `${input.value}${setting.unit}`));
        if (previewScheduled) {
          return;
        }
        previewScheduled = true;
        requestAnimationFrame(() => {
          previewScheduled = false;
          if (dialog.open) {
            preview(values());
          }
        });
      };
      inputs.forEach(({ input }) => input.addEventListener('input', schedulePreview));

      dialog.returnValue = '';
      dialog.showModal();
      schedulePreview();
      return new Promise((resolve) => {
        dialog.addEventListener('close', () => resolve(dialog.returnValue === 'apply' ? values() : null), {
          once: true,
        });
      });
    },
  };
}

// Récupère un élément de la boîte, ou échoue au démarrage s'il manque dans index.html.
function query<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`${selector} is missing from index.html`);
  }
  return element;
}
