# Traffic System Design

## Implemented Now

- All traffic props are entity based.
- Road signals and pedestrian signals are driven by separate animation/controller setups.
- Road signals use three distinct light animations: red, yellow, green.
- Pedestrian signals use stop, walk, and countdown 8 -> 1 states.
- Signal states are driven by entity properties and updated by controller entities with separate X-axis and Z-axis phases.
- Floor-installed entities use `entity_alphatest`.
- Signal entities use `entity_emissive_alpha_one_sided`.
- Direct per-setting controller wands are no longer required for normal use.
- Controller settings are edited through one stable in-world form UI using `@minecraft/server-ui`.
- Group selection and signal linking are handled through one separate group UI tool.
- All placement still snaps to 90-degree yaw increments.
- Reusing a placement wand on a placed traffic entity rotates it by 90 degrees.
- `stop_line` supports six manual texture frames and advances one frame per left-hit with `traffic:stop_line_wand`.

## Current Entity Set

- `traffic:controller`
- `traffic:road_signal`
- `traffic:ped_signal`
- `traffic:yellow_line`
- `traffic:yellow_corner`
- `traffic:white_corner`
- `traffic:white_corner_side`
- `traffic:white_side_left`
- `traffic:white_side_right`
- `traffic:crossing_ahead`
- `traffic:cross_small`
- `traffic:cross_big`
- `traffic:cross_small_m`
- `traffic:cross_big_m`
- `traffic:gos_tl`
- `traffic:tr`
- `traffic:tl`
- `traffic:stop_line`
- `traffic:guideline`

## Controller Model

- One `traffic:controller` controls one intersection group.
- Each controller stores its own group id and separate X/Z timing values.
- Linked road and pedestrian signals in the same group are updated every second by axis.
- Default cycle:
  - X road green: 30s
  - X ped walk: 8s
  - X ped countdown: 8s
  - road yellow: 4s
  - all red: 2s
  - Z road green: 30s
  - Z ped walk: 8s
  - Z ped countdown: 8s
  - road yellow: 4s
  - all red: 2s

## Tool Roles

- Placement wands place matching entities on the top face of a block.
- `traffic:controller_wand` places a controller on blocks and opens a single controller settings UI when used on a controller entity.
- `traffic:group_wand` opens group-management UI on controllers and signal-link UI on road/pedestrian signals.
- Signal axis can also be switched in the group-management UI.
- `traffic:remove_wand` deletes placed traffic addon entities directly by use or hit.
- Old timing wands are treated as legacy controller UI aliases, but they are no longer handed out by the helper function.
- `traffic:stop_line_wand` still rotates on use and changes stop-line texture frame on left-hit.

## Setup Flow

- Run `/function traffic/give_tools`.
- Place one controller for the intersection.
- Use the group wand on that controller and set/select its group id.
- Place road and pedestrian signals.
- If a group is selected while placing signals, the placed signals are auto-linked to that group and auto-assigned to X/Z axis from rotation.
- If needed, use the group wand on a signal and link or clear it from the UI.
- Use the controller wand on the controller to edit the full X/Z timing cycle in one screen.

## Notes

- If two controllers share the same group in one dimension, only one should be used. Duplicate controllers are marked with `DUP` in the controller name tag.
- Manual sneak-cycling on signals is still available for preview, but linked controllers will overwrite those preview states on the next update tick.
- A direct no-shadow field was tested earlier, but current Bedrock rejected `shadow_size` in custom `minecraft:client_entity` descriptions, so the invalid field was removed to keep logs clean.
