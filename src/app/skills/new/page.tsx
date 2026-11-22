import { Suspense } from "react";
import { NewSkillPage } from "@/components/pages/NewSkillPage";

export default function Page() {
  return (
    <Suspense>
      <NewSkillPage />
    </Suspense>
  );
}
