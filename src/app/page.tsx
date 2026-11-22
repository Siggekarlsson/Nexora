import { Pencil, Wand2, ArrowUp } from "lucide-react";
import { PixelAvatar } from "@/components/brand/PixelAvatar";
import { LogoMark } from "@/components/brand/Logo";
import { departmentSeeds, brain } from "@/data/departments";
import { siteConfig } from "@/config/site";

// Step 1: design-system preview. Replaced by the radial Skill Tree in step 2.
export default function Home() {
  const all = [{ ...brain, tagline: ["knowledge base"], avatar: "brain" as const, jobs: 0, readyToRun: 0 }, ...departmentSeeds];
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-center justify-between">
        <span className="btn btn-glass rounded-full text-muted">Getting Started · <span className="text-fg">5 of 7 Done</span></span>
        <div className="flex gap-2">
          <button className="btn btn-glass"><Wand2 size={15} /> New Skill</button>
          <button className="btn btn-glass"><Pencil size={15} /> Edit Tree</button>
        </div>
      </div>

      <div className="mt-14 flex flex-col items-center text-center">
        <LogoMark size={64} />
        <h1 className="dept-title mt-6 text-3xl">{siteConfig.name}</h1>
        <p className="mt-3 text-sm text-muted">Design system preview · step 1 of 5</p>
      </div>

      <section className="mt-14">
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-faint">Departments & agents</h2>
        <div className="grid grid-cols-4 gap-4">
          {all.map((d) => (
            <div key={d.id} className="glass relative overflow-hidden rounded-2xl p-5">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl" style={{ background: d.color }} />
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${d.color}22`, boxShadow: `0 0 0 1px ${d.color}55, 0 0 24px ${d.color}40` }}
              >
                <PixelAvatar id={d.avatar} color={d.color} size={24} />
              </div>
              <div className="dept-title mt-4 text-[13px]" style={{ color: d.color }}>{d.name}</div>
              <div className="mt-1 text-xs text-muted">{d.tagline.join(" · ")}</div>
              {d.jobs > 0 && (
                <div className="mt-3 text-[11px] text-faint">{d.jobs} jobs · {d.readyToRun} ready to run</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-faint">Typography</h2>
          <div className="glass space-y-3 rounded-2xl p-6">
            <div className="dept-title text-2xl">Research</div>
            <div className="text-xl font-semibold">What&apos;s up, {siteConfig.user.firstName}?</div>
            <p className="text-sm text-muted">Auto sends it to the right teammate, or pick one yourself below.</p>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-faint">Controls</h2>
          <div className="glass space-y-4 rounded-2xl p-6">
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-cta">Start →</button>
              <button className="btn btn-glass">+ New</button>
              <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">Runs on your brain</span>
              <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">→ Recommended next</span>
            </div>
            <div className="glass flex items-center gap-3 rounded-2xl py-2 pl-4 pr-2">
              <span className="flex-1 text-sm text-faint">Ask anything, or type / for an agent or skill</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cta text-cta-fg"><ArrowUp size={16} /></span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
