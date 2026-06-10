import type { RefObject } from "react";
import { ui } from "../../lib/ui";

interface EditorHeaderProps {
  floorName: string;
  onExport: () => void;
  onLoadAZonePdfDemo: () => void;
  onHandleUpload: (file: File) => void;
  onLoadRouteDemo: () => void;
  uploadRef: RefObject<HTMLInputElement | null>;
}

export function EditorHeader({
  floorName,
  onExport,
  onHandleUpload,
  onLoadAZonePdfDemo,
  onLoadRouteDemo,
  uploadRef,
}: EditorHeaderProps) {
  return (
    <header className={`${ui.panel} flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between`}>
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-linear-to-br from-orange-600 to-amber-500 text-2xl font-bold text-amber-50 shadow-lg shadow-orange-950/30">
          M
        </div>
        <div>
          <p className={ui.eyebrow}>Mortorshow3D Editor</p>
          <h1 className="text-[clamp(1.3rem,1.8vw,1.95rem)] font-semibold tracking-tight text-white">
            {floorName}
          </h1>
          <span className="mt-1 block max-w-4xl text-sm leading-6 text-slate-300">
            Using the real construction manual PDF as floor plan and the real CSV booth
            config as the catalog source.
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
        <button
          className={`${ui.buttonPrimary} w-full sm:w-auto`}
          onClick={() => uploadRef.current?.click()}
          type="button"
        >
          Upload floor plan
        </button>
        <button className={`${ui.buttonGhost} w-full sm:w-auto`} onClick={onLoadRouteDemo} type="button">
          Route demo
        </button>
        <button
          className={`${ui.buttonGhost} w-full sm:w-auto`}
          onClick={onLoadAZonePdfDemo}
          type="button"
        >
          A zone demo
        </button>
        <button className={`${ui.buttonGhost} w-full sm:w-auto`} onClick={onExport} type="button">
          Export JSON
        </button>
        <input
          accept="image/*,.pdf,application/pdf"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onHandleUpload(file);
            }
            event.currentTarget.value = "";
          }}
          ref={uploadRef}
          type="file"
        />
      </div>
    </header>
  );
}
