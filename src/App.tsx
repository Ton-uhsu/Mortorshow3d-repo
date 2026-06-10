import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { FloorPlanEditor } from "./components/FloorPlanEditor";
import { InspectorPanel } from "./components/InspectorPanel";
import { defaultFloorPlanImage, defaultFloorPlanSize } from "./data/defaultFloorPlan";
import { loadBoothCatalog } from "./lib/boothCatalog";
import {
  extractPdfBoothLabels,
  renderPdfFloorPlan,
} from "./lib/floorPlanPdf";
import { planDoorRoute } from "./lib/routePlanner";
import type { PdfBoothLabel } from "./lib/floorPlanPdf";
import type {
  BoothCatalogEntry,
  BoothObject,
  DoorObject,
  FloorPlanSize,
  RectDraft,
  SelectedMapObject,
  ToolMode,
  WalkwayObject,
} from "./types";

const ThreePreview = lazy(async () => {
  const module = await import("./components/ThreePreview");
  return { default: module.ThreePreview };
});

const CATEGORY_COLORS = {
  standard: "#60a5fa",
  premium: "#f59e0b",
  food: "#ef4444",
  stage: "#8b5cf6",
  service: "#14b8a6",
} satisfies Record<BoothObject["category"], string>;

const DEFAULT_PDF_ASSET = "/Doc/THAI-Construction-Manual-crop.pdf";
const DEFAULT_CSV_ASSET = "/config/Mortorshow3d-config.csv";
const MAIN_TOP_CODES = new Set([
  "A22",
  "A20",
  "A16,A18",
  "A14",
  "A12",
  "A12/1",
  "A10",
  "A8",
  "A6",
  "A4",
  "A2",
]);
const MAIN_BOTTOM_CODES = new Set([
  "A25",
  "A24",
  "A23",
  "A21",
  "A19",
  "A17",
  "A15",
  "A13",
  "A11",
  "A9",
  "A7",
  "A5",
  "A3",
  "A1",
]);

type PdfSource = string | Uint8Array | null;
interface PixelRect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

function createBoothId() {
  return `booth-${Math.random().toString(36).slice(2, 9)}`;
}

function createWalkwayId() {
  return `walkway-${Math.random().toString(36).slice(2, 9)}`;
}

