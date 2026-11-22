export function PagePlaceholder({ title, subtitle, step }: { title: string; subtitle: string; step: number }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="dept-title text-[13px] text-muted">{title.split("").join(" ")}</div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
      <span className="mt-6 rounded-full glass px-3 py-1 text-xs text-muted">Built in step {step}</span>
    </div>
  );
}
