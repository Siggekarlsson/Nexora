import type { DepartmentId } from "@/lib/types";

/**
 * Original 9-column pixel sprites for each department agent.
 * '#' = body pixel, 'o' = eye (rendered dark), '.' = empty.
 */
const sprites: Record<DepartmentId, string[]> = {
  research: [
    ".#.....#.",
    "..#####..",
    ".#######.",
    "##oo#oo##",
    "#########",
    ".#######.",
    ".#.#.#.#.",
    "#.......#",
  ],
  sales: [
    "#.......#",
    ".#.###.#.",
    ".#######.",
    "##o###o##",
    "#########",
    "..#.#.#..",
    ".#.....#.",
    "#.......#",
  ],
  marketing: [
    "...###...",
    "..#####..",
    ".##o#o##.",
    "#########",
    "#########",
    "..#.#.#..",
    ".#.#.#.#.",
    "#.#...#.#",
  ],
  operations: [
    "....#....",
    ".#######.",
    ".#o###o#.",
    ".#######.",
    ".##...##.",
    ".#######.",
    ".#.#.#.#.",
    "##.....##",
  ],
  customer: [
    ".##...##.",
    "#########",
    "##o###o##",
    "#########",
    ".#######.",
    "..#####..",
    "..#.#.#..",
    ".#.....#.",
  ],
  finance: [
    "..#####..",
    ".#######.",
    "##o#o#o##",
    "#########",
    "#.#####.#",
    "#.#...#.#",
    "..#...#..",
    ".##...##.",
  ],
  leadership: [
    "#..#.#..#",
    "#########",
    ".#######.",
    ".##o#o##.",
    ".#######.",
    "..##.##..",
    ".#.....#.",
    "#.......#",
  ],
  brain: [
    "..##.##..",
    ".#######.",
    "##.###.##",
    "###o#o###",
    "#########",
    ".#.###.#.",
    "..#...#..",
    ".#.....#.",
  ],
};

interface Props {
  id: DepartmentId;
  color?: string;
  size?: number;
  eyeColor?: string;
  className?: string;
}

export function PixelAvatar({ id, color = "currentColor", size = 20, eyeColor = "#0b0b10", className }: Props) {
  const rows = sprites[id];
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) =>
    row.split("").forEach((c, x) => {
      if (c === ".") return;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={c === "o" ? eyeColor : color} />,
      );
    }),
  );
  return (
    <svg
      viewBox="0 0 9 8"
      width={size}
      height={(size * 8) / 9}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects}
    </svg>
  );
}
