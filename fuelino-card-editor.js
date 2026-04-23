const FUELINO_CARD_EDITOR_TAG = "fuelino-card-editor";

class FuelinoCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._activeTab = "base";
    this._vehicleCatalog = [];
    this._vehicleCatalogKey = "";
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
      show_fuel: true,
      show_costs: true,
      show_charts: true,
      show_trips: true,
      show_recent_items: true,
      show_empty_categories: false,
      show_header: true,
      dense_mode: false,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    const shouldRender = !this._hass || !this.shadowRoot;
    this._hass = hass;
    this._loadVehicleCatalog();

    if (shouldRender) {
      this._render();
      return;
    }

    return;
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

  _setValue(key, value, options = {}) {
    const { render = true, dispatch = true } = options;
    const next = { ...this._config };
    if (value === "" || value === null || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    this._config = next;
    if (dispatch) {
      this._dispatchConfig();
    }
    if (render) {
      this._render();
    }
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

  _vehicleEntityRegex() {
    const suffixPattern = this._vehicleSensorSuffixes().join("|");
    return new RegExp(`^sensor\\.([a-z0-9_]+)_(${suffixPattern})$`, "i");
  }

  _vehicleSensorSuffixes() {
    const suffixes = [
      "vehicle_prefix",
      "last_fill_date",
      "days_since_fill",
      "last_fill_volume",
      "last_fill_cost",
      "last_price_per_unit",
      "last_consumption",
      "last_fill_temperature",
      "last_city",
      "favorite_station",
      "favorite_city",
      "favorite_station_id",
      "odometer",
      "distance_since_previous_fill",
      "tracked_distance",
      "fill_count",
      "cost_30d",
      "fuel_cost_this_month",
      "last_expense_date",
      "last_expense_cost",
      "expense_count",
      "expense_cost_this_month",
      "total_expense_cost",
      "total_vehicle_cost",
      "service_cost_total",
      "wash_cost_total",
      "registration_cost_total",
      "parking_cost_total",
      "toll_cost_total",
      "insurance_cost_total",
      "last_service_date",
      "last_service_cost",
      "top_expense_category",
      "fill_count_30d",
      "total_cost",
      "most_expensive_fill",
      "least_expensive_fill",
      "total_volume",
      "average_price",
      "average_price_5_fills",
      "average_consumption",
      "best_consumption",
      "worst_consumption",
      "average_consumption_30d",
      "average_cost_per_km",
      "average_fill_volume",
      "average_days_between_fills",
      "average_distance_between_fills",
      "distance_this_month",
      "last_month_cost",
      "last_month_average_consumption",
      "last_month_fill_count",
      "last_month_average_price",
      "month_over_month_cost_delta",
      "fuel_price_trend",
      "days_since_full_tank",
      "km_since_full_tank",
      "lowest_price_per_unit",
      "highest_price_per_unit",
      "different_stations_count",
      "different_cities_count",
      "last_trip_date",
      "last_trip_distance",
      "last_trip_cost",
      "trip_count",
      "total_trip_distance",
      "average_trip_cost_per_km",
      "source_file_name",
      "source_reference",
    ];
    return [...new Set([...suffixes, ...Object.values(this._vehicleSensorSuffixAliases()).flat()])];
  }

  _vehicleSensorSuffixAliases() {
    return {
      vehicle_prefix: ["prefix_senzoru_vozidla"],
      last_fill_date: ["datum_posledniho_tankovani"],
      days_since_fill: ["dnu_od_tankovani"],
      last_fill_volume: ["posledni_objem_tankovani"],
      last_fill_cost: ["cena_posledniho_tankovani"],
      last_price_per_unit: ["posledni_cena_za_jednotku"],
      last_consumption: ["posledni_spotreba"],
      last_city: ["posledni_mesto"],
      favorite_station: ["nejcastejsi_pumpa"],
      favorite_city: ["nejcastejsi_mesto"],
      favorite_station_id: ["nejcastejsi_id_pumpy"],
      odometer: ["tachometr"],
      distance_since_previous_fill: ["vzdalenost_od_minuleho_tankovani"],
      tracked_distance: ["sledovana_vzdalenost"],
      fill_count: ["pocet_tankovani"],
      fuel_cost_this_month: ["naklady_na_palivo_tento_mesic"],
      last_expense_date: ["datum_posledniho_vydaje"],
      last_expense_cost: ["cena_posledniho_vydaje"],
      expense_count: ["pocet_vydaju"],
      expense_cost_this_month: ["vydaje_tento_mesic"],
      total_expense_cost: ["celkove_ostatni_vydaje"],
      total_vehicle_cost: ["celkove_naklady_auta"],
      service_cost_total: ["celkem_servis_a_udrzba"],
      wash_cost_total: ["celkem_myti"],
      registration_cost_total: ["celkem_registrace"],
      parking_cost_total: ["celkem_parkovani"],
      toll_cost_total: ["celkem_mytne"],
      insurance_cost_total: ["celkem_pojisteni"],
      last_service_date: ["datum_posledniho_servisu"],
      last_service_cost: ["cena_posledniho_servisu"],
      top_expense_category: ["nejvetsi_kategorie_vydaju"],
      fill_count_30d: ["pocet_tankovani_za_30_dni"],
      total_cost: ["celkove_naklady"],
      total_volume: ["celkovy_objem"],
      average_price: ["prumerna_cena"],
      average_price_5_fills: ["prumerna_cena_za_poslednich_5_tankovani"],
      average_consumption: ["prumerna_spotreba"],
      best_consumption: ["nejlepsi_spotreba"],
      worst_consumption: ["nejhorsi_spotreba"],
      average_consumption_30d: ["prumerna_spotreba_za_30_dni"],
      average_cost_per_km: ["prumerna_cena_za_vzdalenost"],
      average_fill_volume: ["prumerny_objem_tankovani"],
      average_days_between_fills: ["prumer_dnu_mezi_tankovanimi"],
      average_distance_between_fills: ["prumerna_vzdalenost_mezi_tankovanimi"],
      distance_this_month: ["vzdalenost_tento_mesic"],
      last_month_cost: ["naklady_minuly_mesic"],
      last_month_average_consumption: ["prumerna_spotreba_minuly_mesic"],
      last_month_fill_count: ["pocet_tankovani_minuly_mesic"],
      last_month_average_price: ["prumerna_cena_minuly_mesic"],
      month_over_month_cost_delta: ["rozdil_nakladu_proti_minulemu_mesici"],
      fuel_price_trend: ["trend_ceny_paliva"],
      days_since_full_tank: ["dnu_od_plne_nadrze"],
      km_since_full_tank: ["vzdalenost_od_plne_nadrze"],
      lowest_price_per_unit: ["nejnizsi_cena_za_jednotku"],
      highest_price_per_unit: ["nejvyssi_cena_za_jednotku"],
      different_stations_count: ["pocet_ruznych_pump"],
      different_cities_count: ["pocet_ruznych_mest"],
      last_trip_date: ["datum_posledni_jizdy"],
      last_trip_distance: ["vzdalenost_posledni_jizdy"],
      last_trip_cost: ["cena_posledni_jizdy"],
      trip_count: ["pocet_jizd"],
      total_trip_distance: ["celkova_vzdalenost_jizd"],
      average_trip_cost_per_km: ["prumerna_cena_jizdy_za_vzdalenost"],
      source_file_name: ["nazev_zdrojoveho_souboru"],
      source_reference: ["zdrojovy_odkaz_nebo_cesta"],
    };
  }

  _canonicalSensorKey(suffix) {
    const value = String(suffix || "").trim();
    if (!value) {
      return "";
    }
    for (const [canonical, aliases] of Object.entries(this._vehicleSensorSuffixAliases())) {
      if (canonical === value || aliases.includes(value)) {
        return canonical;
      }
    }
    return value;
  }

  _slugToLabel(slug) {
    return String(slug || "")
      .split("_")
      .filter(Boolean)
      .map((part) => (part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
      .join(" ");
  }

  _humanizeMetric(metric) {
    return String(metric || "")
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  _composeVehicleDetailsLabel(attrs = {}) {
    const make = String(attrs?.make || "").trim();
    const model = String(attrs?.model || "").trim();
    const year = String(attrs?.year || "").trim();
    const parts = [make, model].filter(Boolean);
    if (year) {
      parts.push(year);
    }
    return parts.join(" ").trim();
  }

  _cleanVehicleLabel(label, slug = "") {
    const raw = String(label || "").trim();
    if (!raw) {
      return this._slugToLabel(slug);
    }

    const withoutExtension = raw.replace(/\.(csv|zip)$/gi, "");
    const normalizedSpacing = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    const cleaned = normalizedSpacing
      .replace(/\b(sync|backup|export)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const genericMatch = cleaned.match(/^vehicle\s+(\d+)\b/i);
    if (genericMatch) {
      return `Vehicle ${genericMatch[1]}`;
    }

    if (!cleaned) {
      return this._slugToLabel(slug);
    }

    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((part) => (part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
      .join(" ");
  }

  _fallbackVehicleLabelFromState(state, slug) {
    const explicitVehicleName = this._cleanVehicleLabel(state?.attributes?.vehicle_name || "", slug);
    if (explicitVehicleName && explicitVehicleName !== this._slugToLabel(slug)) {
      return explicitVehicleName;
    }

    const vehicleDetails = this._composeVehicleDetailsLabel(state?.attributes);
    if (vehicleDetails) {
      return vehicleDetails;
    }

    const friendly = String(state?.attributes?.friendly_name || "").trim();
    if (!friendly) {
      return this._cleanVehicleLabel("", slug);
    }

    const suffixes = [
      "Total Vehicle Cost",
      "Total Cost",
      "Last Fill Date",
      "Fuel Cost This Month",
      "Odometer",
      this._humanizeMetric(state?.entity_id?.split("_").slice(-3).join("_") || ""),
    ].filter(Boolean);

    for (const suffix of suffixes) {
      if (friendly.endsWith(suffix)) {
        const trimmed = friendly.slice(0, -suffix.length).trim();
        if (trimmed) {
          return this._cleanVehicleLabel(trimmed, slug);
        }
      }
    }

    return this._cleanVehicleLabel(friendly, slug);
  }

  _normalizedVehicleValue(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");
  }

  _vehicleStateMap() {
    const states = Object.values(this._hass?.states || {});
    const helperVehicles = this._vehicleHelperStateMap(states);
    if (helperVehicles.size) {
      return helperVehicles;
    }

    const vehicles = new Map();
    const regex = this._vehicleEntityRegex();

    for (const state of states) {
      const entityId = String(state?.entity_id || "");
      const attrVehicleKey = String(state?.attributes?.vehicle_key || "").trim();
      const regexMatch = entityId.match(regex);
      const slug = attrVehicleKey || regexMatch?.[1] || "";
      if (!slug) {
        continue;
      }

      if (!vehicles.has(slug)) {
        vehicles.set(slug, state);
        continue;
      }

      const existing = vehicles.get(slug);
      const existingHasVehicleKey = Boolean(existing?.attributes?.vehicle_key);
      const existingHasVehicleName = Boolean(existing?.attributes?.vehicle_name);
      const currentHasVehicleKey = Boolean(attrVehicleKey);
      const currentHasVehicleName = Boolean(state?.attributes?.vehicle_name);
      if (
        (!existingHasVehicleKey && currentHasVehicleKey) ||
        (existingHasVehicleKey === currentHasVehicleKey && !existingHasVehicleName && currentHasVehicleName)
      ) {
        vehicles.set(slug, state);
      }
    }

    return vehicles;
  }

  _vehicleHelperStateMap(states = Object.values(this._hass?.states || {})) {
    const vehicles = new Map();

    for (const state of states) {
      const entityId = String(state?.entity_id || "");
      const attrs = state?.attributes || {};
      const isVehicleHelper =
        attrs.fuelino_vehicle_helper === true ||
        entityId.endsWith("_vehicle_prefix");
      if (!isVehicleHelper) {
        continue;
      }

      const slug = String(attrs.vehicle_key || attrs.sensor_prefix || state?.state || "")
        .trim()
        .toLowerCase();
      if (!slug) {
        continue;
      }

      vehicles.set(slug, state);
    }

    return vehicles;
  }

  _buildStateVehicleMap() {
    const vehicles = new Map();
    for (const [slug, state] of this._vehicleStateMap()) {
      if (!vehicles.has(slug)) {
        vehicles.set(slug, {
          value: slug,
          label: this._fallbackVehicleLabelFromState(state, slug),
        });
      }
    }

    const configuredVehicle = String(this._config.vehicle || "").trim();
    const configuredMatchesDetected = [...vehicles.values()].some((vehicle) => {
      const normalizedConfigured = this._normalizedVehicleValue(configuredVehicle);
      return (
        vehicle.value === configuredVehicle ||
        this._normalizedVehicleValue(vehicle.label) === normalizedConfigured ||
        this._normalizedVehicleValue(this._slugToLabel(vehicle.value)) === normalizedConfigured
      );
    });

    if (configuredVehicle && !vehicles.size && !vehicles.has(configuredVehicle) && !configuredMatchesDetected) {
      vehicles.set(this._config.vehicle, {
        value: this._config.vehicle,
        label: this._slugToLabel(this._config.vehicle),
      });
    }

    return vehicles;
  }

  async _loadVehicleCatalog() {
    const stateVehicles = this._buildStateVehicleMap();
    const stateKey = [...stateVehicles.keys()].sort().join("|");

    if (!stateVehicles.size) {
      if (this._vehicleCatalog.length) {
        this._vehicleCatalog = [];
        this._vehicleCatalogKey = "";
        this._render();
      }
      return;
    }

    if (this._vehicleCatalogKey === stateKey && this._vehicleCatalog.length) {
      return;
    }

    let catalog = [...stateVehicles.values()];
    this._vehicleCatalogKey = stateKey;

    try {
      if (typeof this._hass?.callWS === "function") {
        const vehicleStates = this._vehicleStateMap();
        const [entityRegistry, deviceRegistry] = await Promise.all([
          this._hass.callWS({ type: "config/entity_registry/list" }),
          this._hass.callWS({ type: "config/device_registry/list" }),
        ]);

        if (this._vehicleCatalogKey !== stateKey) {
          return;
        }

        const deviceMap = new Map(deviceRegistry.map((device) => [device.id, device]));
        const mergedVehicles = new Map(stateVehicles);

        for (const entity of entityRegistry) {
          const entityId = String(entity?.entity_id || "");
          const state = this._hass?.states?.[entityId];
          const slug = String(state?.attributes?.vehicle_key || "").trim();
          if (!slug || !vehicleStates.has(slug)) {
            continue;
          }
          const device = deviceMap.get(entity.device_id);
          const isFuelinoVehicleDevice =
            String(device?.manufacturer || "").trim().toLowerCase() === "fuelio" &&
            String(device?.name || "").trim().toLowerCase() !== "fuelio";
          const stateLabel = stateVehicles.get(slug)?.label || "";
          const label =
            stateLabel ||
            (device?.name_by_user ? this._cleanVehicleLabel(device.name_by_user, slug) : "") ||
            (device?.name ? this._cleanVehicleLabel(device.name, slug) : "") ||
            this._slugToLabel(slug);

          if (isFuelinoVehicleDevice) {
            mergedVehicles.set(slug, { value: slug, label });
          }
        }

        catalog = [...mergedVehicles.values()];
      }
    } catch (_error) {
      // Fall back to labels derived from entity states when registry access is unavailable.
    }

    catalog.sort((a, b) => a.label.localeCompare(b.label));
    const nextSerialized = JSON.stringify(catalog);
    const previousSerialized = JSON.stringify(this._vehicleCatalog);
    if (nextSerialized !== previousSerialized) {
      this._vehicleCatalog = catalog;
      this._render();
    } else {
      this._vehicleCatalog = catalog;
    }
  }

  _vehicleOptions() {
    if (this._vehicleCatalog.length) {
      return this._vehicleCatalog;
    }
    return [...this._buildStateVehicleMap().values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  _renderTabContent() {
    if (this._activeTab === "visibility") {
      return `
        <div class="stack">
          ${this._toggle("Palivo", "show_fuel", "Show the fuel statistics section.")}
          ${this._toggle("Naklady", "show_costs", "Show the cost and monthly summary section.")}
          ${this._toggle("Grafy", "show_charts", "Show trend charts and graph carousel.")}
          ${this._toggle("Zaznam jizd", "show_trips", "Show TripLog highlights and recent trips.")}
          ${this._toggle("Posledni polozky", "show_recent_items", "Show the latest fuel, expense and trip activity list.")}
          ${this._toggle("Show expenses", "show_expenses", "Display service and non-fuel expense sections.")}
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

    const vehicleOptions = this._vehicleOptions();

    return `
      <div class="stack">
        ${
          vehicleOptions.length
            ? this._select("Vehicle", "vehicle", vehicleOptions)
            : `<div class="hint">No FuelinoHA vehicles were auto-detected yet.</div>`
        }
        ${this._input("Card title", "title", "My car")}
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
          Pick the detected vehicle from Home Assistant. The card will use the matching Fuelino sensors automatically.
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
        if (field.tagName === "SELECT") {
          this._setValue(key, field.value.trim());
          return;
        }
        if (field.type === "checkbox") {
          this._setValue(key, field.checked);
          return;
        }
        if (field.type === "number") {
          const parsed = Number(field.value);
          this._setValue(key, Number.isFinite(parsed) ? parsed : "");
          return;
        }
        this._setValue(key, field.value.trim(), { render: false, dispatch: false });
      };

      if (field.tagName === "SELECT" || field.type === "checkbox") {
        field.addEventListener("change", handler);
        return;
      }

      field.addEventListener("input", handler);
      field.addEventListener("change", () => this._setValue(key, field.value.trim(), { render: false }));
    });
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
          grid-template-columns: minmax(320px, 420px);
          gap: 20px;
          align-items: start;
        }

        .panel {
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
      </div>
    `;

    this._attachEvents();
  }
}

if (!customElements.get(FUELINO_CARD_EDITOR_TAG)) {
  customElements.define(FUELINO_CARD_EDITOR_TAG, FuelinoCardEditor);
}
