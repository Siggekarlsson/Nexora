import type { Department, DepartmentId, Skill, SubGroup } from "@/lib/types";
import { departmentSeeds } from "./departments";
import { catalog } from "./catalog";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function genDescription(name: string, group: string, dept: string) {
  return `${name} is a ${dept} skill in ${group}. It reads the relevant documents in your company brain, does the groundwork a junior analyst would normally do, and hands back a draft you can edit and send. Use it whenever ${group.toLowerCase()} work piles up; it produces a structured, source-linked result in a few minutes.`;
}

function build(): Department[] {
  return departmentSeeds.map((seed) => {
    const groups = catalog[seed.id as Exclude<DepartmentId, "brain">];
    // Interleave groups so "ready to run" is spread across sub-groups.
    const order: { g: number; s: number }[] = [];
    const max = Math.max(...groups.map((g) => g.skills.length));
    for (let s = 0; s < max; s++) groups.forEach((g, gi) => s < g.skills.length && order.push({ g: gi, s }));
    const ready = new Set(order.slice(0, seed.readyToRun).map((o) => `${o.g}:${o.s}`));

    const subGroups: SubGroup[] = groups.map((g, gi) => ({
      id: `${seed.id}.${g.id}`,
      departmentId: seed.id,
      name: g.name,
      skills: g.skills.map(([name, description, icon], si): Skill => {
        const readyToRun = ready.has(`${gi}:${si}`);
        return {
          id: `${seed.id}.${slug(name)}`,
          departmentId: seed.id,
          subGroupId: `${seed.id}.${g.id}`,
          name,
          description: description ?? genDescription(name, g.name, seed.name),
          icon: icon ?? g.icon,
          color: seed.color,
          enabled: readyToRun && name !== "Deal Closer",
          recommended: gi === 0 && si === 0,
          readyToRun,
          owner: "Your team",
        };
      }),
    }));
    const jobs = subGroups.reduce((n, g) => n + g.skills.length, 0);
    return { ...seed, jobs, subGroups };
  });
}

export const departments: Department[] = build();

/** Clockwise order around the radial map. Neighbours are used for paging in department view. */
export const radialOrder: Exclude<DepartmentId, "brain">[] = [
  "research", "leadership", "operations", "customer", "marketing", "finance", "sales",
];

export function getDepartment(id: DepartmentId) {
  return departments.find((d) => d.id === id);
}

export function neighbours(id: DepartmentId) {
  const i = radialOrder.indexOf(id as (typeof radialOrder)[number]);
  const n = radialOrder.length;
  return { prev: radialOrder[(i - 1 + n) % n], next: radialOrder[(i + 1) % n] };
}

export const allSkills: Skill[] = departments.flatMap((d) => d.subGroups.flatMap((g) => g.skills));
