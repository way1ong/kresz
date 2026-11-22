import type { Question } from './types'

/**
 * Генератор ситуацій на перехресті: два автомобілі, чиї траєкторії перетинаються,
 * і три варіанти організації руху. Правильну відповідь обчислює правило, а не людина,
 * тому беремо лише конфігурації, де KRESZ дає однозначну відповідь:
 *  - рівнозначні дороги → перевага в того, хто наближається справа (28. § (1) a));
 *  - знак «Elsőbbségadás kötelező» → дорогу дає той, у кого знак (28. § (2) b));
 *  - зустрічні автомобілі → дорогу дає той, хто повертає ліворуч (31. § (5) c)).
 * Синій автомобіль («Ви») завжди під'їжджає знизу.
 */
export type SceneGo = 's' | 'l' | 'r'
export type SceneArm = 'e' | 'w' | 'n'
export type SceneConfig = 'eq' | 'min' | 'maj'

/** x — чотиристороннє перехрестя; ts — Т-подібне, синій під'їжджає «ніжкою»; te — Т-подібне, «ніжка» справа. */
export type SceneShape = 'x' | 'ts' | 'te'

export interface SceneScenario {
  /** Форма перехрестя (типово 'x'). */
  shape?: SceneShape
  config: SceneConfig
  /** Маневр синього автомобіля. */
  blueGo: SceneGo
  /** Звідки під'їжджає червоний: e — справа, w — зліва, n — назустріч. */
  redArm: SceneArm
  redGo: SceneGo
}

/**
 * Пари маневрів [синій, червоний], за яких траєкторії перетинаються або зливаються.
 * Пари без конфлікту (наприклад, обидва їдуть прямо назустріч) не генеруються.
 */
const CONFLICTS: Record<SceneArm, [SceneGo, SceneGo][]> = {
  e: [['s', 's'], ['s', 'l'], ['s', 'r'], ['l', 's'], ['l', 'l']],
  w: [['s', 's'], ['s', 'l'], ['l', 's'], ['l', 'l'], ['r', 's']],
  n: [['s', 'l'], ['l', 's'], ['l', 'r'], ['r', 'l']],
}

export const SCENE_SCENARIOS: SceneScenario[] = (['eq', 'min', 'maj'] as const).flatMap((config) =>
  (['e', 'w', 'n'] as const).flatMap((redArm) =>
    CONFLICTS[redArm].map(([blueGo, redGo]) => ({ config, blueGo, redArm, redGo })),
  ),
)

/**
 * Т-подібні перехрестя. Розв'язувач той самий: «наскрізна» дорога сама по собі переваги не дає.
 *  ts — синій виїжджає з «ніжки» (ліворуч чи праворуч), червоний їде наскрізною дорогою;
 *  te — синій їде наскрізною дорогою, червоний виїжджає з «ніжки» справа.
 */
const TEE_SCENARIOS: SceneScenario[] = [
  ...(['eq', 'min'] as const).flatMap((config): SceneScenario[] => [
    { shape: 'ts', config, blueGo: 'l', redArm: 'e', redGo: 's' },
    { shape: 'ts', config, blueGo: 'l', redArm: 'e', redGo: 'l' },
    { shape: 'ts', config, blueGo: 'l', redArm: 'w', redGo: 's' },
    { shape: 'ts', config, blueGo: 'r', redArm: 'w', redGo: 's' },
  ]),
  ...(['eq', 'maj'] as const).flatMap((config): SceneScenario[] => [
    { shape: 'te', config, blueGo: 's', redArm: 'e', redGo: 'l' },
    { shape: 'te', config, blueGo: 's', redArm: 'e', redGo: 'r' },
  ]),
]
SCENE_SCENARIOS.push(...TEE_SCENARIOS)

export type SceneRule = 'right-hand' | 'sign' | 'left-turn'

/** Хто проїжджає першим і за яким правилом. */
export function solveScene({ config, blueGo, redArm }: SceneScenario): { first: 'blue' | 'red'; rule: SceneRule } {
  // Зустрічні автомобілі завжди на дорогах одного рангу: вирішує правило повороту ліворуч.
  if (redArm === 'n') return { first: blueGo === 'l' ? 'red' : 'blue', rule: 'left-turn' }
  if (config === 'min') return { first: 'red', rule: 'sign' }
  if (config === 'maj') return { first: 'blue', rule: 'sign' }
  return { first: redArm === 'e' ? 'red' : 'blue', rule: 'right-hand' }
}

export function sceneImageId({ shape, config, blueGo, redArm, redGo }: SceneScenario): string {
  const base = `gx:${config}:${blueGo}:${redArm}${redGo}`
  return shape && shape !== 'x' ? `${base}:${shape}` : base
}

