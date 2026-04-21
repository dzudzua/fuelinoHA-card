const FUELINO_CARD_EDITOR_TAG = "fuelino-card-editor";

function ensureFuelinoCardEditorDefined() {
  if (customElements.get(FUELINO_CARD_EDITOR_TAG)) {
    return;
  }

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
        layout: "fuelio",
        trend_period: "180d",
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
            { value: "fuelio", label: "Fuelio Stats" },
            { value: "compact", label: "Compact" },
          ])}
          ${this._select("Trend period", "trend_period", [
            { value: "30d", label: "Last 30 days" },
            { value: "90d", label: "Last 90 days" },
            { value: "180d", label: "Last 180 days" },
            { value: "365d", label: "Last year" },
            { value: "all", label: "All data" },
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

          .preview {
            min-width: 0;
            overflow: hidden;
            position: relative;
            isolation: isolate;
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

          .preview__frame {
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
            border-radius: 24px;
          }

          fuelino-card {
            display: block;
            width: 100%;
            max-width: 100%;
            min-width: 0;
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
            <div class="preview__frame">
              <fuelino-card></fuelino-card>
            </div>
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

  customElements.define(FUELINO_CARD_EDITOR_TAG, FuelinoCardEditor);
}

class FuelinoCard extends HTMLElement {
  constructor() {
    super();
    this._resizeObserver = null;
    this._fuelioTrendSlide = 0;
    this._trendTouchStartX = null;
  }

  static async getConfigElement() {
    ensureFuelinoCardEditorDefined();
    return document.createElement("fuelino-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:fuelino-card",
      vehicle: "hyundai_i30",
      title: "Hyundai i30",
      layout: "fuelio",
      trend_period: "180d",
      show_expenses: true,
      show_trips: true,
      show_empty_categories: false,
      show_header: true,
    };
  }

  setConfig(config) {
    this._config = {
      title: null,
      vehicle: "",
      layout: "fuelio",
      trend_period: "180d",
      accent_color: "#88d24f",
      card_background: "",
      border_radius: 28,
      show_expenses: true,
      show_trips: true,
      show_empty_categories: false,
      show_header: true,
      dense_mode: false,
      ...config,
      vehicle: String(config?.vehicle ?? "").trim(),
    };
    this._fuelioTrendPeriod = String(this._config.trend_period || "180d");

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._ensureResizeObserver();
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  getCardSize() {
    if (this._config?.layout === "compact") {
      return 4;
    }
    if (this._config?.layout === "fuelio") {
      return 12;
    }
    return 8;
  }

  _hasVehicle() {
    return Boolean(this._config?.vehicle);
  }

  _ensureResizeObserver() {
    if (this._resizeObserver || typeof ResizeObserver === "undefined") {
      return;
    }

    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? this.clientWidth ?? 0;
      this._applyWidthMode(width);
    });
    this._resizeObserver.observe(this);
    this._applyWidthMode(this.clientWidth ?? 0);
  }

  _applyWidthMode(width) {
    const mode = width <= 340 ? "xs" : width <= 460 ? "sm" : width <= 720 ? "md" : "lg";
    if (this.dataset.widthMode !== mode) {
      this.dataset.widthMode = mode;
      if (this._hass && this.shadowRoot) {
        this._render();
      }
    }
  }

  _entityId(suffix) {
    return `sensor.${this._config.vehicle}_${suffix}`;
  }

  _entity(suffix) {
    return this._hass?.states[this._entityId(suffix)] ?? null;
  }

  _attrs(suffix) {
    return this._entity(suffix)?.attributes ?? {};
  }

  _rawState(suffix) {
    return this._entity(suffix)?.state ?? null;
  }

  _unit(suffix) {
    return this._entity(suffix)?.attributes?.unit_of_measurement ?? "";
  }

  _number(suffix) {
    const raw = this._rawState(suffix);
    if (raw === null || raw === undefined || raw === "unknown" || raw === "unavailable") {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  _numberFromValue(value) {
    if (value === null || value === undefined || value === "" || value === "unknown" || value === "unavailable") {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  _sharedAttrs() {
    const candidates = [
      "total_vehicle_cost",
      "total_expense_cost",
      "total_cost",
      "last_fill_date",
    ];
    for (const suffix of candidates) {
      const attrs = this._attrs(suffix);
      if (Object.keys(attrs).length > 0) {
        return attrs;
      }
    }
    return {};
  }

  _locale() {
    return this._hass?.locale?.language || this._hass?.language || navigator.language || "cs-CZ";
  }

  _numericAttr(name) {
    return this._numberFromValue(this._sharedAttrs()?.[name]);
  }

  _recentFillNumeric(field, index = 0) {
    const fills = this._recentFills();
    return this._numberFromValue(fills[index]?.[field]);
  }

  _averageRecentFillField(field, items = null) {
    const source = Array.isArray(items) ? items : this._recentFills();
    const values = source
      .map((item) => this._numberFromValue(item?.[field]))
      .filter((value) => value !== null);
    return this._average(values);
  }

  _formatNumericValue(value, unit = "", options = {}, fallback = "—") {
    const numeric = this._numberFromValue(value);
    if (numeric === null) {
      return fallback;
    }
    const formatted = this._formatNumber(numeric, options);
    return unit ? `${formatted} ${unit}` : formatted;
  }

  _consumptionUnit() {
    return this._unit("last_consumption") || "L/100 km";
  }

  _averageConsumptionNumber() {
    return (
      this._number("average_consumption") ??
      this._averageRecentFillField("consumption") ??
      this._numericAttr("latest_consumption")
    );
  }

  _lastConsumptionNumber() {
    return this._number("last_consumption") ?? this._recentFillNumeric("consumption") ?? this._numericAttr("latest_consumption");
  }

  _averageConsumptionDisplay() {
    return this._formatNumericValue(this._averageConsumptionNumber(), this._consumptionUnit(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
  }

  _lastConsumptionDisplay() {
    return this._formatNumericValue(this._lastConsumptionNumber(), this._consumptionUnit(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
  }

  _trendPeriod() {
    return this._fuelioTrendPeriod || this._config.trend_period || "180d";
  }

  _trendPeriodOptions() {
    return [
      { value: "30d", label: "30 d" },
      { value: "90d", label: "90 d" },
      { value: "180d", label: "180 d" },
      { value: "365d", label: "1 rok" },
      { value: "all", label: "Vse" },
    ];
  }

  _trendCutoffDate() {
    const period = this._trendPeriod();
    if (period === "all") {
      return null;
    }
    const days = Number.parseInt(period, 10);
    if (!Number.isFinite(days) || days <= 0) {
      return null;
    }
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);
    return cutoff;
  }

  _filterRecentFillsByTrendPeriod(fills) {
    const cutoff = this._trendCutoffDate();
    if (!cutoff) {
      return fills;
    }
    return fills.filter((item) => {
      const date = new Date(item?.date);
      return !Number.isNaN(date.getTime()) && date >= cutoff;
    });
  }

  _filterMonthlySummaryByTrendPeriod(items) {
    const cutoff = this._trendCutoffDate();
    if (!cutoff) {
      return items;
    }
    return items.filter((item) => {
      const date = new Date(item?.year, (item?.month ?? 1) - 1, 1);
      return !Number.isNaN(date.getTime()) && date >= cutoff;
    });
  }

  _setFuelioTrendPeriod(period) {
    if (!period || this._trendPeriod() === period) {
      return;
    }
    this._fuelioTrendPeriod = period;
    this._fuelioTrendSlide = 0;
    if (this._hass && this.shadowRoot) {
      this._render();
    }
  }

  _formatNumber(value, options = {}) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return String(value);
    }

    const formatter = new Intl.NumberFormat(this._locale(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    });
    return formatter.format(numeric);
  }

  _formatState(suffix, fallback = "—") {
    const entity = this._entity(suffix);
    if (!entity || entity.state === "unknown" || entity.state === "unavailable") {
      return fallback;
    }

    const numeric = this._number(suffix);
    const unit = this._unit(suffix);
    if (numeric !== null) {
      const precision =
        entity.attributes?.suggested_display_precision ??
        (unit && (unit.includes("Kč") || unit.includes("CZK") || unit.includes("/") ? 2 : 1));
      const value = this._formatNumber(numeric, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
      return unit ? `${value} ${unit}` : value;
    }

    return unit ? `${entity.state} ${unit}` : entity.state;
  }

  _formatCurrencyValue(value, unit = null, fallback = "—") {
    if (value === null || value === undefined) {
      return fallback;
    }
    const currencyUnit = unit || this._unit("total_vehicle_cost") || this._unit("total_cost") || "";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return String(value);
    }
    const formatted = this._formatNumber(numeric, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return currencyUnit ? `${formatted} ${currencyUnit}` : formatted;
  }

  _vehicleLabel() {
    return this._config.title || this._config.vehicle.replaceAll("_", " ");
  }

  _expenseSummary() {
    const attrs = this._sharedAttrs();
    return Array.isArray(attrs.expense_category_summary) ? attrs.expense_category_summary : [];
  }

  _recentExpenses() {
    const attrs = this._sharedAttrs();
    return Array.isArray(attrs.recent_expenses) ? attrs.recent_expenses : [];
  }

  _recentFills() {
    const attrs = this._sharedAttrs();
    return Array.isArray(attrs.recent_fills) ? attrs.recent_fills : [];
  }

  _recentTrips() {
    const attrs = this._sharedAttrs();
    return Array.isArray(attrs.recent_trips) ? attrs.recent_trips : [];
  }

  _monthlySummary() {
    const attrs = this._sharedAttrs();
    return Array.isArray(attrs.monthly_summary) ? attrs.monthly_summary : [];
  }

  _monthSummaryAt(index) {
    return this._monthlySummary()[index] || null;
  }

  _monthLabel(summary) {
    if (!summary?.year || !summary?.month) {
      return "Nezname obdobi";
    }

    const date = new Date(summary.year, summary.month - 1, 1);
    return new Intl.DateTimeFormat(this._locale(), { month: "long", year: "numeric" }).format(date);
  }

  _formatDate(value, options = {}) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat(this._locale(), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...options,
    }).format(date);
  }

  _daysAgo(value) {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const now = new Date();
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.max(0, Math.round((utcNow - utcDate) / 86400000));
  }

  _daysAgoLabel(value) {
    const days = this._daysAgo(value);
    if (days === null) {
      return "";
    }
    if (days === 0) {
      return "dnes";
    }
    if (days === 1) {
      return "pred 1 dnem";
    }
    return `pred ${days} dny`;
  }

  _formatTrendDelta(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "—";
    }
    const sign = numeric > 0 ? "+" : "";
    return `${sign}${this._formatNumber(numeric, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  _formatTrendDeltaValue(current, previous) {
    const a = Number(current);
    const b = Number(previous);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) {
      return null;
    }
    return ((a - b) / b) * 100;
  }

  _barHeights(values, maxHeight = 160) {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }
    const max = Math.max(...values, 1);
    return values.map((value) => Math.max(12, (value / max) * maxHeight));
  }

  _average(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
  }

  _barPalette(kind) {
    const palettes = {
      volume: {
        fill: "linear-gradient(180deg, rgba(110, 203, 255, 0.95) 0%, rgba(61, 145, 255, 0.72) 100%)",
        active: "linear-gradient(180deg, rgba(173, 230, 255, 1) 0%, rgba(77, 167, 255, 0.92) 100%)",
      },
      fill_cost: {
        fill: "linear-gradient(180deg, rgba(103, 236, 199, 0.95) 0%, rgba(38, 182, 148, 0.74) 100%)",
        active: "linear-gradient(180deg, rgba(155, 248, 223, 1) 0%, rgba(56, 207, 171, 0.96) 100%)",
      },
      monthly_cost: {
        fill: "linear-gradient(180deg, rgba(124, 183, 255, 0.95) 0%, rgba(72, 113, 244, 0.76) 100%)",
        active: "linear-gradient(180deg, rgba(185, 216, 255, 1) 0%, rgba(96, 136, 255, 0.96) 100%)",
      },
      monthly_distance: {
        fill: "linear-gradient(180deg, rgba(165, 198, 255, 0.92) 0%, rgba(103, 144, 227, 0.72) 100%)",
        active: "linear-gradient(180deg, rgba(223, 235, 255, 1) 0%, rgba(129, 169, 245, 0.95) 100%)",
      },
      default: {
        fill: "linear-gradient(180deg, rgba(124, 183, 255, 0.95) 0%, rgba(72, 113, 244, 0.76) 100%)",
        active: "linear-gradient(180deg, rgba(185, 216, 255, 1) 0%, rgba(96, 136, 255, 0.96) 100%)",
      },
    };
    return palettes[kind] || palettes.default;
  }

  _setFuelioTrendSlide(index, total = null) {
    const count = total ?? this._buildFuelioTrendCards().length;
    if (!count) {
      this._fuelioTrendSlide = 0;
      return;
    }

    const next = ((index % count) + count) % count;
    if (this._fuelioTrendSlide !== next) {
      this._fuelioTrendSlide = next;
      if (this._hass && this.shadowRoot) {
        this._render();
      }
    }
  }

  _buildFuelioTrendCards() {
    const cards = [];
    const fillsChronological = this._filterRecentFillsByTrendPeriod(this._recentFills()).slice().reverse();

    const priceFills = fillsChronological.filter((item) => Number.isFinite(Number(item.price_per_unit)));
    if (priceFills.length >= 2) {
      const values = priceFills.map((item) => Number(item.price_per_unit));
      cards.push({
        kind: "line",
        icon: "mdi:gas-station",
        title: `Cena paliva${priceFills[priceFills.length - 1]?.fuel_type ? ` (${priceFills[priceFills.length - 1].fuel_type})` : ""}`,
        latest: values[values.length - 1],
        average: this._average(values),
        delta: this._formatTrendDeltaValue(values[values.length - 1], values[values.length - 2]),
        values,
        unit: this._unit("last_price_per_unit"),
        xStart: this._formatDate(priceFills[0]?.date, { day: "2-digit", month: "short" }),
        xEnd: this._formatDate(priceFills[priceFills.length - 1]?.date, { day: "2-digit", month: "short" }),
      });
    }

    const consumptionFills = fillsChronological.filter((item) => Number.isFinite(Number(item.consumption)));
    if (consumptionFills.length >= 2) {
      const values = consumptionFills.map((item) => Number(item.consumption));
      cards.push({
        kind: "line",
        icon: "mdi:water-outline",
        title: "Spotreba paliva",
        latest: values[values.length - 1],
        average: this._average(values),
        delta: this._formatTrendDeltaValue(values[values.length - 1], values[values.length - 2]),
        values,
        unit: this._unit("last_consumption"),
        xStart: this._formatDate(consumptionFills[0]?.date, { day: "2-digit", month: "short" }),
        xEnd: this._formatDate(consumptionFills[consumptionFills.length - 1]?.date, { day: "2-digit", month: "short" }),
      });
    }

    const volumeFills = fillsChronological.filter((item) => Number.isFinite(Number(item.volume)));
    if (volumeFills.length >= 2) {
      const values = volumeFills.map((item) => Number(item.volume));
      cards.push({
        kind: "bar",
        bar_kind: "volume",
        icon: "mdi:gas-station-in-use",
        title: "Objem tankovani",
        latest: values[values.length - 1],
        average: this._average(values),
        delta: this._formatTrendDeltaValue(values[values.length - 1], values[values.length - 2]),
        values,
        unit: this._unit("average_fill_volume") || "L",
        xStart: this._formatDate(volumeFills[0]?.date, { day: "2-digit", month: "short" }),
        xEnd: this._formatDate(volumeFills[volumeFills.length - 1]?.date, { day: "2-digit", month: "short" }),
      });
    }

    const fillCostFills = fillsChronological.filter((item) => Number.isFinite(Number(item.cost)));
    if (fillCostFills.length >= 2) {
      const values = fillCostFills.map((item) => Number(item.cost));
      cards.push({
        kind: "bar",
        bar_kind: "fill_cost",
        icon: "mdi:cash-fast",
        title: "Cena tankovani",
        latest: values[values.length - 1],
        average: this._average(values),
        delta: this._formatTrendDeltaValue(values[values.length - 1], values[values.length - 2]),
        values,
        unit: this._unit("fuel_cost_this_month") || "CZK",
        xStart: this._formatDate(fillCostFills[0]?.date, { day: "2-digit", month: "short" }),
        xEnd: this._formatDate(fillCostFills[fillCostFills.length - 1]?.date, { day: "2-digit", month: "short" }),
      });
    }

    const monthly = this._filterMonthlySummaryByTrendPeriod(this._monthlySummary()).slice().reverse();
    if (monthly.length >= 2) {
      const fuelCosts = monthly.filter((item) => Number.isFinite(Number(item.total_cost)));
      if (fuelCosts.length >= 2) {
        const values = fuelCosts.map((item) => Number(item.total_cost));
        cards.push({
          kind: "bar",
          bar_kind: "monthly_cost",
          icon: "mdi:cash",
          title: "Mesicni naklady (palivo)",
          latest: values[values.length - 1],
          average: this._average(values),
          delta: this._formatTrendDeltaValue(values[values.length - 1], values[values.length - 2]),
          values,
          unit: this._unit("fuel_cost_this_month") || "CZK",
          xStart: this._formatDate(`${fuelCosts[0].year}-${String(fuelCosts[0].month).padStart(2, "0")}-01`, { month: "short", year: "2-digit" }),
          xEnd: this._formatDate(`${fuelCosts[fuelCosts.length - 1].year}-${String(fuelCosts[fuelCosts.length - 1].month).padStart(2, "0")}-01`, { month: "short", year: "2-digit" }),
        });
      }

      const distances = monthly.filter((item) => Number.isFinite(Number(item.distance)));
      if (distances.length >= 2) {
        const values = distances.map((item) => Number(item.distance));
        cards.push({
          kind: "bar",
          bar_kind: "monthly_distance",
          icon: "mdi:map-marker-distance",
          title: "Mesicni vzdalenost",
          latest: values[values.length - 1],
          average: this._average(values),
          delta: this._formatTrendDeltaValue(values[values.length - 1], values[values.length - 2]),
          values,
          unit: this._unit("distance_this_month"),
          xStart: this._formatDate(`${distances[0].year}-${String(distances[0].month).padStart(2, "0")}-01`, { month: "short", year: "2-digit" }),
          xEnd: this._formatDate(`${distances[distances.length - 1].year}-${String(distances[distances.length - 1].month).padStart(2, "0")}-01`, { month: "short", year: "2-digit" }),
        });
      }
    }

    return cards;
  }

  _recentFuelPriceDeltaPercent() {
    const fills = this._recentFills().filter((item) => Number.isFinite(Number(item.price_per_unit)));
    if (fills.length < 2) {
      return null;
    }

    const latest = Number(fills[0].price_per_unit);
    const previous = Number(fills[1].price_per_unit);
    if (!Number.isFinite(latest) || !Number.isFinite(previous) || previous === 0) {
      return null;
    }

    return ((latest - previous) / previous) * 100;
  }

  _trendPoints(values, width = 420, height = 170) {
    if (!Array.isArray(values) || values.length === 0) {
      return "";
    }

    if (values.length === 1) {
      const y = height / 2;
      return `0,${y} ${width},${y}`;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  _fuelioTrendCard() {
    const cards = this._buildFuelioTrendCards();
    if (cards.length === 0) {
      return "";
    }
    const total = cards.length;
    const activeIndex = Math.min(this._fuelioTrendSlide, total - 1);
    const card = cards[activeIndex];
    const periodSelector = `
      <div class="fuelio-trend__periods">
        ${this._trendPeriodOptions()
          .map(
            (option) => `
              <button type="button" class="fuelio-trend__period ${option.value === this._trendPeriod() ? "is-active" : ""}" data-trend-period="${option.value}">
                ${option.label}
              </button>
            `
          )
          .join("")}
      </div>
    `;
    const pager = `
      <div class="fuelio-trend__dots">
        ${Array.from({ length: total }, (_, index) => `
          <button type="button" class="fuelio-trend__pager ${index === activeIndex ? "is-active" : ""}" data-trend-slide="${index}" aria-label="Show trend ${index + 1}"></button>
        `).join("")}
      </div>
    `;

    if (card.kind === "bar") {
      const heights = this._barHeights(card.values);
      const palette = this._barPalette(card.bar_kind);
      return `
        <section class="fuelio-panel fuelio-panel--trend">
          <div class="fuelio-trend-carousel" data-trend-carousel>
            <div class="fuelio-trend">
              <div class="fuelio-trend__meta">
                <div class="fuelio-trend__eyebrow"><ha-icon icon="${card.icon}"></ha-icon> ${card.title}</div>
                ${periodSelector}
                <div class="fuelio-trend__metric">
                  <span class="fuelio-trend__value">${this._formatCurrencyValue(card.latest, card.unit, this._formatNumber(card.latest))}</span>
                  <span class="fuelio-trend__label">Posledni</span>
                </div>
                <div class="fuelio-trend__metric">
                  <span class="fuelio-trend__value">${this._formatCurrencyValue(card.average, card.unit, this._formatNumber(card.average))}</span>
                  <span class="fuelio-trend__label">Prum.</span>
                </div>
                <div class="fuelio-trend__metric">
                  <span class="fuelio-trend__value ${card.delta > 0 ? "is-up" : card.delta < 0 ? "is-down" : ""}">${this._formatTrendDelta(card.delta)}</span>
                  <span class="fuelio-trend__label">Zmenit</span>
                </div>
              </div>
              <div class="fuelio-trend__chart">
                <div
                  class="fuelio-bars"
                  style="grid-template-columns: repeat(${Math.max(heights.length, 1)}, minmax(0, 1fr)); --bar-fill:${palette.fill}; --bar-fill-active:${palette.active};"
                >
                  ${heights
                    .map(
                      (height, index) => `
                    <div class="fuelio-bars__col">
                      <div class="fuelio-bars__bar ${index === heights.length - 1 ? "is-active" : ""}" style="height:${height.toFixed(1)}px"></div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
                <div class="fuelio-trend__axis">
                  <span>${card.xStart}</span>
                  <span>${card.xEnd}</span>
                </div>
                ${pager}
              </div>
            </div>
          </div>
        </section>
      `;
    }

    const points = this._trendPoints(card.values);
    const max = Math.max(...card.values);
    const min = Math.min(...card.values);
    const avgY = 170 - ((((card.average ?? min) - min) / ((max - min) || 1)) * 170);

    return `
      <section class="fuelio-panel fuelio-panel--trend">
        <div class="fuelio-trend-carousel" data-trend-carousel>
          <div class="fuelio-trend">
            <div class="fuelio-trend__meta">
              <div class="fuelio-trend__eyebrow"><ha-icon icon="${card.icon}"></ha-icon> ${card.title}</div>
              ${periodSelector}
              <div class="fuelio-trend__metric">
                <span class="fuelio-trend__value">${this._formatCurrencyValue(card.latest, card.unit, this._formatNumber(card.latest))}</span>
                <span class="fuelio-trend__label">Posledni</span>
              </div>
              <div class="fuelio-trend__metric">
                <span class="fuelio-trend__value">${this._formatCurrencyValue(card.average, card.unit, this._formatNumber(card.average))}</span>
                <span class="fuelio-trend__label">Prum.</span>
              </div>
              <div class="fuelio-trend__metric">
                <span class="fuelio-trend__value ${card.delta > 0 ? "is-up" : card.delta < 0 ? "is-down" : ""}">${this._formatTrendDelta(card.delta)}</span>
                <span class="fuelio-trend__label">Zmenit</span>
              </div>
            </div>
            <div class="fuelio-trend__chart">
              <svg viewBox="0 0 420 210" role="img" aria-label="${card.title}">
                <defs>
                  <linearGradient id="fuelioTrendFill-${activeIndex}" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="rgba(235,214,112,0.42)"></stop>
                    <stop offset="100%" stop-color="rgba(235,214,112,0.02)"></stop>
                  </linearGradient>
                </defs>
                <line x1="0" y1="${avgY.toFixed(1)}" x2="420" y2="${avgY.toFixed(1)}" class="fuelio-trend__avg"></line>
                <polyline points="${points} 420,170 0,170" class="fuelio-trend__area" style="fill:url(#fuelioTrendFill-${activeIndex})"></polyline>
                <polyline points="${points}" class="fuelio-trend__line"></polyline>
                ${points
                  .split(" ")
                  .map((point, index, all) => {
                    const [x, y] = point.split(",");
                    const active = index === all.length - 1 ? "is-active" : "";
                    return `<circle cx="${x}" cy="${y}" r="${index === all.length - 1 ? 7 : 4.5}" class="fuelio-trend__dot ${active}"></circle>`;
                  })
                  .join("")}
              </svg>
              <div class="fuelio-trend__axis">
                <span>${card.xStart}</span>
                <span>${card.xEnd}</span>
              </div>
              ${pager}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _recentActivityItems() {
    const fills = this._recentFills().map((item) => ({
      kind: "fill",
      icon: "mdi:gas-station",
      amount: this._formatCurrencyValue(item.cost),
      date: item.date,
      title: item.fuel_type || "Dotankovani",
      note: item.volume ? `${this._formatNumber(item.volume, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L` : "",
    }));

    const expenses = this._recentExpenses().map((item) => ({
      kind: "expense",
      icon: "mdi:cash",
      amount: this._formatCurrencyValue(item.cost),
      date: item.date,
      title: item.title || item.category_name || "Vydaj",
      note: item.category_name || "",
    }));

    return [...fills, ...expenses]
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, 6);
  }

  _normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  _summaryForAliases(aliases) {
    const summary = this._expenseSummary();
    const normalizedAliases = aliases.map((alias) => this._normalize(alias));
    const matched = summary.filter((item) => {
      const name = this._normalize(item.category_name);
      return normalizedAliases.some((alias) => name.includes(alias));
    });

    if (matched.length === 0) {
      return null;
    }

    return matched.reduce(
      (acc, item) => ({
        category_name: acc.category_name || item.category_name,
        count: (acc.count || 0) + (item.count || 0),
        total_cost: (acc.total_cost || 0) + (item.total_cost || 0),
      }),
      { category_name: null, count: 0, total_cost: 0 }
    );
  }

  _latestExpenseForAliases(aliases) {
    const recent = this._recentExpenses();
    const normalizedAliases = aliases.map((alias) => this._normalize(alias));
    return (
      recent.find((item) => {
        const name = this._normalize(item.category_name || item.title);
        return normalizedAliases.some((alias) => name.includes(alias));
      }) || null
    );
  }

  _categoryCards() {
    const categories = [
      { title: "Služba", aliases: ["sluzba", "service"], icon: "mdi:briefcase-variant-outline" },
      { title: "Údržba", aliases: ["udrzba", "maintenance"], icon: "mdi:car-wrench" },
      { title: "Registrace", aliases: ["registrace", "registration"], icon: "mdi:card-account-details" },
      { title: "Parkování", aliases: ["parkovani", "parking"], icon: "mdi:parking" },
      { title: "Mytí", aliases: ["myti", "wash", "nanowax"], icon: "mdi:car-wash" },
      { title: "Mýtné", aliases: ["mytne", "toll"], icon: "mdi:road-toll" },
      { title: "Pojištění", aliases: ["pojisteni", "insurance"], icon: "mdi:shield-car" },
    ];

    const totalExpense = this._number("total_expense_cost") || 0;
    const cards = categories
      .map((category) => {
        const summary = this._summaryForAliases(category.aliases);
        const latest = this._latestExpenseForAliases(category.aliases);
        if (!summary && !this._config.show_empty_categories) {
          return "";
        }

        const total = summary?.total_cost || 0;
        const count = summary?.count || 0;
        const share = totalExpense > 0 ? (total / totalExpense) * 100 : 0;
        const latestCost = latest?.cost ?? null;
        const latestDate = latest?.date ?? "—";

        return `
          <section class="cost-card">
            <div class="cost-card__head">
              <div>
                <div class="cost-card__label">${category.title}</div>
                <div class="cost-card__total">${this._formatCurrencyValue(total)}</div>
              </div>
              <div class="cost-card__icon"><ha-icon icon="${category.icon}"></ha-icon></div>
            </div>
            <div class="cost-card__divider"></div>
            <div class="cost-card__stats">
              ${this._miniStat(
                "Podíl",
                `${this._formatNumber(share, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1,
                })} %`,
                "mdi:chart-donut"
              )}
              ${this._miniStat("Záznamy", this._formatNumber(count), "mdi:counter")}
              ${this._miniStat("Poslední výdaj", this._formatCurrencyValue(latestCost), "mdi:cash")}
              ${this._miniStat("Datum", latestDate, "mdi:calendar")}
            </div>
          </section>
        `;
      })
      .filter(Boolean)
      .join("");

    return cards || `<section class="empty-note">Kategorie výdajů zatím nejsou k dispozici.</section>`;
  }

  _miniStat(label, value, icon) {
    return `
      <div class="mini-stat">
        <div class="mini-stat__icon"><ha-icon icon="${icon}"></ha-icon></div>
        <div class="mini-stat__value">${value}</div>
        <div class="mini-stat__label">${label}</div>
      </div>
    `;
  }

  _summaryBlock(title, mainValue, stats, kind = "olive") {
    return `
      <section class="summary-card summary-card--${kind}">
        <div class="summary-card__title">${title}</div>
        <div class="summary-card__main">${mainValue}</div>
        <div class="summary-card__divider"></div>
        <div class="summary-card__stats">
          ${stats
            .map(
              (stat) => `
                <div class="summary-stat">
                  <div class="summary-stat__icon"><ha-icon icon="${stat.icon}"></ha-icon></div>
                  <div class="summary-stat__value">${stat.value}</div>
                  <div class="summary-stat__label">${stat.label}</div>
                </div>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  _topPanel() {
    const averageTotalPerKm = this._formatState("average_cost_per_km");
    const fuelPerKm = this._formatCurrencyValue(
      this._number("average_cost_per_km"),
      this._unit("average_cost_per_km")
    );
    const expenseCount = this._formatState("expense_count");
    const fillCount = this._formatState("fill_count");

    return `
      <section class="hero-panel">
        <div class="hero-illustration">
          <div class="hero-arc"></div>
          <div class="hero-wallet">
            <div class="hero-wallet__band"></div>
            <div class="hero-wallet__cash"></div>
          </div>
          <div class="hero-receipt">
            <span></span><span></span><span></span>
          </div>
          <div class="hero-badge hero-badge--left"><ha-icon icon="mdi:credit-card-outline"></ha-icon></div>
          <div class="hero-badge hero-badge--right"><ha-icon icon="mdi:parking"></ha-icon></div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat-card">
            <div class="hero-stat-card__label">Průměrné náklady na kilometr</div>
            <div class="hero-stat-card__main">${averageTotalPerKm}</div>
            <div class="hero-stat-card__sub">${fuelPerKm}</div>
            <div class="hero-stat-card__hint">Aktuální průměr</div>
          </div>
          <div class="hero-stat-card">
            <div class="hero-stat-card__label">Počet záznamů</div>
            <div class="hero-stat-card__main">${expenseCount}</div>
            <div class="hero-stat-card__sub">${fillCount}</div>
            <div class="hero-stat-card__hint">Výdaje / tankování</div>
          </div>
        </div>
      </section>
    `;
  }

  _renderCosts() {
    const totalVehicle = this._formatState("total_vehicle_cost");
    const totalExpenses = this._formatState("total_expense_cost");
    const totalFuel = this._formatState("total_cost");
    const lastExpenseDate = this._formatState("last_expense_date");
    const lastFillDate = this._formatState("last_fill_date");
    const lastServiceDate = this._formatState("last_service_date");
    const topCategory = this._formatState("top_expense_category");

    return `
      <ha-card>
        <div class="shell">
          ${
            this._config.show_header
              ? `
          <header class="fuelio-header fuelio-header--shared">
            <div class="fuelio-header__brand">
              <div class="fuelio-header__menu"><ha-icon icon="mdi:menu"></ha-icon></div>
              <div class="fuelio-header__titlewrap">
                <div class="fuelio-header__eyebrow">FuelinoHA</div>
                <h2>Naklady</h2>
              </div>
            </div>
            <div class="fuelio-vehicle">
              <div class="fuelio-vehicle__avatar">${this._vehicleLabel().slice(0, 1).toUpperCase()}</div>
              <div class="fuelio-vehicle__copy">
                <strong>${this._vehicleLabel()}</strong>
                <span>${this._formatState("odometer")}</span>
              </div>
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </div>
          </header>
          `
              : ""
          }

          ${this._topPanel()}

          <section class="section-chipline">
            <div class="fuelio-chip"><ha-icon icon="mdi:chart-box-outline"></ha-icon><span>Souhrn</span></div>
          </section>

          <section class="summary-grid">
            ${this._summaryBlock("Náklady (s palivem)", totalVehicle, [
              { label: "Palivo tento měsíc", value: this._formatState("fuel_cost_this_month"), icon: "mdi:gas-station-outline" },
              { label: "Výdaje tento měsíc", value: this._formatState("expense_cost_this_month"), icon: "mdi:wallet-outline" },
              { label: "Poslední výdaj", value: lastExpenseDate, icon: "mdi:calendar-star" },
              { label: "Poslední tankování", value: lastFillDate, icon: "mdi:calendar-check" },
            ])}

            ${this._summaryBlock("Náklady (bez paliva)", totalExpenses, [
              { label: "Tento měsíc", value: this._formatState("expense_cost_this_month"), icon: "mdi:calendar-month" },
              { label: "Poslední servis", value: lastServiceDate, icon: "mdi:wrench-clock" },
              { label: "Top kategorie", value: topCategory, icon: "mdi:shape-outline" },
              { label: "Počet výdajů", value: this._formatState("expense_count"), icon: "mdi:counter" },
            ])}

            ${this._summaryBlock("Palivo", totalFuel, [
              { label: "Tento měsíc", value: this._formatState("fuel_cost_this_month"), icon: "mdi:calendar-month" },
              { label: "Cena za litr", value: this._formatState("last_price_per_unit"), icon: "mdi:cash-100" },
              { label: "Průměr", value: this._formatState("average_price"), icon: "mdi:finance" },
              { label: "Tankování", value: this._formatState("fill_count"), icon: "mdi:counter" },
            ], "fuel")}
          </section>

          <section class="section-chipline">
            <div class="fuelio-chip"><ha-icon icon="mdi:shape-outline"></ha-icon><span>Kategorie</span></div>
          </section>

          <section class="cost-grid">
            ${this._categoryCards()}
          </section>
        </div>
      </ha-card>
    `;
  }

  _renderGarage() {
    const title = this._vehicleLabel();
    const recentFills = this._recentFills();
    const recentExpenses = this._recentExpenses();
    const recentTrips = this._sharedAttrs().recent_trips || [];

    return `
      <ha-card>
        <div class="garage-shell" style="--accent:${this._config.accent_color}">
          <section class="garage-hero">
            <div class="garage-hero__copy">
              <div class="topbar__eyebrow">FuelinoHA</div>
              <h2>${title}</h2>
              <p>Poslední tankování: <strong>${this._formatState("last_fill_date")}</strong></p>
            </div>
            <div class="garage-hero__stats">
              ${this._miniMetric("Cena", this._formatState("last_fill_cost"), "is-primary")}
              ${this._miniMetric("Cena za litr", this._formatState("last_price_per_unit"))}
              ${this._miniMetric("Tachometr", this._formatState("odometer"))}
            </div>
          </section>

          <section class="garage-grid">
            <div class="garage-panel">
              <div class="garage-panel__title">Palivo a náklady</div>
              <div class="garage-metrics">
                ${this._miniMetric("Palivo tento měsíc", this._formatState("fuel_cost_this_month"))}
                ${this._miniMetric("Palivo minulý měsíc", this._formatState("last_month_cost"))}
                ${this._miniMetric("Cena za km", this._formatState("average_cost_per_km"))}
                ${this._miniMetric("Trend ceny", this._formatState("fuel_price_trend"))}
              </div>
            </div>

            ${
              this._config.show_expenses
                ? `
              <div class="garage-panel">
                <div class="garage-panel__title">Servis a výdaje</div>
                <div class="garage-metrics">
                  ${this._miniMetric("Tento měsíc", this._formatState("expense_cost_this_month"))}
                  ${this._miniMetric("Poslední servis", this._formatState("last_service_date"))}
                  ${this._miniMetric("Cena servisu", this._formatState("last_service_cost"))}
                  ${this._miniMetric("Top kategorie", this._formatState("top_expense_category"))}
                </div>
              </div>
            `
                : ""
            }

            ${
              this._config.show_trips
                ? `
              <div class="garage-panel">
                <div class="garage-panel__title">TripLog a jízdy</div>
                <div class="garage-metrics">
                  ${this._miniMetric("Poslední jízda", this._formatState("last_trip_date"))}
                  ${this._miniMetric("Poslední vzdálenost", this._formatState("last_trip_distance"))}
                  ${this._miniMetric("Počet jízd", this._formatState("trip_count"))}
                  ${this._miniMetric("Celková vzdálenost", this._formatState("total_trip_distance"))}
                </div>
              </div>
            `
                : ""
            }
          </section>

          <section class="garage-list-grid">
            ${this._renderRecentList("Poslední tankování", recentFills, (fill) =>
              `<strong>${fill.date ?? "?"}</strong> · ${fill.volume ?? "?"} L · ${fill.cost ?? "?"}`
            )}
            ${
              this._config.show_expenses
                ? this._renderRecentList("Poslední výdaje", recentExpenses, (expense) =>
                    `<strong>${expense.date ?? "?"}</strong> · ${expense.title ?? "Bez názvu"} · ${expense.cost ?? "?"}`
                  )
                : ""
            }
            ${
              this._config.show_trips
                ? this._renderRecentList("Poslední jízdy", recentTrips, (trip) =>
                    `<strong>${trip.date ?? "?"}</strong> · ${trip.title ?? "Bez názvu"} · ${trip.distance_km ?? "?"} km`
                  )
                : ""
            }
          </section>
        </div>
      </ha-card>
    `;
  }

  _miniMetric(label, value, tone = "") {
    return `
      <div class="garage-metric ${tone}">
        <div class="garage-metric__label">${label}</div>
        <div class="garage-metric__value">${value ?? "—"}</div>
      </div>
    `;
  }

  _renderRecentList(title, items, formatter) {
    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    const rows = items.slice(0, 3).map((item) => `<li>${formatter(item)}</li>`).join("");
    return `
      <section class="garage-panel garage-panel--list">
        <div class="garage-panel__title">${title}</div>
        <ul>${rows}</ul>
      </section>
    `;
  }

  _renderCompact() {
    const title = this._vehicleLabel();

    return `
      <ha-card>
        <div class="shell compact-layout" style="--accent:${this._config.accent_color}">
          <header class="fuelio-header fuelio-header--shared">
            <div class="fuelio-header__brand">
              <div class="fuelio-header__menu"><ha-icon icon="mdi:menu"></ha-icon></div>
              <div class="fuelio-header__titlewrap">
                <div class="fuelio-header__eyebrow">FuelinoHA</div>
                <h2>Prehled</h2>
              </div>
            </div>
            <div class="fuelio-vehicle">
              <div class="fuelio-vehicle__avatar">${title.slice(0, 1).toUpperCase()}</div>
              <div class="fuelio-vehicle__copy">
                <strong>${title}</strong>
                <span>${this._formatState("odometer")}</span>
              </div>
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </div>
          </header>
          <section class="compact-panel">
            <div class="compact-panel__price">${this._formatState("last_price_per_unit")}</div>
            <div class="compact-panel__chips">
              <span>${this._formatState("last_fill_date")}</span>
              <span>${this._formatState("fuel_cost_this_month")}</span>
              <span>${this._formatState("odometer")}</span>
              <span>${this._formatState("last_service_date")}</span>
            </div>
          </section>
        </div>
      </ha-card>
    `;
  }

  _renderFuelioStats() {
    const currentMonth = this._monthSummaryAt(0);
    const previousMonth = this._monthSummaryAt(1);
    const recentFill = this._recentFills()[0] || null;
    const activities = this._recentActivityItems();
    const tripCount = this._formatState("trip_count");
    const tripDistance = this._formatState("total_trip_distance");
    const tripCostPerKm = this._formatState("average_trip_cost_per_km");
    const lastTripCost = this._formatState("last_trip_cost");
    const averagePrice5Fills = this._formatState("average_price_5_fills");
    const averageFillVolume = this._formatState("average_fill_volume");
    const averageDistanceBetweenFills = this._formatState("average_distance_between_fills");
    const averageDaysBetweenFills = this._formatState("average_days_between_fills");
    const distanceSincePreviousFill = this._formatState("distance_since_previous_fill");
    const daysSinceFill = this._formatState("days_since_fill");
    const favoriteStation = this._formatState("favorite_station");
    const favoriteCity = this._formatState("favorite_city");
    const differentStations = this._formatState("different_stations_count");
    const fillCount30d = this._formatState("fill_count_30d");
    const lastFillVolume = this._formatNumericValue(recentFill?.volume, this._unit("average_fill_volume") || "L", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    const lastFillCost = this._formatCurrencyValue(recentFill?.cost, this._unit("fuel_cost_this_month") || "CZK");
    const lastFillStation = recentFill?.city || favoriteStation || "Neznama pumpa";
    const lastFillType = recentFill?.fuel_type || "Palivo";
    const lastFillPartial = recentFill?.is_partial === true ? "Castecne tankovani" : "Plna nadrz";

    return `
      <ha-card>
        <div class="fuelio-shell">
          <header class="fuelio-header">
            <div class="fuelio-header__brand">
              <div class="fuelio-header__menu"><ha-icon icon="mdi:menu"></ha-icon></div>
              <div class="fuelio-header__titlewrap">
                <div class="fuelio-header__eyebrow">FuelinoHA</div>
                <h2>fuelio</h2>
              </div>
            </div>
            <div class="fuelio-vehicle">
              <div class="fuelio-vehicle__avatar">${this._vehicleLabel().slice(0, 1).toUpperCase()}</div>
              <div class="fuelio-vehicle__copy">
                <strong>${this._vehicleLabel()}</strong>
                <span>${this._formatState("odometer")}</span>
              </div>
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </div>
          </header>

          <section class="fuelio-section">
            <div class="fuelio-chip"><ha-icon icon="mdi:gas-station"></ha-icon><span>Palivo</span></div>
            <div class="fuelio-panel fuelio-panel--stats">
              <div class="fuelio-panel__eyebrow">${lastFillType}</div>
              <div class="fuelio-fuelgrid">
                <div class="fuelio-fuelcard fuelio-fuelcard--highlight">
                  <div class="fuelio-fuelcard__label">Posledni tankovani</div>
                  <strong>${lastFillCost}</strong>
                  <span>${lastFillVolume} · ${lastFillStation}</span>
                  <small>${lastFillPartial}</small>
                </div>
                <div class="fuelio-fuelcard">
                  <div class="fuelio-fuelcard__label">Prumer spotreby</div>
                  <strong>${this._averageConsumptionDisplay()}</strong>
                  <span>z historie tankovani</span>
                </div>
                <div class="fuelio-fuelcard">
                  <div class="fuelio-fuelcard__label">Posledni spotreba</div>
                  <strong>${this._lastConsumptionDisplay()}</strong>
                  <span>pri poslednim zaznamu</span>
                </div>
                <div class="fuelio-fuelcard">
                  <div class="fuelio-fuelcard__label">Prumerna cena 5 tankovani</div>
                  <strong>${averagePrice5Fills}</strong>
                  <span>rychly cenovy prehled</span>
                </div>
              </div>
              <div class="fuelio-statrows fuelio-statrows--dense">
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:water-outline"></ha-icon>
                    <strong>${averageFillVolume}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Prumerny objem tankovani</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:map-marker-distance"></ha-icon>
                    <strong>${averageDistanceBetweenFills}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Prumerna vzdalenost mezi tankovanim</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:calendar-sync"></ha-icon>
                    <strong>${averageDaysBetweenFills}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Prumer dnu mezi tankovanim</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:road-variant"></ha-icon>
                    <strong>${distanceSincePreviousFill}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Vzdalenost od minuleho tankovani</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:calendar-clock"></ha-icon>
                    <strong>${daysSinceFill}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Dnu od posledniho tankovani</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:pump"></ha-icon>
                    <strong>${fillCount30d}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Tankovani za poslednich 30 dni</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:cash-fast"></ha-icon>
                    <strong>${this._formatState("last_price_per_unit")}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Posledni cena paliva</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:star-circle"></ha-icon>
                    <strong>${favoriteStation}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Nejcastejsi pumpa · ${differentStations}</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:city"></ha-icon>
                    <strong>${favoriteCity}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Nejcastejsi mesto tankovani</div>
                </div>
              </div>
              ${
                recentFill
                  ? `<div class="fuelio-panel__footer">${this._formatDate(recentFill.date)} · ${this._daysAgoLabel(recentFill.date)}</div>`
                  : ""
              }
            </div>
          </section>

          <section class="fuelio-section">
            <div class="fuelio-chip"><ha-icon icon="mdi:currency-usd"></ha-icon><span>Naklady</span></div>
            <div class="fuelio-panel fuelio-panel--stats">
              <div class="fuelio-costblock">
                <div class="fuelio-costblock__title">${currentMonth ? this._monthLabel(currentMonth) : "Tento mesic"}</div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:gas-station"></ha-icon>
                    <strong>${this._formatState("fuel_cost_this_month")}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Palivo</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:cash"></ha-icon>
                    <strong>${this._formatState("expense_cost_this_month")}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Ostatni naklady</div>
                </div>
              </div>
              <div class="fuelio-costblock fuelio-costblock--previous">
                <div class="fuelio-costblock__title">${previousMonth ? this._monthLabel(previousMonth) : "Predchozi mesic"}</div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:gas-station"></ha-icon>
                    <strong>${this._formatState("last_month_cost")}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Palivo</div>
                </div>
                <div class="fuelio-statrow">
                  <div class="fuelio-statrow__left">
                    <ha-icon icon="mdi:counter"></ha-icon>
                    <strong>${this._formatState("last_month_fill_count")}</strong>
                  </div>
                  <div class="fuelio-statrow__label">Tankovani</div>
                </div>
              </div>
            </div>
          </section>

          ${this._fuelioTrendCard()}

          ${
            this._config.show_trips
              ? `
          <section class="fuelio-section">
            <div class="fuelio-chip"><ha-icon icon="mdi:map-marker-path"></ha-icon><span>Zaznam jizd</span></div>
            <div class="fuelio-panel fuelio-panel--stats">
              <div class="fuelio-tripgrid">
                <div class="fuelio-tripcell">
                  <strong>${tripCount}</strong>
                  <span>Celkovy pocet tras</span>
                </div>
                <div class="fuelio-tripcell">
                  <strong>${tripDistance}</strong>
                  <span>Vzdalenost</span>
                </div>
                <div class="fuelio-tripcell">
                  <strong>${tripCostPerKm}</strong>
                  <span>Prumerne naklady na km</span>
                </div>
                <div class="fuelio-tripcell">
                  <strong>${lastTripCost}</strong>
                  <span>Posledni cena jizdy</span>
                </div>
              </div>
            </div>
          </section>
          `
              : ""
          }

          <section class="fuelio-section">
            <div class="fuelio-chip"><ha-icon icon="mdi:history"></ha-icon><span>Posledni polozky</span></div>
            <div class="fuelio-panel fuelio-panel--list">
              ${
                activities.length
                  ? activities
                      .map(
                        (item) => `
                    <div class="fuelio-activity">
                      <div class="fuelio-activity__amount">
                        <ha-icon icon="${item.icon}"></ha-icon>
                        <strong>${item.amount}</strong>
                      </div>
                      <div class="fuelio-activity__date">${this._formatDate(item.date, {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}</div>
                      <div class="fuelio-activity__title">${item.title}</div>
                    </div>
                  `
                      )
                      .join("")
                  : `<div class="empty-note">Posledni polozky zatim nejsou k dispozici.</div>`
              }
            </div>
          </section>
        </div>
      </ha-card>
    `;
  }

  _attachFuelioTrendEvents() {
    const carousel = this.shadowRoot?.querySelector("[data-trend-carousel]");
    if (!carousel) {
      return;
    }

    this.shadowRoot.querySelectorAll("[data-trend-slide]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-trend-slide"));
        if (Number.isFinite(index)) {
          this._setFuelioTrendSlide(index);
        }
      });
    });

    this.shadowRoot.querySelectorAll("[data-trend-period]").forEach((button) => {
      button.addEventListener("click", () => {
        const period = button.getAttribute("data-trend-period");
        if (period) {
          this._setFuelioTrendPeriod(period);
        }
      });
    });

    carousel.addEventListener("touchstart", (event) => {
      this._trendTouchStartX = event.touches[0]?.clientX ?? null;
    }, { passive: true });

    carousel.addEventListener("touchend", (event) => {
      if (this._trendTouchStartX === null) {
        return;
      }
      const endX = event.changedTouches[0]?.clientX ?? this._trendTouchStartX;
      const deltaX = endX - this._trendTouchStartX;
      this._trendTouchStartX = null;

      if (Math.abs(deltaX) < 35) {
        return;
      }

      const total = this._buildFuelioTrendCards().length;
      if (!total) {
        return;
      }

      if (deltaX < 0) {
        this._setFuelioTrendSlide(this._fuelioTrendSlide + 1, total);
      } else {
        this._setFuelioTrendSlide(this._fuelioTrendSlide - 1, total);
      }
    }, { passive: true });
  }

  _render() {
    if (!this._hass || !this._config) {
      return;
    }

    if (!this._hasVehicle()) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }

          ha-card {
            overflow: hidden;
            border-radius: 24px;
            box-shadow: none;
          }

          .empty-shell {
            padding: 20px;
            border-radius: 24px;
            background: linear-gradient(180deg, #3a3413 0%, #262004 100%);
            color: #f4f5ef;
            display: grid;
            gap: 10px;
          }

          .empty-shell__title {
            font-size: 1rem;
            font-weight: 700;
          }

          .empty-shell__body {
            color: rgba(244, 245, 239, 0.78);
            line-height: 1.5;
          }

          code {
            padding: 2px 6px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.08);
          }
        </style>
        <ha-card>
          <div class="empty-shell">
            <div class="empty-shell__title">FuelinoHA Card</div>
            <div class="empty-shell__body">
              Set <code>vehicle</code> to your Fuelino vehicle slug, for example <code>hyundai_i30</code>.
            </div>
          </div>
        </ha-card>
      `;
      return;
    }

    let cardHtml = this._renderCosts();
    if (this._config.layout === "fuelio") {
      cardHtml = this._renderFuelioStats();
    } else if (this._config.layout === "compact") {
      cardHtml = this._renderCompact();
    }

    const background =
      this._config.card_background ||
      "radial-gradient(circle at top right, color-mix(in srgb, var(--card-green) 50%, transparent), transparent 38%), linear-gradient(145deg, var(--card-olive) 0%, var(--card-olive-mid) 45%, var(--card-olive-deep) 100%)";
    const radius = Number(this._config.border_radius) || 28;
    const denseGap = this._config.dense_mode ? 12 : 18;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-width: 0;
          --card-olive: #10172a;
          --card-olive-mid: #17223d;
          --card-olive-deep: #0f1220;
          --card-olive-panel: rgba(255, 255, 255, 0.06);
          --card-olive-panel-strong: rgba(255, 255, 255, 0.09);
          --card-text: #f6f7fb;
          --card-muted: rgba(246, 247, 251, 0.68);
          --card-divider: rgba(255, 255, 255, 0.14);
          --card-green: ${this._config.accent_color};
          --card-red: #ea6c62;
        }

        ha-card {
          overflow: hidden;
          border-radius: ${radius}px;
          box-shadow: none;
          min-width: 0;
        }

        ha-icon {
          width: 20px;
          height: 20px;
          color: inherit;
        }

        .shell {
          background: ${background};
          color: var(--card-text);
          padding: ${this._config.dense_mode ? 16 : 22}px;
          display: grid;
          gap: ${denseGap}px;
          min-width: 0;
          box-sizing: border-box;
        }

        .section-chipline {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .topbar__left,
        .topbar__controls {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .topbar__menu,
        .topbar__action {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: var(--card-olive-panel);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--card-text);
        }

        .topbar__eyebrow,
        .section-head__eyebrow {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--card-muted);
        }

        .topbar h2,
        .section-head h3,
        .garage-hero__copy h2 {
          margin: 4px 0 0;
          font-size: 2rem;
          line-height: 1.04;
          font-weight: 800;
        }

        .vehicle-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 12px 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: var(--card-olive-panel);
          font-size: 1rem;
        }

        .hero-panel,
        .summary-card,
        .cost-card,
        .hero-stat-card,
        .garage-panel,
        .garage-hero__copy,
        .garage-hero__stats {
          background: var(--card-olive-panel);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border-radius: ${Math.max(radius - 4, 18)}px;
          min-width: 0;
          box-sizing: border-box;
        }

        .hero-panel {
          padding: ${this._config.dense_mode ? 18 : 24}px;
          display: grid;
          gap: ${this._config.dense_mode ? 12 : 18}px;
        }

        .hero-illustration {
          position: relative;
          min-height: 200px;
          border-radius: ${Math.max(radius - 8, 16)}px;
          background:
            radial-gradient(circle at top right, color-mix(in srgb, var(--card-green) 26%, transparent), transparent 34%),
            rgba(255, 255, 255, 0.03);
          overflow: hidden;
        }

        .hero-arc {
          position: absolute;
          inset: 28px auto auto 34px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          border: 8px solid rgba(255, 255, 255, 0.18);
          border-bottom-color: transparent;
          border-right-color: transparent;
          transform: rotate(8deg);
        }

        .hero-wallet {
          position: absolute;
          left: 84px;
          top: 88px;
          width: 138px;
          height: 92px;
          border-radius: 18px;
          background: linear-gradient(180deg, color-mix(in srgb, var(--card-green) 30%, #7ea3ff), #4f5cd4);
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.08);
        }

        .hero-wallet__band {
          position: absolute;
          left: 0;
          right: 0;
          top: 26px;
          height: 16px;
          background: #0f1016;
        }

        .hero-wallet__cash {
          position: absolute;
          left: -20px;
          top: 36px;
          width: 86px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.24);
          border: 4px solid rgba(255, 255, 255, 0.18);
        }

        .hero-receipt {
          position: absolute;
          right: 42px;
          top: 58px;
          width: 120px;
          height: 146px;
          border-radius: 10px 10px 18px 18px;
          background: #f6f6f1;
        }

        .hero-receipt::before {
          content: "";
          position: absolute;
          left: 20px;
          top: 24px;
          width: 80px;
          height: 28px;
          border-radius: 4px;
          background: var(--card-red);
        }

        .hero-receipt span {
          position: absolute;
          left: 20px;
          right: 20px;
          height: 8px;
          border-radius: 999px;
          background: rgba(193, 60, 50, 0.82);
        }

        .hero-receipt span:nth-child(1) { top: 68px; }
        .hero-receipt span:nth-child(2) { top: 88px; width: 70px; }
        .hero-receipt span:nth-child(3) { top: 108px; width: 86px; }

        .hero-badge {
          position: absolute;
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: var(--card-red);
          color: white;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
        }

        .hero-badge--left {
          left: 36px;
          top: 70px;
        }

        .hero-badge--right {
          left: 230px;
          top: 128px;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .hero-stat-card {
          padding: 18px;
        }

        .hero-stat-card__label,
        .summary-card__title,
        .cost-card__label {
          font-size: 0.92rem;
          color: var(--card-muted);
        }

        .hero-stat-card__main,
        .summary-card__main,
        .cost-card__total {
          margin-top: 8px;
          font-size: clamp(2rem, 7vw, 3.3rem);
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: 0.01em;
          overflow-wrap: anywhere;
        }

        .hero-stat-card__sub {
          margin-top: 16px;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .hero-stat-card__hint {
          margin-top: 4px;
          color: var(--card-muted);
          font-size: 0.92rem;
        }

        .summary-grid,
        .cost-grid {
          display: grid;
          gap: ${denseGap}px;
        }

        .summary-card,
        .cost-card {
          padding: ${this._config.dense_mode ? 18 : 22}px;
        }

        .summary-card__divider,
        .cost-card__divider {
          height: 1px;
          background: var(--card-divider);
          margin: 20px 0 18px;
        }

        .summary-card__stats,
        .cost-card__stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px 18px;
        }

        .summary-stat,
        .mini-stat {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 6px 10px;
          align-items: center;
        }

        .summary-stat__icon,
        .mini-stat__icon {
          color: var(--card-green);
          grid-row: span 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-stat__value,
        .mini-stat__value {
          font-size: 1rem;
          font-weight: 700;
        }

        .summary-stat__label,
        .mini-stat__label {
          font-size: 0.88rem;
          color: var(--card-muted);
        }

        .section-head {
          padding: 4px 2px 0;
        }

        .cost-card__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .cost-card__icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: var(--card-olive-panel-strong);
          display: grid;
          place-items: center;
          color: var(--card-green);
        }

        .empty-note {
          padding: 20px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--card-muted);
        }

        .garage-shell {
          color: #f6f7fb;
          background:
            radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 55%, transparent), transparent 35%),
            linear-gradient(145deg, #10172a 0%, #17223d 45%, #0f1220 100%);
          padding: 20px;
          display: grid;
          gap: 18px;
          min-width: 0;
          box-sizing: border-box;
        }

        .garage-hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 16px;
        }

        .garage-hero__copy,
        .garage-hero__stats,
        .garage-panel {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .garage-hero__copy,
        .garage-panel {
          padding: 16px;
        }

        .garage-hero__stats {
          padding: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .garage-grid,
        .garage-list-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .garage-panel__title {
          font-size: 0.92rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .garage-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .garage-metric {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
        }

        .garage-metric.is-primary {
          background: color-mix(in srgb, var(--accent) 22%, rgba(255, 255, 255, 0.05));
        }

        .garage-metric__label {
          font-size: 0.76rem;
          opacity: 0.78;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .garage-metric__value {
          font-size: 1rem;
          font-weight: 700;
        }

        .garage-panel--list ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }

        .garage-panel--list li {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          font-size: 0.92rem;
        }

        .compact-layout {
          color: #f6f7fb;
          gap: 16px;
        }

        .compact-panel {
          background: var(--card-olive-panel);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border-radius: 28px;
          padding: 20px;
          display: grid;
          gap: 14px;
        }

        .compact-panel__price {
          font-size: 1.5rem;
          font-weight: 800;
          color: color-mix(in srgb, var(--accent) 75%, white);
        }

        .compact-panel__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .compact-panel__chips span {
          border-radius: 999px;
          padding: 8px 12px;
          background: var(--card-olive-panel-strong);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.84rem;
        }

        .fuelio-shell {
          --fuelio-bg: var(--card-olive);
          --fuelio-bg-mid: var(--card-olive-mid);
          --fuelio-bg-deep: var(--card-olive-deep);
          --fuelio-panel: var(--card-olive-panel);
          --fuelio-panel-strong: var(--card-olive-panel-strong);
          --fuelio-text: var(--card-text);
          --fuelio-muted: var(--card-muted);
          --fuelio-line: color-mix(in srgb, var(--accent) 78%, white);
          --fuelio-down: var(--card-red);
          background:
            radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 50%, transparent), transparent 38%),
            linear-gradient(145deg, var(--fuelio-bg) 0%, var(--fuelio-bg-mid) 45%, var(--fuelio-bg-deep) 100%);
          color: var(--fuelio-text);
          padding: 22px;
          display: grid;
          gap: 18px;
          min-width: 0;
          box-sizing: border-box;
        }

        .fuelio-shell ha-icon,
        .fuelio-trend__eyebrow ha-icon,
        .fuelio-statrow__left ha-icon,
        .fuelio-activity__amount ha-icon {
          color: color-mix(in srgb, var(--accent) 80%, white);
        }

        .fuelio-header {
          display: grid;
          gap: 16px;
        }

        .fuelio-header--shared {
          margin-bottom: 2px;
        }

        .fuelio-header__brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .fuelio-header__menu {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: var(--fuelio-panel);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .fuelio-header__titlewrap {
          flex: 1;
          min-width: 0;
        }

        .fuelio-header__eyebrow {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--fuelio-muted);
        }

        .fuelio-header h2 {
          margin: 4px 0 0;
          font-size: 2.25rem;
          line-height: 1;
          font-weight: 800;
        }

        .fuelio-vehicle {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
          border-radius: 22px;
          padding: 16px 18px;
          background: var(--fuelio-panel);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .fuelio-vehicle__avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--fuelio-panel-strong);
          font-size: 1.65rem;
          font-weight: 700;
        }

        .fuelio-vehicle__copy {
          display: grid;
          gap: 2px;
          min-width: 0;
        }

        .fuelio-vehicle__copy strong {
          font-size: 1.45rem;
          font-weight: 700;
        }

        .fuelio-vehicle__copy span {
          color: var(--fuelio-muted);
          font-size: 1rem;
        }

        .fuelio-section {
          display: grid;
          gap: 12px;
        }

        .fuelio-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          border-radius: 999px;
          padding: 10px 16px;
          background: var(--fuelio-panel-strong);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--fuelio-text);
          font-weight: 700;
        }

        .fuelio-panel {
          border-radius: 28px;
          padding: 22px;
          background: var(--fuelio-panel);
          border: 1px solid rgba(255, 255, 255, 0.06);
          min-width: 0;
          backdrop-filter: blur(10px);
        }

        .fuelio-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .fuelio-panel__eyebrow {
          font-size: 0.92rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--fuelio-muted);
          margin-bottom: 12px;
        }

        .fuelio-panel__footer,
        .fuelio-trend__hint {
          margin-top: 16px;
          color: var(--fuelio-muted);
          font-size: 0.9rem;
        }

        .fuelio-fuelgrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .fuelio-fuelcard {
          display: grid;
          gap: 6px;
          padding: 16px;
          border-radius: 20px;
          background: var(--fuelio-panel-strong);
          min-width: 0;
        }

        .fuelio-fuelcard--highlight {
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--accent) 26%, transparent), transparent),
            var(--fuelio-panel-strong);
        }

        .fuelio-fuelcard__label,
        .fuelio-fuelcard span,
        .fuelio-fuelcard small {
          color: var(--fuelio-muted);
        }

        .fuelio-fuelcard strong {
          font-size: 1.2rem;
          font-weight: 800;
          line-height: 1.1;
        }

        .fuelio-statrows--dense .fuelio-statrow {
          gap: 12px;
        }

        .fuelio-statrows,
        .fuelio-costblock {
          display: grid;
          gap: 14px;
        }

        .fuelio-costblock + .fuelio-costblock {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .fuelio-costblock__title {
          color: var(--fuelio-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.95rem;
        }

        .fuelio-statrow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
        }

        .fuelio-statrow__left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .fuelio-statrow__left strong,
        .fuelio-tripcell strong,
        .fuelio-trend__value {
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: 0.01em;
        }

        .fuelio-statrow__label,
        .fuelio-tripcell span,
        .fuelio-trend__label {
          color: var(--fuelio-muted);
          text-align: right;
        }

        .fuelio-trend {
          display: grid;
          grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
          gap: 18px;
          align-items: end;
        }

        .fuelio-trend__meta {
          display: grid;
          gap: 16px;
        }

        .fuelio-trend__periods {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .fuelio-trend__period {
          border: 0;
          border-radius: 999px;
          padding: 7px 12px;
          background: var(--fuelio-panel-strong);
          color: var(--fuelio-muted);
          font: inherit;
          cursor: pointer;
        }

        .fuelio-trend__period.is-active {
          background: color-mix(in srgb, var(--accent) 75%, white);
          color: #0f1220;
          font-weight: 700;
        }

        .fuelio-trend__metric {
          display: grid;
          gap: 2px;
        }

        .fuelio-trend__value {
          font-size: 2rem;
          line-height: 0.95;
        }

        .fuelio-trend__value.is-up {
          color: var(--fuelio-down);
        }

        .fuelio-trend__value.is-down {
          color: color-mix(in srgb, var(--accent) 82%, white);
        }

        .fuelio-trend__chart svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .fuelio-trend__line {
          fill: none;
          stroke: var(--fuelio-line);
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .fuelio-trend__area {
          fill: url(#fuelioTrendFill);
          stroke: none;
        }

        .fuelio-trend__dot {
          fill: var(--fuelio-line);
          opacity: 0.88;
        }

        .fuelio-trend__dot.is-active {
          stroke: rgba(255, 255, 255, 0.24);
          stroke-width: 6;
        }

        .fuelio-trend__avg {
          stroke: rgba(255, 255, 255, 0.28);
          stroke-width: 2;
          stroke-dasharray: 10 8;
        }

        .fuelio-trend__axis {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          color: var(--fuelio-muted);
          font-size: 0.9rem;
        }

        .fuelio-trend__dots {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 14px;
        }

        .fuelio-trend__pager {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 0;
          padding: 0;
          background: rgba(255, 255, 255, 0.2);
          cursor: pointer;
        }

        .fuelio-trend__pager.is-active {
          background: var(--fuelio-line);
        }

        .fuelio-bars {
          height: 180px;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 14px;
          align-items: end;
          padding: 0 8px;
          position: relative;
        }

        .fuelio-bars::before {
          content: "";
          position: absolute;
          left: 8px;
          right: 8px;
          top: 50%;
          border-top: 2px dashed rgba(255, 255, 255, 0.28);
        }

        .fuelio-bars__col {
          height: 100%;
          display: flex;
          align-items: end;
        }

        .fuelio-bars__bar {
          width: 100%;
          border-radius: 10px;
          background: var(--bar-fill, color-mix(in srgb, var(--fuelio-line) 84%, white));
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.08),
            0 12px 24px rgba(13, 19, 36, 0.24);
        }

        .fuelio-bars__bar.is-active {
          background: var(--bar-fill-active, var(--bar-fill, color-mix(in srgb, var(--fuelio-line) 92%, white)));
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.12),
            0 0 0 2px rgba(255, 255, 255, 0.18),
            0 16px 32px rgba(13, 19, 36, 0.34);
        }

        .fuelio-tripgrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .fuelio-tripcell {
          display: grid;
          gap: 6px;
          padding: 16px;
          border-radius: 18px;
          background: var(--fuelio-panel-strong);
          min-width: 0;
        }

        .fuelio-tripcell span {
          text-align: left;
        }

        .fuelio-panel--list {
          display: grid;
          gap: 12px;
        }

        .fuelio-activity {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) auto auto;
          gap: 14px;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .fuelio-activity:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .fuelio-activity__amount {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .fuelio-activity__amount strong {
          font-size: 1.15rem;
          font-weight: 800;
        }

        .fuelio-activity__date,
        .fuelio-activity__title {
          color: var(--fuelio-muted);
          white-space: nowrap;
        }

        .fuelio-activity__title {
          text-align: right;
        }

        :host([data-width-mode="md"]) .garage-hero,
        :host([data-width-mode="sm"]) .garage-hero,
        :host([data-width-mode="xs"]) .garage-hero,
        :host([data-width-mode="md"]) .garage-grid,
        :host([data-width-mode="sm"]) .garage-grid,
        :host([data-width-mode="xs"]) .garage-grid,
        :host([data-width-mode="md"]) .garage-list-grid,
        :host([data-width-mode="sm"]) .garage-list-grid,
        :host([data-width-mode="xs"]) .garage-list-grid {
          grid-template-columns: 1fr;
        }

        :host([data-width-mode="sm"]) .topbar,
        :host([data-width-mode="xs"]) .topbar {
          flex-direction: column;
          align-items: flex-start;
        }

        :host([data-width-mode="sm"]) .topbar__controls,
        :host([data-width-mode="xs"]) .topbar__controls {
          width: 100%;
          justify-content: space-between;
        }

        :host([data-width-mode="sm"]) .hero-stats,
        :host([data-width-mode="sm"]) .summary-card__stats,
        :host([data-width-mode="sm"]) .cost-card__stats,
        :host([data-width-mode="sm"]) .garage-hero__stats,
        :host([data-width-mode="sm"]) .garage-metrics {
          grid-template-columns: 1fr 1fr;
        }

        :host([data-width-mode="md"]) .summary-grid,
        :host([data-width-mode="sm"]) .summary-grid,
        :host([data-width-mode="xs"]) .summary-grid,
        :host([data-width-mode="md"]) .cost-grid,
        :host([data-width-mode="sm"]) .cost-grid,
        :host([data-width-mode="xs"]) .cost-grid {
          grid-template-columns: 1fr;
        }

        :host([data-width-mode="md"]) .hero-panel,
        :host([data-width-mode="sm"]) .hero-panel,
        :host([data-width-mode="xs"]) .hero-panel {
          padding: 18px;
        }

        :host([data-width-mode="md"]) .hero-stat-card__main,
        :host([data-width-mode="md"]) .summary-card__main,
        :host([data-width-mode="md"]) .cost-card__total {
          font-size: clamp(1.8rem, 6vw, 2.6rem);
        }

        :host([data-width-mode="sm"]) .hero-stat-card__main,
        :host([data-width-mode="sm"]) .summary-card__main,
        :host([data-width-mode="sm"]) .cost-card__total {
          font-size: clamp(1.7rem, 7vw, 2.35rem);
        }

        :host([data-width-mode="md"]) .hero-illustration,
        :host([data-width-mode="sm"]) .hero-illustration,
        :host([data-width-mode="xs"]) .hero-illustration {
          min-height: 150px;
        }

        :host([data-width-mode="md"]) .hero-arc,
        :host([data-width-mode="sm"]) .hero-arc,
        :host([data-width-mode="xs"]) .hero-arc {
          inset: 18px auto auto 20px;
          width: 128px;
          height: 128px;
        }

        :host([data-width-mode="md"]) .hero-wallet,
        :host([data-width-mode="sm"]) .hero-wallet,
        :host([data-width-mode="xs"]) .hero-wallet {
          left: 48px;
          top: 56px;
          width: 108px;
          height: 74px;
        }

        :host([data-width-mode="md"]) .hero-wallet__band,
        :host([data-width-mode="sm"]) .hero-wallet__band,
        :host([data-width-mode="xs"]) .hero-wallet__band {
          top: 22px;
          height: 12px;
        }

        :host([data-width-mode="md"]) .hero-wallet__cash,
        :host([data-width-mode="sm"]) .hero-wallet__cash,
        :host([data-width-mode="xs"]) .hero-wallet__cash {
          left: -10px;
          top: 28px;
          width: 64px;
          height: 34px;
        }

        :host([data-width-mode="md"]) .hero-receipt,
        :host([data-width-mode="sm"]) .hero-receipt,
        :host([data-width-mode="xs"]) .hero-receipt {
          right: 18px;
          top: 42px;
          width: 88px;
          height: 108px;
        }

        :host([data-width-mode="md"]) .hero-receipt::before,
        :host([data-width-mode="sm"]) .hero-receipt::before,
        :host([data-width-mode="xs"]) .hero-receipt::before {
          left: 14px;
          top: 18px;
          width: 58px;
          height: 18px;
        }

        :host([data-width-mode="md"]) .hero-receipt span,
        :host([data-width-mode="sm"]) .hero-receipt span,
        :host([data-width-mode="xs"]) .hero-receipt span {
          left: 14px;
          right: 14px;
          height: 6px;
        }

        :host([data-width-mode="md"]) .hero-receipt span:nth-child(1),
        :host([data-width-mode="sm"]) .hero-receipt span:nth-child(1),
        :host([data-width-mode="xs"]) .hero-receipt span:nth-child(1) {
          top: 52px;
        }

        :host([data-width-mode="md"]) .hero-receipt span:nth-child(2),
        :host([data-width-mode="sm"]) .hero-receipt span:nth-child(2),
        :host([data-width-mode="xs"]) .hero-receipt span:nth-child(2) {
          top: 68px;
          width: 44px;
        }

        :host([data-width-mode="md"]) .hero-receipt span:nth-child(3),
        :host([data-width-mode="sm"]) .hero-receipt span:nth-child(3),
        :host([data-width-mode="xs"]) .hero-receipt span:nth-child(3) {
          top: 84px;
          width: 56px;
        }

        :host([data-width-mode="md"]) .hero-badge,
        :host([data-width-mode="sm"]) .hero-badge,
        :host([data-width-mode="xs"]) .hero-badge {
          width: 42px;
          height: 42px;
          border-radius: 14px;
        }

        :host([data-width-mode="md"]) .hero-badge--left,
        :host([data-width-mode="sm"]) .hero-badge--left,
        :host([data-width-mode="xs"]) .hero-badge--left {
          left: 16px;
          top: 52px;
        }

        :host([data-width-mode="md"]) .hero-badge--right,
        :host([data-width-mode="sm"]) .hero-badge--right,
        :host([data-width-mode="xs"]) .hero-badge--right {
          left: 134px;
          top: 98px;
        }

        :host([data-width-mode="xs"]) .hero-stats,
        :host([data-width-mode="xs"]) .summary-card__stats,
        :host([data-width-mode="xs"]) .cost-card__stats,
        :host([data-width-mode="xs"]) .garage-hero__stats,
        :host([data-width-mode="xs"]) .garage-metrics {
          grid-template-columns: 1fr;
        }

        :host([data-width-mode="sm"]) .hero-panel,
        :host([data-width-mode="xs"]) .hero-panel,
        :host([data-width-mode="sm"]) .summary-card,
        :host([data-width-mode="xs"]) .summary-card,
        :host([data-width-mode="sm"]) .cost-card,
        :host([data-width-mode="xs"]) .cost-card {
          padding: 18px;
        }

        :host([data-width-mode="sm"]) .topbar h2,
        :host([data-width-mode="sm"]) .section-head h3,
        :host([data-width-mode="xs"]) .topbar h2,
        :host([data-width-mode="xs"]) .section-head h3 {
          font-size: 1.55rem;
        }

        :host([data-width-mode="xs"]) .shell,
        :host([data-width-mode="xs"]) .garage-shell,
        :host([data-width-mode="xs"]) .compact-layout {
          padding: 14px;
        }

        :host([data-width-mode="xs"]) .hero-stat-card__main,
        :host([data-width-mode="xs"]) .summary-card__main,
        :host([data-width-mode="xs"]) .cost-card__total {
          font-size: clamp(1.55rem, 9vw, 2.4rem);
        }

        :host([data-width-mode="md"]) .fuelio-trend,
        :host([data-width-mode="sm"]) .fuelio-trend,
        :host([data-width-mode="xs"]) .fuelio-trend {
          grid-template-columns: 1fr;
        }

        :host([data-width-mode="sm"]) .fuelio-tripgrid,
        :host([data-width-mode="sm"]) .fuelio-fuelgrid,
        :host([data-width-mode="xs"]) .fuelio-tripgrid {
          grid-template-columns: 1fr;
        }

        :host([data-width-mode="xs"]) .fuelio-fuelgrid {
          grid-template-columns: 1fr;
        }

        :host([data-width-mode="sm"]) .fuelio-activity,
        :host([data-width-mode="xs"]) .fuelio-activity {
          grid-template-columns: 1fr;
          gap: 6px;
        }

        :host([data-width-mode="sm"]) .fuelio-activity__title,
        :host([data-width-mode="xs"]) .fuelio-activity__title,
        :host([data-width-mode="sm"]) .fuelio-statrow__label,
        :host([data-width-mode="xs"]) .fuelio-statrow__label {
          text-align: left;
        }

        :host([data-width-mode="xs"]) .fuelio-shell {
          padding: 16px;
        }

        :host([data-width-mode="xs"]) .fuelio-panel {
          padding: 18px;
          border-radius: 22px;
        }

        :host([data-width-mode="xs"]) .fuelio-header h2 {
          font-size: 1.85rem;
        }

        @media (min-width: 920px) {
          .summary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .cost-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .garage-hero,
          .garage-grid,
          .garage-list-grid {
            grid-template-columns: 1fr;
          }

          .garage-hero__stats,
          .garage-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .shell {
            padding: 16px;
          }

          .topbar {
            align-items: flex-start;
          }

          .topbar__controls {
            flex-direction: column;
            align-items: flex-end;
          }

          .vehicle-chip {
            padding: 10px 14px;
          }

          .hero-stats,
          .summary-card__stats,
          .cost-card__stats {
            grid-template-columns: 1fr 1fr;
          }

          .hero-stat-card__main,
          .summary-card__main,
          .cost-card__total {
            font-size: clamp(2rem, 9vw, 3rem);
          }

          .hero-receipt {
            right: 18px;
            width: 92px;
            height: 120px;
          }

          .hero-wallet {
            left: 70px;
            width: 118px;
          }

          .hero-badge--right {
            left: 190px;
          }
        }

        @media (max-width: 480px) {
          .summary-card__stats,
          .cost-card__stats,
          .hero-stats,
          .garage-hero__stats,
          .garage-metrics {
            grid-template-columns: 1fr;
          }

          .topbar h2,
          .section-head h3 {
            font-size: 1.55rem;
          }
        }
      </style>
      ${cardHtml}
    `;

    this._attachFuelioTrendEvents();
  }
}

customElements.define("fuelino-card", FuelinoCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "fuelino-card",
  name: "FuelinoHA Card",
  description: "Vehicle dashboard card for FuelinoHA / Fuelino entities.",
});
