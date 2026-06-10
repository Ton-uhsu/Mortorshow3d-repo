import { useEffect } from "react";
import type { BoothObject, SelectedMapObject } from "../types";

interface UseEditorShortcutsOptions {
  copiedBooth: BoothObject | null;
  onCopyBooth: (booth: BoothObject) => void;
  onDeleteSelected: () => void;
  onDuplicateBooth: (booth: BoothObject) => void;
  selectedBooth: BoothObject | null;
  selectedObject: SelectedMapObject;
}

export function useEditorShortcuts({
  copiedBooth,
  onCopyBooth,
  onDeleteSelected,
  onDuplicateBooth,
  selectedBooth,
  selectedObject,
}: UseEditorShortcutsOptions) {
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
        onDeleteSelected();
        return;
      }

      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (!isModifierPressed) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "c" && selectedBooth) {
        event.preventDefault();
        onCopyBooth(selectedBooth);
        return;
      }

      if (key === "v") {
        const source = copiedBooth ?? selectedBooth;

        if (!source) {
          return;
        }

        event.preventDefault();
        onDuplicateBooth(source);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    copiedBooth,
    onCopyBooth,
    onDeleteSelected,
    onDuplicateBooth,
    selectedBooth,
    selectedObject,
  ]);
}
