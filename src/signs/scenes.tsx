import type { ReactNode } from 'react'
import { parseSceneImageId, type SceneGo } from '../content/sceneGenerator'
import { SIGNS } from './registry'

/**
 * Схеми перехресть і сигнали світлофора для питань (поле image).
 * Схема описується декларативно: які дороги є, хто звідки їде й куди, які знаки стоять.
 * Умовні кольори: синій автомобіль — «Ви», інші учасники — червоний і зелений, трамвай — жовтий.
 */
type Arm = 'n' | 'e' | 's' | 'w'
type Turn = 'straight' | 'left' | 'right'
type VehicleColor = 'blue' | 'red' | 'green'

interface Vehicle {
  arm: Arm
  go: Turn
  color?: VehicleColor
  kind?: 'car' | 'tram'
}

interface SceneSpec {
  /** Які дороги підходять до перехрестя (за замовчуванням усі чотири). */
  arms?: Arm[]
  /** Ґрунтові дороги (решта — з твердим покриттям). */
  dirt?: Arm[]
  vehicles: Vehicle[]
  /** Знаки біля в'їзду з відповідного боку: id із реєстру знаків. */
  signs?: { arm: Arm; sign: string }[]
  /** Пішохід, що переходить дорогу з указаного боку перехрестя. */
  pedestrians?: Arm[]
  /**
   * Регулювальник у центрі з руками, витягнутими в сторони:
   * 'ns' — руки вздовж осі північ–південь, 'ew' — вздовж осі захід–схід.
   */
  police?: 'ns' | 'ew'
}

const COLORS: Record<VehicleColor | 'tram', string> = {
  blue: '#1a5fb4',
  red: '#d4202a',
  green: '#1f9d4b',
  tram: '#f6c700',
}
const GRASS = '#d7e5cb'
const ROAD = '#8b929c'
const DIRT = '#c9a56a'
const ALL_ARMS: Arm[] = ['n', 'e', 's', 'w']
// Усе малюється для південного в'їзду (рух угору) і повертається навколо центру.
const ROTATION: Record<Arm, number> = { s: 0, w: 90, n: 180, e: 270 }

const ARROWS: Record<Turn, { line: string; head: string }> = {
  straight: { line: 'M57.5 68V37', head: 'M57.5 31 53.8 38h7.4Z' },
  left: { line: 'M57.5 68V51Q57.5 42.5 49 42.5H37', head: 'M31 42.5 38 38.8v7.4Z' },
  right: { line: 'M57.5 68V63Q57.5 57.5 62 57.5H67', head: 'M73 57.5 66 53.8v7.4Z' },
}

function Rotated({ arm, children }: { arm: Arm; children: ReactNode }) {
  return <g transform={`rotate(${ROTATION[arm]} 50 50)`}>{children}</g>
}

