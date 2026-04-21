# Changelog

## v0.3.11

Follow-up release for `FuelinoHA Card`.

### Highlights

- added the custom Lovelace card without a build step
- added the visual editor for Home Assistant card configuration
- added `costs`, `garage`, and `compact` layouts
- added a new `fuelio` stats layout inspired by the Fuelio mobile overview screens
- retuned the new `fuelio` layout colors to match the original default FuelinoHA card palette
- improved the `costs` layout in narrow cards and the visual editor preview so large numbers and summary panels no longer crowd each other
- switched the default card layout to the cleaner stacked `garage` view
- added swipeable/clickable trend cards in the `fuelio` layout with dot navigation
- added multiple trend views for fuel price, fuel consumption, monthly fuel cost, and monthly distance
- unified the `fuelio` stats layout colors with the blue-toned card theme instead of the previous olive/brown palette
- improved responsiveness for narrow dashboard columns so the card behaves better in dense multi-column views
- inlined the card editor into `fuelino-card.js` so the visual editor works reliably when installed through HACS
- stopped throwing a hard config error when Home Assistant briefly initializes the card without a `vehicle` value
- replaced that crash state with a friendly placeholder message inside the card
- switched README badges to stable tag and repository endpoints that render correctly on GitHub and in HACS
- updated manual installation docs to match the single-file card setup
- expanded the `fuelio` layout with a denser fueling dashboard focused on consumption, fill volume, cadence, station habits, and latest fill summary
- added more trend cards for fill volume and fill cost while keeping the existing graphs
- added in-card graph period switching for `30d`, `90d`, `180d`, `365d`, and `all`
- added config/editor support for the default trend period
- added consumption fallbacks from shared attributes and recent fill history when dedicated sensors are missing

### Notes

- designed as a frontend companion for the `FuelinoHA` integration
- optimized for Home Assistant dashboards using Fuelino vehicle entities
