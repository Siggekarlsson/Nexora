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

/** Clockwise order around the radial map, starting at the bottom (Research).  Neighbours are used for paging in department view. */
export const radialOrder: Exclude<DepartmentId, "brain">[] = [
  "research", "sales", "marketing", "operations", "customer", "finance", "leadership",
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

/** Built-in skills by id. Kept in sync with `allSkills` when a company tree is applied. */
export const skillById: Record<string, Skill> = Object.fromEntries(allSkills.map((s) => [s.id, s]));

/** Snapshot of the default tree, so a removed override can be undone. */
const original = {
  seeds: departmentSeeds.map((s) => ({ name: s.name, tagline: [...s.tagline] })),
  depts: departments.map((d) => ({ name: d.name, tagline: d.tagline, jobs: d.jobs, readyToRun: d.readyToRun, subGroups: d.subGroups })),
};

type OverrideDept = {
  name: string;
  tagline: string[];
  groups: { name: string; skills: { name: string; description: string; icon?: string }[] }[];
};

const GROUP_ICONS = ["Sparkles", "FileText", "Mail", "BarChart3", "Users", "Target", "Calendar", "Search"];

/**
 * Replaces department names, taglines and skills with the ones written for this company during onboarding.
 * The exported arrays and objects are mutated in place so every module that imported them sees the new tree.
 * Pass null to go back to the default tree.
 */
export function applyTree(tree: Partial<Record<Exclude<DepartmentId, "brain">, OverrideDept>> | null) {
  departments.forEach((d, i) => {
    const seed = departmentSeeds[i];
    const o = tree?.[d.id as Exclude<DepartmentId, "brain">];
    if (!o || !o.groups?.length) {
      Object.assign(seed, original.seeds[i]);
      Object.assign(d, original.depts[i]);
      return;
    }
    let n = 0;
    const subGroups: SubGroup[] = o.groups.map((g, gi) => {
      const gid = `${d.id}.${slug(g.name) || `group-${gi}`}`;
      return {
        id: gid,
        departmentId: d.id,
        name: g.name,
        skills: g.skills.map((s, si): Skill => {
          const readyToRun = si === 0 || n++ % 3 === 0;
          return {
            id: `${d.id}.${slug(s.name) || `skill-${gi}-${si}`}`,
            departmentId: d.id,
            subGroupId: gid,
            name: s.name,
            description: s.description || genDescription(s.name, g.name, o.name),
            icon: s.icon || GROUP_ICONS[gi % GROUP_ICONS.length],
            color: d.color,
            enabled: readyToRun,
            recommended: gi === 0 && si === 0,
            readyToRun,
            owner: "Your team",
          };
        }),
      };
    });
    const skills = subGroups.flatMap((g) => g.skills);
    Object.assign(seed, { name: o.name, tagline: o.tagline.slice(0, 3) });
    Object.assign(d, { name: o.name, tagline: o.tagline.slice(0, 3), subGroups, jobs: skills.length, readyToRun: skills.filter((s) => s.readyToRun).length });
  });
  allSkills.splice(0, allSkills.length, ...departments.flatMap((d) => d.subGroups.flatMap((g) => g.skills)));
  for (const k of Object.keys(skillById)) delete skillById[k];
  allSkills.forEach((s) => (skillById[s.id] = s));
}