function createDoorId() {
  return `door-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function insetPixelRect(
  rect: PixelRect,
  pageWidth: number,
  pageHeight: number,
  insetX: number,
  insetY: number,
): RectDraft {
  const x = rect.x + insetX;
  const y = rect.y + insetY;
  const width = Math.max(rect.width - insetX * 2, 8);
  const depth = Math.max(rect.depth - insetY * 2, 8);

  return {
    x: clamp(x / pageWidth, 0, 0.98),
    y: clamp(y / pageHeight, 0, 0.98),
    width: clamp(width / pageWidth, 0.015, 0.96),
    depth: clamp(depth / pageHeight, 0.015, 0.96),
  };
}

function readImageSize(file: File): Promise<FloorPlanSize> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      resolve({
        width: image.naturalWidth || defaultFloorPlanSize.width,
        height: image.naturalHeight || defaultFloorPlanSize.height,
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image size"));
    };

    image.src = objectUrl;
  });
}

async function fileToDataUrl(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return `data:${file.type};base64,${btoa(binary)}`;
}

function getCatalogCategory(entry: BoothCatalogEntry): BoothObject["category"] {
  if (entry.section.includes("MOTORCYCLE")) {
    return "service";
  }

  return "premium";
}

function createBoothFromRect(
  label: PdfBoothLabel,
  catalogEntries: BoothCatalogEntry[],
  rect: RectDraft,
  extrudeHeight = 0.2,
): BoothObject {
  const entry = catalogEntries.find((item) => item.code === label.code);
  const category = entry ? getCatalogCategory(entry) : /^M/i.test(label.code) ? "service" : "premium";

  return {
    id: createBoothId(),
    name: label.code,
    boothCode: entry?.code,
    category,
    color: CATEGORY_COLORS[category],
    x: clamp(rect.x, 0, 0.98),
    y: clamp(rect.y, 0, 0.98),
    width: clamp(rect.width, 0.02, 0.96),
    depth: clamp(rect.depth, 0.02, 0.96),
    extrudeHeight,
    rotation: 0,
  };
}

function createRowBooths(
  labels: PdfBoothLabel[],
  catalogEntries: BoothCatalogEntry[],
  pageWidth: number,
  pageHeight: number,
  topPx: number,
  bottomPx: number,
) {
  if (!labels.length) {
    return [] as BoothObject[];
  }

  const sorted = [...labels].sort((left, right) => left.x - right.x);
  const boundaries = sorted.map((label, index) => {
    if (index === 0) {
      const next = sorted[index + 1];
      const gap = next ? next.x - label.x : pageWidth * 0.08;
      return clamp(label.x - gap * 0.5, 0, pageWidth);
    }

    const previous = sorted[index - 1];
    return (previous.x + label.x) / 2;
  });

  boundaries.push(
    (() => {
      const last = sorted.at(-1)!;
      const previous = sorted.at(-2);
      const gap = previous ? last.x - previous.x : pageWidth * 0.08;
      return clamp(last.x + gap * 0.5, 0, pageWidth);
    })(),
  );

  return sorted.map((label, index) =>
    createBoothFromRect(
      label,
      catalogEntries,
      insetPixelRect(
        {
          x: boundaries[index],
          y: topPx,
          width: boundaries[index + 1] - boundaries[index],
          depth: bottomPx - topPx,
        },
        pageWidth,
        pageHeight,
        3.5,
        5,
      ),
      0.2,
    ),
  );
}

function createLooseBooth(
  label: PdfBoothLabel,
  catalogEntries: BoothCatalogEntry[],
  widthPx: number,
  heightPx: number,
  offsetXPx = 2,
  offsetYPx = 6,
) {
  return createBoothFromRect(
    label,
    catalogEntries,
    insetPixelRect(
      {
        x: label.x - offsetXPx,
        y: label.y - offsetYPx,
        width: widthPx,
        depth: heightPx,
      },
      label.pageWidth,
      label.pageHeight,
      /^M/i.test(label.code) ? 1.5 : 2,
      /^M/i.test(label.code) ? 1.5 : 2.5,
    ),
    0.2,
  );
}

async function buildSuggestedBoothsFromPdf(
  source: string | Uint8Array,
  catalogEntries: BoothCatalogEntry[],
) {
  const labels = await extractPdfBoothLabels(source);
  const pageWidth = labels[0]?.pageWidth ?? 1;
  const pageHeight = labels[0]?.pageHeight ?? 1;
  const mainTop = labels.filter((label) => MAIN_TOP_CODES.has(label.code));
  const mainBottom = labels.filter((label) => MAIN_BOTTOM_CODES.has(label.code));
  const remaining = labels.filter(
    (label) => !MAIN_TOP_CODES.has(label.code) && !MAIN_BOTTOM_CODES.has(label.code),
  );

  const looseBooths = remaining.map((label) => {
    if (label.code === "A1/1") {
      return createLooseBooth(label, catalogEntries, 28, 22, 3, 8);
    }

    if (/^A\d+\/\d+$/i.test(label.code)) {
      return createLooseBooth(label, catalogEntries, 20, 14, 2, 4);
    }

    if (/^M\d+/i.test(label.code)) {
      return createLooseBooth(
        label,
        catalogEntries,
        label.y < 90 ? 18 : 24,
        label.y < 90 ? 16 : 22,
        2,
        5,
      );
    }

    return createLooseBooth(label, catalogEntries, 26, 62, 4, 8);
  });

  return [
    ...createRowBooths(mainTop, catalogEntries, pageWidth, pageHeight, 6, 68),
    ...createRowBooths(mainBottom, catalogEntries, pageWidth, pageHeight, 83, 154),
    ...looseBooths,
  ];
}

export default function App() {
  const [booths, setBooths] = useState<BoothObject[]>([]);
  const [walkways, setWalkways] = useState<WalkwayObject[]>([]);
  const [doors, setDoors] = useState<DoorObject[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<BoothCatalogEntry[]>([]);
  const [catalogStatus, setCatalogStatus] = useState("Loading catalog...");
  const [floorPlanStatus, setFloorPlanStatus] = useState("No floor plan loaded");
  const [floorPlanImage, setFloorPlanImage] = useState(defaultFloorPlanImage);
  const [floorPlanSize, setFloorPlanSize] = useState<FloorPlanSize>(defaultFloorPlanSize);
  const [floorName, setFloorName] = useState("New Custom Map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<SelectedMapObject>(null);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [gridVisible, setGridVisible] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [autoDrawEnabled, setAutoDrawEnabled] = useState(false);
  const [currentPdfSource, setCurrentPdfSource] = useState<PdfSource>(null);
  const [copiedBooth, setCopiedBooth] = useState<BoothObject | null>(null);
  const [fromDoorId, setFromDoorId] = useState<string | null>(null);
  const [toDoorId, setToDoorId] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const selectedBooth = useMemo(
    () => booths.find((booth) => booth.id === selectedId) ?? null,
    [booths, selectedId],
  );
  const selectedCatalogEntry = useMemo(
    () =>
      catalogEntries.find((entry) => entry.code === selectedBooth?.boothCode) ?? null,
    [catalogEntries, selectedBooth?.boothCode],
  );
  const routePath = useMemo(
    () =>
      planDoorRoute({
        booths,
        doors,
        fromDoorId,
        toDoorId,
        walkways,
      }),
    [booths, doors, fromDoorId, toDoorId, walkways],
  );
  const routeStatus = useMemo(() => {
    if (!fromDoorId || !toDoorId) {
      return "Pick two doors";
    }

    if (walkways.length === 0) {
      return "Draw a walkway first";
    }

    return routePath ? `${routePath.points.length} route points` : "No valid walkway route";
  }, [fromDoorId, routePath, toDoorId, walkways.length]);

  useEffect(() => {
    const doorIds = new Set(doors.map((door) => door.id));

    if (fromDoorId && !doorIds.has(fromDoorId)) {
      setFromDoorId(null);
    }

    if (toDoorId && !doorIds.has(toDoorId)) {
      setToDoorId(null);
    }
  }, [doors, fromDoorId, toDoorId]);

  useEffect(() => {
    if (!selectedObject) {
      return;
    }

    const stillExists =
      (selectedObject.type === "booth" &&
        booths.some((booth) => booth.id === selectedObject.id)) ||
      (selectedObject.type === "walkway" &&
        walkways.some((walkway) => walkway.id === selectedObject.id)) ||
      (selectedObject.type === "door" && doors.some((door) => door.id === selectedObject.id));

    if (!stillExists) {
      setSelectedObject(null);
      setSelectedId(null);
    }
  }, [booths, doors, selectedObject, walkways]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const catalog = await loadBoothCatalog(DEFAULT_CSV_ASSET);

        if (!active) {
          return;
        }

        setCatalogEntries(catalog);
        setCatalogStatus(`Loaded ${catalog.length} booth records`);
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unable to load default assets";
        setCatalogStatus(message);
        setFloorPlanStatus(message);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const clearNavigationObjects = () => {
    setWalkways([]);
    setDoors([]);
    setFromDoorId(null);
    setToDoorId(null);
    setSelectedObject((current) => (current?.type === "booth" ? current : null));
  };

  const selectMapObject = (selection: SelectedMapObject) => {
    setSelectedObject(selection);
    setSelectedId(selection?.type === "booth" ? selection.id : null);
  };

  const loadRouteDemo = () => {
    const demoBoothA: BoothObject = {
      id: createBoothId(),
      name: "Demo booth A",
      category: "standard",
      color: CATEGORY_COLORS.standard,
      x: 0.34,
      y: 0.3,
      width: 0.16,
      depth: 0.2,
      extrudeHeight: 0.7,
      rotation: 0,
    };
    const demoBoothB: BoothObject = {
      id: createBoothId(),
      name: "Demo booth B",
      category: "standard",
      color: CATEGORY_COLORS.standard,
      x: 0.65,
      y: 0.3,
      width: 0.16,
      depth: 0.2,
      extrudeHeight: 0.7,
      rotation: 0,
    };
    const demoBoothC: BoothObject = {
      id: createBoothId(),
      name: "Demo booth C",
      category: "service",
      color: CATEGORY_COLORS.service,
      x: 0.78,
      y: 0.57,
      width: 0.1,
      depth: 0.16,
      extrudeHeight: 0.7,
      rotation: 0,
    };
    const demoWalkways: WalkwayObject[] = [
      {
        id: createWalkwayId(),
        name: "walkway A",
        x: 0.39,
        y: 0.49,
        width: 0.07,
        depth: 0.2,
      },
      {
        id: createWalkwayId(),
        name: "walkway B",
        x: 0.39,
        y: 0.62,
        width: 0.38,
        depth: 0.08,
      },
      {
        id: createWalkwayId(),
        name: "walkway C",
        x: 0.7,
        y: 0.49,
        width: 0.07,
        depth: 0.2,
      },
      {
        id: createWalkwayId(),
        name: "walkway D",
        x: 0.76,
        y: 0.62,
        width: 0.09,
        depth: 0.06,
      },
    ];
    const demoDoorA: DoorObject = {
      id: createDoorId(),
      name: "door A",
      boothId: demoBoothA.id,
      edge: "bottom",
      x: demoBoothA.x + demoBoothA.width / 2,
      y: demoBoothA.y + demoBoothA.depth,
    };
    const demoDoorB: DoorObject = {
      id: createDoorId(),
      name: "door B",
      boothId: demoBoothB.id,
      edge: "bottom",
      x: demoBoothB.x + demoBoothB.width / 2,
      y: demoBoothB.y + demoBoothB.depth,
    };
    const demoDoorC: DoorObject = {
      id: createDoorId(),
      name: "door C",
      boothId: demoBoothC.id,
      edge: "bottom",
      x: demoBoothC.x + demoBoothC.width / 2,
      y: demoBoothC.y + demoBoothC.depth,
    };

    setFloorName("Route Demo");
    setFloorPlanImage(defaultFloorPlanImage);
    setFloorPlanSize(defaultFloorPlanSize);
    setCurrentPdfSource(null);
    setBooths([demoBoothA, demoBoothB, demoBoothC]);
    setWalkways(demoWalkways);
    setDoors([demoDoorA, demoDoorB, demoDoorC]);
    setFromDoorId(demoDoorA.id);
    setToDoorId(demoDoorB.id);
    selectMapObject({ type: "door", id: demoDoorA.id });
    setToolMode("select");
    setFloorPlanStatus("Loaded route demo with booths, doors, and walkway turns");
  };

  const loadPresetProject = async () => {
    setCatalogStatus("Reloading catalog...");
    setFloorPlanStatus("Loading preset...");
    setFloorName("THAI Construction Manual");
    setCurrentPdfSource(DEFAULT_PDF_ASSET);

    try {
      const catalog = await loadBoothCatalog(DEFAULT_CSV_ASSET);
      const renderedFloorPlan = await renderPdfFloorPlan(DEFAULT_PDF_ASSET);
      setCatalogEntries(catalog);
      setCatalogStatus(`Loaded ${catalog.length} booth records`);
      setFloorPlanImage(renderedFloorPlan.image);
      setFloorPlanSize(renderedFloorPlan.size);

      if (autoDrawEnabled) {
        const suggestedBooths = await buildSuggestedBoothsFromPdf(DEFAULT_PDF_ASSET, catalog);
        setBooths(suggestedBooths);
        clearNavigationObjects();
        selectMapObject(
          suggestedBooths[0] ? { type: "booth", id: suggestedBooths[0].id } : null,
        );
        setFloorPlanStatus(`Preset loaded + auto-drew ${suggestedBooths.length} booths`);
        return;
      }

      setBooths([]);
      clearNavigationObjects();
      selectMapObject(null);
      setFloorPlanStatus("Preset loaded. Auto draw is off");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load preset assets";
      setCatalogStatus(message);
      setFloorPlanStatus(message);
    }
  };

  const addBooth = (rect: RectDraft) => {
    const nextIndex = booths.length + 1;
    const booth: BoothObject = {
      id: createBoothId(),
      name: `booth${nextIndex}`,
      category: "standard",
      color: CATEGORY_COLORS.standard,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      depth: rect.depth,
      extrudeHeight: 0.2,
      rotation: 0,
    };

    setBooths((current) => [...current, booth]);
    selectMapObject({ type: "booth", id: booth.id });
    setToolMode("select");
  };

  const addWalkway = (rect: RectDraft) => {
    const nextIndex = walkways.length + 1;
    const walkway: WalkwayObject = {
      id: createWalkwayId(),
      name: `walkway${nextIndex}`,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      depth: rect.depth,
    };

    setWalkways((current) => [...current, walkway]);
    selectMapObject({ type: "walkway", id: walkway.id });
    setToolMode("select");
  };

  const addDoor = (door: Omit<DoorObject, "id" | "name">) => {
    const nextIndex = doors.length + 1;
    const nextDoor: DoorObject = {
      ...door,
      id: createDoorId(),
      name: `door${nextIndex}`,
    };

    setDoors((current) => [...current, nextDoor]);
    selectMapObject({ type: "door", id: nextDoor.id });
    if (!fromDoorId) {
      setFromDoorId(nextDoor.id);
    } else if (!toDoorId) {
      setToDoorId(nextDoor.id);
    }
  };

  const updateBooth = (id: string, patch: Partial<BoothObject>) => {
    setBooths((current) =>
      current.map((booth) => {
        if (booth.id !== id) {
          return booth;
        }

        const nextX = patch.x ?? booth.x;
        const nextY = patch.y ?? booth.y;
        const nextWidth = patch.width ?? booth.width;
        const nextDepth = patch.depth ?? booth.depth;

        return {
          ...booth,
          ...patch,
          x: clamp(nextX, 0, 1 - nextWidth),
          y: clamp(nextY, 0, 1 - nextDepth),
          width: clamp(nextWidth, 0.02, 1 - nextX),
          depth: clamp(nextDepth, 0.02, 1 - nextY),
        };
      }),
    );
  };

  const updateWalkway = (id: string, patch: Partial<WalkwayObject>) => {
    setWalkways((current) =>
      current.map((walkway) => {
        if (walkway.id !== id) {
          return walkway;
        }

        const nextX = patch.x ?? walkway.x;
        const nextY = patch.y ?? walkway.y;
        const nextWidth = patch.width ?? walkway.width;
        const nextDepth = patch.depth ?? walkway.depth;

        return {
          ...walkway,
          ...patch,
          x: clamp(nextX, 0, 1 - nextWidth),
          y: clamp(nextY, 0, 1 - nextDepth),
          width: clamp(nextWidth, 0.02, 1 - nextX),
          depth: clamp(nextDepth, 0.02, 1 - nextY),
        };
      }),
    );
  };

  const assignCatalogEntry = (id: string, code: string) => {
    const entry = catalogEntries.find((item) => item.code === code);

    setBooths((current) =>
      current.map((booth) => {
        if (booth.id !== id) {
          return booth;
        }

        if (!entry) {
          return {
            ...booth,
            boothCode: undefined,
          };
        }

        const shouldReplaceName =
          !booth.name.trim() ||
          /^booth\d+$/i.test(booth.name) ||
          booth.name === booth.boothCode;
        const category = getCatalogCategory(entry);

        return {
          ...booth,
          boothCode: entry.code,
          name: shouldReplaceName ? entry.code : booth.name,
          category,
          color: CATEGORY_COLORS[category],
        };
      }),
    );
  };

  const deleteSelectedObject = () => {
    if (!selectedObject) {
      return;
    }

    if (selectedObject.type === "booth") {
      setBooths((current) => current.filter((booth) => booth.id !== selectedObject.id));
      setDoors((current) => current.filter((door) => door.boothId !== selectedObject.id));
    }

    if (selectedObject.type === "walkway") {
      setWalkways((current) => current.filter((walkway) => walkway.id !== selectedObject.id));
    }

    if (selectedObject.type === "door") {
      setDoors((current) => current.filter((door) => door.id !== selectedObject.id));
    }

    selectMapObject(null);
  };

  const duplicateBooth = (source: BoothObject) => {
    const duplicate: BoothObject = {
      ...source,
      id: createBoothId(),
      name: `${source.name}-copy`,
      x: clamp(source.x + 0.02, 0, 1 - source.width),
      y: clamp(source.y + 0.02, 0, 1 - source.depth),
    };

    setBooths((current) => [...current, duplicate]);
    selectMapObject({ type: "booth", id: duplicate.id });
  };

  const duplicateSelected = () => {
    if (!selectedBooth) {
      return;
    }

    duplicateBooth(selectedBooth);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedObject) {
        event.preventDefault();
        deleteSelectedObject();
        return;
      }

      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (!isModifierPressed) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "c" && selectedBooth) {
        event.preventDefault();
        setCopiedBooth(selectedBooth);
        return;
      }

      if (key === "v") {
        const source = copiedBooth ?? selectedBooth;

        if (!source) {
          return;
        }

        event.preventDefault();
        duplicateBooth(source);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [copiedBooth, selectedBooth, selectedObject]);

  const autoDrawCurrentPdf = async (source: PdfSource = currentPdfSource) => {
    if (!source) {
      setFloorPlanStatus("Auto draw works only when the current floor plan came from a PDF");
      return;
    }

    const suggestedBooths = await buildSuggestedBoothsFromPdf(source, catalogEntries);
    setBooths(suggestedBooths);
    clearNavigationObjects();
    selectMapObject(
      suggestedBooths[0] ? { type: "booth", id: suggestedBooths[0].id } : null,
    );
    setToolMode("select");
    setFloorPlanStatus(`Auto-drew ${suggestedBooths.length} booths from PDF labels`);
  };

  const handleUpload = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      const rawBuffer = await file.arrayBuffer();
      const renderSource = new Uint8Array(rawBuffer.slice(0));
      const storedSource = new Uint8Array(rawBuffer.slice(0));
      const rendered = await renderPdfFloorPlan(renderSource);
      setCurrentPdfSource(storedSource);
      setFloorPlanImage(rendered.image);
      setFloorPlanSize(rendered.size);
      setFloorName(file.name.replace(/\.[^.]+$/, ""));

      if (autoDrawEnabled) {
        const detectSource = new Uint8Array(rawBuffer.slice(0));
        const suggestedBooths = await buildSuggestedBoothsFromPdf(detectSource, catalogEntries);
        setBooths(suggestedBooths);
        clearNavigationObjects();
        selectMapObject(
          suggestedBooths[0] ? { type: "booth", id: suggestedBooths[0].id } : null,
        );
        setFloorPlanStatus(`Custom PDF loaded + auto-drew ${suggestedBooths.length} booths`);
        return;
      }

      setBooths([]);
      clearNavigationObjects();
      selectMapObject(null);
      setFloorPlanStatus("Custom PDF loaded. Auto draw is off");
      return;
    }

    const nextSize = await readImageSize(file);
    const dataUrl = await fileToDataUrl(file);
    setCurrentPdfSource(null);
    setFloorPlanImage(dataUrl);
    setFloorPlanSize(nextSize);
    setBooths([]);
    clearNavigationObjects();
    selectMapObject(null);
    setFloorPlanStatus("Custom image floor plan loaded");
    setFloorName(file.name.replace(/\.[^.]+$/, ""));
  };

  const exportProject = () => {
    const payload = {
      floorName,
      exportedAt: new Date().toISOString(),
      booths,
      doors,
      route: {
        distance: routePath?.distance ?? null,
        fromDoorId,
        points: routePath?.points ?? [],
        toDoorId,
      },
      walkways,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mortorshow3d-map.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetProject = () => {
    setBooths([]);
    clearNavigationObjects();
    selectMapObject(null);
    setToolMode("select");
    setFloorName("New Custom Map");
    setFloorPlanImage(defaultFloorPlanImage);
    setFloorPlanSize(defaultFloorPlanSize);
    setFloorPlanStatus("No floor plan loaded");
    setCurrentPdfSource(null);
  };

  const clearAllMapObjects = () => {
    setBooths([]);
    clearNavigationObjects();
    selectMapObject(null);
    setToolMode("select");
    setFloorPlanStatus("Cleared all map objects");
  };

  const categorySummary = useMemo(() => {
    return booths.reduce<Record<string, number>>((summary, booth) => {
      summary[booth.category] = (summary[booth.category] ?? 0) + 1;
      return summary;
    }, {});
  }, [booths]);

  return (
    <div className="app-shell">
      <header className="hero-bar">
        <div className="hero-title">
          <div className="nav-pill">M</div>
          <div>
            <p className="eyebrow">Mortorshow3D Editor</p>
            <h1>{floorName}</h1>
            <span>Using the real construction manual PDF as floor plan and the real CSV booth config as the catalog source.</span>
          </div>
        </div>

        <div className="hero-actions">
          <button
            className="primary-button"
            onClick={() => uploadRef.current?.click()}
            type="button"
          >
            Upload floor plan
          </button>
          <button
            className="ghost-button"
            onClick={() => {
              void loadPresetProject();
            }}
            type="button"
          >
            Load preset
          </button>
          <button className="ghost-button" onClick={loadRouteDemo} type="button">
            Route demo
          </button>
          <button
            className="ghost-button"
            onClick={() => {
              void autoDrawCurrentPdf();
            }}
            type="button"
          >
            Auto draw booths
          </button>
          <button className="ghost-button" onClick={exportProject} type="button">
            Export JSON
          </button>
          <button
            className="danger-button"
            disabled={!selectedObject}
            onClick={deleteSelectedObject}
            type="button"
          >
            Delete selected
          </button>
          <button className="danger-button" onClick={clearAllMapObjects} type="button">
            Clear all
          </button>
          <button className="ghost-button" onClick={resetProject} type="button">
            Reset project
          </button>
          <input
            accept="image/*,.pdf,application/pdf"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleUpload(file);
              }
              event.currentTarget.value = "";
            }}
            ref={uploadRef}
            type="file"
          />
        </div>
      </header>

      <main className="studio-layout">
        <aside className="studio-sidebar">
          <section className="dashboard-strip sidebar-strip">
            <div className="status-card">
              <span>Total booths</span>
              <strong>{booths.length}</strong>
            </div>
            <div className="status-card">
              <span>Navigation</span>
              <strong>
                {walkways.length} walkways / {doors.length} doors
              </strong>
            </div>
            <div className="status-card">
              <span>Catalog</span>
              <strong>{catalogStatus}</strong>
            </div>
            <div className="status-card">
              <span>Floor plan</span>
              <strong>{floorPlanStatus}</strong>
            </div>
            <div className="switch-row">
              <label>
                <input
                  checked={autoDrawEnabled}
                  onChange={(event) => setAutoDrawEnabled(event.target.checked)}
                  type="checkbox"
                />
                Auto draw PDF
              </label>
              <label>
                <input
                  checked={gridVisible}
                  onChange={(event) => setGridVisible(event.target.checked)}
                  type="checkbox"
                />
                Grid
              </label>
              <label>
                <input
                  checked={showLabels}
                  onChange={(event) => setShowLabels(event.target.checked)}
                  type="checkbox"
                />
                Labels
              </label>
            </div>
          </section>

          <section className="directions-card">
            <header className="panel-header">
              <div>
                <p className="eyebrow">Directions</p>
                <h2>Route preview</h2>
              </div>
            </header>

            <div className="field-grid">
              <label className="field">
                <span>From door</span>
                <select
                  onChange={(event) => setFromDoorId(event.target.value || null)}
                  value={fromDoorId ?? ""}
                >
                  <option value="">Select start</option>
                  {doors.map((door) => (
                    <option key={door.id} value={door.id}>
                      {door.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>To door</span>
                <select
                  onChange={(event) => setToDoorId(event.target.value || null)}
                  value={toDoorId ?? ""}
                >
                  <option value="">Select destination</option>
                  {doors.map((door) => (
                    <option key={door.id} value={door.id}>
                      {door.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="meta-card">
              <div>
                <span>Status</span>
                <strong>{routeStatus}</strong>
              </div>
              <div>
                <span>Route distance</span>
                <strong>{routePath ? `${(routePath.distance * 100).toFixed(1)} units` : "-"}</strong>
              </div>
            </div>
          </section>

          <InspectorPanel
            booth={selectedBooth}
            catalogEntries={catalogEntries}
            catalogEntry={selectedCatalogEntry}
            onAssignCatalogEntry={(code) => {
              if (selectedId) {
                assignCatalogEntry(selectedId, code);
              }
            }}
            onDelete={deleteSelectedObject}
            onDuplicate={duplicateSelected}
            onUpdate={(patch) => {
              if (selectedId) {
                updateBooth(selectedId, patch);
              }
            }}
          />

          <section className="summary-card">
            <header className="panel-header">
              <div>
                <p className="eyebrow">Map Summary</p>
                <h2>Category mix</h2>
              </div>
            </header>

            <div className="summary-list">
              {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                <div className="summary-row" key={category}>
                  <span className="dot" style={{ backgroundColor: color }} />
                  <span>{category}</span>
                  <strong>{categorySummary[category] ?? 0}</strong>
                </div>
              ))}
            </div>

            <div className="meta-card">
              <div>
                <span>Catalog rows</span>
                <strong>{catalogEntries.length}</strong>
              </div>
              <div>
                <span>Real asset source</span>
                <strong>{currentPdfSource ? "PDF + CSV" : "Image + CSV"}</strong>
              </div>
            </div>

            <div className="roadmap-note">
              <strong>Next step</strong>
              <p>The auto-draw is tailored to this PDF layout. Next we can refine the left-side mini booths and add snapping for exact booth edges.</p>
            </div>
          </section>
        </aside>

        <div className="studio-main">
          <FloorPlanEditor
            booths={booths}
            doors={doors}
            floorPlanImage={floorPlanImage}
            floorPlanSize={floorPlanSize}
            gridVisible={gridVisible}
            onAddBooth={addBooth}
            onAddDoor={addDoor}
            onAddWalkway={addWalkway}
            onDeleteSelected={deleteSelectedObject}
            onSelectObject={selectMapObject}
            onToolModeChange={setToolMode}
            onUpdateBooth={updateBooth}
            onUpdateWalkway={updateWalkway}
            routePath={routePath}
            selectedObject={selectedObject}
            showLabels={showLabels}
            toolMode={toolMode}
            walkways={walkways}
          />

          <Suspense
            fallback={
              <section className="preview-card loading-card">
                <header className="panel-header">
                  <div>
                    <p className="eyebrow">3D Preview</p>
                    <h2>Extruded scene</h2>
                  </div>
                </header>
                <div className="empty-state">
                  <strong>Loading 3D engine</strong>
                  <p>Editor is ready. The 3D preview panel is loading separately to keep the first paint fast.</p>
                </div>
              </section>
            }
          >
            <ThreePreview
              booths={booths}
              doors={doors}
              floorPlanImage={floorPlanImage}
              floorPlanSize={floorPlanSize}
              routePath={routePath}
              selectedId={selectedId}
              walkways={walkways}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
