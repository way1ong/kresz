import { SignImage } from './SignImage'
import { SCENE_SCENARIOS, sceneImageId } from '../content/sceneGenerator'
import { IMAGE_IDS } from './images'

/** Службова сторінка (#/signs): усі малюнки з їхніми id — зручно, коли додаєш питання з полем image. */
export function SignGalleryPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 12 }}>
      {[...IMAGE_IDS, ...SCENE_SCENARIOS.map(sceneImageId)].map((id) => (
        <figure key={id} className="card center" style={{ margin: 0, padding: 8 }}>
          <SignImage id={id} size={72} />
          <figcaption className="small muted" style={{ overflowWrap: 'anywhere' }}>
            {id}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
