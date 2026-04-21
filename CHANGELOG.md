# Changelog

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
