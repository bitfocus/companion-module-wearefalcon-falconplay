# Release Notes v1.0.2

This release adds rundown cue-moving and latest-preview helpers to Falcon Play Companion, plus the matching Falcon Play API documentation.

## What's new

- Added **Move Next Forward** and **Move Next Backward** actions.
- Added **Take Latest Live to Preview** action.
- Added **Take Latest SS/DVE to Preview** action.
- Extended the Falcon Play API requirements document with the new rundown preview endpoints:
  - `POST /api/rundown/move-next-forward`
  - `POST /api/rundown/move-next-backward`
  - `POST /api/rundown/latest-extern-to-preview`
  - `POST /api/rundown/latest-ss-dve-to-preview`
- Updated the Companion help text and README so the action list matches the module.

## Behaviour changes

- `Move Next Forward` and `Move Next Backward` adjust the cued rundown item without triggering playback.
- `Take Latest Live to Preview` cues the most recently played live/Extern input as a temporary preview item.
- `Take Latest SS/DVE to Preview` cues the most recently played SuperSource or DVE input as a temporary preview item.

## Version bump

- `package.json` updated to `1.0.2`
- `companion/manifest.json` updated to `1.0.2`
