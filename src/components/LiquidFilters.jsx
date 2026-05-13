// Hidden SVG <defs> — declared once at the root, referenced by CSS
// (backdrop-filter: url(#liquid-refraction)) wherever we need real refraction.
//
// How the lensing works:
//   feTurbulence  → produces an organic noise field.
//   feGaussianBlur→ smooths the noise so the distortion isn't speckly.
//   feDisplacementMap → uses R/G channels of the blurred noise to push pixels
//                       of the background up/down — that's the "lens" bend.
//   The scale stays low (~22) so text behind the bar stays legible while
//   still visibly warping when it scrolls underneath.
export default function LiquidFilters() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter
          id="liquid-refraction"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.018"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* A stronger variant used by the dropzone when a file is being
            dragged over it — exaggerates the lens for "ooh, magnetic" feel. */}
        <filter
          id="liquid-refraction-strong"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.028"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="3" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="48"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
