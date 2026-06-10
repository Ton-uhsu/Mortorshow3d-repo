import type { BoothObject, DoorObject, RoutePath, RoutePoint, WalkwayObject } from "../types";

const GRID_COLUMNS = 96;
const GRID_ROWS = 54;
const DOOR_SEARCH_RADIUS = 10;
const OBSTACLE_PADDING_X = 1 / GRID_COLUMNS;
const OBSTACLE_PADDING_Y = 1 / GRID_ROWS;
const WALKWAY_GRID_TOLERANCE = Math.max(1 / GRID_COLUMNS, 1 / GRID_ROWS) * 0.55;

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
