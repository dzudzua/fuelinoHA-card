# FuelinoHA Card

[![Release](https://img.shields.io/github/v/tag/dzudzua/fuelinoHA-card?sort=semver)](https://github.com/dzudzua/fuelinoHA-card/tags)
[![Stargazers](https://img.shields.io/github/stars/dzudzua/fuelinoHA-card?style=flat)](https://github.com/dzudzua/fuelinoHA-card/stargazers)
[![HACS](https://img.shields.io/badge/HACS-Dashboard-41BDF5.svg)](https://hacs.xyz/)
[![GitHub last commit](https://img.shields.io/github/last-commit/dzudzua/fuelinoHA-card)](https://github.com/dzudzua/fuelinoHA-card/commits/main)
[![Contributors](https://img.shields.io/github/contributors/dzudzua/fuelinoHA-card)](https://github.com/dzudzua/fuelinoHA-card/graphs/contributors)
[![Forks](https://img.shields.io/github/forks/dzudzua/fuelinoHA-card)](https://github.com/dzudzua/fuelinoHA-card/network/members)
[![Issues](https://img.shields.io/github/issues/dzudzua/fuelinoHA-card)](https://github.com/dzudzua/fuelinoHA-card/issues)
[![Code size](https://img.shields.io/github/repo-size/dzudzua/fuelinoHA-card)](https://github.com/dzudzua/fuelinoHA-card)
[![MIT License](https://img.shields.io/github/license/dzudzua/fuelinoHA-card)](https://github.com/dzudzua/fuelinoHA-card/blob/main/LICENSE)

Custom Lovelace card for Home Assistant built on top of the `FuelinoHA` / `Fuelino` integration.

This project is intended as a separate frontend companion project for vehicle dashboards.

## Status

MVP scaffold.

Current features:

- custom card without build step
- built-in visual editor for Home Assistant card configuration
- three layouts:
  - `costs`
  - `fuelio`
  - `garage`
  - `compact`
- interactive fuel trend carousel with swipe and click navigation
- configurable graph period for the `fuelio` layout
- reads Fuelino sensor entities from one vehicle slug, for example `hyundai_i30`
- shows:
  - last fill
  - price per unit
  - odometer
  - monthly fuel cost
  - monthly non-fuel cost
  - service/trip highlights
  - expanded fuel insights such as consumption fallback, average fill volume, fill cadence, station habits, and recent fueling summary

## Installation

### HACS

1. Open HACS in Home Assistant
2. Add this repository as a custom repository
3. Choose type `Dashboard`
4. Install `FuelinoHA Card`
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
trend_period: 180d
```

Supported options:

- `vehicle`: vehicle slug used in entity ids, for example `hyundai_i30`
- `title`: optional title override
- `layout`: `garage`, `costs`, `fuelio`, or `compact`
- `trend_period`: `30d`, `90d`, `180d`, `365d`, or `all`
- `accent_color`: optional CSS color for the main accent
- `show_expenses`: `true` / `false`
- `show_trips`: `true` / `false`
- `show_empty_categories`: show expense category cards even when total is `0`
- `show_header`: show or hide the app-like header in the `costs` layout
- `dense_mode`: tighter spacing for smaller dashboards
- `card_background`: optional custom CSS background
- `border_radius`: optional card radius override

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

- `examples/costs.yaml`
- `examples/garage.yaml`
- `examples/compact.yaml`

## Notes

- this project is scaffolded inside the current workspace, but intended to become its own GitHub repository
- it is designed specifically around the sensor model exposed by `FuelinoHA`
- the new `costs` layout is inspired by the mobile Fuelio/Fuelino statistics screens and is intended as the primary layout
- the visual editor currently focuses on `Base`, `Visibility`, and `Style` tabs with live preview

## Support

If Fuelino helps you, you can support development here:

<a href="https://www.buymeacoffee.com/dzudzua" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me a Coffee" style="height: 60px !important;width: 217px !important;"></a>