function Intersection({ arms = ALL_ARMS, dirt = [], vehicles, signs = [], pedestrians = [], police }: SceneSpec) {
  return (
    <>
      <rect width="100" height="100" rx="6" fill={GRASS} />
      {arms.map((arm) => (
        <Rotated key={arm} arm={arm}>
          <rect x="35" y="64" width="30" height="36" fill={dirt.includes(arm) ? DIRT : ROAD} />
          {!dirt.includes(arm) && <path d="M50 70V100" stroke="#fff" strokeWidth="1.2" strokeDasharray="5 4" />}
        </Rotated>
      ))}
      <rect x="35" y="35" width="30" height="30" fill={ROAD} />
      {signs.map(({ arm, sign }) => (
        // Знак стоїть праворуч від дороги, обличчям до тих, хто під'їжджає; сам малюнок не повертаємо.
        <SignAt key={arm + sign} arm={arm} sign={sign} />
      ))}
      {pedestrians.map((arm) => (
        <Rotated key={arm} arm={arm}>
          {/* пішохід переходить дорогу (позначеного переходу немає) */}
          <path d="M39 74H55" stroke="#f08a24" strokeWidth="1.6" strokeDasharray="2.5 2" />
          <path d="M59 74 54.5 71.4V76.6Z" fill="#f08a24" />
          <ellipse cx="44" cy="74" rx="3.4" ry="5" fill="#f08a24" stroke="#15171a" strokeWidth="1" />
          <circle cx="44" cy="74" r="2.3" fill="#f6d2b0" stroke="#15171a" strokeWidth="0.8" />
        </Rotated>
      ))}
      {vehicles.map((vehicle, index) => {
        const color = vehicle.kind === 'tram' ? COLORS.tram : COLORS[vehicle.color ?? 'red']
        const arrow = ARROWS[vehicle.go]
        return (
          <Rotated key={index} arm={vehicle.arm}>
            <path d={arrow.line} stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d={arrow.head} fill={color} />
            {vehicle.kind === 'tram' ? (
              <>
                <rect x="53" y="71" width="9" height="27" rx="2.5" fill={color} stroke="#15171a" strokeWidth="1" />
                <path d="M54.5 80h6M54.5 89h6" stroke="#15171a" strokeWidth="1" />
                <rect x="54.5" y="73" width="6" height="3" rx="1" fill="#e8f4ff" />
              </>
            ) : (
              <>
                <rect x="53" y="72" width="9" height="16" rx="3" fill={color} stroke="#15171a" strokeWidth="1" />
                <rect x="54.5" y="75" width="6" height="3.4" rx="1" fill="#e8f4ff" />
              </>
            )}
          </Rotated>
        )
      })}
      {police && (
        // Регулювальник малюється поверх автомобілів і стрілок.
        <g transform={`rotate(${police === 'ew' ? 90 : 0} 50 50)`}>
          {/* вид згори: плечі, голова й руки в білих рукавичках */}
          <path d="M50 35V65" stroke="#15171a" strokeWidth="4.6" strokeLinecap="round" />
          <path d="M50 35.6V44M50 56V64.4" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
          <ellipse cx="50" cy="50" rx="3.6" ry="6.2" fill="#1c2f6b" stroke="#15171a" strokeWidth="1" />
          <circle cx="50" cy="50" r="2.8" fill="#f6d2b0" stroke="#15171a" strokeWidth="0.9" />
        </g>
      )}
    </>
  )
}

const SIGN_POSITION: Record<Arm, [number, number]> = { s: [67, 67], w: [19, 67], n: [19, 19], e: [67, 19] }

function SignAt({ arm, sign }: { arm: Arm; sign: string }) {
  const [x, y] = SIGN_POSITION[arm]
  return <g transform={`translate(${x} ${y}) scale(0.14)`}>{SIGNS[sign]?.()}</g>
}

