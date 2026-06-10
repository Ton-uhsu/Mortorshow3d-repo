# Mortorshow3D Floor Plan Editor

เว็บต้นแบบสำหรับแปลง `2D floor plan` ให้กลายเป็น `custom 3D map` แบบแก้ไขเองได้

แนวคิดของเวอร์ชันนี้อิงจาก workflow แบบเครื่องมือ map editor:

1. อัปโหลด floor plan 2D
2. วาง floor plan ลงบนแผนที่จริง
3. วาดพื้นที่สี่เหลี่ยมบน floor plan เพื่อ extrude เป็น 3D
4. ตั้งค่าสี หมวดหมู่ ความสูง ความกว้าง ความลึก และการหมุน
5. ตั้งชื่อ object เช่น `booth1`, `booth2`
6. ได้แผนที่ 3D ที่ custom เองจาก floor plan 2D

ตอนนี้เวอร์ชันใน repo โฟกัสที่ข้อ `1, 3, 4, 5, 6` ก่อน ส่วนการผูก floor plan เข้ากับแผนที่จริงยังถูกพักไว้สำหรับรอบถัดไป

## MVP ที่ทำแล้ว

- อัปโหลดภาพ floor plan จากเครื่อง
- มี floor plan ตัวอย่างให้เริ่มลองได้ทันที
- วาดสี่เหลี่ยมบนภาพเพื่อสร้าง booth footprint
- เลือก object แล้วลากย้ายหรือ resize ได้
- แก้ `name`, `category`, `color`, `3D height`, `width`, `depth`, `rotation`
- ดู 3D preview แบบ real-time จากข้อมูลเดียวกัน
- duplicate / delete object
- export โปรเจกต์เป็น JSON

## Tech Stack

- React 19
- Vite
- TypeScript
- Three.js
- `@react-three/fiber`
- `@react-three/drei`

## การรัน

```bash
npm install
npm run dev
```

เปิดที่:

```text
http://127.0.0.1:5173
```

ถ้าต้องการ build:

```bash
npm run build
```

## วิธีใช้งานเร็วๆ

1. กด `Upload floor plan`
2. เลือก `Draw booth`
3. ลากบนภาพเพื่อสร้างสี่เหลี่ยม
4. คลิก object ที่สร้างแล้วแก้ค่าจากฝั่ง `Inspector`
5. ดูผล extrude ใน `3D Preview`
6. กด `Export JSON` เพื่อเอาข้อมูลออก

## โครงสร้างหลัก

```text
src/
  App.tsx
  styles.css
  types.ts
  data/defaultFloorPlan.ts
  components/
    FloorPlanEditor.tsx
    InspectorPanel.tsx
    ThreePreview.tsx
```

## สิ่งที่ยังไม่ได้ทำ

- วาง floor plan ลงบนแผนที่จริงด้วย georeference / control points
- รองรับ shape ที่ไม่ใช่สี่เหลี่ยม
- import JSON กลับเข้าระบบ
- save project ถาวร
- snapping, measurement, undo/redo
- label และ metadata ที่ลึกกว่านี้

## ทิศทางรอบถัดไป

ถ้าจะต่อจากจุดนี้ แนะนำลำดับดังนี้:

1. เพิ่ม `save/load project JSON`
2. เพิ่ม `undo/redo`
3. เพิ่ม `snap to grid`
4. เพิ่ม `polygon drawing`
5. ค่อยทำ `place floor plan on real map`
