import type { BoothObject, DoorObject, RoutePath, RoutePoint, WalkwayObject } from "../types";

const GRID_COLUMNS = 96;
const GRID_ROWS = 54;
const DOOR_SEARCH_RADIUS = 10;
const OBSTACLE_PADDING_X = 0.25 / GRID_COLUMNS;
const OBSTACLE_PADDING_Y = 0.25 / GRID_ROWS;
const WALKWAY_GRID_TOLERANCE = Math.max(1 / GRID_COLUMNS, 1 / GRID_ROWS) * 0.55;
const ROUTE_POINT_EPSILON = 0.00001;

interface GridNode {
  col: number;
  row: number;
}

interface PlannerInput {
  booths: BoothObject[];
  doors: DoorObject[];
  fromDoorId: string | null;
  toDoorId: string | null;
  walkways: WalkwayObject[];
}

interface WalkwaySegment {
  end: RoutePoint;
  index: number;
  start: RoutePoint;
  walkway: WalkwayObject;
}

interface SegmentProjection {
  distance: number;
  point: RoutePoint;
  segment: WalkwaySegment;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointInsideRect(point: RoutePoint, rect: { x: number; y: number; width: number; depth: number }) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.depth
  );
}

function routePointKey(point: RoutePoint) {
  return `${Math.round(point.x / ROUTE_POINT_EPSILON)}:${Math.round(point.y / ROUTE_POINT_EPSILON)}`;
}

function sameRoutePoint(left: RoutePoint, right: RoutePoint) {
  return Math.hypot(left.x - right.x, left.y - right.y) <= ROUTE_POINT_EPSILON;
}

function getWalkwaySegments(walkways: WalkwayObject[]) {
  return walkways.flatMap((walkway) =>
    walkway.points.flatMap((start, index): WalkwaySegment[] => {
      const end = walkway.points[index + 1];

      return end ? [{ end, index, start, walkway }] : [];
    }),
  );
}

function distanceToSegment(point: RoutePoint, start: RoutePoint, end: RoutePoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const ratio = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    0,
    1,
  );
  const closest = {
    x: start.x + ratio * dx,
    y: start.y + ratio * dy,
  };

  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

function projectPointToSegment(point: RoutePoint, start: RoutePoint, end: RoutePoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return start;
  }

  const ratio = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    0,
    1,
  );

  return {
    x: start.x + ratio * dx,
    y: start.y + ratio * dy,
  };
}

function segmentPointRatio(point: RoutePoint, segment: WalkwaySegment) {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return 0;
  }

  return clamp(
    ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) /
      lengthSquared,
    0,
    1,
  );
}

function getSegmentIntersection(left: WalkwaySegment, right: WalkwaySegment) {
  const ax = left.start.x;
  const ay = left.start.y;
  const bx = left.end.x;
  const by = left.end.y;
  const cx = right.start.x;
  const cy = right.start.y;
  const dx = right.end.x;
  const dy = right.end.y;
  const leftX = bx - ax;
  const leftY = by - ay;
  const rightX = dx - cx;
  const rightY = dy - cy;
  const denominator = leftX * rightY - leftY * rightX;

  if (Math.abs(denominator) <= ROUTE_POINT_EPSILON) {
    return null;
  }

  const cxax = cx - ax;
  const cyay = cy - ay;
  const leftRatio = (cxax * rightY - cyay * rightX) / denominator;
  const rightRatio = (cxax * leftY - cyay * leftX) / denominator;

  if (
    leftRatio < -ROUTE_POINT_EPSILON ||
    leftRatio > 1 + ROUTE_POINT_EPSILON ||
    rightRatio < -ROUTE_POINT_EPSILON ||
    rightRatio > 1 + ROUTE_POINT_EPSILON
  ) {
    return null;
  }

  return {
    x: ax + leftRatio * leftX,
    y: ay + leftRatio * leftY,
  };
}

