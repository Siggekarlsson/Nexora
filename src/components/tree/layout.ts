import type { Department, DepartmentId } from "@/lib/types";
import { radialOrder } from "@/data/tree";

export type TreeMode = "radial" | "line";
export type NodeKind = "brain" | "dept" | "group" | "job";

export interface TreeNode {
  id: string;
  kind: NodeKind;
  deptId: DepartmentId;
  parent?: string;
  x: number;
  y: number;
  /** used for staggered intro animation, 0..1 */
  order: number;
}

export interface TreeLabel {
  deptId: DepartmentId;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

export interface TreeLayout {
  nodes: TreeNode[];
  labels: TreeLabel[];
  groupLabels: { id: string; x: number; y: number; name: string }[];
}

export const VIEW = { w: 1400, h: 940 };

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const R_DEPT = 150;
const R_GROUP = 215;
const R_JOB_MIN = 248;
const R_JOB_MAX = 330;
const R_LABEL = 372;

export function radialLayout(departments: Department[]): TreeLayout {
  const nodes: TreeNode[] = [{ id: "brain", kind: "brain", deptId: "brain", x: 0, y: 0, order: 0 }];
  const labels: TreeLabel[] = [];
  const n = radialOrder.length;
  const sector = (Math.PI * 2) / n;

  radialOrder.forEach((deptId, i) => {
    const d = departments.find((x) => x.id === deptId)!;
    const a = Math.PI / 2 + i * sector;
    const dx = Math.cos(a) * R_DEPT;
    const dy = Math.sin(a) * R_DEPT;
    nodes.push({ id: d.id, kind: "dept", deptId: d.id, parent: "brain", x: dx, y: dy, order: 0.1 + i * 0.04 });

    const usable = sector * 0.82;
    const totalJobs = d.subGroups.reduce((s, g) => s + g.skills.length, 0);
    let cursor = a - usable / 2;
    const rand = rng(i * 97 + 13);

    d.subGroups.forEach((g) => {
      // share of the sector proportional to job count (with a minimum)
      const share = Math.max(0.16, g.skills.length / totalJobs);
      const width = usable * share;
      const totalShare = d.subGroups.reduce((s, gg) => s + Math.max(0.16, gg.skills.length / totalJobs), 0);
      const w = width / totalShare;
      const ga = cursor + w / 2;
      cursor += w;
      const gx = Math.cos(ga) * R_GROUP;
      const gy = Math.sin(ga) * R_GROUP;
      nodes.push({ id: g.id, kind: "group", deptId: d.id, parent: d.id, x: gx, y: gy, order: 0.35 + rand() * 0.2 });

      g.skills.forEach((s) => {
        const ja = ga + (rand() - 0.5) * w * 0.95;
        const jr = R_JOB_MIN + rand() * (R_JOB_MAX - R_JOB_MIN) * Math.min(1, 0.45 + g.skills.length / 12);
        nodes.push({
          id: s.id, kind: "job", deptId: d.id, parent: g.id,
          x: Math.cos(ja) * jr, y: Math.sin(ja) * jr,
          order: 0.55 + rand() * 0.45,
        });
      });
    });

    const lx = Math.cos(a) * R_LABEL * 1.12;
    const ly = Math.sin(a) * R_LABEL;
    const c = Math.cos(a);
    labels.push({ deptId: d.id, x: lx, y: ly + (Math.sin(a) > 0.5 ? 18 : Math.sin(a) < -0.5 ? -10 : 0), anchor: Math.abs(c) < 0.3 ? "middle" : c > 0 ? "start" : "end" });
  });

  return { nodes, labels, groupLabels: [] };
}

export function lineLayout(departments: Department[]): TreeLayout {
  const nodes: TreeNode[] = [{ id: "brain", kind: "brain", deptId: "brain", x: -540, y: 0, order: 0 }];
  const labels: TreeLabel[] = [];
  const groupLabels: TreeLayout["groupLabels"] = [];
  const rows = departments.reduce((s, d) => s + d.subGroups.length, 0);
  const gap = 18;
  const rowH = (VIEW.h - 80 - gap * (radialOrder.length - 1)) / rows;
  let y = -VIEW.h / 2 + 40;

  radialOrder.forEach((deptId, i) => {
    const d = departments.find((x) => x.id === deptId)!;
    const top = y;
    const groupYs: number[] = [];
    d.subGroups.forEach((g) => {
      const gy = y + rowH / 2;
      groupYs.push(gy);
      nodes.push({ id: g.id, kind: "group", deptId: d.id, parent: d.id, x: -190, y: gy, order: 0.4 });
      g.skills.forEach((s, j) => {
        nodes.push({ id: s.id, kind: "job", deptId: d.id, parent: g.id, x: -150 + j * 13, y: gy, order: 0.5 + j * 0.02 });
      });
      // all group names start in one column, right of the longest row of jobs
      groupLabels.push({ id: g.id, x: 50, y: gy, name: g.name });
      y += rowH;
    });
    const dy = (top + y) / 2;
    nodes.push({ id: d.id, kind: "dept", deptId: d.id, parent: "brain", x: -380, y: dy, order: 0.1 + i * 0.04 });
    labels.push({ deptId: d.id, x: 330, y: dy, anchor: "start" });
    y += gap;
  });

  return { nodes, labels, groupLabels };
}
