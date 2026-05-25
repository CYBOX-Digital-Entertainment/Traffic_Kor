import {
  Direction,
  EntityComponentTypes,
  EquipmentSlot,
  system,
  world,
} from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const GROUP_TAG_PREFIX = "traffic.selected_group.";
const MAX_GROUP = 99;
const STOP_LINE_FRAME_COUNT = 6;
const DIMENSION_IDS = ["overworld", "nether", "the_end"];
const POSITION_EPSILON = 0.1;
const HEIGHT_EPSILON = 0.25;
const ROTATION_INCREMENT = 45;
const FLOOR_MARKING_SURFACE_OFFSET = 0.94;
const FLOOR_MARKING_HEIGHT = FLOOR_MARKING_SURFACE_OFFSET;
const PARTICLE_MARKING_SURFACE_OFFSET = 0.98;
const AXIS_X = 0;
const AXIS_Z = 1;
const AXIS_INITIALIZED_TAG = "traffic.axis_initialized";
const LINE_MANUAL_ROTATION_TAG = "traffic.line_manual_rotation";
const ROAD_SIGNAL_MODEL_VARIANT_COUNT = 3;
const GUIDELINE_MODEL_VARIANT_COUNT = 3;
const LEGACY_DIAGONAL_X_OFFSET = 0.25;
const LEGACY_DIAGONAL_OFFSET_EPSILON = 0.12;
const AUTO_FILL_STEP_BY_TYPE = {
  "traffic:white_line_side_l": 4,
  "traffic:white_line_side_r": 4,
  "traffic:white_line_side_l_particle": 4,
  "traffic:white_line_side_r_particle": 4,
};
const PARTICLE_MARKING_TYPES = new Set([
  "traffic:yellow_line_particle",
  "traffic:yellowline2_particle",
  "traffic:white_side_left_particle",
  "traffic:white_side_right_particle",
  "traffic:white_line_side_l_particle",
  "traffic:white_line_side_r_particle",
]);
const SIDE_AWARE_LINE_GROUPS = [
  {
    family: "white_side",
    left: "traffic:white_side_left",
    right: "traffic:white_side_right",
  },
  {
    family: "white_side_particle",
    left: "traffic:white_side_left_particle",
    right: "traffic:white_side_right_particle",
  },
  {
    family: "white_center",
    left: "traffic:white_line_side_l",
    right: "traffic:white_line_side_r",
  },
  {
    family: "white_center_particle",
    left: "traffic:white_line_side_l_particle",
    right: "traffic:white_line_side_r_particle",
  },
];
const SIDE_AWARE_LINE_TYPE_TO_GROUP = new Map(
  SIDE_AWARE_LINE_GROUPS.flatMap((group) => [
    [group.left, { ...group, requestedSide: "left" }],
    [group.right, { ...group, requestedSide: "right" }],
  ]),
);
const RECENT_LINE_PLACEMENT_TTL_MS = 180000;
const recentLinePlacementByPlayer = new Map();
const STRAIGHT_LINE_TYPES = new Set([
  "traffic:yellow_line",
  "traffic:yellowline2",
  "traffic:white_side_left",
  "traffic:white_side_right",
]);
const CORNER_TYPES = new Set([
  "traffic:yellow_corner",
  "traffic:white_corner",
  "traffic:white_corner_side",
]);
const ROTATE_CONNECTOR = {
  north_left: "east_top",
  north_center: "east_center",
  north_right: "east_bottom",
  east_top: "south_right",
  east_center: "south_center",
  east_bottom: "south_left",
  south_right: "west_bottom",
  south_center: "west_center",
  south_left: "west_top",
  west_bottom: "north_left",
  west_center: "north_center",
  west_top: "north_right",
};
const OPPOSITE_CONNECTOR = {
  north_left: "south_left",
  north_center: "south_center",
  north_right: "south_right",
  east_top: "west_top",
  east_center: "west_center",
  east_bottom: "west_bottom",
  south_right: "north_right",
  south_center: "north_center",
  south_left: "north_left",
  west_bottom: "east_bottom",
  west_center: "east_center",
  west_top: "east_top",
};
const CONNECTOR_NEIGHBOR_OFFSET = {
  north_left: { x: 0, z: -1 },
  north_center: { x: 0, z: -1 },
  north_right: { x: 0, z: -1 },
  east_top: { x: 1, z: 0 },
  east_center: { x: 1, z: 0 },
  east_bottom: { x: 1, z: 0 },
  south_right: { x: 0, z: 1 },
  south_center: { x: 0, z: 1 },
  south_left: { x: 0, z: 1 },
  west_bottom: { x: -1, z: 0 },
  west_center: { x: -1, z: 0 },
  west_top: { x: -1, z: 0 },
};

