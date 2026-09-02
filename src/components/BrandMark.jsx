// Recreación en SVG del logo SRM Telsa Transformadores: wordmark verde con
// un rayo gris cruzando, doble línea fina y "TELSA TRANSFORMADORES" debajo,
// dentro de un marco ligeramente inclinado. Vectorial para verse nítido en
// cualquier tamaño y poder animarlo (el rayo hace un flicker sutil).
export default function BrandMark({ className = '', compact = false }) {
  if (compact) {
    return (
      <svg viewBox="0 0 120 40" className={className} role="img" aria-label="SRM Telsa">
        <polygon
          points="6,4 116,4 114,36 4,36"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.9"
        />
        <polygon
          points="18,32 46,6 40,20 62,20 30,34"
          fill="currentColor"
          opacity="0.35"
          className="animate-bolt"
        />
        <text
          x="60"
          y="27"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="24"
          fill="currentColor"
        >
          SRM
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label="SRM Telsa Transformadores">
      <polygon
        points="18,14 302,14 294,226 10,226"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.95"
      />
      <polygon
        points="40,196 145,32 128,96 210,96 105,202"
        fill="#9aa3ab"
        opacity="0.55"
        className="animate-bolt"
      />
      <text
        x="160"
        y="112"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="82"
        fill="currentColor"
      >
        SRM
      </text>
      <line x1="55" y1="130" x2="265" y2="130" stroke="currentColor" strokeWidth="1.5" />
      <line x1="55" y1="138" x2="265" y2="138" stroke="currentColor" strokeWidth="1.5" />
      <text
        x="160"
        y="176"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="600"
        fontSize="26"
        letterSpacing="2"
        fill="currentColor"
      >
        TELSA
      </text>
      <text
        x="160"
        y="208"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="22"
        letterSpacing="1"
        fill="currentColor"
      >
        TRANSFORMADORES
      </text>
    </svg>
  )
}
