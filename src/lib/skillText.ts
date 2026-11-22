import type { Skill } from "./types";
import { departmentName } from "@/data/departments";

/** Long-form description for the job panel. Later this comes from the DB. */
export function skillSections(s: Skill, groupName: string) {
  const dept = departmentName(s.departmentId);
  return [
    { title: "What it does", body: s.description },
    {
      title: "When to use it",
      body: `Reach for ${s.name} when ${groupName.toLowerCase()} work is waiting and you want a solid first draft fast. It works best when your company brain has the relevant notes, models and past correspondence uploaded, so the ${dept} agent can cite them instead of guessing.`,
    },
    {
      title: "What you get",
      body: `A structured result in the thread: a short summary up top, the full draft below, and a list of the sources it used from your brain. You can ask follow-up questions, have it rewrite sections, or hand it to another agent.`,
    },
    {
      title: "How it runs",
      body: `Runs on your brain: it only reads documents your workspace has access to. Nothing is sent outside ${dept} without your approval, and every run is logged under Schedules so you can repeat it.`,
    },
  ];
}
