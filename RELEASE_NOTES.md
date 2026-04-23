# FuelinoHA Card v0.3.48

Hotfix release focused on fixed-vehicle cards.

## Fixed

- The in-card vehicle switcher is now hidden when the card has a specific vehicle selected in configuration.
- This prevents the card header from showing one car while the small switcher chip below it shows the other car.
- Cards without a fixed vehicle value can still use automatic multi-car switching.

## Upgrade Notes

After installing the update, refresh the browser cache or reload Home Assistant frontend resources if the old editor still appears.

For manual installs, update both files:

- `fuelino-card.js`
- `fuelino-card-editor.js`
