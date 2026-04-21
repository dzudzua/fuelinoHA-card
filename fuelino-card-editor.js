const FUELINO_CARD_EDITOR_TAG = "fuelino-card-editor";

class FuelinoCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._activeTab = "base";
  }

  setConfig(config) {
    this._config = {
      type: "custom:fuelino-card",
      vehicle: "",
      title: "",
      layout: "costs",
      accent_color: "#88d24f",
      card_background: "",
      border_radius: 28,
      show_expenses: true,
      show_trips: true,
      show_empty_categories: false,
      show_header: true,
      dense_mode: false,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _dispatchConfig() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _setValue(key, value) {
    const next = { ...this._config };
    if (value === "" || value === null || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    this._config = next;
    this._dispatchConfig();
    this._render();
  }

  _setTab(tab) {
    this._activeTab = tab;
    this._render();
  }

  _input(label, key, placeholder = "") {
    const value = this._config[key] ?? "";
    return `
      <label class="field">
        <span class="field__label">${label}</span>
        <input data-key="${key}" type="text" value="${String(value).replace(/"/g, "&quot;")}" placeholder="${placeholder}">
      </label>
    `;
  }

  _number(label, key, min = 0, max = 999) {
    const value = this._config[key] ?? "";
    return `
      <label class="field">
        <span class="field__label">${label}</span>
        <input data-key="${key}" type="number" min="${min}" max="${max}" value="${value}">
      </label>
    `;
  }

  _select(label, key, options) {
    const current = this._config[key] ?? "";
    return `
      <label class="field">
        <span class="field__label">${label}</span>
        <select data-key="${key}">
          ${options
            .map(
              (option) => `
            <option value="${option.value}" ${current === option.value ? "selected" : ""}>${option.label}</option>
          `
            )
            .join("")}
        </select>
      </label>
    `;
  }

  _toggle(label, key, note = "") {
    const checked = Boolean(this._config[key]);
    return `
      <label class="toggle">
        <div>
          <div class="toggle__label">${label}</div>
          ${note ? `<div class="toggle__note">${note}</div>` : ""}
        </div>
        <input data-key="${key}" type="checkbox" ${checked ? "checked" : ""}>
      </label>
    `;
  }

  _tabButton(id, label) {
    return `<button class="tab ${this._activeTab === id ? "is-active" : ""}" data-tab="${id}">${label}</button>`;
  }

  _renderTabContent() {
    if (this._activeTab === "visibility") {
      return `
        <div class="stack">
          ${this._toggle("Show expenses", "show_expenses", "Display service and non-fuel expense sections.")}
          ${this._toggle("Show trips", "show_trips", "Display TripLog highlights and recent trips.")}
          ${this._toggle("Show empty categories", "show_empty_categories", "Keep category cards visible even when their value is zero.")}
          ${this._toggle("Show top header", "show_header", "Show the app-like title bar in the costs layout.")}
          ${this._toggle("Dense mode", "dense_mode", "Use tighter spacing for dashboards with less room.")}
        </div>
      `;
    }

    if (this._activeTab === "style") {
      return `
        <div class="stack">
          ${this._input("Accent color", "accent_color", "#88d24f")}
          ${this._input("Card background (optional)", "card_background", "linear-gradient(...)")}
          ${this._number("Border radius", "border_radius", 12, 48)}
          <div class="hint">
            Leave background empty to use the default app-inspired theme. Accent color is used for highlights,
            metrics and category emphasis.
          </div>
        </div>
      `;
    }

    return `
      <div class="stack">
        ${this._input("Vehicle slug", "vehicle", "hyundai_i30")}
        ${this._input("Card title", "title", "Hyundai i30")}
        ${this._select("Layout", "layout", [
          { value: "costs", label: "Costs" },
          { value: "garage", label: "Garage" },
          { value: "compact", label: "Compact" },
        ])}
        <div class="hint">
          The card auto-reads entities from FuelinoHA using the vehicle slug. Example:
          <code>sensor.hyundai_i30_total_vehicle_cost</code>
        </div>
      </div>
    `;
  }

  _attachEvents() {
    this.shadowRoot.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => this._setTab(button.dataset.tab));
    });

    this.shadowRoot.querySelectorAll("input[data-key], select[data-key]").forEach((field) => {
      const key = field.dataset.key;
      const handler = () => {
        if (field.type === "checkbox") {
          this._setValue(key, field.checked);
          return;
        }
        if (field.type === "number") {
          const parsed = Number(field.value);
          this._setValue(key, Number.isFinite(parsed) ? parsed : "");
          return;
        }
        this._setValue(key, field.value.trim());
      };

      field.addEventListener("input", handler);
      field.addEventListener("change", handler);
    });

    const preview = this.shadowRoot.querySelector("fuelino-card");
    if (preview) {
      preview.hass = this._hass;
    }
  }

  _render() {
    if (!this._config) {
      return;
    }

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: var(--primary-text-color);
        }

        .editor {
          display: grid;
          grid-template-columns: minmax(320px, 420px) minmax(280px, 1fr);
          gap: 20px;
          align-items: start;
        }

        .panel,
        .preview {
          border-radius: 24px;
          background: rgba(18, 24, 38, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px;
        }

        .panel__header {
          display: grid;
          gap: 4px;
          margin-bottom: 18px;
        }

        .panel__eyebrow {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--secondary-text-color);
        }

        .panel__title {
          font-size: 1.35rem;
          font-weight: 700;
        }

        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }

        .tab {
          border: 0;
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.06);
          color: inherit;
          cursor: pointer;
          font: inherit;
        }

        .tab.is-active {
          background: rgba(255, 173, 96, 0.18);
          color: #ffbf7a;
        }

        .stack {
          display: grid;
          gap: 14px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field__label,
        .toggle__label {
          font-size: 0.92rem;
          font-weight: 600;
        }

        .field input,
        .field select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.05);
          color: inherit;
          font: inherit;
        }

        .toggle {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
        }

        .toggle__note,
        .hint {
          color: var(--secondary-text-color);
          font-size: 0.86rem;
          line-height: 1.45;
        }

        .toggle input {
          width: 20px;
          height: 20px;
        }

        .preview__title {
          font-size: 0.92rem;
          color: var(--secondary-text-color);
          margin-bottom: 12px;
        }

        fuelino-card {
          display: block;
        }

        @media (max-width: 920px) {
          .editor {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="editor">
        <section class="panel">
          <div class="panel__header">
            <div class="panel__eyebrow">FuelinoHA Card</div>
            <div class="panel__title">Card editor</div>
          </div>
          <div class="tabs">
            ${this._tabButton("base", "Base")}
            ${this._tabButton("visibility", "Visibility")}
            ${this._tabButton("style", "Style")}
          </div>
          ${this._renderTabContent()}
        </section>
        <section class="preview">
          <div class="preview__title">Live preview</div>
          <fuelino-card></fuelino-card>
        </section>
      </div>
    `;

    const preview = this.shadowRoot.querySelector("fuelino-card");
    if (preview) {
      preview.setConfig(this._config);
      preview.hass = this._hass;
    }

    this._attachEvents();
  }
}

if (!customElements.get(FUELINO_CARD_EDITOR_TAG)) {
  customElements.define(FUELINO_CARD_EDITOR_TAG, FuelinoCardEditor);
}
