export function Tooltip({ label, children, side = "bottom" }: { label: string; children: React.ReactNode; side?: "bottom" | "top" }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md glass-strong px-2 py-1 text-[11px] text-fg opacity-0 transition-opacity delay-150 group-hover/tt:opacity-100 ${
          side === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
        }`}
      >
        {label}
      </span>
    </span>
  );
}
