import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata = { title: "Get started" };

export default function OnboardingPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}
