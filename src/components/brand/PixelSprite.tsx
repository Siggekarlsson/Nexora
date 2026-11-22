import type { DepartmentId } from "@/lib/types";
import { sprites } from "./PixelAvatar";

/** Pixel avatar rendered as an SVG <g>, for use inside another SVG. Centered on (cx, cy). */
export function PixelSprite({ id, cx, cy, size, color, eye = "#0b0b10" }: { id: DepartmentId; cx: number; cy: number; size: number; color: string; eye?: string }) {
  const px = size / 9;
  const ox = cx - size / 2;
  const oy = cy - (px * 8) / 2;
  return (
    <g shapeRendering="crispEdges" pointerEvents="none">
      {sprites[id].flatMap((row, y) =>
        row.split("").map((c, x) =>
          c === "." ? null : (
            <rect key={`${x}-${y}`} x={ox + x * px} y={oy + y * px} width={px + 0.05} height={px + 0.05} fill={c === "o" ? eye : color} />
          ),
        ),
      )}
    </g>
  );
}
