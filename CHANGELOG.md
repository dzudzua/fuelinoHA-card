# Changelog

## v0.3.50

Hotfix release for `FuelinoHA Card`.

### Highlights

- adds clear labels to compact layout values
- replaces unlabeled compact chips with small labeled metric blocks
- keeps the compact layout dense while making each number understandable at a glance

## v0.3.49

Hotfix release for `FuelinoHA Card`.

### Highlights

- removes the confusing `Card title` field from the visual editor
- keeps existing YAML `title` values working as a legacy fallback
- updates the README example and options list to focus on vehicle-based titles

## v0.3.48

Hotfix release for `FuelinoHA Card`.

### Highlights

- hides the in-card vehicle switcher when the card has a specific vehicle selected in configuration
- prevents the header from showing the selected car while the small switcher chip shows the other car
- keeps automatic multi-car switching available only for cards without a fixed vehicle value

## v0.3.47

Feature release for `FuelinoHA Card`.

### Highlights

- adds a visual editor checkbox for showing or hiding the Fuelio trend charts
- adds the matching `show_charts` config option
- keeps charts visible by default for existing cards
- documents the new chart visibility option in the README

## v0.3.46

Feature release for `FuelinoHA Card`.

### Highlights

- adds visual editor checkboxes for showing or hiding the Fuelio sections: Palivo, Naklady, Zaznam jizd, and Posledni polozky
- adds matching card config options: `show_fuel`, `show_costs`, `show_trips`, and `show_recent_items`
- keeps all sections visible by default for existing cards
- documents the new visibility options in the README

## v0.3.45

Hotfix release for `FuelinoHA Card`.

### Highlights

- removes the visual editor live preview panel to avoid duplicate card views while editing in Home Assistant
- keeps editor changes saved through Home Assistant's standard Lovelace config flow
- leaves the real dashboard card as the single visible preview during card editing

## v0.3.44

Hotfix release for `FuelinoHA Card`.

### Highlights

- fixes the visual editor vehicle dropdown so selected cars are saved to Lovelace config, not only shown in live preview
- syncs the standalone editor with the embedded editor detection logic for multi-car FuelinoHA setups
- constrains the editor live preview frame so tall card previews scroll inside the editor instead of overlapping the dialog

## v0.3.43

Hotfix release for `FuelinoHA Card`.

### Highlights

- added Czech localized entity-id suffix aliases such as `celkove_naklady`
- lets the card resolve sensors like `sensor.rychly_cerveny_celkove_naklady` as `total_cost`
- keeps `sensor_key` attributes as the preferred lookup path when FuelinoHA is fully updated

## v0.3.42

Hotfix release for `FuelinoHA Card`.

### Highlights

- resolves FuelinoHA entities by explicit `sensor_key` attributes when available
- fixes vehicle data loading when Home Assistant uses localized or customized entity IDs
- keeps the `vehicle_prefix` helper as the primary vehicle picker source

## v0.3.41

Follow-up release for `FuelinoHA Card`.

### Highlights

- uses the new FuelinoHA `vehicle_prefix` helper sensors as the primary source for the vehicle picker
- stops guessing vehicle options from unrelated Home Assistant devices when helper sensors are available
- keeps legacy sensor scanning as a fallback for older FuelinoHA versions

## v0.3.40

Hotfix release for `FuelinoHA Card`.

### Highlights

- ignores stale or invalid saved `vehicle` values such as `poco_car` instead of trying to render them
- broadens vehicle detection to the full FuelinoHA sensor set, not only a small group of summary sensors
- resolves sensor entities by `vehicle_key` attributes when available, so renamed or non-standard entity IDs still work

## v0.3.39

Follow-up release for `FuelinoHA Card`.

### Highlights

- rebuilt vehicle detection to primarily use FuelinoHA `vehicle_key` sensor attributes instead of depending on specific entity-id suffixes
- improves multi-car picker reliability when one vehicle has a slightly different set of available sensors
- prefers sensor states with explicit `vehicle_name` values so picker labels stay aligned with FuelinoHA vehicle devices
- keeps legacy entity-id pattern matching only as a fallback for older FuelinoHA versions

## v0.3.38

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed the vehicle picker so partially registered multi-car setups still show every detected car
- Home Assistant registry data now only improves labels and no longer hides valid vehicles from sensor data
- keeps unrelated devices filtered out without dropping a real secondary car

## v0.3.37

Follow-up release for `FuelinoHA Card`.

### Highlights

- updated vehicle detection to group cars by FuelinoHA `vehicle_key` sensor attributes
- improves multi-car detection when Home Assistant registry metadata is incomplete
- restores missing secondary vehicles in the card editor picker

## v0.3.36

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed the vehicle picker to prefer real Fuelino vehicle devices from Home Assistant registry
- prevents unrelated devices such as phones from appearing as selectable vehicles
- keeps state-based detection only as a fallback when registry vehicle devices are unavailable

## v0.3.35

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed the editor crash caused by a missing `_normalizedVehicleValue` helper
- restores card configuration after the stale vehicle label cleanup from the previous release

## v0.3.34

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed stale saved vehicle values showing up as extra options in the editor
- prevents old labels such as `Poco` from being injected into the vehicle dropdown when real cars are already detected
- keeps compatibility with manual values only when no detected vehicles are available

## v0.3.33

Follow-up release for `FuelinoHA Card`.

### Highlights

- updated vehicle selection to use the new `vehicle_name` diagnostics attribute from FuelinoHA
- improved both the card switcher and editor picker for multi-car setups
- reduced reliance on guessed labels from friendly names and device names

## v0.3.32

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed vehicle selection labels in the editor for multi-car setups
- the editor now prefers Fuelino vehicle names from sensor data instead of unrelated Home Assistant device names
- prevents phone names such as `Poco` from replacing the actual car label

## v0.3.31

Follow-up release for `FuelinoHA Card`.

### Highlights

- fixed `Card title` text entry in the visual editor again
- text fields now update the live preview while typing without firing a full config change on every keystroke
- the final config is committed when the field change is confirmed

## v0.3.30

Follow-up release for `FuelinoHA Card`.

### Highlights

- improved detected vehicle labels for multi-car setups
- the card now prefers parsed vehicle details like make, model, and year when available
- file-based labels such as `vehicle-2-sync.csv.zip` are now cleaned into a simpler vehicle name

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