function pointInsideWalkway(point: RoutePoint, walkway: WalkwayObject) {
  return walkway.points.some((start, index) => {
    const end = walkway.points[index + 1];

    if (!end) {
      return false;
    }

    return distanceToSegment(point, start, end) <= walkway.width / 2 + WALKWAY_GRID_TOLERANCE;
  });
}

function nodeKey(node: GridNode) {
  return `${node.col}:${node.row}`;
}

function nodeToPoint(node: GridNode): RoutePoint {
  return {
    x: (node.col + 0.5) / GRID_COLUMNS,
    y: (node.row + 0.5) / GRID_ROWS,
  };
}

function pointToNode(point: RoutePoint): GridNode {
  return {
    col: clamp(Math.floor(point.x * GRID_COLUMNS), 0, GRID_COLUMNS - 1),
    row: clamp(Math.floor(point.y * GRID_ROWS), 0, GRID_ROWS - 1),
  };
}

function createWalkableGrid(booths: BoothObject[], walkways: WalkwayObject[]) {
  return Array.from({ length: GRID_ROWS }, (_, row) =>
    Array.from({ length: GRID_COLUMNS }, (_, col) => {
      const point = nodeToPoint({ col, row });
      const insideWalkway = walkways.some((walkway) => pointInsideWalkway(point, walkway));
      const insideBooth = booths.some((booth) =>
        pointInsideRect(point, {
          x: booth.x - OBSTACLE_PADDING_X,
          y: booth.y - OBSTACLE_PADDING_Y,
          width: booth.width + OBSTACLE_PADDING_X * 2,
          depth: booth.depth + OBSTACLE_PADDING_Y * 2,
        }),
      );

      return insideWalkway && !insideBooth;
    }),
  );
}

function isWalkable(grid: boolean[][], node: GridNode) {
  return Boolean(grid[node.row]?.[node.col]);
}

function findNearestWalkableNode(grid: boolean[][], point: RoutePoint) {
  const origin = pointToNode(point);

  if (isWalkable(grid, origin)) {
    return origin;
  }

  let best: GridNode | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let radius = 1; radius <= DOOR_SEARCH_RADIUS; radius += 1) {
    for (let row = origin.row - radius; row <= origin.row + radius; row += 1) {
      for (let col = origin.col - radius; col <= origin.col + radius; col += 1) {
        const node = { col, row };

        if (
          col < 0 ||
          row < 0 ||
          col >= GRID_COLUMNS ||
          row >= GRID_ROWS ||
          !isWalkable(grid, node)
        ) {
          continue;
        }

        const distance = Math.abs(col - origin.col) + Math.abs(row - origin.row);

        if (distance < bestDistance) {
          best = node;
          bestDistance = distance;
        }
      }
    }

    if (best) {
      return best;
    }
  }

  return null;
}

function getNeighbors(node: GridNode) {
  return [
    { col: node.col + 1, row: node.row },
    { col: node.col - 1, row: node.row },
    { col: node.col, row: node.row + 1 },
    { col: node.col, row: node.row - 1 },
  ];
}

function heuristic(left: GridNode, right: GridNode) {
  return Math.abs(left.col - right.col) + Math.abs(left.row - right.row);
}

function reconstructPath(cameFrom: Map<string, string>, currentKey: string) {
  const keys = [currentKey];
  let cursor = currentKey;

  while (cameFrom.has(cursor)) {
    cursor = cameFrom.get(cursor)!;
    keys.unshift(cursor);
  }

  return keys.map((key) => {
    const [col, row] = key.split(":").map(Number);
    return nodeToPoint({ col, row });
  });
}

