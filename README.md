# Mortorshow3D Floor Plan Editor

Web app for turning a 2D floor plan into an editable booth layout with a live 3D preview.

The current version is focused on manual editing:
- Upload a floor plan image or PDF
- Draw booths and walkways on top of the plan
- Place doors for route planning
- Edit booth properties from the inspector
- Preview the result in 3D
- Export the map data as JSON

## Current Features

- Upload custom floor plans from image files or PDF files
- Draw booth rectangles on top of the floor plan
- Draw walkway zones
- Place doors snapped to booth edges
- Move and resize booths and walkways
- Edit booth name, catalog link, category, color, size, height, and rotation
- Route preview between doors using walkway areas
- Real-time 3D preview with Three.js
- Duplicate and delete selected objects
- Export project data to JSON
- Built-in route demo for quick testing

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS v4
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- `pdfjs-dist` for rendering PDF floor plans
- `papaparse` for booth catalog CSV parsing

## Project Structure

```text
src/
  App.tsx
  main.tsx
  styles.css
  types.ts
  constants/
  components/
    app/
    floorPlanEditor/
    FloorPlanEditor.tsx
    InspectorPanel.tsx
    ThreePreview.tsx
  data/
  hooks/
  lib/
```

## Getting Started

```bash
npm install
npm run dev
```

Default local URL:

```text
http://127.0.0.1:5173
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Quick Usage

1. Click `Upload floor plan`
2. Choose `Draw booth` or `Draw walkway`
3. Drag on the canvas to create shapes
4. Use `Place door` to add route points on booth edges
5. Select an object to edit it in `Inspector`
6. Review the result in `3D Preview`
7. Click `Export JSON` to save the layout data

## Notes

- `Auto draw booths` has been removed.
- `Load preset` has been removed.
- The workflow is now fully manual except for route snapping and route planning.

## Future Improvements

- Import JSON back into the editor
- Save/load project state
- Undo/redo
- Better snapping and measurement tools
- Support for non-rectangular booth shapes
- Better mobile editing ergonomics
