export type ToolMode =
  | "select"
  | "draw-booth"
  | "draw-walkway"
  | "place-door"
  | "place-start";

export type BoothCategory =
  | "standard"
  | "premium"
  | "food"
  | "stage"
  | "service";

export interface BoothObject {
  id: string;
  name: string;
  boothCode?: string;
  logoUrl?: string | null;
  category: BoothCategory;
  color: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  extrudeHeight: number;
  rotation: number;
}

export interface WalkwayObject {
  id: string;
  name: string;
  points: RoutePoint[];
  width: number;
}

export type DoorEdge = "top" | "right" | "bottom" | "left";

export interface DoorObject {
  id: string;
  name: string;
  boothId: string;
  edge: DoorEdge;
  x: number;
  y: number;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export interface RoutePath {
  points: RoutePoint[];
  distance: number;
}

export type SelectedMapObject =
  | { type: "booth"; id: string }
  | { type: "walkway"; id: string }
  | { type: "door"; id: string }
  | null;

export interface RectDraft {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export interface FloorPlanSize {
  width: number;
  height: number;
}

export interface BoothCatalogEntry {
  code: string;
  companyThai: string;
  companyEnglish: string;
  brandThai: string;
  brandEnglish: string;
  section: string;
  logoUrl: string | null;
}
