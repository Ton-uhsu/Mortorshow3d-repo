import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Edges, Grid, Html, Line, OrbitControls } from "@react-three/drei";
import { DoubleSide, MathUtils, SRGBColorSpace, TextureLoader } from "three";
import type { Camera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ui } from "../lib/ui";
import type {
  BoothObject,
  DoorObject,
  FloorPlanSize,
  RoutePath,
  WalkwayObject,
} from "../types";

interface ThreePreviewProps {
  booths: BoothObject[];
  doors: DoorObject[];
  floorPlanImage: string;
  floorPlanOpacity: number;
  floorPlanSize: FloorPlanSize;
  routePath: RoutePath | null;
  selectedId: string | null;
  walkways: WalkwayObject[];
}

interface PreviewMetrics {
  canvasHeight: number;
  canvasWidth: number;
  dpr: number;
  fps: number;
  scrollY: number;
}

const MAX_PLANE_DIMENSION = 14;
const ISO_POLAR_ANGLE = Math.acos(1 / Math.sqrt(3));
const DOOR_CUTOUT_HEIGHT_RATIO = 0.82;
const DOOR_CUTOUT_MIN_HEIGHT = 0.13;
const DOOR_CUTOUT_OFFSET = 0.012;
const DOOR_CUTOUT_WIDTH = 0.46;

function isDoorHorizontal(door: DoorObject) {
  return door.edge === "top" || door.edge === "bottom";
}

function isRouteEndpoint(index: number, pointsLength: number) {
  return index === 0 || index === pointsLength - 1;
}

function getPlaneDimensions(size: FloorPlanSize) {
  const aspectRatio = size.width / size.height;

  if (aspectRatio >= 1) {
    return {
      width: MAX_PLANE_DIMENSION,
      depth: MAX_PLANE_DIMENSION / aspectRatio,
    };
  }

  return {
    width: MAX_PLANE_DIMENSION * aspectRatio,
    depth: MAX_PLANE_DIMENSION,
  };
}

function setIsometricCamera(
  camera: Camera,
  controls: OrbitControlsImpl | null,
  preserveAzimuth: boolean,
) {
  const distance = Math.max(camera.position.length(), 12);
  const azimuth = preserveAzimuth
    ? Math.atan2(camera.position.x, camera.position.z)
    : Math.PI / 4;
  const horizontalDistance = Math.sin(ISO_POLAR_ANGLE) * distance;

  camera.position.set(
    Math.sin(azimuth) * horizontalDistance,
    Math.cos(ISO_POLAR_ANGLE) * distance,
    Math.cos(azimuth) * horizontalDistance,
  );
  controls?.target.set(0, 0, 0);
  camera.lookAt(0, 0, 0);
  controls?.update();
}

function CameraControls({
  isoLocked,
  isoViewVersion,
}: {
  isoLocked: boolean;
  isoViewVersion: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    if (isoViewVersion === 0) {
      return;
    }

    setIsometricCamera(camera, controlsRef.current, false);
  }, [camera, isoViewVersion]);

  useEffect(() => {
    if (!isoLocked) {
      return;
    }

    setIsometricCamera(camera, controlsRef.current, true);
  }, [camera, isoLocked]);

  return (
    <OrbitControls
      enablePan
      enableRotate
      enableZoom
      makeDefault
      maxPolarAngle={isoLocked ? ISO_POLAR_ANGLE : Math.PI / 2.15}
      minPolarAngle={isoLocked ? ISO_POLAR_ANGLE : 0.1}
      ref={controlsRef}
    />
  );
}

function PerformanceProbe({
  onMetrics,
}: {
  onMetrics: (metrics: PreviewMetrics) => void;
}) {
  const { gl } = useThree();
  const frameCountRef = useRef(0);
  const lastReportRef = useRef(performance.now());

  useFrame(() => {
    frameCountRef.current += 1;
    const now = performance.now();
    const elapsed = now - lastReportRef.current;

    if (elapsed < 700) {
      return;
    }

    onMetrics({
      canvasHeight: Math.round(gl.domElement.clientHeight),
      canvasWidth: Math.round(gl.domElement.clientWidth),
      dpr: Number(gl.getPixelRatio().toFixed(2)),
      fps: Math.round((frameCountRef.current * 1000) / elapsed),
      scrollY: Math.round(window.scrollY),
    });
    frameCountRef.current = 0;
    lastReportRef.current = now;
  });

  return null;
}

