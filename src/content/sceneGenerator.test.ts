import { describe, expect, it } from 'vitest'
import { generateSceneQuestions, parseSceneImageId, SCENE_SCENARIOS, sceneImageId, solveScene, type SceneScenario } from './sceneGenerator'

const first = (scenario: SceneScenario) => solveScene(scenario).first

describe('ситуації на перехресті', () => {
  it('рівнозначні дороги: перевага в того, хто наближається справа — незалежно від маневрів', () => {
    for (const blueGo of ['s', 'l'] as const) {
      expect(first({ config: 'eq', blueGo, redArm: 'e', redGo: 's' })).toBe('red')
      expect(first({ config: 'eq', blueGo, redArm: 'w', redGo: 's' })).toBe('blue')
    }
    expect(solveScene({ config: 'eq', blueGo: 'r', redArm: 'w', redGo: 's' })).toEqual({ first: 'blue', rule: 'right-hand' })
  })

  it('знак «Дати дорогу»: дорогу дає той, у кого знак, з якого б боку не був інший', () => {
    for (const redArm of ['e', 'w'] as const) {
      expect(solveScene({ config: 'min', blueGo: 's', redArm, redGo: 's' })).toEqual({ first: 'red', rule: 'sign' })
      expect(solveScene({ config: 'maj', blueGo: 's', redArm, redGo: 's' })).toEqual({ first: 'blue', rule: 'sign' })
    }
  })

  it('зустрічні: дорогу дає той, хто повертає ліворуч, за будь-якої організації руху', () => {
    for (const config of ['eq', 'min', 'maj'] as const) {
      expect(solveScene({ config, blueGo: 'l', redArm: 'n', redGo: 's' })).toEqual({ first: 'red', rule: 'left-turn' })
      expect(solveScene({ config, blueGo: 'l', redArm: 'n', redGo: 'r' })).toEqual({ first: 'red', rule: 'left-turn' })
      expect(solveScene({ config, blueGo: 's', redArm: 'n', redGo: 'l' })).toEqual({ first: 'blue', rule: 'left-turn' })
      expect(solveScene({ config, blueGo: 'r', redArm: 'n', redGo: 'l' })).toEqual({ first: 'blue', rule: 'left-turn' })
    }
  })

  it('генеруються лише конфліктні пари: 14 на кожну організацію руху, без повторів', () => {
    expect(SCENE_SCENARIOS).toHaveLength(42)
    const ids = SCENE_SCENARIOS.map(sceneImageId)
    expect(new Set(ids).size).toBe(42)
    // зустрічні, що обидва їдуть прямо, не конфліктують — такого сценарію немає
    expect(ids).not.toContain('gx:eq:s:ns')
    for (const scenario of SCENE_SCENARIOS) expect(parseSceneImageId(sceneImageId(scenario))).toEqual(scenario)
    expect(parseSceneImageId('stop')).toBeNull()
  })

  it('питання: 3 бали, правильна відповідь відповідає розв\'язку', () => {
    const questions = generateSceneQuestions()
    expect(questions).toHaveLength(42)
    questions.forEach((question, index) => {
      expect(question.points).toBe(3)
      expect(question.correct).toBe(first(SCENE_SCENARIOS[index]) === 'blue' ? 0 : 1)
    })
  })
})
