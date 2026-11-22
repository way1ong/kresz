import type { ReactNode } from 'react'
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

function Intersection({ arms = ALL_ARMS, dirt = [], vehicles, signs = [] }: SceneSpec) {
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
    </>
  )
}

const SIGN_POSITION: Record<Arm, [number, number]> = { s: [67, 67], w: [19, 67], n: [19, 19], e: [67, 19] }

function SignAt({ arm, sign }: { arm: Arm; sign: string }) {
  const [x, y] = SIGN_POSITION[arm]
  return <g transform={`translate(${x} ${y}) scale(0.14)`}>{SIGNS[sign]?.()}</g>
}

function TrafficLight({ red, yellow, green }: { red?: boolean; yellow?: boolean; green?: boolean }) {
  const off = '#3a3f47'
  return (
    <>
      <rect x="30" y="4" width="40" height="92" rx="10" fill="#15171a" />
      <circle cx="50" cy="22" r="11.5" fill={red ? '#e3262f' : off} />
      <circle cx="50" cy="50" r="11.5" fill={yellow ? '#f6c700' : off} />
      <circle cx="50" cy="78" r="11.5" fill={green ? '#1fb455' : off} />
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

  // ---- Сигнали світлофора ----
  'light-red': () => <TrafficLight red />,
  'light-red-yellow': () => <TrafficLight red yellow />,
  'light-yellow': () => <TrafficLight yellow />,
  'light-green': () => <TrafficLight green />,
}
