# Release Notes v1.2.0

Version 1.2.0 extends the 1.1.0 module with dynamic Subitems, Favorites, richer button content, and more state reporting.

## New features

- **Subitem Buttons:** play the current item in a configured Director Subitem position, with names, thumbnails, graphic values, and available/playing/cued/played feedbacks. Selection follows Director highlighting and the new on-air item after Take Next.
- **Favorites:** trigger positions 1–99 in Falcon Play's shared, persistent Favorites list. Falcon Play has no fixed list limit; Companion exposes the first 99 positions. Reorder favorites in Director to change the numbered positions.
- **Dynamic text:** Item Text supports on-air, cued, selected, Subitem, and Favorite sources. Favorite Text offers a dedicated Favorite selector.
- **All text combinations:** combine Item Name, First Graphic Variable, and Second Graphic Variable, including either variable alone, automatic item-name fallbacks, and No Text. Empty parts do not add blank lines.
- **Button images:** JPEG/PNG thumbnails render directly on Companion 4 buttons, above or behind text. Images are cached and revalidated every 15 seconds, even when the image URL is unchanged.
- **Presets:** one ready-to-place preset per configured Subitem Button, plus 99 Favorite presets with play actions, text, thumbnails, and state feedbacks.
- **Variables:** rundown IDs, selected item/story, file-server details, first/second graphic values, display text, and per-position image/state variables. Favorite count and revision are also exposed.
- **Logical input names:** Program/Preview actions and Input On Air feedback distinguish SuperSource/DVE layouts that share a physical mixer input. Existing numeric input selections keep their previous behavior.

## Behavior and compatibility

- Subitem and Favorite play requests include the UID from the latest status snapshot. Falcon Play rejects a changed position rather than executing a different item after a selection change or reorder.
- Missing items and lost connections clear dynamic text, thumbnail overrides, and status values. Outdated status responses cannot overwrite newer applied status or a changed connection.
- Status is polled every 2 seconds; input/function/scene/video lists refresh every 10 seconds.
- Graphic values come from the first two saved fields in scene order and their configured default values. They are not read back from rendered output.
- Subitem playback requires an active on-air rundown. Favorites can be triggered independently of a rundown.
- Favorite Played records a successful trigger during the current server session. Playing and Cued depend on available runtime state.
- New features require Falcon Play's extended Companion status and Subitem/Favorite REST routes. Logical input selection requires `inputName` support. See [API requirements](FALCON_PLAY_API_REQUIREMENTS.md).
- Existing action IDs and legacy numeric-input request formats remain supported.
- Includes the dependency/tooling updates already merged into the upstream main branch.

## Version

- `package.json`: `1.2.0`
- `companion/manifest.json`: `1.2.0`
- Git tag: `v1.2.0`

See the [README](README.md) for setup, text formats, variable groups, and examples.
