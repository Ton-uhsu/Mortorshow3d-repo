import { Suspense, lazy, useRef } from "react";
import { EditorHeader } from "./components/app/EditorHeader";
import { StatusOverview } from "./components/app/StatusOverview";
import { SummaryPanel } from "./components/app/SummaryPanel";
import { FloorPlanEditor } from "./components/FloorPlanEditor";
import { InspectorPanel } from "./components/InspectorPanel";
import { useFloorPlanProject } from "./hooks/useFloorPlanProject";
import { ui } from "./lib/ui";

const ThreePreview = lazy(async () => {
  const module = await import("./components/ThreePreview");
  return { default: module.ThreePreview };
});

export default function App() {
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const project = useFloorPlanProject();
  const routePanelProps = {
    booths: project.booths,
    doors: project.doors,
    fromDoorId: project.fromDoorId,
    onDestinationTypeChange: project.setRouteDestinationType,
    onFromDoorChange: project.setFromDoorId,
    onRouteStartModeChange: project.setRouteStartMode,
    onRouteStartPointChange: project.placeRouteStartPoint,
    onToBoothChange: project.setToBoothId,
    onToDoorChange: project.setToDoorId,
    routeDestinationType: project.routeDestinationType,
    routeDistance: project.routePath?.distance ?? null,
    routeStartMode: project.routeStartMode,
    routeStartPoint: project.routeStartPoint,
    routeStatus: project.routeStatus,
    toBoothId: project.toBoothId,
    toDoorId: project.toDoorId,
  };

  return (
    <div className="min-h-screen p-3 md:p-4">
      <EditorHeader
        floorName={project.floorName}
        isAZoneDemoLoading={project.isAZoneDemoLoading}
        onExport={project.exportProject}
        onHandleUpload={(file) => {
          void project.handleUpload(file);
        }}
        onLoadAZonePdfDemo={() => {
          void project.loadAZonePdfDemo();
        }}
        onLoadRouteDemo={project.loadRouteDemo}
        uploadRef={uploadRef}
      />

      <main className="mt-4 grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="grid content-start gap-4 xl:sticky xl:top-4">
          <StatusOverview
            boothCount={project.booths.length}
            catalogStatus={project.catalogStatus}
            doorCount={project.doors.length}
            floorPlanOpacity={project.floorPlanOpacity}
            floorPlanStatus={project.floorPlanStatus}
            gridVisible={project.gridVisible}
            onFloorPlanOpacityChange={project.setFloorPlanOpacity}
            onGridVisibleChange={project.setGridVisible}
            onShowLabelsChange={project.setShowLabels}
            showLabels={project.showLabels}
            walkwayCount={project.walkways.length}
          />

          <InspectorPanel
            booth={project.selectedBooth}
            catalogEntries={project.catalogEntries}
            catalogEntry={project.selectedCatalogEntry}
            onAssignCatalogEntry={(code) => {
              if (project.selectedId) {
                project.assignCatalogEntry(project.selectedId, code);
              }
            }}
            onDelete={project.deleteSelectedObject}
            onDuplicate={project.duplicateSelected}
            onUpdate={(patch) => {
              if (project.selectedId) {
                project.updateBooth(project.selectedId, patch);
              }
            }}
          />

          <SummaryPanel
            catalogCount={project.catalogEntries.length}
            categorySummary={project.categorySummary}
            hasPdfSource={Boolean(project.currentPdfSource)}
          />
        </aside>

        <div className="grid gap-4">
          <FloorPlanEditor
            booths={project.booths}
            doors={project.doors}
            floorPlanImage={project.floorPlanImage}
            floorPlanOpacity={project.floorPlanOpacity}
            floorPlanSize={project.floorPlanSize}
            gridVisible={project.gridVisible}
            onAddBooth={project.addBooth}
            onAddDoor={project.addDoor}
            onAddWalkway={project.addWalkway}
            onClearAll={project.clearAllMapObjects}
            onDeleteSelected={project.deleteSelectedObject}
            onSelectObject={project.selectMapObject}
            onResetProject={project.resetProject}
            onRouteStartPointChange={project.placeRouteStartPoint}
            onToolModeChange={project.setToolMode}
            onUpdateBooth={project.updateBooth}
            onUpdateWalkway={project.updateWalkway}
            routePath={project.routePath}
            routeStartPoint={project.routeStartPoint}
            selectedObject={project.selectedObject}
            showLabels={project.showLabels}
            toolMode={project.toolMode}
            walkways={project.walkways}
          />

          <Suspense
            fallback={
              <section className={`${ui.panel} flex min-h-[420px] flex-col lg:min-h-[calc(100vh-8.5rem)]`}>
                <header className={ui.panelHeader}>
                  <div>
                    <p className={ui.eyebrow}>3D Preview</p>
                    <h2 className={ui.panelTitle}>Extruded scene</h2>
                  </div>
                </header>
                <div className={ui.emptyState}>
                  <strong className={ui.emptyStateTitle}>Loading 3D engine</strong>
                  <p className={ui.sectionText}>
                    Editor is ready. The 3D preview panel is loading separately to keep
                    the first paint fast.
                  </p>
                </div>
              </section>
            }
          >
            <ThreePreview
              booths={project.booths}
              doors={project.doors}
              floorPlanImage={project.floorPlanImage}
              floorPlanOpacity={project.floorPlanOpacity}
              floorPlanSize={project.floorPlanSize}
              routePath={project.routePath}
              routePanel={routePanelProps}
              selectedId={project.selectedId}
              walkways={project.walkways}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
