import { Suspense, lazy, useRef } from "react";
import { EditorHeader } from "./components/app/EditorHeader";
import { RoutePanel } from "./components/app/RoutePanel";
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

  return (
    <div className="min-h-screen p-3 md:p-4">
      <EditorHeader
        floorName={project.floorName}
        hasSelection={Boolean(project.selectedObject)}
        onAutoDraw={() => {
          void project.autoDrawCurrentPdf();
        }}
        onClearAll={project.clearAllMapObjects}
        onDeleteSelected={project.deleteSelectedObject}
        onExport={project.exportProject}
        onHandleUpload={(file) => {
          void project.handleUpload(file);
        }}
        onLoadPreset={() => {
          void project.loadPresetProject();
        }}
        onLoadRouteDemo={project.loadRouteDemo}
        onResetProject={project.resetProject}
        uploadRef={uploadRef}
      />

      <main className="mt-4 grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="grid content-start gap-4 xl:sticky xl:top-24">
          <StatusOverview
            autoDrawEnabled={project.autoDrawEnabled}
            boothCount={project.booths.length}
            catalogStatus={project.catalogStatus}
            doorCount={project.doors.length}
            floorPlanStatus={project.floorPlanStatus}
            gridVisible={project.gridVisible}
            onAutoDrawChange={project.setAutoDrawEnabled}
            onGridVisibleChange={project.setGridVisible}
            onShowLabelsChange={project.setShowLabels}
            showLabels={project.showLabels}
            walkwayCount={project.walkways.length}
          />

          <RoutePanel
            doors={project.doors}
            fromDoorId={project.fromDoorId}
            onFromDoorChange={project.setFromDoorId}
            onToDoorChange={project.setToDoorId}
            routeDistance={project.routePath?.distance ?? null}
            routeStatus={project.routeStatus}
            toDoorId={project.toDoorId}
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
            floorPlanSize={project.floorPlanSize}
            gridVisible={project.gridVisible}
            onAddBooth={project.addBooth}
            onAddDoor={project.addDoor}
            onAddWalkway={project.addWalkway}
            onDeleteSelected={project.deleteSelectedObject}
            onSelectObject={project.selectMapObject}
            onToolModeChange={project.setToolMode}
            onUpdateBooth={project.updateBooth}
            onUpdateWalkway={project.updateWalkway}
            routePath={project.routePath}
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
              floorPlanSize={project.floorPlanSize}
              routePath={project.routePath}
              selectedId={project.selectedId}
              walkways={project.walkways}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
