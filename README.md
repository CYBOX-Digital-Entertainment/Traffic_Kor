# Traffic System Design

## English

### Implemented Now

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

### Current Entity Set

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

### Controller Model

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

### Tool Roles

- Placement wands place matching entities on the top face of a block.
- `traffic:controller_wand` places a controller on blocks and opens a single controller settings UI when used on a controller entity.
- `traffic:group_wand` opens group-management UI on controllers and signal-link UI on road/pedestrian signals.
- Signal axis can also be switched in the group-management UI.
- `traffic:remove_wand` deletes placed traffic addon entities directly by use or hit.
- Old timing wands are treated as legacy controller UI aliases, but they are no longer handed out by the helper function.
- `traffic:stop_line_wand` still rotates on use and changes stop-line texture frame on left-hit.

### Setup Flow

- Run `/function traffic/give_tools`.
- Place one controller for the intersection.
- Use the group wand on that controller and set/select its group id.
- Place road and pedestrian signals.
- If a group is selected while placing signals, the placed signals are auto-linked to that group and auto-assigned to X/Z axis from rotation.
- If needed, use the group wand on a signal and link or clear it from the UI.
- Use the controller wand on the controller to edit the full X/Z timing cycle in one screen.

### Notes

- If two controllers share the same group in one dimension, only one should be used. Duplicate controllers are marked with `DUP` in the controller name tag.
- Manual sneak-cycling on signals is still available for preview, but linked controllers will overwrite those preview states on the next update tick.
- A direct no-shadow field was tested earlier, but current Bedrock rejected `shadow_size` in custom `minecraft:client_entity` descriptions, so the invalid field was removed to keep logs clean.

## 한국어

### 현재 구현된 내용

- 모든 교통 오브젝트는 엔티티 기반입니다.
- 차량 신호등과 보행자 신호등은 각각 별도의 애니메이션/컨트롤러 구성으로 동작합니다.
- 차량 신호등은 빨간불, 노란불, 초록불의 세 가지 점등 애니메이션을 사용합니다.
- 보행자 신호등은 정지, 보행, 카운트다운 8 -> 1 상태를 사용합니다.
- 신호 상태는 엔티티 속성으로 제어되며, 컨트롤러 엔티티가 X축/Z축 단계를 따로 계산해 갱신합니다.
- 바닥에 설치되는 엔티티는 `entity_alphatest`를 사용합니다.
- 신호등 엔티티는 `entity_emissive_alpha_one_sided`를 사용합니다.
- 일반적인 사용에서는 설정별 컨트롤러 완드가 더 이상 필요하지 않습니다.
- 컨트롤러 설정은 `@minecraft/server-ui`를 사용하는 안정적인 월드 내 폼 UI 하나에서 편집합니다.
- 그룹 선택과 신호 연결은 별도의 그룹 UI 도구 하나에서 처리합니다.
- 모든 설치 방향은 여전히 90도 단위 yaw로 스냅됩니다.
- 이미 설치된 교통 엔티티에 설치 완드를 다시 사용하면 90도씩 회전합니다.
- `stop_line`은 여섯 개의 수동 텍스처 프레임을 지원하며, `traffic:stop_line_wand`로 왼쪽 히트할 때마다 한 프레임씩 진행합니다.

### 현재 엔티티 목록

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

### 컨트롤러 모델

- `traffic:controller` 하나가 교차로 그룹 하나를 제어합니다.
- 각 컨트롤러는 자체 그룹 ID와 X/Z축별 타이밍 값을 저장합니다.
- 같은 그룹에 연결된 차량 신호등과 보행자 신호등은 축 기준으로 매초 갱신됩니다.
- 기본 주기:
  - X축 차량 초록불: 30초
  - X축 보행자 보행: 8초
  - X축 보행자 카운트다운: 8초
  - 차량 노란불: 4초
  - 전체 빨간불: 2초
  - Z축 차량 초록불: 30초
  - Z축 보행자 보행: 8초
  - Z축 보행자 카운트다운: 8초
  - 차량 노란불: 4초
  - 전체 빨간불: 2초

### 도구 역할

- 설치 완드는 블록 윗면에 대응하는 엔티티를 설치합니다.
- `traffic:controller_wand`는 블록에 컨트롤러를 설치하며, 컨트롤러 엔티티에 사용하면 단일 컨트롤러 설정 UI를 엽니다.
- `traffic:group_wand`는 컨트롤러에서는 그룹 관리 UI를, 차량/보행자 신호등에서는 신호 연결 UI를 엽니다.
- 신호 축은 그룹 관리 UI에서도 전환할 수 있습니다.
- `traffic:remove_wand`는 사용 또는 히트로 설치된 교통 애드온 엔티티를 바로 삭제합니다.
- 기존 타이밍 완드들은 레거시 컨트롤러 UI 별칭으로 처리되지만, 보조 함수에서는 더 이상 지급하지 않습니다.
- `traffic:stop_line_wand`는 사용 시 회전 기능을 유지하며, 왼쪽 히트 시 정지선 텍스처 프레임을 변경합니다.

### 설정 흐름

- `/function traffic/give_tools`를 실행합니다.
- 교차로에 컨트롤러 하나를 설치합니다.
- 해당 컨트롤러에 그룹 완드를 사용해 그룹 ID를 설정하거나 선택합니다.
- 차량 신호등과 보행자 신호등을 설치합니다.
- 신호등 설치 중 그룹이 선택되어 있으면, 설치된 신호등은 해당 그룹에 자동 연결되고 회전 방향을 기준으로 X/Z축이 자동 배정됩니다.
- 필요하면 신호등에 그룹 완드를 사용해 UI에서 연결하거나 해제합니다.
- 컨트롤러에 컨트롤러 완드를 사용해 전체 X/Z 타이밍 주기를 한 화면에서 편집합니다.

### 참고

- 한 차원에서 두 컨트롤러가 같은 그룹을 공유하면 하나만 사용해야 합니다. 중복 컨트롤러는 이름표에 `DUP`로 표시됩니다.
- 신호등에서 수동 sneak-cycling 미리보기는 여전히 사용할 수 있지만, 연결된 컨트롤러가 다음 업데이트 틱에서 미리보기 상태를 덮어씁니다.
- 직접적인 no-shadow 필드는 이전에 테스트했지만, 현재 Bedrock이 커스텀 `minecraft:client_entity` 설명의 `shadow_size`를 거부하므로 로그를 깨끗하게 유지하기 위해 잘못된 필드를 제거했습니다.
