# DataTalk V2.2 RC8 - Alignment Fix

Frontend-only refinement release.

## Changes
- UX Health gauge score block is moved to the actual visual center of the arc (`top: 108px`) so the score and `Điểm UX / UX score` label no longer sit too close to the upper segments.
- Previous-period text remains outside the gauge center and does not affect score alignment.
- Session journey timeline marker and connector are now rendered inside a dedicated `journey-marker` column.
- The vertical connector uses `left: 50%` of that marker column, guaranteeing the gray line passes through the center of every purple dot.
- The last journey item does not render a trailing connector.

## Scope
- Frontend only.
- No backend changes.
- No database migration.
