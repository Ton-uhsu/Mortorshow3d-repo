import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Edges, Grid, Line, OrbitControls } from "@react-three/drei";
import { DoubleSide, MathUtils, SRGBColorSpace, TextureLoader } from "three";
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
  floorPlanSize: FloorPlanSize;
  routePath: RoutePath | null;
  selectedId: string | null;
  walkways: WalkwayObject[];
}

const MAX_PLANE_DIMENSION = 14;

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

function FloorTexture({
  image,
  planeDepth,
  planeWidth,
}: {
  image: string;
  planeDepth: number;
  planeWidth: number;
}) {
  const texture = useLoader(TextureLoader, image);
  texture.colorSpace = SRGBColorSpace;

  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2}>
      <planeGeometry args={[planeWidth, planeDepth]} />
      <meshStandardMaterial map={texture} side={DoubleSide} />
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
        const width = walkway.width * planeWidth;
        const depth = walkway.depth * planeDepth;
        const x = (walkway.x + walkway.width / 2 - 0.5) * planeWidth;
        const z = (walkway.y + walkway.depth / 2 - 0.5) * planeDepth;

        return (
          <mesh key={walkway.id} position={[x, 0.035, z]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial
              color="#10b981"
              opacity={0.14}
              transparent
              side={DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}

function DoorMarkers({
  doors,
  planeDepth,
  planeWidth,
}: {
  doors: DoorObject[];
  planeDepth: number;
  planeWidth: number;
}) {
  return (
    <>
      {doors.map((door) => {
        const x = (door.x - 0.5) * planeWidth;
        const z = (door.y - 0.5) * planeDepth;

        return (
          <mesh key={door.id} position={[x, 0.12, z]}>
            <sphereGeometry args={[0.11, 18, 18]} />
            <meshStandardMaterial color="#1d9bf0" emissive="#0b63a8" emissiveIntensity={0.35} />
          </mesh>
        );
      })}
    </>
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

  return (
    <>
      <Line
        color="#ffffff"
        depthTest={false}
        lineWidth={8}
        points={routePath.points.map((point) => [
          (point.x - 0.5) * planeWidth,
          0.34,
          (point.y - 0.5) * planeDepth,
        ])}
        renderOrder={20}
      />
      <Line
        color="#1d9bf0"
        depthTest={false}
        lineWidth={5}
        points={routePath.points.map((point) => [
          (point.x - 0.5) * planeWidth,
          0.36,
          (point.y - 0.5) * planeDepth,
        ])}
        renderOrder={21}
      />
      {routePath.points.map((point, index) => (
        <mesh
          key={`${point.x}-${point.y}-${index}`}
          position={[(point.x - 0.5) * planeWidth, 0.39, (point.y - 0.5) * planeDepth]}
          renderOrder={22}
        >
          <sphereGeometry args={[index === 0 || index === routePath.points.length - 1 ? 0.13 : 0.07, 16, 16]} />
          <meshStandardMaterial
            color="#1d9bf0"
            depthTest={false}
            emissive="#0b63a8"
            emissiveIntensity={0.45}
          />
        </mesh>
      ))}
    </>
  );
}

export function ThreePreview({
  booths,
  doors,
  floorPlanImage,
  floorPlanSize,
  routePath,
  selectedId,
  walkways,
}: ThreePreviewProps) {
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

  return (
    <section className={`${ui.panel} flex min-h-[420px] flex-col lg:min-h-[calc(100vh-8.5rem)]`}>
      <header className={ui.panelHeader}>
        <div>
          <p className={ui.eyebrow}>3D Preview</p>
          <h2 className={ui.panelTitle}>Extruded scene</h2>
        </div>
        <div className="min-w-[92px] rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-center">
          <strong className="block text-xl font-semibold text-white">{stats.total}</strong>
          <span className="text-sm text-slate-300">objects</span>
        </div>
      </header>

      <div className="mt-3 min-h-[420px] flex-1 overflow-hidden rounded-[24px] border border-white/10">
        <Canvas camera={{ fov: 42, position: [9, 9, 8] }} shadows>
          <color args={["#101721"]} attach="background" />
          <ambientLight intensity={0.65} />
          <directionalLight
            castShadow
            intensity={1.15}
            position={[6, 12, 5]}
            shadow-mapSize-height={2048}
            shadow-mapSize-width={2048}
          />
          <Suspense fallback={null}>
            <FloorTexture
              image={floorPlanImage}
              planeDepth={plane.depth}
              planeWidth={plane.width}
            />
          </Suspense>
          <mesh receiveShadow position={[0, -0.02, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[shadowPlaneSize, shadowPlaneSize]} />
            <shadowMaterial opacity={0.25} />
          </mesh>
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
          <DoorMarkers doors={doors} planeDepth={plane.depth} planeWidth={plane.width} />
          <RouteLine
            planeDepth={plane.depth}
            planeWidth={plane.width}
            routePath={routePath}
          />
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
          <OrbitControls enablePan enableRotate enableZoom maxPolarAngle={Math.PI / 2.15} />
        </Canvas>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <div>
          <span className={ui.statsLabel}>Average height</span>
          <strong className={ui.statsValue}>{stats.averageHeight.toFixed(1)}m</strong>
        </div>
        <div>
          <span className={ui.statsLabel}>Camera</span>
          <strong className={ui.statsValue}>Orbit enabled</strong>
        </div>
      </footer>
    </section>
  );
}
