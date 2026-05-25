# Traffic Kor

Minecraft Bedrock용 한국 도로 교통 애드온입니다. 교통 신호등, 보행자 신호등, 차선, 정지선, 횡단보도, 진행 방향 표시를 완드로 배치하고, 컨트롤러 엔티티로 신호 주기를 관리합니다.

## 한국어

### 구성

- `development_behavior_packs/Traffic_Kor_BP`: 엔티티 동작, 아이템, 함수, Script API 로직
- `development_resource_packs/Traffic_Kor_RP`: 모델, 텍스처, 애니메이션, 언어 파일
- 최소 엔진 버전: Minecraft Bedrock `1.21.90`

월드에서 BP와 RP를 모두 활성화해야 정상 동작합니다.

### 설치

개발 환경에서는 이 저장소를 `com.mojang` 폴더 아래에 두면 됩니다.

```text
com.mojang/
  development_behavior_packs/
    Traffic_Kor_BP/
  development_resource_packs/
    Traffic_Kor_RP/
```

압축 파일로 받은 경우에는 `Traffic_Kor_BP`를 `development_behavior_packs`에, `Traffic_Kor_RP`를 `development_resource_packs`에 넣으세요.

### 가장 간단한 사용법

1. 월드 설정에서 `XK Traffic System KOR BP`와 `XK Traffic System KOR RP`를 활성화합니다.
2. 명령어를 사용할 수 있게 치트를 켭니다.
3. 월드에 들어가서 아래 명령어로 기본 도구를 한 번에 받습니다.

```mcfunction
/function traffic/give_tools
```

4. `Traffic Control Wand`로 교차로에 컨트롤러를 하나 설치합니다. 컨트롤러를 설치하면 새 그룹이 자동으로 선택됩니다.
5. 차량 신호등, 보행자 신호등, 차선, 정지선, 횡단보도 완드를 들고 블록 윗면에 사용해 배치합니다.
6. 컨트롤러 설치 후 신호등을 배치하면 선택된 그룹에 자동 연결됩니다.
7. `Traffic Control Wand`를 컨트롤러에 사용하면 신호 시간 설정 UI가 열립니다.

대부분의 경우 이 흐름만으로 교차로 하나를 만들 수 있습니다.

### 추가 도구

파티클 기반 대각선 라인 도구는 별도 명령어로 받습니다.

```mcfunction
/function traffic/give_particle_tools
```

### 완드 동작

- 설치 완드: 블록 윗면에 해당 교통 엔티티를 배치합니다.
- 같은 설치 완드를 이미 설치된 같은 엔티티에 사용: 엔티티를 90도 회전합니다.
- 다른 설치 완드를 설치된 교통 엔티티에 사용: 같은 위치에 새 교통 엔티티를 배치합니다.
- `Traffic Control Wand`: 컨트롤러 설치, 컨트롤러 설정 UI 열기
- `Group Manager Wand`: 컨트롤러 그룹 설정, 신호등 그룹 연결/해제, X/Z축 변경
- `Remove Wand`: 교통 엔티티 삭제. 왼쪽 공격으로 연결된 직선 라인 묶음을 삭제할 수 있습니다.
- `Road Signal Wand`: 차량 신호등 배치. 차량 신호등을 왼쪽 공격하면 모델이 전환됩니다.
- `Guideline Wand`: 가이드라인 배치. 가이드라인을 왼쪽 공격하면 크기/모델이 전환됩니다.
- `Stop Line Wand`: 정지선 배치. 정지선을 왼쪽 공격하면 텍스처 프레임이 바뀝니다.

### 컨트롤러 기본값

- X축 차량 초록불: 30초
- Z축 차량 초록불: 30초
- 차량 노란불: 4초
- 전체 빨간불: 2초
- X축 보행자 보행: 8초
- X축 보행자 카운트다운: 8초
- Z축 보행자 보행: 8초
- Z축 보행자 카운트다운: 8초

한 차원 안에서 같은 그룹 ID를 가진 컨트롤러는 하나만 두는 것이 좋습니다. 중복 컨트롤러는 이름표에 `DUP`로 표시됩니다.

## English

### Overview

Traffic Kor is a Minecraft Bedrock add-on for Korean-style road traffic props. It provides traffic lights, pedestrian signals, lane markings, stop lines, crosswalks, and direction markings that can be placed with wand items and controlled with in-world controller entities.

### Structure

- `development_behavior_packs/Traffic_Kor_BP`: entity behavior, items, functions, and Script API logic
- `development_resource_packs/Traffic_Kor_RP`: models, textures, animations, and language files
- Minimum engine version: Minecraft Bedrock `1.21.90`

Both the behavior pack and resource pack must be enabled in the world.

### Installation

For development, keep this repository under your `com.mojang` folder so the pack folders stay in the expected Bedrock locations.

```text
com.mojang/
  development_behavior_packs/
    Traffic_Kor_BP/
  development_resource_packs/
    Traffic_Kor_RP/
```

If you downloaded a zip, place `Traffic_Kor_BP` in `development_behavior_packs` and `Traffic_Kor_RP` in `development_resource_packs`.

### Quick Start

1. Enable `XK Traffic System KOR BP` and `XK Traffic System KOR RP` in your world settings.
2. Enable cheats so you can run function commands.
3. Join the world and run this command to receive the main tools at once.

```mcfunction
/function traffic/give_tools
```

4. Use the `Traffic Control Wand` to place one controller for the intersection. Placing a controller automatically creates and selects a group.
5. Use the signal, lane, stop-line, and crosswalk wands on the top face of blocks to place traffic props.
6. Signals placed after a controller are automatically linked to the selected group.
7. Use the `Traffic Control Wand` on the controller to open the timing settings UI.

That is enough for the simplest working intersection.

### Extra Tools

Particle-based diagonal line tools are available through a separate function.

```mcfunction
/function traffic/give_particle_tools
```

### Wand Behavior

- Placement wands: place the matching traffic entity on the top face of a block.
- Same placement wand on the same placed entity: rotate the entity by 90 degrees.
- Different placement wand on an existing traffic entity: place the new traffic entity at the same position.
- `Traffic Control Wand`: place controllers and open the controller timing UI.
- `Group Manager Wand`: edit controller groups, link or unlink signals, and switch X/Z axis.
- `Remove Wand`: remove traffic entities. Left-hit can remove connected straight-line runs.
- `Road Signal Wand`: place road signals. Left-hit a road signal to switch its model.
- `Guideline Wand`: place guidelines. Left-hit a guideline to switch its size/model.
- `Stop Line Wand`: place stop lines. Left-hit a stop line to switch its texture frame.

### Default Controller Timing

- X road green: 30 seconds
- Z road green: 30 seconds
- Road yellow: 4 seconds
- All red: 2 seconds
- X pedestrian walk: 8 seconds
- X pedestrian countdown: 8 seconds
- Z pedestrian walk: 8 seconds
- Z pedestrian countdown: 8 seconds

Use only one controller per group in the same dimension. Duplicate controllers with the same group are marked with `DUP` in their name tag.

## License

This project is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE).
