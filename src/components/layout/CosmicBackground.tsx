/** Fixed star field + soft nebula glows behind all content. */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const stars = Array.from({ length: 220 }, (_, i) => ({
  x: rand() * 100,
  y: rand() * 100,
  r: rand() < 0.08 ? 1.3 : rand() * 0.7 + 0.3,
  o: rand() * 0.45 + 0.1,
  twinkle: i % 9 === 0,
  delay: rand() * 6,
}));

export function CosmicBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* nebulae */}
      <div className="absolute inset-0" style={{ opacity: "var(--nebula-opacity)" }}>
        <div className="absolute -left-[10%] top-[10%] h-[55vh] w-[45vw] rounded-full bg-[#6d3cff] opacity-[0.10] blur-[120px]" />
        <div className="absolute right-[-5%] top-[5%] h-[50vh] w-[40vw] rounded-full bg-[#2f7bff] opacity-[0.09] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[45vh] w-[40vw] rounded-full bg-[#16c99a] opacity-[0.07] blur-[130px]" />
        <div className="absolute bottom-[0%] right-[10%] h-[40vh] w-[35vw] rounded-full bg-[#ff4f9a] opacity-[0.07] blur-[130px]" />
      </div>
      {/* stars */}
      <svg className="absolute inset-0 h-full w-full">
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            fill={`rgba(var(--star), ${s.o})`}
            className={s.twinkle ? "animate-[twinkle_5s_ease-in-out_infinite]" : undefined}
            style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
          />
        ))}
      </svg>
      <style>{`@keyframes twinkle{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
    </div>
  );
}
