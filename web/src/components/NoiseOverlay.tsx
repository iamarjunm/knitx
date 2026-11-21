export default function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden select-none"
    >
      {/* Subtle Architectural Brutalist Vertical Hairlines */}
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-4 px-4 sm:px-6 lg:px-10">
        <div className="border-l border-bone/[0.035]" />
        <div className="border-l border-bone/[0.035]" />
        <div className="border-l border-bone/[0.035]" />
        <div className="border-x border-bone/[0.035]" />
      </div>

      {/* Film Grain SVG Overlay */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.045] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="knitx-film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.78"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#knitx-film-grain)" />
      </svg>

      {/* Subtle Vignette Frame */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 58%, rgba(6, 6, 7, 0.48) 100%)",
        }}
      />
    </div>
  );
}
