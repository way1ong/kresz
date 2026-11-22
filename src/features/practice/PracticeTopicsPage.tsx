import { ProgressBar, Tile } from '../../components/ui'
import { QUESTIONS, questionsByTopic, TOPICS } from '../../content'
import { Bi, Tx } from '../../i18n'
import { useProgress } from '../../store/progress'
import { weakQuestionIds } from '../stats/compute'

export function PracticeTopicsPage() {
  const progress = useProgress()
  const weakCount = weakQuestionIds(QUESTIONS, progress).length
  const correctCount = (ids: string[]) => ids.filter((id) => progress.questions[id]?.lastCorrect).length

  return (
    <>
      <h1>
        <Tx k="practice.title" />
      </h1>
      {weakCount > 0 && (
        <Tile
          to="/practice/weak"
          icon="🎯"
          title={<Tx k="practice.weak" />}
          desc={<Tx k="practice.weak.desc" vars={{ n: weakCount }} />}
        />
      )}
      {TOPICS.map((topic) => {
        const ids = questionsByTopic(topic.id).map((q) => q.id)
        const correct = correctCount(ids)
        return (
          <Tile
            key={topic.id}
            to={`/practice/${topic.id}`}
            icon={topic.icon}
            title={<Bi hu={topic.hu} ua={topic.ua} />}
            desc={
              <span className="stack" style={{ gap: 6, marginTop: 6 }}>
                <ProgressBar value={correct} max={ids.length} tone="ok" />
                <Tx k="practice.topicProgress" vars={{ correct, total: ids.length }} layout="inline" />
              </span>
            }
          />
        )
      })}
      <Tile
        to="/practice/all"
        icon="🎲"
        title={<Tx k="practice.allTopics" />}
        desc={
          <Tx
            k="practice.topicProgress"
            vars={{ correct: correctCount(QUESTIONS.map((q) => q.id)), total: QUESTIONS.length }}
            layout="inline"
          />
        }
      />
    </>
  )
}
