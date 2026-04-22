# Changelog

## v0.3.29

Follow-up release for `FuelinoHA Card`.

### Highlights

- added an in-card vehicle switcher when multiple Fuelino vehicles are detected
- you can now switch between detected cars directly from the card header
- the card still auto-selects the configured or first detected vehicle by default

## v0.3.28

Follow-up release for `FuelinoHA Card`.

### Highlights

- removed the `30d`, `90d`, `180d`, `1 rok`, and `Vse` period buttons from the `Cena paliva` trend card
- kept the period selector available for the other trend charts

## v0.3.27

Follow-up release for `FuelinoHA Card`.

### Highlights

- added visible value labels directly into the trend charts
- bar charts now show each value above its column
- line charts now show each value near its data point

## v0.3.26

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed text input focus in the visual editor so typing into fields like `Card title` no longer drops focus after each character
- updated the live preview to refresh without re-rendering the full editor form on every keystroke
- kept normal re-render behavior for toggles, selects, and committed field changes

## v0.3.25

Follow-up release for `FuelinoHA Card`.

### Highlights

- automatically uses the first detected Fuelino vehicle when the card config does not specify `vehicle`
- removed the need to manually select a vehicle just to get the card to render
- kept manual vehicle selection available when you want to target a specific car

## v0.3.24

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed the visual editor loading in HACS installs after the previous release
- embedded the card editor back into `fuelino-card.js` so card configuration no longer depends on loading a second JS module
- kept the simpler vehicle selection flow without the manual `Vehicle slug` field

## v0.3.23

Follow-up release for `FuelinoHA Card`.

### Highlights

- removed the manual `Vehicle slug` input from the visual editor
- switched card setup to use the detected Home Assistant vehicle name instead
- added automatic mapping from the selected vehicle name to the internal Fuelino sensor slug
- kept backward compatibility for existing card configs that still use the legacy slug value
- updated the empty-state messaging and README to reflect the simpler setup flow

## v0.3.22

Follow-up release for `FuelinoHA Card`.

### Highlights

- removed the duplicated embedded editor from `fuelino-card.js`
- made `fuelino-card-editor.js` the single source of truth for the visual editor
- switched the card to dynamically import the standalone editor file
- upgraded detected vehicle labels to use Home Assistant device names when available
- updated manual installation docs to include both `fuelino-card.js` and `fuelino-card-editor.js`

## v0.3.17

Follow-up release for `FuelinoHA Card`.

### Highlights

- expanded the `Naklady` section in the `fuelio` layout from 2 months to the latest 4 months
- switched the monthly cost area to a compact responsive grid for easier month-to-month comparison
- each month card now shows fuel cost, fill count, and driven distance from `monthly_summary`

## v0.3.16

Follow-up release for `FuelinoHA Card`.

### Highlights

- added per-column labels under the bar charts so each bar shows its own date or month directly below the graph
- used compact date labels for fill-based charts and compact month labels for monthly summary charts
- kept the existing trend carousel and chart styling while making bar graphs easier to read at a glance

## v0.3.15

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed the visual editor live preview so the preview card is clipped to a single frame instead of spilling into a duplicated-looking overlay
- constrained the embedded preview card to the editor column width
- added an explicit preview frame wrapper to keep editor rendering stable in Home Assistant's modal layout

## v0.3.14

Follow-up release for `FuelinoHA Card`.

### Highlights

- aligned the `costs` layout header with the same shared header structure used by `fuelio`
- replaced the old compact card header with the same shared app header and vehicle block used by the main layouts
- switched the `costs` section headings to the same chip-style section markers used in `fuelio`
- tightened the visual system further so the remaining layouts share the same structural style instead of only a similar color palette

## v0.3.13

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed the bar colors for the later trend slides so volume, fill cost, monthly fuel cost, and monthly distance now render with intentional bar palettes
- improved the active bar highlight styling in trend charts
- pushed the `costs`, `fuelio`, and `compact` layouts closer into one shared visual system by aligning chips, controls, panel surfaces, and accent treatment

## v0.3.12

Follow-up release for `FuelinoHA Card`.

### Highlights

- removed the `garage` layout from the public card configuration and editor
- switched the default layout to `fuelio`
- unified the `costs`, `fuelio`, and `compact` layouts around the same blue Garage-inspired color system
- updated examples and documentation to use the remaining layout set

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