function FloorTexture({
  image,
  opacity,
  planeDepth,
  planeWidth,
}: {
  image: string;
  opacity: number;
  planeDepth: number;
  planeWidth: number;
}) {
  const texture = useLoader(TextureLoader, image);
  texture.colorSpace = SRGBColorSpace;

  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2}>
      <planeGeometry args={[planeWidth, planeDepth]} />
      <meshBasicMaterial
        depthWrite={opacity >= 0.98}
        map={texture}
        opacity={opacity}
        side={DoubleSide}
        toneMapped={false}
        transparent={opacity < 1}
      />
    </mesh>
  );
}

function FloorBacking({
  planeDepth,
  planeWidth,
}: {
  planeDepth: number;
  planeWidth: number;
}) {
  return (
    <mesh position={[0, -0.026, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[planeWidth, planeDepth]} />
      <meshBasicMaterial color="#d9d4c8" side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function BoothMeshes({
  booths,
  planeDepth,
  planeWidth,
  selectedId,
}: {
  booths: BoothObject[];
  planeDepth: number;
  planeWidth: number;
  selectedId: string | null;
}) {
  return (
    <>
      {booths.map((booth) => {
        const width = booth.width * planeWidth;
        const depth = booth.depth * planeDepth;
        const x = (booth.x + booth.width / 2 - 0.5) * planeWidth;
        const z = (booth.y + booth.depth / 2 - 0.5) * planeDepth;
        const isSelected = booth.id === selectedId;

        return (
          <mesh
            castShadow
            key={booth.id}
            position={[x, booth.extrudeHeight / 2, z]}
            rotation-y={MathUtils.degToRad(booth.rotation)}
          >
            <boxGeometry args={[width, booth.extrudeHeight, depth]} />
            <meshStandardMaterial color={booth.color} metalness={0.1} roughness={0.45} />
            {isSelected ? <Edges color="#ffffff" lineWidth={2.2} /> : null}
          </mesh>
        );
      })}
    </>
  );
}

function WalkwayMeshes({
  planeDepth,
  planeWidth,
  walkways,
}: {
  planeDepth: number;
  planeWidth: number;
  walkways: WalkwayObject[];
}) {
  return (
    <>
      {walkways.map((walkway) => {
        return (
          <Line
            color="#10b981"
            depthTest={false}
            key={walkway.id}
            lineWidth={Math.max(walkway.width * 180, 3.5)}
            points={walkway.points.map((point) => [
              (point.x - 0.5) * planeWidth,
              0.075,
              (point.y - 0.5) * planeDepth,
            ])}
            renderOrder={8}
            transparent
            opacity={0.42}
          />
        );
      })}
    </>
  );
}

function DoorCutouts({
  booths,
  doors,
  planeDepth,
  planeWidth,
}: {
  booths: BoothObject[];
  doors: DoorObject[];
  planeDepth: number;
  planeWidth: number;
}) {
  return (
    <>
      {doors.map((door) => {
        const booth = booths.find((item) => item.id === door.boothId);
        const boothHeight = booth?.extrudeHeight ?? 0.2;
        const cutoutHeight = Math.max(
          DOOR_CUTOUT_MIN_HEIGHT,
          boothHeight * DOOR_CUTOUT_HEIGHT_RATIO,
        );
        const x = (door.x - 0.5) * planeWidth;
        const z = (door.y - 0.5) * planeDepth;
        const isHorizontal = isDoorHorizontal(door);
        const offsetX =
          door.edge === "left"
            ? -DOOR_CUTOUT_OFFSET
            : door.edge === "right"
              ? DOOR_CUTOUT_OFFSET
              : 0;
        const offsetZ =
          door.edge === "top"
            ? -DOOR_CUTOUT_OFFSET
            : door.edge === "bottom"
              ? DOOR_CUTOUT_OFFSET
              : 0;

        return (
          <mesh
            key={door.id}
            position={[x + offsetX, cutoutHeight / 2 + 0.012, z + offsetZ]}
            renderOrder={30}
            rotation-y={isHorizontal ? 0 : Math.PI / 2}
          >
            <planeGeometry args={[DOOR_CUTOUT_WIDTH, cutoutHeight]} />
            <meshStandardMaterial
              color="#ffffff"
              depthTest={false}
              emissive="#ffffff"
              emissiveIntensity={0.08}
              roughness={0.3}
              side={DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}

function StartMarkerIcon() {
  return (
    <svg height="43.2" viewBox="0 0 20 48" width="18">
      <path
        d="M1.37965 29.3246C1.5778 31.2167 2.27661 33.0694 3.83078 33.775C4.0998 37.1861 4.7451 40.2227 5.65918 42.4784C6.14556 43.6787 6.72883 44.71 7.41453 45.4578C8.10027 46.2056 8.97065 46.7527 9.99989 46.7527C11.0292 46.7527 11.8995 46.2055 12.585 45.4576C13.2706 44.7098 13.8536 43.6785 14.3398 42.4783C15.2536 40.2226 15.8988 37.186 16.1688 33.7752C17.7232 33.0697 18.422 31.2169 18.6201 29.3247C18.8386 27.2385 18.5165 24.6502 17.6475 22.0285L17.6473 22.0278C16.9657 19.9761 16.0319 18.1622 14.9848 16.7474C17.0884 15.1587 18.4471 12.5964 18.4471 9.7152C18.4471 4.93539 14.6967 1 9.99966 1C5.30272 1 1.54993 4.93527 1.54993 9.7152C1.54993 12.5961 2.90839 15.1583 5.01167 16.747C3.9635 18.1625 3.03185 19.977 2.3522 22.0286C1.48319 24.6503 1.16118 27.2385 1.37965 29.3246Z"
        fill="#1890FF"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
    </svg>
  );
}

function EndFlagIcon() {
  return (
    <svg height="42" viewBox="0 0 42 48" width="36">
      <path
        d="M9 45V6M9 7C17 2 25 12 34 7V27C25 32 17 22 9 27"
        fill="#ffffff"
        stroke="#0f172a"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path d="M9 7C17 2 25 12 34 7V27C25 32 17 22 9 27Z" fill="#f97316" />
      <path d="M9 7C17 2 25 12 34 7V27C25 32 17 22 9 27Z" fill="none" stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}

function RouteLine({
  planeDepth,
  planeWidth,
  routePath,
}: {
  planeDepth: number;
  planeWidth: number;
  routePath: RoutePath | null;
}) {
  if (!routePath) {
    return null;
  }

  const points = routePath.points.map((point) => [
    (point.x - 0.5) * planeWidth,
    0.18,
    (point.y - 0.5) * planeDepth,
  ] as const);

  return (
    <>
      <Line
        color="#06b6d4"
        depthTest={false}
        lineWidth={5}
        points={points}
        renderOrder={20}
      />
      {routePath.points.map((point, index) => {
        if (!isRouteEndpoint(index, routePath.points.length)) {
          return null;
        }

        return (
          <Html
            center
            distanceFactor={8}
            key={`${point.x}-${point.y}-${index}`}
            position={[(point.x - 0.5) * planeWidth, 0.2, (point.y - 0.5) * planeDepth]}
            style={{
              filter: "drop-shadow(0 8px 10px rgba(15, 23, 42, 0.35))",
              pointerEvents: "none",
              transform: "translateY(-18px)",
            }}
          >
            {index === 0 ? <StartMarkerIcon /> : <EndFlagIcon />}
          </Html>
        );
      })}
    </>
  );
}

function PreviewSceneCanvas({
  booths,
  doors,
  floorPlanImage,
  floorPlanOpacity,
  gridSize,
  isoLocked,
  isoViewVersion,
  onMetrics,
  performanceMode = false,
  plane,
  routePath,
  selectedId,
  shadowPlaneSize,
  walkways,
}: ThreePreviewProps & {
  gridSize: number;
  isoLocked: boolean;
  isoViewVersion: number;
  onMetrics?: (metrics: PreviewMetrics) => void;
  performanceMode?: boolean;
  plane: { depth: number; width: number };
  shadowPlaneSize: number;
}) {
  return (
    <Canvas
      camera={{ fov: 42, position: [9, 9, 8] }}
      dpr={performanceMode ? [1, 1.35] : [1, 1.75]}
      gl={{
        antialias: !performanceMode,
        powerPreference: "high-performance",
      }}
      shadows={!performanceMode}
    >
      <color args={["#101721"]} attach="background" />
      <ambientLight intensity={0.65} />
      <directionalLight
        castShadow={!performanceMode}
        intensity={performanceMode ? 0.95 : 1.15}
        position={[6, 12, 5]}
        shadow-mapSize-height={performanceMode ? 512 : 2048}
        shadow-mapSize-width={performanceMode ? 512 : 2048}
      />
      <FloorBacking planeDepth={plane.depth} planeWidth={plane.width} />
      <Suspense fallback={null}>
        <FloorTexture
          image={floorPlanImage}
          opacity={floorPlanOpacity}
          planeDepth={plane.depth}
          planeWidth={plane.width}
        />
      </Suspense>
      {!performanceMode ? (
        <mesh receiveShadow position={[0, -0.02, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[shadowPlaneSize, shadowPlaneSize]} />
          <shadowMaterial opacity={0.25} />
        </mesh>
      ) : null}
      <WalkwayMeshes
        planeDepth={plane.depth}
        planeWidth={plane.width}
        walkways={walkways}
      />
      <BoothMeshes
        booths={booths}
        planeDepth={plane.depth}
        planeWidth={plane.width}
        selectedId={selectedId}
      />
      <RouteLine
        planeDepth={plane.depth}
        planeWidth={plane.width}
        routePath={routePath}
      />
      <DoorCutouts
        booths={booths}
        doors={doors}
        planeDepth={plane.depth}
        planeWidth={plane.width}
      />
      {!performanceMode ? (
        <Grid
          args={[gridSize, gridSize]}
          cellColor="#25364a"
          cellSize={0.5}
          fadeDistance={22}
          fadeStrength={1}
          infiniteGrid
          position={[0, 0.01, 0]}
          sectionColor="#35516d"
          sectionSize={2}
        />
      ) : (
        <Grid
          args={[plane.width, plane.depth]}
          cellColor="#94a3b8"
          cellSize={0.5}
          fadeDistance={Math.max(plane.width, plane.depth) + 2}
          fadeStrength={0.45}
          position={[0, 0.012, 0]}
          sectionColor="#64748b"
          sectionSize={2}
        />
      )}
      {onMetrics ? <PerformanceProbe onMetrics={onMetrics} /> : null}
      <CameraControls isoLocked={isoLocked} isoViewVersion={isoViewVersion} />
    </Canvas>
  );
}

export function ThreePreview({
  booths,
  doors,
  floorPlanImage,
  floorPlanOpacity,
  floorPlanSize,
  routePath,
  selectedId,
  walkways,
}: ThreePreviewProps) {
  const [isoLocked, setIsoLocked] = useState(false);
  const [isoViewVersion, setIsoViewVersion] = useState(0);
  const [largePreviewOpen, setLargePreviewOpen] = useState(false);
  const [metrics, setMetrics] = useState<PreviewMetrics | null>(null);
  const showDebugMetrics = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "1",
    [],
  );
  const stats = useMemo(() => {
    const totalHeight = booths.reduce((sum, booth) => sum + booth.extrudeHeight, 0);
    return {
      averageHeight: booths.length ? totalHeight / booths.length : 0,
      total: booths.length,
    };
  }, [booths]);
  const plane = useMemo(() => getPlaneDimensions(floorPlanSize), [floorPlanSize]);
  const gridSize = Math.max(plane.width, plane.depth) + 8;
  const shadowPlaneSize = Math.max(plane.width, plane.depth) + 6;
  const sceneProps = {
    booths,
    doors,
    floorPlanImage,
    floorPlanOpacity,
    floorPlanSize,
    gridSize,
    isoLocked,
    isoViewVersion,
    plane,
    routePath,
    selectedId,
    shadowPlaneSize,
    walkways,
  };

  useEffect(() => {
    if (!largePreviewOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "hidden";

    const preventTouchScroll = (event: TouchEvent) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLargePreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchmove", preventTouchScroll, { passive: false });
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchmove", preventTouchScroll);
      window.scrollTo(0, scrollY);
    };
  }, [largePreviewOpen]);

  return (
    <>
    <section className={`${ui.panel} flex min-h-[420px] flex-col lg:min-h-[calc(100vh-8.5rem)]`}>
      <header className={ui.panelHeader}>
        <div>
          <p className={ui.eyebrow}>3D Preview</p>
          <h2 className={ui.panelTitle}>Extruded scene</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="rounded-2xl border border-emerald-300/30 bg-emerald-400/14 px-3 py-2 text-sm font-semibold text-emerald-50 transition hover:-translate-y-px hover:bg-emerald-400/22"
            onClick={() => setLargePreviewOpen(true)}
            type="button"
          >
            Large preview
          </button>
          <button
            className="rounded-2xl border border-sky-300/30 bg-sky-400/14 px-3 py-2 text-sm font-semibold text-sky-50 transition hover:-translate-y-px hover:bg-sky-400/22"
            onClick={() => setIsoViewVersion((version) => version + 1)}
            type="button"
          >
            Iso
          </button>
          <button
            className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition hover:-translate-y-px ${
              isoLocked
                ? "border-amber-300/55 bg-amber-300/20 text-amber-50"
                : "border-white/10 bg-white/5 text-slate-100"
            }`}
            onClick={() => setIsoLocked((locked) => !locked)}
            type="button"
          >
            Iso lock
          </button>
          <div className="min-w-[92px] rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-center">
            <strong className="block text-xl font-semibold text-white">{stats.total}</strong>
            <span className="text-sm text-slate-300">objects</span>
          </div>
        </div>
      </header>

      <div className="mt-3 min-h-[420px] flex-1 overflow-hidden rounded-[24px] border border-white/10">
        {largePreviewOpen ? null : <PreviewSceneCanvas {...sceneProps} />}
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <div>
          <span className={ui.statsLabel}>Average height</span>
          <strong className={ui.statsValue}>{stats.averageHeight.toFixed(1)}m</strong>
        </div>
        <div>
          <span className={ui.statsLabel}>Camera</span>
          <strong className={ui.statsValue}>
            {isoLocked ? "Iso orbit lock" : "Free orbit"}
          </strong>
        </div>
      </footer>
    </section>
    {largePreviewOpen ? (
      <div className="fixed inset-0 z-50 overscroll-none bg-slate-950/92 p-0 backdrop-blur-md sm:p-4">
        <section className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden rounded-none border-white/12 bg-slate-950 shadow-[0_32px_120px_rgba(0,0,0,0.6)] sm:h-[calc(100dvh-2rem)] sm:rounded-[24px] sm:border">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-5">
            <div>
              <p className={ui.eyebrow}>Large 3D Preview</p>
              <h2 className="text-lg font-semibold text-white sm:text-2xl">Extruded scene</h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                className="rounded-2xl border border-sky-300/30 bg-sky-400/14 px-3 py-2 text-sm font-semibold text-sky-50"
                onClick={() => setIsoViewVersion((version) => version + 1)}
                type="button"
              >
                Iso
              </button>
              <button
                className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${
                  isoLocked
                    ? "border-amber-300/55 bg-amber-300/20 text-amber-50"
                    : "border-white/10 bg-white/5 text-slate-100"
                }`}
                onClick={() => setIsoLocked((locked) => !locked)}
                type="button"
              >
                Iso lock
              </button>
              <button
                className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => setLargePreviewOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
          </header>
          <div className="relative min-h-0 flex-1 touch-none overflow-hidden">
            <PreviewSceneCanvas
              {...sceneProps}
              onMetrics={showDebugMetrics ? setMetrics : undefined}
              performanceMode
            />
            {showDebugMetrics && metrics ? (
              <div className="pointer-events-none absolute left-3 bottom-3 rounded-2xl border border-white/12 bg-slate-950/82 px-3 py-2 font-mono text-[0.68rem] leading-5 text-cyan-100 shadow-2xl">
                <div>fps: {metrics.fps}</div>
                <div>dpr: {metrics.dpr}</div>
                <div>
                  canvas: {metrics.canvasWidth}x{metrics.canvasHeight}
                </div>
                <div>scrollY: {metrics.scrollY}</div>
                <div>mode: mobile perf</div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}