const placementWands = {
  "traffic:road_signal_wand": { entity: "traffic:road_signal", yOffset: 1.0 },
  "traffic:ped_signal_wand": { entity: "traffic:ped_signal", yOffset: 1.0 },
  "traffic:yellow_line_wand": { entity: "traffic:yellow_line", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:yellow_line_particle_wand": { entity: "traffic:yellow_line_particle", yOffset: PARTICLE_MARKING_SURFACE_OFFSET },
  "traffic:yellow_corner_wand": { entity: "traffic:yellow_corner", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:white_corner_wand": { entity: "traffic:white_corner", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:white_corner_side_wand": { entity: "traffic:white_corner_side", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:white_side_left_wand": { entity: "traffic:white_side_left", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:white_side_right_wand": { entity: "traffic:white_side_right", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:white_side_left_particle_wand": { entity: "traffic:white_side_left_particle", yOffset: PARTICLE_MARKING_SURFACE_OFFSET },
  "traffic:white_side_right_particle_wand": { entity: "traffic:white_side_right_particle", yOffset: PARTICLE_MARKING_SURFACE_OFFSET },
  "traffic:white_line_side_l_wand": { entity: "traffic:white_line_side_l", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:white_line_side_r_wand": { entity: "traffic:white_line_side_r", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:white_line_side_l_particle_wand": { entity: "traffic:white_line_side_l_particle", yOffset: PARTICLE_MARKING_SURFACE_OFFSET },
  "traffic:white_line_side_r_particle_wand": { entity: "traffic:white_line_side_r_particle", yOffset: PARTICLE_MARKING_SURFACE_OFFSET },
  "traffic:crossing_ahead_wand": { entity: "traffic:crossing_ahead", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:gos_wand": { entity: "traffic:gos", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:gos_tr_wand": { entity: "traffic:gos_tr", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:tl_noti_wand": { entity: "traffic:tl_noti", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:tr_noti_wand": { entity: "traffic:tr_noti", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:gos_tl_wand": { entity: "traffic:gos_tl", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:tr_wand": { entity: "traffic:tr", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:tl_wand": { entity: "traffic:tl", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:yellowline2_wand": { entity: "traffic:yellowline2", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:yellowline2_particle_wand": { entity: "traffic:yellowline2_particle", yOffset: PARTICLE_MARKING_SURFACE_OFFSET },
  "traffic:stop_line_wand": { entity: "traffic:stop_line", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:cross_small_wand": { entity: "traffic:cross_small", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:cross_big_wand": { entity: "traffic:cross_big", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:cross_small_m_wand": { entity: "traffic:cross_small_m", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:cross_big_m_wand": { entity: "traffic:cross_big_m", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:guideline_wand": { entity: "traffic:guideline", yOffset: FLOOR_MARKING_HEIGHT },
  "traffic:controller_wand": { entity: "traffic:controller", yOffset: 0.9 },
};
const placementConfigByEntity = new Map(
  Object.values(placementWands).map((config) => [config.entity, config]),
);

const controllerUiToolIds = new Set([
  "traffic:controller_wand",
  "traffic:road_green_wand",
  "traffic:yellow_time_wand",
  "traffic:all_red_wand",
  "traffic:ped_walk_wand",
  "traffic:ped_flash_wand",
]);
const removeToolId = "traffic:remove_wand";

const signalTypes = new Set(["traffic:road_signal", "traffic:ped_signal"]);
const trafficEntities = new Set(Object.values(placementWands).map((entry) => entry.entity));
const floorMarkingTypes = new Set([
  "traffic:yellow_line",
  "traffic:yellowline2",
  "traffic:yellow_corner",
  "traffic:white_corner",
  "traffic:white_corner_side",
  "traffic:white_side_left",
  "traffic:white_side_right",
  "traffic:white_line_side_l",
  "traffic:white_line_side_r",
  "traffic:yellow_line_particle",
  "traffic:yellowline2_particle",
  "traffic:white_side_left_particle",
  "traffic:white_side_right_particle",
  "traffic:white_line_side_l_particle",
  "traffic:white_line_side_r_particle",
  "traffic:crossing_ahead",
  "traffic:gos",
  "traffic:gos_tr",
  "traffic:gos_tl",
  "traffic:tl",
  "traffic:tr",
  "traffic:tl_noti",
  "traffic:tr_noti",
  "traffic:stop_line",
  "traffic:cross_small",
  "traffic:cross_big",
  "traffic:cross_small_m",
  "traffic:cross_big_m",
  "traffic:guideline",
]);
const STOP_LINE_FRAME_SEQUENCE = [0, 1, 2, 4, 5];
const autoFillLineTypes = new Set([
  "traffic:yellow_line",
  "traffic:yellowline2",
  "traffic:white_side_left",
  "traffic:white_side_right",
  "traffic:white_line_side_l",
  "traffic:white_line_side_r",
  "traffic:yellow_line_particle",
  "traffic:yellowline2_particle",
  "traffic:white_side_left_particle",
  "traffic:white_side_right_particle",
  "traffic:white_line_side_l_particle",
  "traffic:white_line_side_r_particle",
]);

function isPlacementWand(itemStack) {
  return !!itemStack && Object.prototype.hasOwnProperty.call(placementWands, itemStack.typeId);
}

function isControllerUiTool(itemStack) {
  return !!itemStack && controllerUiToolIds.has(itemStack.typeId);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wrapGroup(value) {
  if (value < 1) {
    return MAX_GROUP;
  }

  if (value > MAX_GROUP) {
    return 1;
  }

  return value;
}

function snapRightAngle(yaw) {
  let normalized = yaw % 360;
  if (normalized < 0) {
    normalized += 360;
  }

  return (Math.round(normalized / ROTATION_INCREMENT) * ROTATION_INCREMENT) % 360;
}

function yawFromViewDirection(viewDirection) {
  return Math.atan2(-viewDirection.x, viewDirection.z) * (180 / Math.PI);
}

function getSideAwareLineGroup(typeId) {
  return SIDE_AWARE_LINE_TYPE_TO_GROUP.get(typeId);
}

function getOppositeSide(side) {
  return side === "left" ? "right" : "left";
}

function getCanonicalLineSide(typeId, yaw) {
  const group = getSideAwareLineGroup(typeId);
  if (!group) {
    return undefined;
  }

  return snapRightAngle(yaw) >= 180 ? getOppositeSide(group.requestedSide) : group.requestedSide;
}

function getCanonicalLineKey(typeId, yaw) {
  const normalizedYaw = normalizeLineYaw(yaw);
  const group = getSideAwareLineGroup(typeId);
  if (!group) {
    return `${typeId}:${normalizedYaw}`;
  }

  return `${group.family}:${normalizedYaw}:${getCanonicalLineSide(typeId, yaw)}`;
}

function getCompatibleLineTypeIds(typeId) {
  const group = getSideAwareLineGroup(typeId);
  return group ? [group.left, group.right] : [typeId];
}

function getActualLineYawForType(typeId, desiredNormalizedYaw, canonicalSide) {
  const group = getSideAwareLineGroup(typeId);
  if (!group || !canonicalSide) {
    return desiredNormalizedYaw;
  }

  return group.requestedSide === canonicalSide ? desiredNormalizedYaw : (desiredNormalizedYaw + 180) % 360;
}

function axisFromYaw(yaw) {
  const snappedYaw = snapRightAngle(yaw);
  const radians = snappedYaw * (Math.PI / 180);
  return Math.abs(Math.sin(radians)) > Math.abs(Math.cos(radians)) ? AXIS_X : AXIS_Z;
}

function axisName(axis) {
  return axis === AXIS_Z ? "Z" : "X";
}

function getIntProperty(entity, propertyId, fallback = 0) {
  const value = Number(entity.getProperty(propertyId));
  return Number.isFinite(value) ? value : fallback;
}

function getBoolProperty(entity, propertyId, fallback = false) {
  const value = entity.getProperty(propertyId);
  return typeof value === "boolean" ? value : fallback;
}

function setIntPropertyIfChanged(entity, propertyId, value) {
  if (getIntProperty(entity, propertyId, Number.NaN) !== value) {
    entity.setProperty(propertyId, value);
  }
}

function setNameTagIfChanged(entity, value) {
  if (entity.nameTag !== value) {
    entity.nameTag = value;
  }
}

function isClose(a, b, epsilon = POSITION_EPSILON) {
  return Math.abs(a - b) <= epsilon;
}

function snapCenter(value) {
  return Math.round(value - 0.5) + 0.5;
}

function getSnappedEntityYaw(entity) {
  return snapRightAngle(entity.getRotation().y);
}

function getEntityPitch(entity) {
  return entity.getRotation().x;
}

function normalizeLineYaw(yaw) {
  const snappedYaw = snapRightAngle(yaw);
  return snappedYaw >= 180 ? snappedYaw - 180 : snappedYaw;
}

function yawToDirection(yaw) {
  const radians = yaw * (Math.PI / 180);
  return {
    x: -Math.sin(radians),
    z: Math.cos(radians),
  };
}

function isDiagonalStraightLine(entity) {
  return autoFillLineTypes.has(entity.typeId) && snapRightAngle(entity.getRotation().y) % 90 !== 0;
}

function getLegacyDiagonalAlignmentOffset(entity) {
  if (!isDiagonalStraightLine(entity)) {
    return 0;
  }

  const yaw = snapRightAngle(entity.getRotation().y);
  const metric = yaw === 45 || yaw === 225
    ? entity.location.x + entity.location.z
    : entity.location.x - entity.location.z;
  const fractionalOffset = metric - Math.round(metric);

  if (Math.abs(fractionalOffset - LEGACY_DIAGONAL_X_OFFSET) <= LEGACY_DIAGONAL_OFFSET_EPSILON) {
    return -LEGACY_DIAGONAL_X_OFFSET;
  }

  return 0;
}

function collectStraightRunEntries(entity) {
  if (!autoFillLineTypes.has(entity.typeId)) {
    return [{ entity, projection: 0 }];
  }

  const dimension = entity.dimension;
  const lineYaw = normalizeLineYaw(entity.getRotation().y);
  const direction = yawToDirection(lineYaw);
  const perpendicular = {
    x: -direction.z,
    z: direction.x,
  };
  const centerX = entity.location.x;
  const centerY = entity.location.y;
  const centerZ = entity.location.z;
  const entries = [{ entity, projection: 0 }];

  for (const compatibleTypeId of getCompatibleLineTypeIds(entity.typeId)) {
    for (const other of dimension.getEntities({ type: compatibleTypeId })) {
      if (!other.isValid || other.id === entity.id) {
        continue;
      }

      if (!isClose(other.location.y, centerY, 1.2)) {
        continue;
      }

      if (!isSameLinePlacement(entity, other)) {
        continue;
      }

      const deltaX = other.location.x - centerX;
      const deltaZ = other.location.z - centerZ;
      const perpendicularDistance = Math.abs((deltaX * perpendicular.x) + (deltaZ * perpendicular.z));
      if (perpendicularDistance > 0.45) {
        continue;
      }

      const projection = (deltaX * direction.x) + (deltaZ * direction.z);
      entries.push({ entity: other, projection });
    }
  }

  return entries.sort((left, right) => left.projection - right.projection);
}

function getLineShapeVariant(deltaY, distance) {
  if (distance <= POSITION_EPSILON || Math.abs(deltaY) <= HEIGHT_EPSILON) {
    return 0;
  }

  const slope = Math.abs(deltaY / distance);
  if (slope >= 0.8) {
    return 2;
  }

  if (slope >= 0.3) {
    return 1;
  }

  return 0;
}

function setLineShapeVariant(entity, variant) {
  if (!autoFillLineTypes.has(entity.typeId)) {
    return;
  }

  entity.setProperty("traffic:line_shape", variant);
}

function hasManualLineRotation(entity) {
  return entity.hasTag(LINE_MANUAL_ROTATION_TAG);
}

function setManualLineRotation(entity, enabled) {
  if (!autoFillLineTypes.has(entity.typeId)) {
    return;
  }

  if (enabled) {
    if (!entity.hasTag(LINE_MANUAL_ROTATION_TAG)) {
      entity.addTag(LINE_MANUAL_ROTATION_TAG);
    }
    return;
  }

  if (entity.hasTag(LINE_MANUAL_ROTATION_TAG)) {
    entity.removeTag(LINE_MANUAL_ROTATION_TAG);
  }
}

function getFlatLineShapeVariant(yaw) {
  return 0;
}

function updateStraightLineTilt(entity) {
  if (!autoFillLineTypes.has(entity.typeId)) {
    return;
  }

  const entries = collectStraightRunEntries(entity);
  const runNormalizedYaw = normalizeLineYaw(entity.getRotation().y);
  for (const entry of entries) {
    const currentYaw = getSnappedEntityYaw(entry.entity);
    const canonicalSide = getCanonicalLineSide(entry.entity.typeId, currentYaw);
    const baseYaw = hasManualLineRotation(entry.entity)
      ? currentYaw
      : getActualLineYawForType(entry.entity.typeId, runNormalizedYaw, canonicalSide);
    setLineShapeVariant(entry.entity, getFlatLineShapeVariant(baseYaw));
    applyEntityRotation(entry.entity, baseYaw, 0);
  }

  for (let index = 0; index < entries.length - 1; index += 1) {
    const current = entries[index];
    const next = entries[index + 1];
    const deltaY = next.entity.location.y - current.entity.location.y;
    const distance = next.projection - current.projection;
    const variant = getLineShapeVariant(deltaY, distance);
    if (variant === 0) {
      continue;
    }

    const lowerEntry = deltaY > 0 ? current : next;
    const higherEntry = deltaY > 0 ? next : current;
    const slopeNormalizedYaw = normalizeLineYaw(yawFromViewDirection({
      x: higherEntry.entity.location.x - lowerEntry.entity.location.x,
      z: higherEntry.entity.location.z - lowerEntry.entity.location.z,
    }));
    const lowerCanonicalSide = getCanonicalLineSide(lowerEntry.entity.typeId, getSnappedEntityYaw(lowerEntry.entity));

    setLineShapeVariant(lowerEntry.entity, variant);
    applyEntityRotation(
      lowerEntry.entity,
      hasManualLineRotation(lowerEntry.entity)
        ? getSnappedEntityYaw(lowerEntry.entity)
        : getActualLineYawForType(lowerEntry.entity.typeId, slopeNormalizedYaw, lowerCanonicalSide),
      0,
    );
  }
}

function getSignalAxis(entity) {
  if (signalTypes.has(entity.typeId) && !entity.hasTag(AXIS_INITIALIZED_TAG)) {
    const inferredAxis = axisFromYaw(entity.getRotation().y);
    entity.setProperty("traffic:axis", inferredAxis);
    entity.addTag(AXIS_INITIALIZED_TAG);
    return inferredAxis;
  }

  const value = Number(entity.getProperty("traffic:axis"));
  if (value === AXIS_X || value === AXIS_Z) {
    return value;
  }

  return axisFromYaw(entity.getRotation().y);
}

function setSignalAxis(entity, axis) {
  if (!signalTypes.has(entity.typeId)) {
    return;
  }

  entity.setProperty("traffic:axis", axis === AXIS_Z ? AXIS_Z : AXIS_X);
  if (!entity.hasTag(AXIS_INITIALIZED_TAG)) {
    entity.addTag(AXIS_INITIALIZED_TAG);
  }
}

function getNextStopLineFrame(currentFrame) {
  const index = STOP_LINE_FRAME_SEQUENCE.indexOf(currentFrame);
  if (index === -1) {
    return STOP_LINE_FRAME_SEQUENCE[0];
  }

  return STOP_LINE_FRAME_SEQUENCE[(index + 1) % STOP_LINE_FRAME_SEQUENCE.length];
}

function clearSelectedGroup(player) {
  for (const tag of player.getTags()) {
    if (tag.startsWith(GROUP_TAG_PREFIX)) {
      player.removeTag(tag);
    }
  }
}

function rotateConnectors(connectors, yaw) {
  const steps = Math.round(snapRightAngle(yaw) / 90) % 4;
  return connectors.map((connector) => {
    let rotated = connector;
    for (let step = 0; step < steps; step += 1) {
      rotated = ROTATE_CONNECTOR[rotated];
    }
    return rotated;
  });
}

function getEntityConnectors(typeId, yaw) {
  switch (typeId) {
    case "traffic:yellow_line":
    case "traffic:yellowline2":
      return rotateConnectors(["north_center", "south_center"], yaw);
    case "traffic:white_side_left":
      return rotateConnectors(["north_left", "south_left"], yaw);
    case "traffic:white_side_right":
      return rotateConnectors(["north_right", "south_right"], yaw);
    case "traffic:yellow_corner":
      return rotateConnectors(["north_center", "east_center"], yaw);
    case "traffic:white_corner":
      return rotateConnectors(["north_right", "east_top"], yaw);
    case "traffic:white_corner_side":
      return rotateConnectors(["south_right", "east_bottom"], yaw);
    default:
      return [];
  }
}

function getNeighborLineMatches(entity) {
  const centerX = snapCenter(entity.location.x);
  const centerY = entity.location.y;
  const centerZ = snapCenter(entity.location.z);
  const matches = new Map();

  for (const typeId of STRAIGHT_LINE_TYPES) {
    for (const other of entity.dimension.getEntities({ type: typeId })) {
      if (!other.isValid || other.id === entity.id) {
        continue;
      }

    if (!isClose(other.location.y, centerY, 1.2)) {
      continue;
    }

      const deltaX = snapCenter(other.location.x) - centerX;
      const deltaZ = snapCenter(other.location.z) - centerZ;
      if (Math.abs(deltaX) + Math.abs(deltaZ) !== 1) {
        continue;
      }

      const key = `${deltaX},${deltaZ}`;
      const current = matches.get(key) ?? [];
      current.push(other);
      matches.set(key, current);
    }
  }

  return matches;
}

function getAutoCornerYaw(entity, fallbackYaw) {
  if (!CORNER_TYPES.has(entity.typeId)) {
    return fallbackYaw;
  }

  const neighborMatches = getNeighborLineMatches(entity);
  if (neighborMatches.size === 0) {
    return fallbackYaw;
  }

  const fallback = snapRightAngle(fallbackYaw);
  let bestYaw = fallback;
  let bestScore = -1;
  let bestDelta = 360;

  for (const candidateYaw of [0, 90, 180, 270]) {
    const connectors = getEntityConnectors(entity.typeId, candidateYaw);
    let score = 0;

    for (const connector of connectors) {
      const offset = CONNECTOR_NEIGHBOR_OFFSET[connector];
      const neighborEntities = neighborMatches.get(`${offset.x},${offset.z}`) ?? [];
      const neededConnector = OPPOSITE_CONNECTOR[connector];
      const matched = neighborEntities.some((other) => getEntityConnectors(other.typeId, getSnappedEntityYaw(other)).includes(neededConnector));
      if (matched) {
        score += 1;
      }
    }

    const delta = Math.min(
      (candidateYaw - fallback + 360) % 360,
      (fallback - candidateYaw + 360) % 360,
    );

    if (score > bestScore || (score === bestScore && delta < bestDelta)) {
      bestYaw = candidateYaw;
      bestScore = score;
      bestDelta = delta;
    }
  }

  return bestScore >= 2 ? bestYaw : fallbackYaw;
}

function getSelectedGroup(player) {
  for (const tag of player.getTags()) {
    if (!tag.startsWith(GROUP_TAG_PREFIX)) {
      continue;
    }

    const value = Number(tag.slice(GROUP_TAG_PREFIX.length));
    if (Number.isInteger(value) && value >= 1 && value <= MAX_GROUP) {
      return value;
    }
  }

  return 0;
}

function setSelectedGroup(player, groupId) {
  clearSelectedGroup(player);

  if (groupId >= 1 && groupId <= MAX_GROUP) {
    player.addTag(`${GROUP_TAG_PREFIX}${groupId}`);
  }
}

function applyEntityRotation(entity, yaw, pitch = getEntityPitch(entity)) {
  const snappedYaw = snapRightAngle(yaw);
  const location = entity.location;

  entity.clearVelocity();
  entity.teleport(
    {
      x: location.x,
      y: location.y,
      z: location.z,
    },
    {
      rotation: { x: pitch, y: snappedYaw },
      keepVelocity: false,
      checkForBlocks: false,
    },
  );
  entity.setRotation({ x: pitch, y: snappedYaw });
}

function rotateTrafficEntity(entity) {
  const rotation = entity.getRotation();
  const nextYaw = (snapRightAngle(rotation.y) + ROTATION_INCREMENT) % 360;
  if (autoFillLineTypes.has(entity.typeId)) {
    const currentShape = getIntProperty(entity, "traffic:line_shape", 0);
    setManualLineRotation(entity, true);
    const nextShape = currentShape === 1 || currentShape === 2
      ? currentShape
      : getFlatLineShapeVariant(nextYaw);
    setLineShapeVariant(entity, nextShape);
    applyEntityRotation(entity, nextYaw, 0);
    return;
  }

  applyEntityRotation(entity, nextYaw);
  setSignalAxis(entity, axisFromYaw(nextYaw));
  updateStraightLineTilt(entity);
}

function getRecentLinePlacementKey(player, typeId, yaw) {
  return `${player.id}:${getCanonicalLineKey(typeId, yaw)}`;
}

function isEntityReferenceValid(entity) {
  if (!entity) {
    return false;
  }

  try {
    return entity.isValid;
  } catch {
    return false;
  }
}

function cleanupRecentLinePlacements(now = Date.now()) {
  for (const [key, entry] of recentLinePlacementByPlayer) {
    if ((now - entry.timestamp) > RECENT_LINE_PLACEMENT_TTL_MS || !isEntityReferenceValid(entry.entity)) {
      recentLinePlacementByPlayer.delete(key);
    }
  }
}

function getRecentLinePlacement(player, typeId, yaw, dimensionId) {
  cleanupRecentLinePlacements();
  const key = getRecentLinePlacementKey(player, typeId, yaw);
  const entry = recentLinePlacementByPlayer.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.dimensionId !== dimensionId || !isEntityReferenceValid(entry.entity)) {
    recentLinePlacementByPlayer.delete(key);
    return undefined;
  }

  return entry.entity;
}

function rememberRecentLinePlacement(player, entity) {
  recentLinePlacementByPlayer.set(getRecentLinePlacementKey(player, entity.typeId, entity.getRotation().y), {
    entity,
    dimensionId: entity.dimension.id,
    timestamp: Date.now(),
  });
}

function getLineStepSpacing(typeId) {
  return AUTO_FILL_STEP_BY_TYPE[typeId] ?? 1;
}

function getLineDistanceLimit(typeId) {
  return getLineStepSpacing(typeId) > 1 ? 0.75 : 0.35;
}

function getLineProjection(originEntity, otherEntity) {
  const lineYaw = normalizeLineYaw(originEntity.getRotation().y);
  const direction = yawToDirection(lineYaw);
  const deltaX = otherEntity.location.x - originEntity.location.x;
  const deltaZ = otherEntity.location.z - originEntity.location.z;
  return (deltaX * direction.x) + (deltaZ * direction.z);
}

function hasProjectedNeighbor(entity, directionSign) {
  const stepSpacing = getLineStepSpacing(entity.typeId);
  const distanceLimit = getLineDistanceLimit(entity.typeId);
  const lineYaw = normalizeLineYaw(entity.getRotation().y);
  const direction = yawToDirection(lineYaw);
  const targetX = entity.location.x + (direction.x * stepSpacing * directionSign);
  const targetZ = entity.location.z + (direction.z * stepSpacing * directionSign);

  for (const compatibleTypeId of getCompatibleLineTypeIds(entity.typeId)) {
    for (const other of entity.dimension.getEntities({ type: compatibleTypeId })) {
      if (!other.isValid || other.id === entity.id) {
        continue;
      }

      if (!isSameLinePlacement(entity, other)) {
        continue;
      }

      const dx = other.location.x - targetX;
      const dz = other.location.z - targetZ;
      if (Math.hypot(dx, dz) <= distanceLimit && Math.abs(other.location.y - entity.location.y) <= 1.2) {
        return true;
      }
    }
  }

  return false;
}

function isLineEndpoint(entity) {
  return !hasProjectedNeighbor(entity, -1) || !hasProjectedNeighbor(entity, 1);
}

function findNearestCompatibleLineEndpoint(entity) {
  let bestEntity;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const compatibleTypeId of getCompatibleLineTypeIds(entity.typeId)) {
    for (const other of entity.dimension.getEntities({ type: compatibleTypeId })) {
      if (!other.isValid || other.id === entity.id) {
        continue;
      }

      if (!isSameLinePlacement(entity, other) || !isLineEndpoint(other)) {
        continue;
      }

      const projection = getLineProjection(entity, other);
      const absoluteDistance = Math.abs(projection);
      if (absoluteDistance < 1 + POSITION_EPSILON || absoluteDistance >= bestDistance) {
        continue;
      }

      bestEntity = other;
      bestDistance = absoluteDistance;
    }
  }

  return bestEntity;
}

function isSameLinePlacement(leftEntity, rightEntity) {
  const leftYaw = leftEntity.getRotation().y;
  const rightYaw = rightEntity.getRotation().y;
  const lineYaw = normalizeLineYaw(leftYaw);
  if (getCanonicalLineKey(leftEntity.typeId, leftYaw) !== getCanonicalLineKey(rightEntity.typeId, rightYaw)) {
    return false;
  }

  const direction = yawToDirection(lineYaw);
  const perpendicular = {
    x: -direction.z,
    z: direction.x,
  };
  const deltaX = rightEntity.location.x - leftEntity.location.x;
  const deltaZ = rightEntity.location.z - leftEntity.location.z;
  return Math.abs((deltaX * perpendicular.x) + (deltaZ * perpendicular.z)) <= 0.45;
}

function fillStraightLineBetweenEndpoints(startEntity, endEntity) {
  if (!startEntity.isValid || !endEntity.isValid) {
    return false;
  }

  if (!isSameLinePlacement(startEntity, endEntity)) {
    return false;
  }

  const lineYaw = normalizeLineYaw(startEntity.getRotation().y);
  const direction = yawToDirection(lineYaw);
  const projection = getLineProjection(startEntity, endEntity);
  if (Math.abs(projection) < 1 + POSITION_EPSILON) {
    return false;
  }

  const lowerEntity = projection >= 0 ? startEntity : endEntity;
  const upperEntity = projection >= 0 ? endEntity : startEntity;
  const span = Math.abs(projection);
  const stepSpacing = getLineStepSpacing(lowerEntity.typeId);
  const distanceLimit = getLineDistanceLimit(lowerEntity.typeId);
  const dimension = lowerEntity.dimension;
  const referenceYaw = getSnappedEntityYaw(lowerEntity);
  const referenceCanonicalSide = getCanonicalLineSide(lowerEntity.typeId, referenceYaw);
  const occupied = [];

  for (const compatibleTypeId of getCompatibleLineTypeIds(lowerEntity.typeId)) {
    for (const other of dimension.getEntities({ type: compatibleTypeId })) {
      if (!other.isValid || !isSameLinePlacement(lowerEntity, other)) {
        continue;
      }

      occupied.push(other);
    }
  }

  let filled = false;
  for (let step = stepSpacing; step < span - POSITION_EPSILON; step += stepSpacing) {
    const targetX = lowerEntity.location.x + (direction.x * step);
    const targetZ = lowerEntity.location.z + (direction.z * step);
    const targetY = lowerEntity.location.y + (((upperEntity.location.y - lowerEntity.location.y) * step) / span);
    const occupiedAlready = occupied.some((other) => {
      const dx = other.location.x - targetX;
      const dz = other.location.z - targetZ;
      return Math.hypot(dx, dz) <= distanceLimit && Math.abs(other.location.y - targetY) <= 1.2;
    });
    if (occupiedAlready) {
      continue;
    }

    const lineEntity = dimension.spawnEntity(lowerEntity.typeId, {
      x: targetX,
      y: targetY,
      z: targetZ,
    });
    applyEntityRotation(lineEntity, getActualLineYawForType(lowerEntity.typeId, lineYaw, referenceCanonicalSide));
    occupied.push(lineEntity);
    filled = true;
  }

  updateStraightLineTilt(lowerEntity);
  updateStraightLineTilt(upperEntity);
  return filled;
}

function autoFillStraightLine(entity, player) {
  if (!autoFillLineTypes.has(entity.typeId)) {
    return;
  }

  if (!player?.isValid) {
    updateStraightLineTilt(entity);
    return;
  }

  const placementYaw = entity.getRotation().y;
  const previousEntity = getRecentLinePlacement(player, entity.typeId, placementYaw, entity.dimension.id);
  if (previousEntity && previousEntity.id !== entity.id) {
    if (fillStraightLineBetweenEndpoints(previousEntity, entity)) {
      recentLinePlacementByPlayer.delete(getRecentLinePlacementKey(player, entity.typeId, placementYaw));
      return;
    }
  }

  const nearestEndpoint = findNearestCompatibleLineEndpoint(entity);
  if (nearestEndpoint && fillStraightLineBetweenEndpoints(nearestEndpoint, entity)) {
    recentLinePlacementByPlayer.delete(getRecentLinePlacementKey(player, entity.typeId, placementYaw));
    return;
  }

  rememberRecentLinePlacement(player, entity);
  updateStraightLineTilt(entity);
}

function collectAutoFillRunEntities(entity) {
  if (!autoFillLineTypes.has(entity.typeId)) {
    return [entity];
  }

  const dimension = entity.dimension;
  const lineYaw = normalizeLineYaw(entity.getRotation().y);
  const direction = yawToDirection(lineYaw);
  const perpendicular = {
    x: -direction.z,
    z: direction.x,
  };
  const centerX = entity.location.x;
  const centerY = entity.location.y;
  const centerZ = entity.location.z;
  const matchingEntities = [{ entity, projection: 0 }];

  for (const compatibleTypeId of getCompatibleLineTypeIds(entity.typeId)) {
    for (const other of dimension.getEntities({ type: compatibleTypeId })) {
      if (!other.isValid || other.id === entity.id) {
        continue;
      }

      if (!isClose(other.location.y, centerY, 1.2)) {
        continue;
      }

      if (!isSameLinePlacement(entity, other)) {
        continue;
      }

      const deltaX = other.location.x - centerX;
      const deltaZ = other.location.z - centerZ;
      const perpendicularDistance = Math.abs((deltaX * perpendicular.x) + (deltaZ * perpendicular.z));
      if (perpendicularDistance > 0.45) {
        continue;
      }

      const projection = (deltaX * direction.x) + (deltaZ * direction.z);
      matchingEntities.push({ entity: other, projection });
    }
  }

  const lower = matchingEntities
    .filter((other) => other.projection < -POSITION_EPSILON)
    .sort((left, right) => left.projection - right.projection)[0];
  const upper = matchingEntities
    .filter((other) => other.projection > POSITION_EPSILON)
    .sort((left, right) => right.projection - left.projection)[0];

  if (!lower || !upper) {
    return [entity];
  }

  const stepSpacing = getLineStepSpacing(entity.typeId);
  const distanceLimit = getLineDistanceLimit(entity.typeId);
  const minProjection = lower.projection - POSITION_EPSILON;
  const maxProjection = upper.projection + POSITION_EPSILON;

  return matchingEntities
    .filter((other) => other.projection >= minProjection && other.projection <= maxProjection)
    .filter((other) => {
      const snapped = Math.round(other.projection / stepSpacing) * stepSpacing;
      return Math.abs(other.projection - snapped) <= distanceLimit;
    })
    .map((other) => other.entity);
}

function removeTrafficEntityWithRun(player, entity) {
  if (!autoFillLineTypes.has(entity.typeId)) {
    removeTrafficEntity(player, entity);
    return;
  }

  const targets = collectAutoFillRunEntities(entity).filter((target) => target.isValid);
  const uniqueTargets = [...new Map(targets.map((target) => [target.id, target])).values()];

  for (const target of uniqueTargets) {
    target.remove();
  }

  if (uniqueTargets.length <= 1) {
    player.sendMessage(`${entity.typeId} removed.`);
    return;
  }

  player.sendMessage(`${entity.typeId} run removed (${uniqueTargets.length}).`);
}

function removeTrafficEntity(player, entity) {
  const removedName = entity.typeId;
  entity.remove();
  player.sendMessage(`${removedName} removed.`);
}

function cycleRoadSignal(entity) {
  const state = getIntProperty(entity, "traffic:road_state", 0);
  entity.setProperty("traffic:road_state", (state + 1) % 3);
}

function cycleRoadSignalModel(entity) {
  const variant = getIntProperty(entity, "traffic:road_model_variant", 0);
  entity.setProperty("traffic:road_model_variant", (variant + 1) % ROAD_SIGNAL_MODEL_VARIANT_COUNT);
}

function cycleGuidelineModel(entity) {
  const variant = getIntProperty(entity, "traffic:guideline_model_variant", 0);
  entity.setProperty("traffic:guideline_model_variant", (variant + 1) % GUIDELINE_MODEL_VARIANT_COUNT);
}

function cyclePedSignal(entity) {
  const state = getIntProperty(entity, "traffic:ped_state", 0);

  if (state === 0) {
    entity.setProperty("traffic:ped_state", 1);
    return;
  }

  if (state === 1) {
    entity.setProperty("traffic:ped_state", 2);
    return;
  }

  entity.setProperty("traffic:ped_state", state >= 9 ? 0 : state + 1);
}

function updateControllerNameTag(entity, duplicate = false) {
  const groupId = getIntProperty(entity, "traffic:group_id", 1);
  if (duplicate) {
    setNameTagIfChanged(entity, `CTL G${groupId} DUP`);
    return;
  }

  const enabled = getBoolProperty(entity, "traffic:enabled", true) ? "ON" : "OFF";
  const xRoadGreen = getIntProperty(entity, "traffic:x_road_green", 30);
  const zRoadGreen = getIntProperty(entity, "traffic:z_road_green", 30);
  const roadYellow = getIntProperty(entity, "traffic:road_yellow", 4);
  const allRed = getIntProperty(entity, "traffic:all_red", 2);
  const xPedWalk = getIntProperty(entity, "traffic:x_ped_walk", 8);
  const xPedFlash = getIntProperty(entity, "traffic:x_ped_flash", 8);
  const zPedWalk = getIntProperty(entity, "traffic:z_ped_walk", 8);
  const zPedFlash = getIntProperty(entity, "traffic:z_ped_flash", 8);

  setNameTagIfChanged(
    entity,
    `CTL G${groupId} ${enabled} XG${xRoadGreen} ZG${zRoadGreen} Y${roadYellow} AR${allRed} XP${xPedWalk}/${xPedFlash} ZP${zPedWalk}/${zPedFlash}`,
  );
}

function getNextControllerGroup(dimension) {
  const usedGroups = new Set();

  for (const controller of dimension.getEntities({ type: "traffic:controller" })) {
    const groupId = getIntProperty(controller, "traffic:group_id", 0);
    if (groupId >= 1 && groupId <= MAX_GROUP) {
      usedGroups.add(groupId);
    }
  }

  for (let groupId = 1; groupId <= MAX_GROUP; groupId++) {
    if (!usedGroups.has(groupId)) {
      return groupId;
    }
  }

  return 1;
}

function countControllersInGroup(dimension, groupId) {
  let count = 0;
  for (const controller of dimension.getEntities({ type: "traffic:controller" })) {
    if (getIntProperty(controller, "traffic:group_id", 0) === groupId) {
      count += 1;
    }
  }
  return count;
}

function countSignalsInGroup(dimension, typeId, groupId) {
  let count = 0;
  for (const entity of dimension.getEntities({ type: typeId })) {
    if (getIntProperty(entity, "traffic:group_id", 0) === groupId) {
      count += 1;
    }
  }
  return count;
}

function setSignalGroup(entity, groupId) {
  if (signalTypes.has(entity.typeId)) {
    entity.setProperty("traffic:group_id", groupId);
  }
}

function getBaseYFromPlacedEntity(entity) {
  const config = placementConfigByEntity.get(entity.typeId);
  if (!config) {
    return entity.location.y;
  }

  return entity.location.y - config.yOffset;
}

function getFloorMarkingSurfaceOffset(typeId) {
  return PARTICLE_MARKING_TYPES.has(typeId) ? PARTICLE_MARKING_SURFACE_OFFSET : FLOOR_MARKING_SURFACE_OFFSET;
}

function migrateExistingFloorMarkingsInDimension(dimensionId) {
  const dimension = world.getDimension(dimensionId);
  const changedLines = [];

  for (const typeId of floorMarkingTypes) {
    for (const entity of dimension.getEntities({ type: typeId })) {
      if (!entity.isValid) {
        continue;
      }

      const legacyOffsetX = getLegacyDiagonalAlignmentOffset(entity);
      const surfaceOffset = getFloorMarkingSurfaceOffset(entity.typeId);
      const blockY = Math.round(entity.location.y - surfaceOffset);
      const targetY = blockY + surfaceOffset;
      if (isClose(entity.location.y, targetY, 0.01) && Math.abs(legacyOffsetX) <= POSITION_EPSILON) {
        continue;
      }

      entity.teleport(
        {
          x: entity.location.x + legacyOffsetX,
          y: targetY,
          z: entity.location.z,
        },
        {
          rotation: entity.getRotation(),
          keepVelocity: false,
          checkForBlocks: false,
        },
      );
      if (autoFillLineTypes.has(entity.typeId)) {
        changedLines.push(entity);
      }
    }
  }

  for (const entity of changedLines) {
    if (entity.isValid) {
      updateStraightLineTilt(entity);
    }
  }
}

function initializePlacedTrafficEntity(entity, player, yaw, isNewController = false, controllerGroupId = 0) {
  const initialYaw = getAutoCornerYaw(entity, yaw);
  applyEntityRotation(entity, initialYaw);
  setSignalAxis(entity, axisFromYaw(initialYaw));
  autoFillStraightLine(entity, player);
  updateStraightLineTilt(entity);

  if (isNewController) {
    const groupId = controllerGroupId || getNextControllerGroup(entity.dimension);
    entity.setProperty("traffic:group_id", groupId);
    entity.setProperty("traffic:cycle_second", 0);
    entity.setProperty("traffic:enabled", true);
    setSelectedGroup(player, groupId);
    updateControllerNameTag(entity);
    player.sendMessage(`Placed controller group ${groupId}. Group ${groupId} selected.`);
    return;
  }

  if (!signalTypes.has(entity.typeId)) {
    return;
  }

  const selectedGroup = getSelectedGroup(player);
  if (selectedGroup > 0) {
    setSignalGroup(entity, selectedGroup);
    player.sendMessage(`${describeSignal(entity)} placed in group ${selectedGroup} on ${axisName(getSignalAxis(entity))} axis.`);
  }
}

function placeEntityAtEntityLocation(player, targetEntity, config, yaw) {
  const controllerGroupId = config.entity === "traffic:controller" ? getNextControllerGroup(targetEntity.dimension) : 0;
  const baseY = getBaseYFromPlacedEntity(targetEntity);
  const newEntity = targetEntity.dimension.spawnEntity(config.entity, {
    x: snapCenter(targetEntity.location.x),
    y: baseY + config.yOffset,
    z: snapCenter(targetEntity.location.z),
  });

  initializePlacedTrafficEntity(newEntity, player, yaw, config.entity === "traffic:controller", controllerGroupId);
}

function describeSignal(entity) {
  return entity.typeId === "traffic:road_signal" ? "Road signal" : "Ped signal";
}

function getMainhandItem(player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (!equippable) {
    return undefined;
  }

  return equippable.getEquipment(EquipmentSlot.Mainhand);
}

function collectSignalsByGroup(dimension, typeId, allowedGroups = undefined) {
  const map = new Map();

  for (const entity of dimension.getEntities({ type: typeId })) {
    const groupId = getIntProperty(entity, "traffic:group_id", 0);
    if (groupId <= 0 || (allowedGroups && !allowedGroups.has(groupId))) {
      continue;
    }

    const current = map.get(groupId) ?? [];
    current.push(entity);
    map.set(groupId, current);
  }

  return map;
}

function getPedStateForElapsed(elapsed, walk, flash) {
  if (elapsed < walk) {
    return 1;
  }

  if (elapsed < walk + flash && flash > 0) {
    const remaining = clamp(walk + flash - elapsed, 1, 8);
    return 10 - remaining;
  }

  return 0;
}

function getControllerState(controller) {
  const xRoadGreen = getIntProperty(controller, "traffic:x_road_green", 30);
  const zRoadGreen = getIntProperty(controller, "traffic:z_road_green", 30);
  const roadYellow = getIntProperty(controller, "traffic:road_yellow", 4);
  const allRed = getIntProperty(controller, "traffic:all_red", 2);
  const xPedWalk = getIntProperty(controller, "traffic:x_ped_walk", 8);
  const xPedFlash = getIntProperty(controller, "traffic:x_ped_flash", 8);
  const zPedWalk = getIntProperty(controller, "traffic:z_ped_walk", 8);
  const zPedFlash = getIntProperty(controller, "traffic:z_ped_flash", 8);
  const xActive = Math.max(xRoadGreen, xPedWalk + xPedFlash);
  const zActive = Math.max(zRoadGreen, zPedWalk + zPedFlash);
  const total = xActive + roadYellow + allRed + zActive + roadYellow + allRed;
  const cycleSecond = total > 0 ? getIntProperty(controller, "traffic:cycle_second", 0) % total : 0;

  let time = cycleSecond;
  if (time < xActive) {
    return {
      xRoad: time < xRoadGreen ? 2 : 0,
      zRoad: 0,
      xPed: getPedStateForElapsed(time, xPedWalk, xPedFlash),
      zPed: 0,
      total,
    };
  }

  time -= xActive;
  if (time < roadYellow) {
    return { xRoad: 1, zRoad: 0, xPed: 0, zPed: 0, total };
  }

  time -= roadYellow;
  if (time < allRed) {
    return { xRoad: 0, zRoad: 0, xPed: 0, zPed: 0, total };
  }

  time -= allRed;
  if (time < zActive) {
    return {
      xRoad: 0,
      zRoad: time < zRoadGreen ? 2 : 0,
      xPed: 0,
      zPed: getPedStateForElapsed(time, zPedWalk, zPedFlash),
      total,
    };
  }

  time -= zActive;
  if (time < roadYellow) {
    return { xRoad: 0, zRoad: 1, xPed: 0, zPed: 0, total };
  }

  return { xRoad: 0, zRoad: 0, xPed: 0, zPed: 0, total };
}

function processControllersInDimension(dimensionId) {
  const dimension = world.getDimension(dimensionId);
  const controllers = dimension.getEntities({ type: "traffic:controller" });
  if (controllers.length === 0) {
    return;
  }

  const controllerGroups = new Set();
  for (const controller of controllers) {
    const groupId = getIntProperty(controller, "traffic:group_id", 1);
    if (groupId >= 1 && groupId <= MAX_GROUP) {
      controllerGroups.add(groupId);
    }
  }

  if (controllerGroups.size === 0) {
    return;
  }

  const roadSignals = collectSignalsByGroup(dimension, "traffic:road_signal", controllerGroups);
  const pedSignals = collectSignalsByGroup(dimension, "traffic:ped_signal", controllerGroups);
  const processedGroups = new Set();

  for (const controller of controllers) {
    const groupId = getIntProperty(controller, "traffic:group_id", 1);

    if (processedGroups.has(groupId)) {
      updateControllerNameTag(controller, true);
      continue;
    }

    processedGroups.add(groupId);
    updateControllerNameTag(controller);

    const state = getControllerState(controller);
    for (const roadSignal of roadSignals.get(groupId) ?? []) {
      setIntPropertyIfChanged(
        roadSignal,
        "traffic:road_state",
        getSignalAxis(roadSignal) === AXIS_X ? state.xRoad : state.zRoad,
      );
    }

    for (const pedSignal of pedSignals.get(groupId) ?? []) {
      setIntPropertyIfChanged(
        pedSignal,
        "traffic:ped_state",
        getSignalAxis(pedSignal) === AXIS_X ? state.xPed : state.zPed,
      );
    }

    if (!getBoolProperty(controller, "traffic:enabled", true) || state.total <= 0) {
      continue;
    }

    controller.setProperty(
      "traffic:cycle_second",
      (getIntProperty(controller, "traffic:cycle_second", 0) + 1) % state.total,
    );
  }
}

async function showControllerSettingsForm(player, controller, openedByLegacyTool = false) {
  if (!player.isValid || !controller.isValid) {
    return;
  }

  const groupId = getIntProperty(controller, "traffic:group_id", 1);
  const selectedGroup = getSelectedGroup(player);
  const enabled = getBoolProperty(controller, "traffic:enabled", true);
  const xRoadGreen = getIntProperty(controller, "traffic:x_road_green", 30);
  const zRoadGreen = getIntProperty(controller, "traffic:z_road_green", 30);
  const roadYellow = getIntProperty(controller, "traffic:road_yellow", 4);
  const allRed = getIntProperty(controller, "traffic:all_red", 2);
  const xPedWalk = getIntProperty(controller, "traffic:x_ped_walk", 8);
  const xPedFlash = getIntProperty(controller, "traffic:x_ped_flash", 8);
  const zPedWalk = getIntProperty(controller, "traffic:z_ped_walk", 8);
  const zPedFlash = getIntProperty(controller, "traffic:z_ped_flash", 8);

  const form = new ModalFormData()
    .title(`Traffic Controller G${groupId}`)
    .label(
      `Selected group: ${selectedGroup || "none"}\nRoad signals use travel direction (X/Z). Ped signals use walk direction (X/Z).`,
    )
    .toggle("Enabled", enabled)
    .slider("X road green (seconds)", 5, 120, 5, xRoadGreen)
    .slider("Z road green (seconds)", 5, 120, 5, zRoadGreen)
    .slider("Road yellow (seconds)", 1, 20, 1, roadYellow)
    .slider("All red (seconds)", 0, 20, 1, allRed)
    .slider("X ped walk (seconds)", 1, 60, 1, xPedWalk)
    .slider("X ped countdown (seconds)", 0, 8, 1, xPedFlash)
    .slider("Z ped walk (seconds)", 1, 60, 1, zPedWalk)
    .slider("Z ped countdown (seconds)", 0, 8, 1, zPedFlash)
    .toggle("Reset cycle to start after save", false)
    .submitButton("Save");

  let response;
  try {
    response = await form.show(player);
  } catch (error) {
    if (player.isValid) {
      player.sendMessage("Could not open the controller UI. Close chat and try again.");
    }
    return;
  }

  if (response.canceled || !response.formValues || !player.isValid || !controller.isValid) {
    return;
  }

  const [
    enabledValue,
    xRoadGreenValue,
    zRoadGreenValue,
    roadYellowValue,
    allRedValue,
    xPedWalkValue,
    xPedFlashValue,
    zPedWalkValue,
    zPedFlashValue,
    resetCycleValue,
  ] = response.formValues;

  controller.setProperty("traffic:enabled", Boolean(enabledValue));
  controller.setProperty("traffic:x_road_green", clamp(Math.round(Number(xRoadGreenValue)), 5, 120));
  controller.setProperty("traffic:z_road_green", clamp(Math.round(Number(zRoadGreenValue)), 5, 120));
  controller.setProperty("traffic:road_yellow", clamp(Math.round(Number(roadYellowValue)), 1, 20));
  controller.setProperty("traffic:all_red", clamp(Math.round(Number(allRedValue)), 0, 20));
  controller.setProperty("traffic:x_ped_walk", clamp(Math.round(Number(xPedWalkValue)), 1, 60));
  controller.setProperty("traffic:x_ped_flash", clamp(Math.round(Number(xPedFlashValue)), 0, 8));
  controller.setProperty("traffic:z_ped_walk", clamp(Math.round(Number(zPedWalkValue)), 1, 60));
  controller.setProperty("traffic:z_ped_flash", clamp(Math.round(Number(zPedFlashValue)), 0, 8));

  if (Boolean(resetCycleValue)) {
    controller.setProperty("traffic:cycle_second", 0);
  }

  updateControllerNameTag(controller);
  player.sendMessage(`Controller group ${getIntProperty(controller, "traffic:group_id", 1)} settings updated.`);

  if (openedByLegacyTool) {
    player.sendMessage("Legacy timing wand detected. You can now use only the controller wand for timing edits.");
  }
}

async function showControllerGroupForm(player, controller) {
  if (!player.isValid || !controller.isValid) {
    return;
  }

  const groupId = getIntProperty(controller, "traffic:group_id", 1);
  const selectedGroup = getSelectedGroup(player);
  const roadCount = countSignalsInGroup(controller.dimension, "traffic:road_signal", groupId);
  const pedCount = countSignalsInGroup(controller.dimension, "traffic:ped_signal", groupId);

  const form = new ModalFormData()
    .title(`Controller Group G${groupId}`)
    .label(
      `Selected group: ${selectedGroup || "none"}\nLinked road signals: ${roadCount}\nLinked ped signals: ${pedCount}`,
    )
    .slider("Controller group id", 1, MAX_GROUP, 1, groupId)
    .toggle("Select this group after save", true)
    .submitButton("Save");

  let response;
  try {
    response = await form.show(player);
  } catch (error) {
    if (player.isValid) {
      player.sendMessage("Could not open the group UI. Close chat and try again.");
    }
    return;
  }

  if (response.canceled || !response.formValues || !player.isValid || !controller.isValid) {
    return;
  }

  const nextGroup = wrapGroup(Math.round(Number(response.formValues[0])));
  const selectAfterSave = Boolean(response.formValues[1]);

  controller.setProperty("traffic:group_id", nextGroup);
  controller.setProperty("traffic:cycle_second", 0);
  updateControllerNameTag(controller);

  if (selectAfterSave) {
    setSelectedGroup(player, nextGroup);
  }

  player.sendMessage(
    `Controller group set to ${nextGroup}.${selectAfterSave ? ` Group ${nextGroup} selected.` : ""}`,
  );

  const duplicates = countControllersInGroup(controller.dimension, nextGroup);
  if (duplicates > 1) {
    player.sendMessage(`Warning: ${duplicates} controllers now share group ${nextGroup}.`);
  }
}

async function showSignalGroupForm(player, signal) {
  if (!player.isValid || !signal.isValid) {
    return;
  }

  const currentGroup = getIntProperty(signal, "traffic:group_id", 0);
  const selectedGroup = getSelectedGroup(player);
  const currentAxis = getSignalAxis(signal);

  const form = new ActionFormData()
    .title(`${describeSignal(signal)} Group`)
    .body(
      `Current group: ${currentGroup || "none"}\nSelected group: ${selectedGroup || "none"}\nCurrent axis: ${axisName(currentAxis)}\n\nRoad signals use travel direction. Ped signals use walk direction.`,
    )
    .button(selectedGroup > 0 ? `Link to selected group ${selectedGroup}` : "No selected group")
    .button(currentGroup > 0 ? `Select current group ${currentGroup}` : "No current group")
    .button(`Switch axis to ${axisName(currentAxis === AXIS_X ? AXIS_Z : AXIS_X)}`)
    .button(currentGroup > 0 ? "Unlink signal" : "Nothing to unlink");

  let response;
  try {
    response = await form.show(player);
  } catch (error) {
    if (player.isValid) {
      player.sendMessage("Could not open the signal group UI. Close chat and try again.");
    }
    return;
  }

  if (response.canceled || !player.isValid || !signal.isValid) {
    return;
  }

  switch (response.selection) {
    case 0:
      if (selectedGroup <= 0) {
        player.sendMessage("No controller group is selected yet.");
        return;
      }
      setSignalGroup(signal, selectedGroup);
      player.sendMessage(`${describeSignal(signal)} linked to group ${selectedGroup} on ${axisName(getSignalAxis(signal))} axis.`);
      return;
    case 1:
      if (currentGroup <= 0) {
        player.sendMessage("This signal is not linked to any group.");
        return;
      }
      setSelectedGroup(player, currentGroup);
      player.sendMessage(`Selected controller group ${currentGroup}.`);
      return;
    case 2:
      setSignalAxis(signal, currentAxis === AXIS_X ? AXIS_Z : AXIS_X);
      player.sendMessage(`${describeSignal(signal)} axis set to ${axisName(getSignalAxis(signal))}.`);
      return;
    case 3:
      if (currentGroup <= 0) {
        player.sendMessage("This signal is already unlinked.");
        return;
      }
      setSignalGroup(signal, 0);
      player.sendMessage(`${describeSignal(signal)} link cleared.`);
      return;
    default:
      return;
  }
}

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  const heldItem = getMainhandItem(event.player);
  if (!isPlacementWand(heldItem)) {
    return;
  }

  event.cancel = true;
});

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  if (!event.isFirstEvent || !isPlacementWand(event.itemStack)) {
    return;
  }

  event.cancel = true;

  if (event.blockFace !== Direction.Up) {
    const player = event.player;
    system.run(() => {
      if (player.isValid) {
        player.sendMessage("Traffic props can only be placed on the top face of a block.");
      }
    });
    return;
  }

  const snappedYaw = snapRightAngle(yawFromViewDirection(event.player.getViewDirection()));
  const config = placementWands[event.itemStack.typeId];
  if (!config) {
    return;
  }

  const dimension = event.block.dimension;
  const location = event.block.location;
  const player = event.player;
  const nextControllerGroup = config.entity === "traffic:controller" ? getNextControllerGroup(dimension) : 0;

  system.run(() => {
    try {
      const entity = dimension.spawnEntity(config.entity, {
        x: location.x + 0.5,
        y: location.y + config.yOffset,
        z: location.z + 0.5,
      });

      initializePlacedTrafficEntity(
        entity,
        player,
        snappedYaw,
        entity.typeId === "traffic:controller",
        nextControllerGroup,
      );
    } catch (error) {
      if (player.isValid) {
        player.sendMessage(`Traffic placement failed: ${error}`);
      }
    }
  });
});

world.afterEvents.playerInteractWithEntity.subscribe((event) => {
  const itemStack = event.itemStack;
  if (!itemStack) {
    return;
  }

  if (itemStack.typeId === "traffic:group_wand") {
    const player = event.player;
    const target = event.target;

    if (!player.isValid || !target.isValid) {
      return;
    }

    if (target.typeId === "traffic:controller") {
      void showControllerGroupForm(player, target);
      return;
    }

    if (signalTypes.has(target.typeId)) {
      void showSignalGroupForm(player, target);
      return;
    }

    player.sendMessage("The group wand works on controllers and traffic signals.");
    return;
  }

  if (itemStack.typeId === removeToolId) {
    const player = event.player;
    const target = event.target;

    if (!player.isValid || !target.isValid) {
      return;
    }

    if (!trafficEntities.has(target.typeId)) {
      player.sendMessage("The remove wand only works on traffic addon entities.");
      return;
    }

    removeTrafficEntity(player, target);
    return;
  }

  if (itemStack.typeId === "traffic:controller_wand") {
    const player = event.player;
    const target = event.target;
    const snappedYaw = snapRightAngle(yawFromViewDirection(player.getViewDirection()));

    if (!player.isValid || !target.isValid) {
      return;
    }

    if (target.typeId === "traffic:controller") {
      void showControllerSettingsForm(player, target, false);
      return;
    }

    if (trafficEntities.has(target.typeId)) {
      const config = placementWands[itemStack.typeId];
      if (!config) {
        return;
      }

      placeEntityAtEntityLocation(player, target, config, snappedYaw);
      return;
    }

    player.sendMessage("Use the controller wand on a controller entity to open the control UI.");
    return;
  }

  if (isControllerUiTool(itemStack)) {
    const player = event.player;
    const target = event.target;

    if (!player.isValid || !target.isValid) {
      return;
    }

    if (target.typeId !== "traffic:controller") {
      player.sendMessage("Use the controller wand on a controller entity to open the control UI.");
      return;
    }

    void showControllerSettingsForm(player, target, true);
    return;
  }

  if (!isPlacementWand(itemStack) || itemStack.typeId === "traffic:controller_wand") {
    return;
  }

  if (!trafficEntities.has(event.target.typeId)) {
    return;
  }

  const entity = event.target;
  const player = event.player;
  const sneakAdjust = player.isSneaking;
  const snappedYaw = snapRightAngle(yawFromViewDirection(player.getViewDirection()));
  const config = placementWands[itemStack.typeId];
  if (!config) {
    return;
  }

  if (!entity.isValid || !player.isValid) {
    return;
  }

  if (config.entity !== entity.typeId) {
    placeEntityAtEntityLocation(player, entity, config, snappedYaw);
    return;
  }

  if (sneakAdjust && entity.typeId === "traffic:road_signal") {
    cycleRoadSignal(entity);
    return;
  }

  if (sneakAdjust && entity.typeId === "traffic:ped_signal") {
    cyclePedSignal(entity);
    return;
  }

  rotateTrafficEntity(entity);
});

world.afterEvents.entityHitEntity.subscribe((event) => {
  if (event.damagingEntity.typeId !== "minecraft:player") {
    return;
  }

  const player = event.damagingEntity;
  const hitEntity = event.hitEntity;
  const heldItem = getMainhandItem(player);
  if (!heldItem) {
    return;
  }

  if (heldItem.typeId === removeToolId) {
    if (!player.isValid || !hitEntity.isValid) {
      return;
    }

    if (!trafficEntities.has(hitEntity.typeId)) {
      player.sendMessage("The remove wand only works on traffic addon entities.");
      return;
    }

    removeTrafficEntityWithRun(player, hitEntity);
    return;
  }

  if (heldItem.typeId === "traffic:road_signal_wand" && hitEntity.typeId === "traffic:road_signal") {
    if (!player.isValid || !hitEntity.isValid) {
      return;
    }

    cycleRoadSignalModel(hitEntity);
    player.sendMessage(`Road signal model set to ${getIntProperty(hitEntity, "traffic:road_model_variant", 0) + 1}.`);
    return;
  }

  if (heldItem.typeId === "traffic:guideline_wand" && hitEntity.typeId === "traffic:guideline") {
    if (!player.isValid || !hitEntity.isValid) {
      return;
    }

    cycleGuidelineModel(hitEntity);
    player.sendMessage(`Guideline model set to ${getIntProperty(hitEntity, "traffic:guideline_model_variant", 0) + 1}.`);
    return;
  }

  if (heldItem.typeId !== "traffic:stop_line_wand" || hitEntity.typeId !== "traffic:stop_line") {
    return;
  }

  if (!player.isValid || !hitEntity.isValid) {
    return;
  }

  const nextFrame = getNextStopLineFrame(getIntProperty(hitEntity, "traffic:stop_line_frame", 0));
  hitEntity.setProperty("traffic:stop_line_frame", nextFrame);
  player.sendMessage(`Stop line frame set to ${nextFrame}.`);
});

system.runInterval(() => {
  cleanupRecentLinePlacements();
  for (const dimensionId of DIMENSION_IDS) {
    processControllersInDimension(dimensionId);
  }
}, 20);

let remainingFloorMigrationPasses = 1;
const floorMigrationIntervalId = system.runInterval(() => {
  for (const dimensionId of DIMENSION_IDS) {
    migrateExistingFloorMarkingsInDimension(dimensionId);
  }

  remainingFloorMigrationPasses -= 1;
  if (remainingFloorMigrationPasses <= 0) {
    system.clearRun(floorMigrationIntervalId);
  }
}, 40);