function findPath(grid: boolean[][], start: GridNode, goal: GridNode) {
  const open = new Set<string>([nodeKey(start)]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[nodeKey(start), 0]]);
  const fScore = new Map<string, number>([[nodeKey(start), heuristic(start, goal)]]);

  while (open.size > 0) {
    let currentKey = "";
    let currentScore = Number.POSITIVE_INFINITY;

    for (const key of open) {
      const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;

      if (score < currentScore) {
        currentKey = key;
        currentScore = score;
      }
    }

    const [col, row] = currentKey.split(":").map(Number);
    const current = { col, row };

    if (current.col === goal.col && current.row === goal.row) {
      return reconstructPath(cameFrom, currentKey);
    }

    open.delete(currentKey);

    for (const neighbor of getNeighbors(current)) {
      if (
        neighbor.col < 0 ||
        neighbor.row < 0 ||
        neighbor.col >= GRID_COLUMNS ||
        neighbor.row >= GRID_ROWS ||
        !isWalkable(grid, neighbor)
      ) {
        continue;
      }

      const neighborKey = nodeKey(neighbor);
      const tentativeGScore = (gScore.get(currentKey) ?? Number.POSITIVE_INFINITY) + 1;

      if (tentativeGScore >= (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }

      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentativeGScore);
      fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, goal));
      open.add(neighborKey);
    }
  }

  return null;
}

function findNearestSegmentProjection(
  point: RoutePoint,
  segments: WalkwaySegment[],
): SegmentProjection | null {
  let best: SegmentProjection | null = null;

  for (const segment of segments) {
    const projected = projectPointToSegment(point, segment.start, segment.end);
    const distance = Math.hypot(point.x - projected.x, point.y - projected.y);

    if (!best || distance < best.distance) {
      best = {
        distance,
        point: projected,
        segment,
      };
    }
  }

  return best;
}

function addUniquePoint(points: RoutePoint[], point: RoutePoint) {
  if (!points.some((current) => sameRoutePoint(current, point))) {
    points.push(point);
  }
}

function segmentGraphKey(segment: WalkwaySegment) {
  return `${segment.walkway.id}:${segment.index}`;
}

function findWalkwayGraphPath(
  walkways: WalkwayObject[],
  fromDoor: DoorObject,
  toDoor: DoorObject,
) {
  const segments = getWalkwaySegments(walkways);

  if (segments.length === 0) {
    return null;
  }

  const startProjection = findNearestSegmentProjection(fromDoor, segments);
  const goalProjection = findNearestSegmentProjection(toDoor, segments);

  if (!startProjection || !goalProjection) {
    return null;
  }

  const pointsBySegment = new Map<string, RoutePoint[]>();

  for (const segment of segments) {
    const key = segmentGraphKey(segment);
    pointsBySegment.set(key, [segment.start, segment.end]);
  }

  for (let leftIndex = 0; leftIndex < segments.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < segments.length; rightIndex += 1) {
      const left = segments[leftIndex];
      const right = segments[rightIndex];
      const intersection = getSegmentIntersection(left, right);

      if (!intersection) {
        continue;
      }

      addUniquePoint(pointsBySegment.get(segmentGraphKey(left))!, intersection);
      addUniquePoint(pointsBySegment.get(segmentGraphKey(right))!, intersection);
    }
  }

  addUniquePoint(pointsBySegment.get(segmentGraphKey(startProjection.segment))!, startProjection.point);
  addUniquePoint(pointsBySegment.get(segmentGraphKey(goalProjection.segment))!, goalProjection.point);

  const pointByKey = new Map<string, RoutePoint>();
  const neighbors = new Map<string, Array<{ cost: number; key: string }>>();

  const ensurePoint = (point: RoutePoint) => {
    const key = routePointKey(point);

    if (!pointByKey.has(key)) {
      pointByKey.set(key, point);
      neighbors.set(key, []);
    }

    return key;
  };

  const addEdge = (left: RoutePoint, right: RoutePoint) => {
    if (sameRoutePoint(left, right)) {
      return;
    }

    const leftKey = ensurePoint(left);
    const rightKey = ensurePoint(right);
    const cost = Math.hypot(left.x - right.x, left.y - right.y);

    neighbors.get(leftKey)!.push({ cost, key: rightKey });
    neighbors.get(rightKey)!.push({ cost, key: leftKey });
  };

  for (const segment of segments) {
    const points = pointsBySegment.get(segmentGraphKey(segment)) ?? [];
    const sortedPoints = [...points].sort(
      (left, right) => segmentPointRatio(left, segment) - segmentPointRatio(right, segment),
    );

    for (let index = 1; index < sortedPoints.length; index += 1) {
      addEdge(sortedPoints[index - 1], sortedPoints[index]);
    }
  }

  const startKey = ensurePoint(startProjection.point);
  const goalKey = ensurePoint(goalProjection.point);
  const open = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();
  const distances = new Map<string, number>([[startKey, 0]]);

  while (open.size > 0) {
    let currentKey = "";
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const key of open) {
      const distance = distances.get(key) ?? Number.POSITIVE_INFINITY;

      if (distance < currentDistance) {
        currentKey = key;
        currentDistance = distance;
      }
    }

    if (currentKey === goalKey) {
      const keys = [currentKey];
      let cursor = currentKey;

      while (cameFrom.has(cursor)) {
        cursor = cameFrom.get(cursor)!;
        keys.unshift(cursor);
      }

      return keys.map((key) => pointByKey.get(key)!);
    }

    open.delete(currentKey);

    for (const neighbor of neighbors.get(currentKey) ?? []) {
      const nextDistance = currentDistance + neighbor.cost;

      if (nextDistance >= (distances.get(neighbor.key) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }

      cameFrom.set(neighbor.key, currentKey);
      distances.set(neighbor.key, nextDistance);
      open.add(neighbor.key);
    }
  }

  return null;
}

