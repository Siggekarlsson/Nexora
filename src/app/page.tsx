import { Suspense } from "react";
import { SkillTreeHome } from "@/components/tree/SkillTreeHome";

export default function Home() {
  return (
    <Suspense>
      <SkillTreeHome />
    </Suspense>
  );
}
