import type { ReactNode } from 'react'

/**
 * Дорожні знаки, намальовані власними SVG-примітивами за стандартним виглядом
 * (без сторонніх зображень). Усі знаки вписані у viewBox 0 0 100 100.
 * Назви й значення знаків — у src/content/cards/signs.json.
 */
const RED = '#d4202a'
const BLUE = '#1a5fb4'
const YELLOW = '#f6c700'
const BLACK = '#15171a'
const WHITE = '#ffffff'
const FONT = 'Arial, Helvetica, sans-serif'

// ---------- Базові форми ----------

function Warning({ children }: { children?: ReactNode }) {
  return (
    <>
      <path d="M50 9 94 87H6Z" fill={WHITE} stroke={RED} strokeWidth="8" strokeLinejoin="round" />
      {children}
    </>
  )
}

function Prohibition({ children, fill = WHITE }: { children?: ReactNode; fill?: string }) {
  return (
    <>
      <circle cx="50" cy="50" r="42" fill={fill} stroke={RED} strokeWidth="10" />
      {children}
    </>
  )
}

function Slash() {
  return <path d="M22 22 78 78" stroke={RED} strokeWidth="9" />
}

function BlueDisc({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx="50" cy="50" r="46" fill={BLUE} stroke={WHITE} strokeWidth="2" />
      {children}
    </>
  )
}

function BlueSquare({ children }: { children?: ReactNode }) {
  return (
    <>
      <rect x="4" y="4" width="92" height="92" rx="8" fill={BLUE} stroke={WHITE} strokeWidth="2" />
      {children}
    </>
  )
}

function Label({ text, y = 63, size = 38, fill = BLACK }: { text: string; y?: number; size?: number; fill?: string }) {
  return (
    <text x="50" y={y} textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize={size} fill={fill}>
      {text}
    </text>
  )
}

// ---------- Піктограми ----------

/** Стрілка вгору з центром по x; використовується з transform для інших напрямків. */
function ArrowUp({ x = 50, top = 22, bottom = 78, color = WHITE, width = 9 }: { x?: number; top?: number; bottom?: number; color?: string; width?: number }) {
  const head = width * 1.5
  return (
    <>
      <path d={`M${x} ${bottom}V${top + head}`} stroke={color} strokeWidth={width} />
      <path d={`M${x} ${top}l${head} ${head * 1.4}h${-head * 2}Z`} fill={color} />
    </>
  )
}

function Pedestrian({ x = 0, y = 0, scale = 1, color = BLACK }: { x?: number; y?: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={color} strokeWidth="5" strokeLinecap="round" fill="none">
      <circle cx="20" cy="5" r="4.6" fill={color} stroke="none" />
      <path d="M20 12 18 26M18 26 10 39M18 26 27 39M19 15 10 23M19 15 29 22" />
    </g>
  )
}

/** Автомобіль, вид ззаду. */
function Car({ x = 0, y = 0, scale = 1, color = BLACK }: { x?: number; y?: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={color}>
      <path d="M6 10 9.5 1.5h11L24 10Z" />
      <rect x="1.5" y="9" width="27" height="10" rx="2.5" />
      <rect x="4" y="18" width="5.5" height="5" rx="1" />
      <rect x="20.5" y="18" width="5.5" height="5" rx="1" />
    </g>
  )
}

function Bicycle({ x = 0, y = 0, scale = 1, color = BLACK }: { x?: number; y?: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={color} strokeWidth="2.6" fill="none" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="9" cy="20" r="8" />
      <circle cx="37" cy="20" r="8" />
      <path d="M9 20 17 7H31L37 20M17 7 23 20H9M23 20 31 7M14 5h6M31 7 29 3h5" />
    </g>
  )
}

/** Вантажівка, вид збоку. */
function Truck({ x = 0, y = 0, scale = 1, color = BLACK }: { x?: number; y?: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={color}>
      <rect x="0" y="0" width="30" height="20" rx="1.5" />
      <path d="M32 6h9l6 7v7H32Z" />
      <circle cx="9" cy="23" r="4.5" />
      <circle cx="39" cy="23" r="4.5" />
    </g>
  )
}

/** Знак скасування: біле коло з чорними діагональними смугами. */
function EndCircle({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx="50" cy="50" r="45" fill={WHITE} stroke={BLACK} strokeWidth="2.5" />
      {children}
      <path d="M22 72 72 22M25 75 75 25M28 78 78 28" stroke={BLACK} strokeWidth="1.6" />
    </>
  )
}

