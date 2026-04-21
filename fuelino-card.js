class FuelinoCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("div");
  }

  static getStubConfig() {
    return {
      type: "custom:fuelino-card",
      vehicle: "hyundai_i30",
      title: "Hyundai i30",
      layout: "costs",
    };
  }

  setConfig(config) {
    if (!config.vehicle) {
      throw new Error("FuelinoHA Card requires a vehicle slug, for example 'hyundai_i30'.");
    }

    this._config = {
      title: null,
      layout: "costs",
      accent_color: "#88d24f",
      show_expenses: true,
      show_trips: true,
      show_empty_categories: false,
      ...config,
    };

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return this._config?.layout === "compact" ? 4 : 8;
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
    return (
      this._hass?.locale?.language ||
      this._hass?.language ||
      navigator.language ||
      "cs-CZ"
    );
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
        (unit && (unit.includes("Kc") || unit.includes("CZK") || unit.includes("/") ? 2 : 1));
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
    const decimals = Math.abs(numeric) >= 1000 ? 2 : 2;
    const formatted = this._formatNumber(numeric, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
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
      {
        title: "Sluzba",
        aliases: ["sluzba", "service", "maintenance", "udrzba"],
        icon: "mdi:wrench",
      },
      {
        title: "Udrzba",
        aliases: ["udrzba", "maintenance"],
        icon: "mdi:car-wrench",
      },
      {
        title: "Registrace",
        aliases: ["registrace", "registration"],
        icon: "mdi:card-account-details",
      },
      {
        title: "Parkovani",
        aliases: ["parkovani", "parking"],
        icon: "mdi:parking",
      },
      {
        title: "Myti",
        aliases: ["myti", "wash", "nanowax"],
        icon: "mdi:car-wash",
      },
      {
        title: "Mytne",
        aliases: ["mytne", "toll"],
        icon: "mdi:road-toll",
      },
      {
        title: "Pojisteni",
        aliases: ["pojisteni", "insurance"],
        icon: "mdi:shield-car",
      },
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
              ${this._miniStat("Podil", `${this._formatNumber(share, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              })} %`, "mdi:chart-donut")}
              ${this._miniStat("Zaznamy", this._formatNumber(count), "mdi:counter")}
              ${this._miniStat("Posledni vydaj", this._formatCurrencyValue(latestCost), "mdi:cash")}
              ${this._miniStat("Datum", latestDate, "mdi:calendar")}
            </div>
          </section>
        `;
      })
      .filter(Boolean)
      .join("");

    return cards || `<section class="empty-note">Kategorie vydaju zatim nejsou k dispozici.</section>`;
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
            <div class="hero-stat-card__label">Prumerne naklady na kilometr</div>
            <div class="hero-stat-card__main">${averageTotalPerKm}</div>
            <div class="hero-stat-card__sub">${fuelPerKm}</div>
            <div class="hero-stat-card__hint">Aktualni prumer</div>
          </div>
          <div class="hero-stat-card">
            <div class="hero-stat-card__label">Pocet zaznamu</div>
            <div class="hero-stat-card__main">${expenseCount}</div>
            <div class="hero-stat-card__sub">${fillCount}</div>
            <div class="hero-stat-card__hint">Vydaje / tankovani</div>
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
          <header class="topbar">
            <div class="topbar__left">
              <div class="topbar__menu"><ha-icon icon="mdi:menu"></ha-icon></div>
              <div>
                <div class="topbar__eyebrow">FuelinoHA</div>
                <h2>Statistika nakladu</h2>
              </div>
            </div>
            <div class="topbar__controls">
              <div class="vehicle-chip">${this._vehicleLabel()} <ha-icon icon="mdi:chevron-down"></ha-icon></div>
              <div class="topbar__action"><ha-icon icon="mdi:clipboard-text-outline"></ha-icon></div>
            </div>
          </header>

          ${this._topPanel()}

          <section class="summary-grid">
            ${this._summaryBlock("Naklady (s palivem)", totalVehicle, [
              { label: "Palivo tento mesic", value: this._formatState("fuel_cost_this_month"), icon: "mdi:gas-station-outline" },
              { label: "Vydaje tento mesic", value: this._formatState("expense_cost_this_month"), icon: "mdi:wallet-outline" },
              { label: "Posledni vydaj", value: lastExpenseDate, icon: "mdi:calendar-star" },
              { label: "Posledni tankovani", value: lastFillDate, icon: "mdi:calendar-check" },
            ])}

            ${this._summaryBlock("Naklady (bez paliva)", totalExpenses, [
              { label: "Tento mesic", value: this._formatState("expense_cost_this_month"), icon: "mdi:calendar-month" },
              { label: "Posledni servis", value: lastServiceDate, icon: "mdi:wrench-clock" },
              { label: "Top kategorie", value: topCategory, icon: "mdi:shape-outline" },
              { label: "Pocet vydaju", value: this._formatState("expense_count"), icon: "mdi:counter" },
            ])}

            ${this._summaryBlock("Palivo", totalFuel, [
              { label: "Tento mesic", value: this._formatState("fuel_cost_this_month"), icon: "mdi:calendar-month" },
              { label: "Cena za litr", value: this._formatState("last_price_per_unit"), icon: "mdi:cash-100" },
              { label: "Prumer", value: this._formatState("average_price"), icon: "mdi:finance" },
              { label: "Tankovani", value: this._formatState("fill_count"), icon: "mdi:counter" },
            ], "fuel")}
          </section>

          <section class="section-head">
            <div>
              <div class="section-head__eyebrow">Kategorie</div>
              <h3>Statistika nakladu</h3>
            </div>
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
              <p>Posledni tankovani: <strong>${this._formatState("last_fill_date")}</strong></p>
            </div>
            <div class="garage-hero__stats">
              ${this._miniMetric("Cena", this._formatState("last_fill_cost"), "is-primary")}
              ${this._miniMetric("Cena za litr", this._formatState("last_price_per_unit"))}
              ${this._miniMetric("Tachometr", this._formatState("odometer"))}
            </div>
          </section>

          <section class="garage-grid">
            <div class="garage-panel">
              <div class="garage-panel__title">Palivo a naklady</div>
              <div class="garage-metrics">
                ${this._miniMetric("Palivo tento mesic", this._formatState("fuel_cost_this_month"))}
                ${this._miniMetric("Palivo minuly mesic", this._formatState("last_month_cost"))}
                ${this._miniMetric("Cena za km", this._formatState("average_cost_per_km"))}
                ${this._miniMetric("Trend ceny", this._formatState("fuel_price_trend"))}
              </div>
            </div>

            ${
              this._config.show_expenses
                ? `
              <div class="garage-panel">
                <div class="garage-panel__title">Servis a vydaje</div>
                <div class="garage-metrics">
                  ${this._miniMetric("Tento mesic", this._formatState("expense_cost_this_month"))}
                  ${this._miniMetric("Posledni servis", this._formatState("last_service_date"))}
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
                <div class="garage-panel__title">TripLog a jizdy</div>
                <div class="garage-metrics">
                  ${this._miniMetric("Posledni jizda", this._formatState("last_trip_date"))}
                  ${this._miniMetric("Posledni vzdalenost", this._formatState("last_trip_distance"))}
                  ${this._miniMetric("Pocet jizd", this._formatState("trip_count"))}
                  ${this._miniMetric("Celkova vzdalenost", this._formatState("total_trip_distance"))}
                </div>
              </div>
            `
                : ""
            }
          </section>

          <section class="garage-list-grid">
            ${this._renderRecentList("Posledni tankovani", recentFills, (fill) =>
              `<strong>${fill.date ?? "?"}</strong> · ${fill.volume ?? "?"} L · ${fill.cost ?? "?"}`
            )}
            ${
              this._config.show_expenses
                ? this._renderRecentList("Posledni vydaje", recentExpenses, (expense) =>
                    `<strong>${expense.date ?? "?"}</strong> · ${expense.title ?? "Bez nazvu"} · ${expense.cost ?? "?"}`
                  )
                : ""
            }
            ${
              this._config.show_trips
                ? this._renderRecentList("Posledni jizdy", recentTrips, (trip) =>
                    `<strong>${trip.date ?? "?"}</strong> · ${trip.title ?? "Bez nazvu"} · ${trip.distance_km ?? "?"} km`
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
        <div class="compact-shell" style="--accent:${this._config.accent_color}">
          <div class="compact-shell__main">
            <div>
              <div class="topbar__eyebrow">FuelinoHA</div>
              <h3>${title}</h3>
            </div>
            <div class="compact-shell__price">${this._formatState("last_price_per_unit")}</div>
          </div>
          <div class="compact-shell__chips">
            <span>${this._formatState("last_fill_date")}</span>
            <span>${this._formatState("fuel_cost_this_month")}</span>
            <span>${this._formatState("odometer")}</span>
            <span>${this._formatState("last_service_date")}</span>
          </div>
        </div>
      </ha-card>
    `;
  }

  _render() {
    if (!this._hass || !this._config) {
      return;
    }

    let cardHtml = this._renderCosts();
    if (this._config.layout === "garage") {
      cardHtml = this._renderGarage();
    } else if (this._config.layout === "compact") {
      cardHtml = this._renderCompact();
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --card-olive: #3a3413;
          --card-olive-deep: #262004;
          --card-olive-panel: #4a431a;
          --card-olive-soft: #585126;
          --card-text: #f4f5ef;
          --card-muted: rgba(244, 245, 239, 0.74);
          --card-divider: rgba(255, 255, 255, 0.14);
          --card-green: #85d854;
          --card-red: #ea4738;
        }

        ha-card {
          overflow: hidden;
          border-radius: 28px;
          box-shadow: none;
        }

        ha-icon {
          width: 20px;
          height: 20px;
          color: inherit;
        }

        .shell {
          background: linear-gradient(180deg, var(--card-olive) 0%, var(--card-olive-deep) 100%);
          color: var(--card-text);
          padding: 18px;
          display: grid;
          gap: 18px;
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
          background: rgba(255, 255, 255, 0.06);
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
        .garage-hero__copy h2,
        .compact-shell h3 {
          margin: 4px 0 0;
          font-size: 2rem;
          line-height: 1.04;
          font-weight: 600;
        }

        .vehicle-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 12px 18px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          background: rgba(255, 255, 255, 0.05);
          font-size: 1rem;
        }

        .hero-panel,
        .summary-card,
        .cost-card,
        .hero-stat-card,
        .garage-panel,
        .garage-hero__copy,
        .garage-hero__stats,
        .compact-shell {
          background: var(--card-olive-panel);
          border-radius: 28px;
        }

        .hero-panel {
          padding: 24px;
          display: grid;
          gap: 18px;
        }

        .hero-illustration {
          position: relative;
          min-height: 200px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.03);
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
          background: linear-gradient(180deg, #6a7df1, #4f5cd4);
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
          gap: 18px;
        }

        .summary-card,
        .cost-card {
          padding: 22px;
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
          background: rgba(255, 255, 255, 0.06);
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

        .compact-shell {
          color: #f6f7fb;
          background:
            radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 55%, transparent), transparent 35%),
            linear-gradient(145deg, #10172a 0%, #17223d 45%, #0f1220 100%);
          padding: 18px;
          display: grid;
          gap: 14px;
        }

        .compact-shell__main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .compact-shell__price {
          font-size: 1.2rem;
          font-weight: 800;
          color: color-mix(in srgb, var(--accent) 75%, white);
        }

        .compact-shell__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .compact-shell__chips span {
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.08);
          font-size: 0.84rem;
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
  }
}

customElements.define("fuelino-card", FuelinoCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "fuelino-card",
  name: "FuelinoHA Card",
  description: "Vehicle dashboard card for FuelinoHA / Fuelino entities.",
});