/** Кругове перехрестя: синій автомобіль в'їжджає з півдня, червоний уже їде по колу. */
function Roundabout() {
  const point = (deg: number, radius = 24) => {
    const rad = (deg * Math.PI) / 180
    return `${(50 + radius * Math.cos(rad)).toFixed(1)} ${(50 - radius * Math.sin(rad)).toFixed(1)}`
  }
  return (
    <>
      <rect width="100" height="100" rx="6" fill={GRASS} />
      {ALL_ARMS.map((arm) => (
        <Rotated key={arm} arm={arm}>
          <rect x="40" y="70" width="20" height="30" fill={ROAD} />
          <path d="M50 82V100" stroke="#fff" strokeWidth="1" strokeDasharray="4 3" />
        </Rotated>
      ))}
      <circle cx="50" cy="50" r="24" fill="none" stroke={ROAD} strokeWidth="17" />
      <circle cx="50" cy="50" r="15.5" fill="#b9d3a6" stroke="#fff" strokeWidth="1" />
      {/* червоний їде по колу проти годинникової стрілки й наближається до в'їзду */}
      <path d={`M${point(232)}A24 24 0 0 0 ${point(292)}`} stroke={COLORS.red} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d={`M${point(304)}L${point(291, 27.5)}L${point(291, 20.5)}Z`} fill={COLORS.red} />
      <g transform={`translate(${point(214)}) rotate(146)`}>
        <rect x="-3.6" y="-6.5" width="7.2" height="13" rx="2.4" fill={COLORS.red} stroke="#15171a" strokeWidth="0.9" />
        <rect x="-2.4" y="-4.2" width="4.8" height="2.8" rx="0.8" fill="#e8f4ff" />
      </g>
      {/* синій в'їжджає з півдня */}
      <path d="M55 82V78Q55 73 60 70.5" stroke={COLORS.blue} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M65 68 59.2 67.2 61.8 72.6Z" fill={COLORS.blue} />
      <rect x="51.4" y="84" width="7.2" height="13" rx="2.4" fill={COLORS.blue} stroke="#15171a" strokeWidth="0.9" />
      <rect x="52.6" y="86.3" width="4.8" height="2.8" rx="0.8" fill="#e8f4ff" />
      <g transform="translate(63 73) scale(0.12)">{SIGNS.yield?.()}</g>
      <g transform="translate(76 73) scale(0.12)">{SIGNS.roundabout?.()}</g>
    </>
  )
}

function TrafficLight({ red, yellow, green, arrow }: { red?: boolean; yellow?: boolean; green?: boolean; arrow?: boolean }) {
  const off = '#3a3f47'
  return (
    <>
      <rect x="30" y="4" width="40" height="92" rx="10" fill="#15171a" />
      <circle cx="50" cy="22" r="11.5" fill={red ? '#e3262f' : off} />
      <circle cx="50" cy="50" r="11.5" fill={yellow ? '#f6c700' : off} />
      <circle cx="50" cy="78" r="11.5" fill={green ? '#1fb455' : off} />
      {arrow && (
        <>
          {/* додаткова секція із зеленою стрілкою праворуч */}
          <rect x="72" y="62" width="27" height="32" rx="7" fill="#15171a" />
          <path d="M77 78H90" stroke="#1fb455" strokeWidth="4" />
          <path d="M95 78 87.5 72.5V83.5Z" fill="#1fb455" />
        </>
      )}
    </>
  )
}

const scene = (spec: SceneSpec) => () => <Intersection {...spec} />

