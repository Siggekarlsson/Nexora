import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

/** Render a lucide icon by name (names are stored in data so they can live in a DB). */
export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? Icons.Sparkles;
  return <Icon {...props} />;
}
