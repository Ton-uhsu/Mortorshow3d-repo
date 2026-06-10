import type { BoothObject, FloorPlanSize } from "../types";

const floorPlanSvg = `
<svg width="1600" height="900" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="900" fill="#F5F1EA"/>
  <path d="M0 110H1600" stroke="#DDD4C7" stroke-width="34"/>
  <path d="M0 780H1600" stroke="#DDD4C7" stroke-width="28"/>
  <rect x="220" y="170" width="1160" height="540" rx="24" fill="#ECE5D8" stroke="#C9BFAC" stroke-width="8"/>
  <rect x="310" y="250" width="980" height="360" fill="#A6A39C" stroke="#88857F" stroke-width="8"/>
  <rect x="300" y="240" width="1000" height="380" fill="none" stroke="#8A867F" stroke-width="12"/>
  <path d="M340 280H1260" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M340 430H1260" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M340 580H1260" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M340 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M410 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M490 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M610 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M720 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M860 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M980 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M1090 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <path d="M1180 280V580" stroke="#F4F3F0" stroke-width="6"/>
  <rect x="110" y="110" width="180" height="180" rx="90" stroke="#E1D9CE" stroke-width="18"/>
  <rect x="1320" y="140" width="120" height="320" fill="#E7E0D4" stroke="#D4CAB8"/>
  <rect x="1450" y="170" width="130" height="580" fill="#E7E0D4" stroke="#D4CAB8"/>
  <path d="M1420 80V300H1360" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
  <path d="M1360 300H1180" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
  <path d="M1420 300V820H1280" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
  <path d="M1280 820H220" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
</svg>
`;

export const defaultFloorPlanImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  floorPlanSvg,
)}`;

export const defaultFloorPlanSize: FloorPlanSize = {
  width: 1600,
  height: 900,
};

export const initialBooths: BoothObject[] = [
  {
    id: "booth-1",
    name: "Booth A1",
    category: "premium",
    color: "#f7a63a",
    x: 0.72,
    y: 0.28,
    width: 0.075,
    depth: 0.24,
    extrudeHeight: 2.6,
    rotation: 0,
  },
  {
    id: "booth-2",
    name: "Booth A2",
    category: "premium",
    color: "#d86f34",
    x: 0.805,
    y: 0.28,
    width: 0.12,
    depth: 0.24,
    extrudeHeight: 3.1,
    rotation: 0,
  },
  {
    id: "booth-3",
    name: "Booth A3",
    category: "service",
    color: "#2b8cbe",
    x: 0.93,
    y: 0.28,
    width: 0.055,
    depth: 0.24,
    extrudeHeight: 2.2,
    rotation: 0,
  },
];
