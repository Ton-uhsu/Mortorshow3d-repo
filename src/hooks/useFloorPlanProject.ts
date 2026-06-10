import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CSV_ASSET,
  DEFAULT_PDF_ASSET,
} from "../constants/editor";
import { defaultFloorPlanImage, defaultFloorPlanSize } from "../data/defaultFloorPlan";
import { loadBoothCatalog } from "../lib/boothCatalog";
import { buildRouteDemo } from "../lib/demoProject";
import { fileToDataUrl, readImageSize } from "../lib/floorPlanFiles";
import { renderPdfFloorPlan } from "../lib/floorPlanPdf";
import {
  applyCatalogEntryToBooth,
  createBoothFromDraft,
  createDoorFromPlacement,
  createWalkwayFromDraft,
  duplicateBoothObject,
  patchBoothWithinBounds,
  patchWalkwayWithinBounds,
} from "../lib/mapObjects";
import { buildSuggestedBoothsFromPdf, type PdfSource } from "../lib/pdfAutoDraw";
import { planDoorRoute } from "../lib/routePlanner";
import type {
  BoothCatalogEntry,
  BoothObject,
  DoorObject,
  FloorPlanSize,
  RectDraft,
  SelectedMapObject,
  ToolMode,
  WalkwayObject,
} from "../types";
import { useEditorShortcuts } from "./useEditorShortcuts";

function getAutoDrawSelection(booths: BoothObject[]): SelectedMapObject {
  return booths[0] ? { type: "booth", id: booths[0].id } : null;
}

export function useFloorPlanProject() {
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
  const categorySummary = useMemo(
    () =>
      booths.reduce<Record<string, number>>((summary, booth) => {
        summary[booth.category] = (summary[booth.category] ?? 0) + 1;
        return summary;
      }, {}),
    [booths],
  );

  const selectMapObject = (selection: SelectedMapObject) => {
    setSelectedObject(selection);
    setSelectedId(selection?.type === "booth" ? selection.id : null);
  };

  const clearNavigationObjects = () => {
    setWalkways([]);
    setDoors([]);
    setFromDoorId(null);
    setToDoorId(null);
    setSelectedObject((current) => (current?.type === "booth" ? current : null));
  };

  const applySuggestedBooths = (nextBooths: BoothObject[], status: string) => {
    setBooths(nextBooths);
    clearNavigationObjects();
    selectMapObject(getAutoDrawSelection(nextBooths));
    setToolMode("select");
    setFloorPlanStatus(status);
  };

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

  const loadRouteDemo = () => {
    const demo = buildRouteDemo();

    setFloorName(demo.floorName);
    setFloorPlanImage(demo.floorPlanImage);
    setFloorPlanSize(demo.floorPlanSize);
    setCurrentPdfSource(null);
    setBooths(demo.booths);
    setWalkways(demo.walkways);
    setDoors(demo.doors);
    setFromDoorId(demo.fromDoorId);
    setToDoorId(demo.toDoorId);
    selectMapObject(demo.selectedObject);
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
        applySuggestedBooths(
          suggestedBooths,
          `Preset loaded + auto-drew ${suggestedBooths.length} booths`,
        );
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
    const booth = createBoothFromDraft(rect, booths.length + 1);

    setBooths((current) => [...current, booth]);
    selectMapObject({ type: "booth", id: booth.id });
    setToolMode("select");
  };

  const addWalkway = (rect: RectDraft) => {
    const walkway = createWalkwayFromDraft(rect, walkways.length + 1);

    setWalkways((current) => [...current, walkway]);
    selectMapObject({ type: "walkway", id: walkway.id });
    setToolMode("select");
  };

  const addDoor = (door: Omit<DoorObject, "id" | "name">) => {
    const nextDoor = createDoorFromPlacement(door, doors.length + 1);

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
      current.map((booth) => (booth.id === id ? patchBoothWithinBounds(booth, patch) : booth)),
    );
  };

  const updateWalkway = (id: string, patch: Partial<WalkwayObject>) => {
    setWalkways((current) =>
      current.map((walkway) =>
        walkway.id === id ? patchWalkwayWithinBounds(walkway, patch) : walkway,
      ),
    );
  };

  const assignCatalogEntry = (id: string, code: string) => {
    const entry = catalogEntries.find((item) => item.code === code);

    setBooths((current) =>
      current.map((booth) => (booth.id === id ? applyCatalogEntryToBooth(booth, entry) : booth)),
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
    const duplicate = duplicateBoothObject(source);

    setBooths((current) => [...current, duplicate]);
    selectMapObject({ type: "booth", id: duplicate.id });
  };

  const duplicateSelected = () => {
    if (!selectedBooth) {
      return;
    }

    duplicateBooth(selectedBooth);
  };

  useEditorShortcuts({
    copiedBooth,
    onCopyBooth: setCopiedBooth,
    onDeleteSelected: deleteSelectedObject,
    onDuplicateBooth: duplicateBooth,
    selectedBooth,
    selectedObject,
  });

  const autoDrawCurrentPdf = async (source: PdfSource = currentPdfSource) => {
    if (!source) {
      setFloorPlanStatus("Auto draw works only when the current floor plan came from a PDF");
      return;
    }

    const suggestedBooths = await buildSuggestedBoothsFromPdf(source, catalogEntries);
    applySuggestedBooths(
      suggestedBooths,
      `Auto-drew ${suggestedBooths.length} booths from PDF labels`,
    );
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
        applySuggestedBooths(
          suggestedBooths,
          `Custom PDF loaded + auto-drew ${suggestedBooths.length} booths`,
        );
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

  return {
    addBooth,
    addDoor,
    addWalkway,
    assignCatalogEntry,
    autoDrawCurrentPdf,
    autoDrawEnabled,
    booths,
    catalogEntries,
    catalogStatus,
    categorySummary,
    clearAllMapObjects,
    currentPdfSource,
    deleteSelectedObject,
    doors,
    duplicateSelected,
    exportProject,
    floorName,
    floorPlanImage,
    floorPlanSize,
    floorPlanStatus,
    fromDoorId,
    gridVisible,
    handleUpload,
    loadPresetProject,
    loadRouteDemo,
    resetProject,
    routePath,
    routeStatus,
    selectedBooth,
    selectedCatalogEntry,
    selectedId,
    selectedObject,
    selectMapObject,
    setAutoDrawEnabled,
    setFromDoorId,
    setGridVisible,
    setShowLabels,
    setToDoorId,
    setToolMode,
    showLabels,
    toDoorId,
    toolMode,
    updateBooth,
    updateWalkway,
    walkways,
  };
}