export function parseSceneImageId(id: string): SceneScenario | null {
  const match = /^gx:(eq|min|maj):([slr]):([ewn])([slr])(?::(ts|te))?$/.exec(id)
  if (!match) return null
  return {
    ...(match[5] ? { shape: match[5] as SceneShape } : {}),
    config: match[1] as SceneConfig,
    blueGo: match[2] as SceneGo,
    redArm: match[3] as SceneArm,
    redGo: match[4] as SceneGo,
  }
}

const GO_HU: Record<SceneGo, string> = { s: 'egyenesen halad', l: 'balra kanyarodik', r: 'jobbra kanyarodik' }
const GO_UA_YOU: Record<SceneGo, string> = { s: 'їдете прямо', l: 'повертаєте ліворуч', r: 'повертаєте праворуч' }
const GO_UA_RED: Record<SceneGo, string> = { s: 'їде прямо', l: 'повертає ліворуч', r: 'повертає праворуч' }
const FROM_HU: Record<SceneArm, string> = { e: 'jobbról', w: 'balról', n: 'szemből' }
const FROM_UA: Record<SceneArm, string> = { e: 'справа', w: 'зліва', n: 'назустріч' }

function introTee(scenario: SceneScenario): { hu: string; ua: string } {
  if (scenario.config === 'eq') {
    return {
      hu: 'Két szilárd burkolatú út T alakú kereszteződése, jelzőtábla nincs.',
      ua: 'Т-подібне перехрестя двох доріг із твердим покриттям, знаків немає.',
    }
  }
  return scenario.shape === 'ts'
    ? {
        hu: 'T alakú útkereszteződés: Ön a betorkolló útról érkezik, amelyen „Elsőbbségadás kötelező” tábla van.',
        ua: 'Т-подібне перехрестя: Ви під\'їжджаєте дорогою, що прилягає, і на ній стоїть знак «Elsőbbségadás kötelező» («Дати дорогу»).',
      }
    : {
        hu: 'T alakú útkereszteződés: Ön főútvonalon halad, a jobbról betorkolló úton „Elsőbbségadás kötelező” tábla van.',
        ua: 'Т-подібне перехрестя: Ви їдете головною дорогою, а на дорозі, що прилягає справа, стоїть знак «Elsőbbségadás kötelező» («Дати дорогу»).',
      }
}

function intro(scenario: SceneScenario): { hu: string; ua: string } {
  if (scenario.shape && scenario.shape !== 'x') return introTee(scenario)
  const oncoming = scenario.redArm === 'n'
  switch (scenario.config) {
    case 'eq':
      return {
        hu: 'Egyenrangú utak kereszteződése, jelzőtábla nincs.',
        ua: 'Перехрестя рівнозначних доріг, знаків немає.',
      }
    case 'min':
      return oncoming
        ? {
            hu: 'Ön és a szemből érkező piros jármű útján is „Elsőbbségadás kötelező” tábla van.',
            ua: 'І на Вашій дорозі, і на дорозі зустрічного червоного автомобіля стоїть знак «Elsőbbségadás kötelező» («Дати дорогу»).',
          }
        : {
            hu: 'Ön „Elsőbbségadás kötelező” táblával megjelölt útról érkezik, a keresztező út főútvonal.',
            ua: 'Ви під\'їжджаєте дорогою зі знаком «Elsőbbségadás kötelező» («Дати дорогу»), а дорога, що перетинається, — головна.',
          }
    case 'maj':
      return oncoming
        ? {
            hu: 'Ön és a szemből érkező piros jármű is főútvonalon halad.',
            ua: 'І Ви, і зустрічний червоний автомобіль їдете головною дорогою (főútvonal).',
          }
        : {
            hu: 'Ön főútvonalon halad; a keresztező úton „Elsőbbségadás kötelező” tábla van.',
            ua: 'Ви їдете головною дорогою (főútvonal); на дорозі, що перетинається, стоїть знак «Elsőbbségadás kötelező» («Дати дорогу»).',
          }
  }
}

