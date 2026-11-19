# Release Notes v1.2.1

Patch release addressing all seven findings in the [Companion team's 1.2.0 review](https://github.com/digitaldrummerj/companion-module-review/blob/main/reviews/wearefalcon-falconplay/review-wearefalcon-falconplay-v1.2.0-20261116-035231.md).

## Corrections

- **C1 — Repository layout:** removed the obsolete root-level `actions.js`, `feedbacks.js`, `main.js`, and `variables.js`. The active module remains in `src/` with the same entrypoint.
- **H1 — Built-in Help:** documents all fixed variables and every Subitem/Favorite position field, including image values and the 1–99 Favorite range.
- **M1 — Thumbnail cache:** retains every active URL across Favorites and Subitems and prunes unused URLs. More than 64 images no longer evict each other or bypass the 15-second revalidation interval. Late downloads cannot restore pruned images.
- **L1 — Polling traffic:** publishes only changed variable values and checks only feedback types whose inputs changed. Presets rebuild when the configured Subitem slot count changes, while names continue to update in action/feedback dropdowns. Unchanged library lists no longer rebuild definitions.
- **L2 — Image formats:** only JPEG and PNG bodies are accepted. Unsupported formats such as WebP are not read or published, clear an existing image override, and generate a debug message once per active URL/unsupported format.
- **L3 — Error reporting:** distinguishes failed status requests from processing errors. Processing errors are logged and shown as Unknown Error with their message.
- **N1 — Favorite Text options:** Thumbnail layout is visible only when Show Thumbnail is enabled.

## Compatibility

Existing actions, feedback IDs, variables, Favorite positions, and numeric/logical input selections remain compatible. Node.js 22 and the existing REST routes are unchanged. No Falcon Play server restart or server-side change is required for these module fixes.

## Validation

Regression tests cover more than 99 combined thumbnails, conditional revalidation, pruning and late requests, shared thumbnail URLs, unchanged polling and disconnects, selective feedback updates, error classification, Help-variable coverage, and Favorite Text visibility. These are automated module checks with mocked server responses, not a physical Stream Deck or broadcast playout test.

## Version

- `package.json`: `1.2.1`
- `companion/manifest.json`: `1.2.1`
- Git tag: `v1.2.1`
