# FuelinoHA Card v0.3.46

Feature release focused on section visibility controls.

## What's New

- The visual editor now includes checkboxes for showing or hiding key Fuelio sections:
  - Palivo
  - Naklady
  - Zaznam jizd
  - Posledni polozky
- The card now supports matching config options:
  - `show_fuel`
  - `show_costs`
  - `show_trips`
  - `show_recent_items`
- Existing cards keep all sections visible by default.

## Upgrade Notes

After installing the update, refresh the browser cache or reload Home Assistant frontend resources if the old editor still appears.

For manual installs, update both files:

- `fuelino-card.js`
- `fuelino-card-editor.js`
