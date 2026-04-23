# FuelinoHA Card v0.3.49

Hotfix release focused on simplifying the visual editor.

## Fixed

- The `Card title` field has been removed from the visual editor because the card already uses the selected vehicle name.
- Existing YAML configs that still define `title` continue to work as a legacy fallback.
- The README example and option list now match the simplified editor.

## Upgrade Notes

After installing the update, refresh the browser cache or reload Home Assistant frontend resources if the old editor still appears.

For manual installs, update both files:

- `fuelino-card.js`
- `fuelino-card-editor.js`
