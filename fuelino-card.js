class FuelinoCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("div");
  }

  static getStubConfig() {
    return {
      type: "custom:fuelino-card",
      vehicle: "hyundai_i30",
      title: "Hyundai i30",
      layout: "garage",
    };
  }

  setConfig(config) {
    if (!config.vehicle) {
      throw new Error("Fuelino Card requires a vehicle slug, for example 'hyundai_i30'.");
    }

    this._config = {
      title: null,
      layout: "garage",
      accent_color: "#7c5cff",
      show_expenses: true,
      show_trips: true,
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
    return this._config?.layout === "compact" ? 4 : 6;
  }

  _entityId(suffix) {
    return `sensor.${this._config.vehicle}_${suffix}`;
  }

  _state(suffix) {
    return this._hass?.states[this._entityId(suffix)]?.state ?? null;
  }

  _attrs(suffix) {
    return this._hass?.states[this._entityId(suffix)]?.attributes ?? {};
  }

  _formatValue(suffix, fallback = "—") {
    const entity = this._hass?.states[this._entityId(suffix)];
    if (!entity || entity.state === "unknown" || entity.state === "unavailable") {
      return fallback;
    }
    const unit = entity.attributes?.unit_of_measurement;
    return unit ? `${entity.state} ${unit}` : entity.state;
  }

  _metric(label, value, tone = "") {
    return `
      <div class="metric ${tone}">
        <div class="metric__label">${label}</div>
        <div class="metric__value">${value ?? "—"}</div>
      </div>
    `;
  }

  _renderRecentList(title, items, formatter) {
    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    const rows = items.slice(0, 3).map((item) => `<li>${formatter(item)}</li>`).join("");
    return `
      <section class="panel panel--list">
        <div class="panel__title">${title}</div>
        <ul>${rows}</ul>
      </section>
    `;
  }

  _renderGarage() {
    const title = this._config.title || this._config.vehicle.replaceAll("_", " ");
    const recentFills = this._attrs("last_fill_date").recent_fills || [];
    const recentExpenses = this._attrs("last_fill_date").recent_expenses || [];
    const recentTrips = this._attrs("last_fill_date").recent_trips || [];

    return `
      <ha-card>
        <div class="card card--garage" style="--accent:${this._config.accent_color}">
          <section class="hero">
            <div class="hero__copy">
              <div class="eyebrow">FuelinoHA</div>
              <h2>${title}</h2>
              <p>Posledni tankovani: <strong>${this._formatValue("last_fill_date")}</strong></p>
            </div>
            <div class="hero__stats">
              ${this._metric("Cena", this._formatValue("last_fill_cost"), "is-primary")}
              ${this._metric("Cena za litr", this._formatValue("last_price_per_unit"))}
              ${this._metric("Tachometr", this._formatValue("odometer"))}
            </div>
          </section>

          <section class="grid">
            <div class="panel">
              <div class="panel__title">Palivo a naklady</div>
              <div class="metrics">
                ${this._metric("Palivo tento mesic", this._formatValue("fuel_cost_this_month"))}
                ${this._metric("Palivo minuly mesic", this._formatValue("last_month_cost"))}
                ${this._metric("Cena za km", this._formatValue("average_cost_per_km"))}
                ${this._metric("Trend ceny paliva", this._formatValue("fuel_price_trend"))}
              </div>
            </div>

            ${
              this._config.show_expenses
                ? `
              <div class="panel">
                <div class="panel__title">Servis a vydaje</div>
                <div class="metrics">
                  ${this._metric("Ostatni vydaje tento mesic", this._formatValue("expense_cost_this_month"))}
                  ${this._metric("Posledni servis", this._formatValue("last_service_date"))}
                  ${this._metric("Cena posledniho servisu", this._formatValue("last_service_cost"))}
                  ${this._metric("Top kategorie", this._formatValue("top_expense_category"))}
                </div>
              </div>
            `
                : ""
            }

            ${
              this._config.show_trips
                ? `
              <div class="panel">
                <div class="panel__title">TripLog a jizdy</div>
                <div class="metrics">
                  ${this._metric("Posledni jizda", this._formatValue("last_trip_date"))}
                  ${this._metric("Posledni vzdalenost", this._formatValue("last_trip_distance"))}
                  ${this._metric("Pocet jizd", this._formatValue("trip_count"))}
                  ${this._metric("Celkova vzdalenost", this._formatValue("total_trip_distance"))}
                </div>
              </div>
            `
                : ""
            }
          </section>

          <section class="grid grid--lists">
            ${this._renderRecentList(
              "Posledni tankovani",
              recentFills,
              (fill) =>
                `<strong>${fill.date ?? "?"}</strong> · ${fill.volume ?? "?"} L · ${fill.cost ?? "?"}`
            )}
            ${
              this._config.show_expenses
                ? this._renderRecentList(
                    "Posledni vydaje",
                    recentExpenses,
                    (expense) =>
                      `<strong>${expense.date ?? "?"}</strong> · ${expense.title ?? "Bez nazvu"} · ${expense.cost ?? "?"}`
                  )
                : ""
            }
            ${
              this._config.show_trips
                ? this._renderRecentList(
                    "Posledni jizdy",
                    recentTrips,
                    (trip) =>
                      `<strong>${trip.date ?? "?"}</strong> · ${trip.title ?? "Bez nazvu"} · ${trip.distance_km ?? "?"} km`
                  )
                : ""
            }
          </section>
        </div>
      </ha-card>
    `;
  }

  _renderCompact() {
    const title = this._config.title || this._config.vehicle.replaceAll("_", " ");

    return `
      <ha-card>
        <div class="card card--compact" style="--accent:${this._config.accent_color}">
          <div class="compact__main">
            <div>
              <div class="eyebrow">FuelinoHA</div>
              <h3>${title}</h3>
            </div>
            <div class="compact__price">${this._formatValue("last_price_per_unit")}</div>
          </div>
          <div class="compact__chips">
            <span>${this._formatValue("last_fill_date")}</span>
            <span>${this._formatValue("fuel_cost_this_month")}</span>
            <span>${this._formatValue("odometer")}</span>
            <span>${this._formatValue("last_service_date")}</span>
          </div>
        </div>
      </ha-card>
    `;
  }

  _render() {
    if (!this._hass || !this._config) {
      return;
    }

    const cardHtml =
      this._config.layout === "compact" ? this._renderCompact() : this._renderGarage();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          overflow: hidden;
          border-radius: 26px;
        }

        .card {
          color: #f6f7fb;
          background:
            radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 55%, transparent), transparent 35%),
            linear-gradient(145deg, #10172a 0%, #17223d 45%, #0f1220 100%);
          padding: 20px;
        }

        .card--garage {
          display: grid;
          gap: 18px;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 16px;
          align-items: stretch;
        }

        .hero__copy,
        .hero__stats,
        .panel {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .hero__copy {
          padding: 18px;
        }

        .hero__copy h2,
        .card--compact h3 {
          margin: 6px 0 8px;
          font-size: 1.55rem;
          line-height: 1.1;
        }

        .eyebrow {
          color: color-mix(in srgb, var(--accent) 80%, white);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero__stats {
          padding: 14px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .grid--lists {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .panel {
          padding: 16px;
        }

        .panel__title {
          font-size: 0.92rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: #ffffff;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .metric {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
        }

        .metric.is-primary {
          background: color-mix(in srgb, var(--accent) 22%, rgba(255, 255, 255, 0.05));
        }

        .metric__label {
          font-size: 0.76rem;
          opacity: 0.78;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric__value {
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .panel--list ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }

        .panel--list li {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          font-size: 0.92rem;
        }

        .card--compact {
          display: grid;
          gap: 14px;
        }

        .compact__main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .compact__price {
          font-size: 1.2rem;
          font-weight: 800;
          color: color-mix(in srgb, var(--accent) 75%, white);
        }

        .compact__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .compact__chips span {
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.08);
          font-size: 0.84rem;
        }

        @media (max-width: 900px) {
          .hero,
          .grid,
          .grid--lists {
            grid-template-columns: 1fr;
          }

          .hero__stats,
          .metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 480px) {
          .hero__stats,
          .metrics {
            grid-template-columns: 1fr;
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
  name: "Fuelino Card",
  description: "Vehicle dashboard card for FuelinoHA / Fuelino entities.",
});