function RoundaboutArrows() {
  // Три дугові стрілки проти годинникової стрілки (напрямок руху по колу).
  const r = 23
  const point = (deg: number, radius = r) => {
    const rad = (deg * Math.PI) / 180
    return `${(50 + radius * Math.cos(rad)).toFixed(1)} ${(50 - radius * Math.sin(rad)).toFixed(1)}`
  }
  return (
    <>
      {[0, 120, 240].map((start) => (
        <g key={start}>
          <path d={`M${point(start)}A${r} ${r} 0 0 0 ${point(start + 62)}`} stroke={WHITE} strokeWidth="8" fill="none" />
          <path d={`M${point(start + 100)}L${point(start + 60, r + 10)}L${point(start + 60, r - 10)}Z`} fill={WHITE} />
        </g>
      ))}
    </>
  )
}

// ---------- Реєстр знаків ----------

export const SIGNS: Record<string, () => ReactNode> = {
  // 11. § — тип дороги
  motorway: () => (
    <>
      <rect x="4" y="10" width="92" height="80" rx="8" fill={BLUE} stroke={WHITE} strokeWidth="2" />
      <path d="M26 84H42L47 16H39ZM74 84H58L53 16H61Z" fill={WHITE} />
      <rect x="10" y="39" width="80" height="14" fill={BLUE} />
      <path d="M12 44H88" stroke={WHITE} strokeWidth="4.5" />
      <path d="M22 46v7M78 46v7" stroke={WHITE} strokeWidth="3" />
    </>
  ),
  expressway: () => (
    <>
      <rect x="4" y="10" width="92" height="80" rx="8" fill={BLUE} stroke={WHITE} strokeWidth="2" />
      <Car x={17} y={24} scale={2.2} color={WHITE} />
    </>
  ),
  mainRoad: () => (
    <>
      <path d="M50 4 96 50 50 96 4 50Z" fill={WHITE} stroke={BLACK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 22 78 50 50 78 22 50Z" fill={YELLOW} stroke={BLACK} strokeWidth="1.5" />
    </>
  ),
  mainRoadEnd: () => (
    <>
      <path d="M50 4 96 50 50 96 4 50Z" fill={WHITE} stroke={BLACK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 22 78 50 50 78 22 50Z" fill={YELLOW} stroke={BLACK} strokeWidth="1.5" />
      <path d="M26 74 74 26" stroke={BLACK} strokeWidth="8" />
    </>
  ),

  // 12. § — пріоритет
  yield: () => <path d="M7 13H93L50 89Z" fill={WHITE} stroke={RED} strokeWidth="9" strokeLinejoin="round" />,
  stop: () => (
    <>
      <path d="M30 3H70L97 30V70L70 97H30L3 70V30Z" fill={RED} />
      <path d="M32 8H68L92 32V68L68 92H32L8 68V32Z" fill="none" stroke={WHITE} strokeWidth="2.5" />
      <Label text="STOP" y={60} size={27} fill={WHITE} />
    </>
  ),
  oncomingPriority: () => (
    <Prohibition>
      <g transform="rotate(180 37 50)">
        <ArrowUp x={37} top={24} bottom={76} color={BLACK} width={8} />
      </g>
      <ArrowUp x={63} top={24} bottom={76} color={RED} width={8} />
    </Prohibition>
  ),
  priorityOverOncoming: () => (
    <BlueSquare>
      <g transform="rotate(180 36 50)">
        <ArrowUp x={36} top={26} bottom={74} color={RED} width={7} />
      </g>
      <ArrowUp x={64} top={18} bottom={82} color={WHITE} width={10} />
    </BlueSquare>
  ),

  // 13. § — наказові
  mandatoryStraight: () => (
    <BlueDisc>
      <ArrowUp top={16} bottom={84} width={11} />
    </BlueDisc>
  ),
  mandatoryRight: () => (
    <BlueDisc>
      <g transform="rotate(90 50 50)">
        <ArrowUp top={16} bottom={84} width={11} />
      </g>
    </BlueDisc>
  ),
  passRight: () => (
    <BlueDisc>
      <g transform="rotate(135 50 50)">
        <ArrowUp top={18} bottom={82} width={11} />
      </g>
    </BlueDisc>
  ),
  bikePath: () => (
    <BlueDisc>
      <Bicycle x={22} y={34} scale={1.22} color={WHITE} />
    </BlueDisc>
  ),
  footPath: () => (
    <BlueDisc>
      <Pedestrian x={24} y={20} scale={1.5} color={WHITE} />
    </BlueDisc>
  ),
  roundabout: () => (
    <BlueDisc>
      <RoundaboutArrows />
    </BlueDisc>
  ),
  minSpeed: () => (
    <BlueDisc>
      <Label text="30" y={65} size={44} fill={WHITE} />
    </BlueDisc>
  ),

  // 14. § — заборонні
  noRightTurn: () => (
    <Prohibition>
      <path d="M38 76V46H60" stroke={BLACK} strokeWidth="9" fill="none" />
      <path d="M76 46 58 34V58Z" fill={BLACK} />
      <Slash />
    </Prohibition>
  ),
  noLeftTurn: () => (
    <Prohibition>
      <path d="M62 76V46H40" stroke={BLACK} strokeWidth="9" fill="none" />
      <path d="M24 46 42 34V58Z" fill={BLACK} />
      <Slash />
    </Prohibition>
  ),
  noUTurn: () => (
    <Prohibition>
      <path d="M64 76V46a12 12 0 0 0-24 0V56" stroke={BLACK} strokeWidth="9" fill="none" />
      <path d="M40 74 28 54H52Z" fill={BLACK} />
      <Slash />
    </Prohibition>
  ),
  speedLimit50: () => (
    <Prohibition>
      <Label text="50" y={65} size={42} />
    </Prohibition>
  ),
  noOvertaking: () => (
    <Prohibition>
      <Car x={18} y={37} scale={1.05} color={RED} />
      <Car x={51} y={37} scale={1.05} color={BLACK} />
    </Prohibition>
  ),
  speedLimitEnd: () => (
    <EndCircle>
      <Label text="50" y={65} size={42} fill="#8a8f98" />
    </EndCircle>
  ),
  noOvertakingEnd: () => (
    <EndCircle>
      <Car x={18} y={37} scale={1.05} color="#8a8f98" />
      <Car x={51} y={37} scale={1.05} color="#8a8f98" />
    </EndCircle>
  ),
  restrictionsEnd: () => <EndCircle />,
  noTrucks: () => (
    <Prohibition>
      <Truck x={26} y={36} scale={1} />
    </Prohibition>
  ),
  noBicycles: () => (
    <Prohibition>
      <Bicycle x={27} y={36} scale={1} />
    </Prohibition>
  ),
  noEntryBoth: () => <Prohibition />,
  noEntry: () => (
    <>
      <circle cx="50" cy="50" r="46" fill={RED} stroke={WHITE} strokeWidth="2" />
      <rect x="18" y="41" width="64" height="18" rx="2" fill={WHITE} />
    </>
  ),

  // 15. § — зупинка й стоянка
  noStopping: () => (
    <Prohibition fill={BLUE}>
      <path d="M22 22 78 78M78 22 22 78" stroke={RED} strokeWidth="9" />
    </Prohibition>
  ),
  noParking: () => (
    <Prohibition fill={BLUE}>
      <Slash />
    </Prohibition>
  ),

  // 16. § — попереджувальні
  curveLeft: () => (
    <Warning>
      <path d="M58 78V62L42 48" stroke={BLACK} strokeWidth="7" fill="none" strokeLinejoin="round" />
      <path d="M33 37 49 41 38 53Z" fill={BLACK} />
    </Warning>
  ),
  narrowing: () => (
    <Warning>
      <path d="M36 78V64L44 54V38M64 78V64L56 54V38" stroke={BLACK} strokeWidth="6" fill="none" strokeLinejoin="round" />
    </Warning>
  ),
  oncomingTraffic: () => (
    <Warning>
      <g transform="rotate(180 41 59)">
        <ArrowUp x={41} top={40} bottom={78} color={BLACK} width={6} />
      </g>
      <ArrowUp x={59} top={40} bottom={78} color={BLACK} width={6} />
    </Warning>
  ),
  bump: () => (
    <Warning>
      <path d="M26 74H36C40 74 42 58 50 58S60 74 64 74H74V79H26Z" fill={BLACK} />
    </Warning>
  ),
  unevenRoad: () => (
    <Warning>
      <path d="M24 74H30C33 74 34 62 40 62S47 74 50 74 54 62 60 62 67 74 70 74H76V79H24Z" fill={BLACK} />
    </Warning>
  ),
  slippery: () => (
    <Warning>
      <Car x={36} y={36} scale={0.95} color={BLACK} />
      <path d="M41 62c-5 5 4 8-2 15M57 62c-5 5 4 8-2 15" stroke={BLACK} strokeWidth="4" fill="none" strokeLinecap="round" />
    </Warning>
  ),
  pedestrianWarning: () => (
    <Warning>
      <Pedestrian x={34} y={36} scale={0.85} />
      <path d="M26 79H36M42 79H52M58 79H68" stroke={BLACK} strokeWidth="4" />
    </Warning>
  ),
  children: () => (
    <Warning>
      <Pedestrian x={30} y={38} scale={0.95} />
      <Pedestrian x={50} y={47} scale={0.72} />
    </Warning>
  ),
  trafficLights: () => (
    <Warning>
      <circle cx="50" cy="42" r="6.5" fill={RED} />
      <circle cx="50" cy="57" r="6.5" fill={YELLOW} stroke={BLACK} strokeWidth="0.8" />
      <circle cx="50" cy="72" r="6.5" fill="#1f9d4b" />
    </Warning>
  ),
  equalCrossing: () => (
    <Warning>
      <path d="M35 44 65 78M65 44 35 78" stroke={BLACK} strokeWidth="7" />
    </Warning>
  ),
  minorRoadCrossing: () => (
    <Warning>
      <ArrowUp top={36} bottom={80} color={BLACK} width={10} />
      <path d="M32 64H68" stroke={BLACK} strokeWidth="4.5" />
    </Warning>
  ),
  railwayNoBarrier: () => (
    <Warning>
      {/* спрощений паровоз */}
      <rect x="30" y="56" width="30" height="13" fill={BLACK} />
      <rect x="56" y="46" width="14" height="23" fill={BLACK} />
      <rect x="35" y="47" width="6" height="10" fill={BLACK} />
      <path d="M30 69 24 76H32Z" fill={BLACK} />
      <circle cx="38" cy="74" r="5" fill={BLACK} />
      <circle cx="50" cy="74" r="5" fill={BLACK} />
      <circle cx="63" cy="74" r="5" fill={BLACK} />
      <path d="M38 43c0-6 8-4 8-10" stroke={BLACK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </Warning>
  ),
  railwayBarrier: () => (
    <Warning>
      <path d="M28 56H72M28 68H72" stroke={BLACK} strokeWidth="4.5" />
      <path d="M34 48V79M46 48V79M58 48V79M70 48V79" stroke={BLACK} strokeWidth="4" />
    </Warning>
  ),
  railwayCross: () => (
    // «Vasúti átjáró kezdete» — Андріївський хрест
    <g stroke={RED} strokeWidth="3" fill={WHITE} strokeLinejoin="round">
      <path d="M8 26 14 14 92 62 86 74Z" />
      <path d="M92 26 86 14 8 62 14 74Z" />
    </g>
  ),
  otherDanger: () => (
    <Warning>
      <path d="M50 36V63" stroke={BLACK} strokeWidth="9" strokeLinecap="round" />
      <circle cx="50" cy="75" r="5" fill={BLACK} />
    </Warning>
  ),

  // 17. § — інформаційні
  pedestrianCrossing: () => (
    <BlueSquare>
      <path d="M50 14 88 84H12Z" fill={WHITE} />
      <Pedestrian x={34} y={34} scale={0.85} />
      <path d="M24 79H34M40 79H50M56 79H66M72 79H78" stroke={BLACK} strokeWidth="4" />
    </BlueSquare>
  ),
  oneWay: () => (
    <BlueSquare>
      <ArrowUp top={14} bottom={86} width={13} />
    </BlueSquare>
  ),
  deadEnd: () => (
    <BlueSquare>
      <rect x="42" y="34" width="16" height="52" fill={WHITE} />
      <rect x="26" y="18" width="48" height="16" fill={RED} stroke={WHITE} strokeWidth="2" />
    </BlueSquare>
  ),
  parking: () => (
    <BlueSquare>
      <Label text="P" y={76} size={74} fill={WHITE} />
    </BlueSquare>
  ),
  builtUpStart: () => (
    <>
      <rect x="4" y="26" width="92" height="48" rx="5" fill={WHITE} stroke={BLACK} strokeWidth="3" />
      <Label text="Szeged" y={58} size={22} />
    </>
  ),
  builtUpEnd: () => (
    <>
      <rect x="4" y="26" width="92" height="48" rx="5" fill={WHITE} stroke={BLACK} strokeWidth="3" />
      <Label text="Szeged" y={58} size={22} />
      <path d="M8 70 92 30" stroke={RED} strokeWidth="6" />
    </>
  ),
}

export const SIGN_IDS = Object.keys(SIGNS)

export function hasSign(id: string): boolean {
  return id in SIGNS
}
