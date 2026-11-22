import type { ReactNode } from 'react'
import { SIGNS } from './registry'
import { dynamicScene, SCENES } from './scenes'

/** Усі малюнки, на які може посилатися поле image: знаки + схеми перехресть + світлофори. */
export const IMAGES: Record<string, () => ReactNode> = { ...SIGNS, ...SCENES }
export const IMAGE_IDS = Object.keys(IMAGES)

export function getImage(id: string): (() => ReactNode) | undefined {
  return IMAGES[id] ?? dynamicScene(id)
}

export function hasImage(id: string): boolean {
  return getImage(id) !== undefined
}
