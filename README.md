# Fuelino Card

Custom Lovelace card for Home Assistant built on top of the `FuelinoHA` / `Fuelino` integration.

This project is intended as a separate frontend companion project for vehicle dashboards.

## Status

MVP scaffold.

Current features:

- custom card without build step
- two layouts:
  - `garage`
  - `compact`
- reads Fuelino sensor entities from one vehicle slug, for example `hyundai_i30`
- shows:
  - last fill
  - price per unit
  - odometer
  - monthly fuel cost
  - monthly non-fuel cost
  - service/trip highlights

## Installation

### HACS

1. Open HACS in Home Assistant
2. Add this repository as a custom repository
3. Choose type `Dashboard`
4. Install `Fuelino Card`
5. Add the card resource if HACS does not do it automatically

### Manual

1. Copy `fuelino-card.js` to your Home Assistant `www` folder
2. Add it as a Lovelace resource
3. Use the card in a dashboard

Example resource:

```yaml
url: /local/fuelino-card/fuelino-card.js
type: module
```

## Card configuration

```yaml
type: custom:fuelino-card
vehicle: hyundai_i30
title: Hyundai i30
layout: garage
```

Supported options:

- `vehicle`: vehicle slug used in entity ids, for example `hyundai_i30`
- `title`: optional title override
- `layout`: `garage` or `compact`
- `accent_color`: optional CSS color for the main accent
- `show_expenses`: `true` / `false`
- `show_trips`: `true` / `false`

## Example entity mapping

If `vehicle: hyundai_i30`, the card will read entities like:

- `sensor.hyundai_i30_last_fill_date`
- `sensor.hyundai_i30_last_fill_cost`
- `sensor.hyundai_i30_last_price_per_unit`
- `sensor.hyundai_i30_odometer`
- `sensor.hyundai_i30_fuel_cost_this_month`
- `sensor.hyundai_i30_expense_cost_this_month`
- `sensor.hyundai_i30_last_service_date`
- `sensor.hyundai_i30_last_trip_date`

## Example cards

See:

- `examples/garage.yaml`
- `examples/compact.yaml`

## Notes

- this project is scaffolded inside the current workspace, but intended to become its own GitHub repository
- it is designed specifically around the sensor model exposed by `FuelinoHA`
