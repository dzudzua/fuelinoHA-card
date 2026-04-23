# FuelinoHA Card v0.3.53

Hotfix release focused on the monthly cost cards.

## Fixed

- Monthly cost cards in the `Naklady` section now keep their values readable after the visual unification pass.
- Each month remains a unified panel, but its metrics stack vertically instead of squeezing into narrow columns.
- Currency values no longer break into letter-by-letter columns.

## Upgrade Notes

After installing the update, refresh the browser cache or reload Home Assistant frontend resources if the old editor still appears.

For manual installs, update both files:

- `fuelino-card.js`
- `fuelino-card-editor.js`
