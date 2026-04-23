# FuelinoHA Card v0.3.45

Hotfix release focused on simplifying the visual editor.

## What's Fixed

- The duplicate live preview panel has been removed from the visual editor.
- Home Assistant already shows the real dashboard card behind the editor dialog, so the editor now avoids rendering a second copy of the same card.
- Card settings still save through the normal Lovelace editor flow.

## Upgrade Notes

After installing the update, refresh the browser cache or reload Home Assistant frontend resources if the old editor still appears.

For manual installs, update both files:

- `fuelino-card.js`
- `fuelino-card-editor.js`