function measurePath(points: RoutePoint[]) {
  return points.reduce((sum, point, index) => {
    const previous = points[index - 1];

    if (!previous) {
      return sum;
    }

    return sum + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
}

function simplifyPath(points: RoutePoint[]) {
  if (points.length <= 2) {
    return points;
  }

  const simplified = [points[0]];
  let previousDirection = {
    x: Math.sign(points[1].x - points[0].x),
    y: Math.sign(points[1].y - points[0].y),
  };

  for (let index = 2; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const direction = {
      x: Math.sign(current.x - previous.x),
      y: Math.sign(current.y - previous.y),
    };

    if (direction.x !== previousDirection.x || direction.y !== previousDirection.y) {
      simplified.push(previous);
    }

    previousDirection = direction;
  }

  simplified.push(points.at(-1)!);
  return simplified;
}

function compactRoutePoints(points: RoutePoint[]) {
  return points.filter((point, index) => {
    const previous = points[index - 1];

    return !previous || !sameRoutePoint(previous, point);
  });
}

export function planDoorRoute({
  booths,
  doors,
  fromDoorId,
  toDoorId,
  walkways,
}: PlannerInput): RoutePath | null {
  if (!fromDoorId || !toDoorId || fromDoorId === toDoorId || walkways.length === 0) {
    return null;
  }

  const fromDoor = doors.find((door) => door.id === fromDoorId);
  const toDoor = doors.find((door) => door.id === toDoorId);

  if (!fromDoor || !toDoor) {
    return null;
  }

  const graphPoints = findWalkwayGraphPath(walkways, fromDoor, toDoor);

  if (graphPoints && graphPoints.length >= 2) {
    const routePoints = compactRoutePoints([
      fromDoor,
      ...simplifyPath(graphPoints),
      toDoor,
    ]);

    return {
      points: routePoints,
      distance: measurePath(routePoints),
    };
  }

  const grid = createWalkableGrid(booths, walkways);
  const start = findNearestWalkableNode(grid, fromDoor);
  const goal = findNearestWalkableNode(grid, toDoor);

  if (!start || !goal) {
    return null;
  }

  const points = findPath(grid, start, goal);

  if (!points || points.length < 2) {
    return null;
  }

  const routePoints = [fromDoor, ...simplifyPath(points), toDoor];

  return {
    points: routePoints,
    distance: measurePath(points),
  };
}