function explanation(scenario: SceneScenario, first: 'blue' | 'red', rule: SceneRule): { hu: string; ua: string; ref: string } {
  if (rule === 'left-turn') {
    const sameRank =
      scenario.config === 'eq'
        ? { hu: '', ua: '' }
        : {
            hu: ' A két jármű azonos rangú útról érkezik, ezért köztük ez a szabály dönt.',
            ua: ' Обидва автомобілі під\'їжджають дорогами одного рангу, тому між ними діє саме це правило.',
          }
    return {
      ref: 'KRESZ 31. § (5) c)',
      hu:
        'Balra bekanyarodó járművel elsőbbséget kell adni a szemből érkező és egyenesen továbbhaladó vagy jobbra bekanyarodó jármű részére. ' +
        (first === 'red'
          ? 'Ön kanyarodik balra, ezért a piros jármű haladhat át elsőként.'
          : 'A piros jármű kanyarodik balra, ezért Ön haladhat át elsőként.') +
        sameRank.hu,
      ua:
        'Той, хто повертає ліворуч, має дати дорогу зустрічному транспортному засобу, який їде прямо або повертає праворуч. ' +
        (first === 'red'
          ? 'Ліворуч повертаєте Ви, тому першим проїжджає червоний автомобіль.'
          : 'Ліворуч повертає червоний автомобіль, тому першими проїжджаєте Ви.') +
        sameRank.ua,
    }
  }
  if (rule === 'sign') {
    return first === 'red'
      ? {
          ref: 'KRESZ 28. § (2) b)',
          hu: 'Az „Elsőbbségadás kötelező” táblával megjelölt útról érkező járművel – a másik jármű érkezési irányától függetlenül – elsőbbséget kell adni a keresztező úton érkező jármű részére. A piros jármű haladhat át elsőként; a jobbkézszabály itt nem érvényesül.',
          ua: 'Хто під\'їжджає дорогою зі знаком «Elsőbbségadás kötelező», має дати дорогу транспорту на дорозі, що перетинається, — незалежно від того, з якого боку той наближається. Першим проїжджає червоний автомобіль; правило правої руки тут не діє.',
        }
      : {
          ref: 'KRESZ 28. § (2) b)',
          hu: 'A piros jármű „Elsőbbségadás kötelező” táblával megjelölt útról érkezik, ezért – érkezési irányától függetlenül – elsőbbséget kell adnia a keresztező úton érkező járműnek, vagyis Önnek. A jobbkézszabály itt nem érvényesül.',
          ua: 'Червоний автомобіль під\'їжджає дорогою зі знаком «Elsőbbségadás kötelező», тому — незалежно від того, з якого боку він наближається, — має дати дорогу транспорту на дорозі, що перетинається, тобто Вам. Правило правої руки тут не діє.',
        }
  }
  return first === 'red'
    ? {
        ref: 'KRESZ 28. § (1) a)',
        hu: 'Egyenrangú útkereszteződésben a jobbról érkező járműnek van elsőbbsége. A piros jármű Önhöz képest jobbról érkezik, ezért ő haladhat át elsőként – attól függetlenül, hogy ki merre kanyarodik.',
        ua: 'На перехресті рівнозначних доріг перевагу має той, хто наближається справа. Червоний автомобіль наближається до Вас справа, тому він проїжджає першим — незалежно від того, хто куди повертає.',
      }
    : {
        ref: 'KRESZ 28. § (1) a)',
        hu: 'Egyenrangú útkereszteződésben a jobbról érkező járműnek van elsőbbsége. A piros jármű vezetője Önt jobbról látja érkezni, ezért neki kell elsőbbséget adnia – attól függetlenül, hogy ki merre kanyarodik.',
        ua: 'На перехресті рівнозначних доріг перевагу має той, хто наближається справа. Для водія червоного автомобіля Ви наближаєтеся справа, тому дорогу дає він — незалежно від того, хто куди повертає.',
      }
}

export function generateSceneQuestions(): Question[] {
  return SCENE_SCENARIOS.map((scenario) => {
    const { first, rule } = solveScene(scenario)
    const start = intro(scenario)
    const why = explanation(scenario, first, rule)
    if (scenario.shape && scenario.shape !== 'x' && rule === 'right-hand') {
      why.hu += ' T alakú kereszteződésben az „átmenő” út önmagában nem ad elsőbbséget.'
      why.ua += ' На Т-подібному перехресті «наскрізна» дорога сама по собі переваги не дає.'
    }
    return {
      id: `gen-scene-${scenario.shape && scenario.shape !== 'x' ? `${scenario.shape}-` : ''}${scenario.config}-${scenario.blueGo}-${scenario.redArm}${scenario.redGo}`,
      topic: 'priority',
      kreszRef: why.ref,
      image: sceneImageId(scenario),
      points: 3,
      generated: 'scene',
      hu: {
        question: `${start.hu} Ön a kék járművel ${GO_HU[scenario.blueGo]}, a piros jármű ${FROM_HU[scenario.redArm]} érkezik és ${GO_HU[scenario.redGo]}. Melyik jármű haladhat át elsőként?`,
        answers: ['Ön (a kék jármű).', 'A piros jármű.', 'Az, amelyik előbb ér az útkereszteződésbe.'],
        explanation: why.hu,
      },
      ua: {
        question: `${start.ua} Ви синім автомобілем ${GO_UA_YOU[scenario.blueGo]}, червоний наближається ${FROM_UA[scenario.redArm]} і ${GO_UA_RED[scenario.redGo]}. Хто проїжджає першим?`,
        answers: ['Ви (синій автомобіль).', 'Червоний автомобіль.', 'Той, хто першим в\'їде на перехрестя.'],
        explanation: why.ua,
      },
      correct: first === 'blue' ? 0 : 1,
    }
  })
}