export const SCENES: Record<string, () => ReactNode> = {
  // ---- Перехрестя (синій автомобіль — «Ви») ----
  'x-equal-right': scene({
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'e', go: 'straight', color: 'red' },
    ],
  }),
  'x-equal-left': scene({
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'w', go: 'straight', color: 'red' },
    ],
  }),
  'x-equal-tram-left': scene({
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'w', go: 'straight', kind: 'tram' },
    ],
  }),
  'x-equal-three': scene({
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'e', go: 'straight', color: 'red' },
      { arm: 'n', go: 'straight', color: 'green' },
    ],
  }),
  'x-left-vs-oncoming': scene({
    vehicles: [
      { arm: 's', go: 'left', color: 'blue' },
      { arm: 'n', go: 'straight', color: 'red' },
    ],
  }),
  'x-yield-left': scene({
    signs: [
      { arm: 's', sign: 'yield' },
      { arm: 'n', sign: 'yield' },
      { arm: 'w', sign: 'mainRoad' },
      { arm: 'e', sign: 'mainRoad' },
    ],
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'w', go: 'straight', color: 'red' },
    ],
  }),
  'x-main-right': scene({
    signs: [
      { arm: 's', sign: 'mainRoad' },
      { arm: 'n', sign: 'mainRoad' },
      { arm: 'w', sign: 'yield' },
      { arm: 'e', sign: 'yield' },
    ],
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'e', go: 'straight', color: 'red' },
    ],
  }),
  'x-dirt-left': scene({
    arms: ['w', 'e', 's'],
    dirt: ['s'],
    vehicles: [
      { arm: 's', go: 'right', color: 'blue' },
      { arm: 'w', go: 'straight', color: 'red' },
    ],
  }),
  'x-t-equal': scene({
    arms: ['w', 'e', 's'],
    vehicles: [
      { arm: 's', go: 'left', color: 'blue' },
      { arm: 'w', go: 'straight', color: 'red' },
    ],
  }),

  'x-equal-left-vs-right': scene({
    vehicles: [
      { arm: 's', go: 'left', color: 'blue' },
      { arm: 'e', go: 'straight', color: 'red' },
    ],
  }),
  'x-stop-t': scene({
    arms: ['w', 'e', 's'],
    signs: [{ arm: 's', sign: 'stop' }],
    vehicles: [
      { arm: 's', go: 'left', color: 'blue' },
      { arm: 'e', go: 'straight', color: 'red' },
      { arm: 'w', go: 'straight', color: 'green' },
    ],
  }),
  'x-yield-three': scene({
    signs: [
      { arm: 's', sign: 'yield' },
      { arm: 'n', sign: 'yield' },
      { arm: 'w', sign: 'mainRoad' },
      { arm: 'e', sign: 'mainRoad' },
    ],
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'w', go: 'left', color: 'red' },
      { arm: 'e', go: 'straight', color: 'green' },
    ],
  }),
  'x-right-turn-ped': scene({
    pedestrians: ['e'],
    vehicles: [{ arm: 's', go: 'right', color: 'blue' }],
  }),
  'p-side-go': scene({
    police: 'ns',
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'e', go: 'straight', color: 'red' },
    ],
  }),
  'p-side-stop': scene({
    police: 'ew',
    vehicles: [
      { arm: 's', go: 'straight', color: 'blue' },
      { arm: 'w', go: 'straight', color: 'red' },
    ],
  }),
  'r-enter': () => <Roundabout />,

  // ---- Сигнали світлофора ----
  'light-red': () => <TrafficLight red />,
  'light-red-yellow': () => <TrafficLight red yellow />,
  'light-yellow': () => <TrafficLight yellow />,
  'light-green': () => <TrafficLight green />,
  'light-red-arrow': () => (
    <g transform="translate(-14 0)">
      <TrafficLight red arrow />
    </g>
  ),
}

const GO: Record<SceneGo, Turn> = { s: 'straight', l: 'left', r: 'right' }

/** Схема для згенерованої ситуації: id виду "gx:<організація руху>:<маневр синього>:<звідки й куди червоний>". */
export function dynamicScene(id: string): (() => ReactNode) | undefined {
  const scenario = parseSceneImageId(id)
  if (!scenario) return undefined
  const shape = scenario.shape ?? 'x'
  const arms: Arm[] = shape === 'ts' ? ['w', 'e', 's'] : shape === 'te' ? ['n', 's', 'e'] : ['n', 'e', 's', 'w']
  // Дороги зі знаком «Дати дорогу»: у Т-подібного перехрестя це завжди «ніжка».
  const minor: Arm[] =
    shape === 'ts' ? ['s'] : shape === 'te' ? ['e'] : scenario.config === 'min' ? ['s', 'n'] : ['w', 'e']
  const major = arms.filter((arm) => !minor.includes(arm))
  const signs =
    scenario.config === 'eq'
      ? []
      : [...minor.map((arm) => ({ arm, sign: 'yield' })), ...major.map((arm) => ({ arm, sign: 'mainRoad' }))]
  return scene({
    arms,
    signs,
    vehicles: [
      { arm: 's', go: GO[scenario.blueGo], color: 'blue' },
      { arm: scenario.redArm, go: GO[scenario.redGo], color: 'red' },
    ],
  })
}

/** Схеми перехресть (на відміну від знаків і світлофорів) показуємо більшими. */
export function isScene(id: string): boolean {
  return /^[xpr]-/.test(id) || id.startsWith('gx:')
}
