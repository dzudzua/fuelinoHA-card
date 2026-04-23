# FuelinoHA Card v0.3.44

Hotfix release focused on the visual editor and multi-car setups.

## What's Fixed

- The vehicle dropdown in the visual editor now saves the selected car to the Lovelace card configuration instead of updating only the live preview.
- The standalone `fuelino-card-editor.js` is now in sync with the embedded editor logic from `fuelino-card.js`.
- Multi-car detection in the editor now uses the same FuelinoHA helper and sensor metadata paths as the card itself, including `vehicle_prefix`, `vehicle_key`, `sensor_key`, and localized entity-id aliases.
- The live preview in the editor is constrained to a scrollable frame, so tall previews no longer overlap the editor dialog.

## Upgrade Notes

After installing the update, refresh the browser cache or reload Home Assistant frontend resources if the old editor still appears.

For manual installs, update both files:

- `fuelino-card.js`
- `fuelino-card-editor.js`
