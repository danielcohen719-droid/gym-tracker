import type { ReactNode } from 'react'
import { useRoute } from './lib/router'
import { FeedbackProvider } from './components/Feedback'
import { BottomNav } from './components/BottomNav'
import Home from './screens/Home'
import Workout from './screens/Workout'
import Summary from './screens/Summary'
import History from './screens/History'
import HistoryDetail from './screens/HistoryDetail'
import Progress from './screens/Progress'
import ExerciseDetail from './screens/ExerciseDetail'
import ExerciseEdit from './screens/ExerciseEdit'
import Plan from './screens/Plan'
import TemplateEdit from './screens/TemplateEdit'
import Settings from './screens/Settings'

export default function App() {
  const route = useRoute()
  const [a, b, c] = route
  let screen: ReactNode
  let nav = true

  switch (a) {
    case 'workout':
      screen = <Workout />
      nav = false
      break
    case 'summary':
      screen = <Summary id={b} />
      nav = false
      break
    case 'history':
      screen = b ? <HistoryDetail id={b} /> : <History />
      break
    case 'progress':
      screen = <Progress />
      break
    case 'exercise':
      screen = c === 'edit' ? <ExerciseEdit id={b} /> : <ExerciseDetail id={b} />
      break
    case 'plan':
      screen = b ? <TemplateEdit id={b} /> : <Plan />
      break
    case 'settings':
      screen = <Settings />
      break
    default:
      screen = <Home />
  }

  return (
    <FeedbackProvider>
      <main className={`app ${nav ? 'with-nav' : ''}`} key={route.join('/')}>
        {screen}
      </main>
      {nav && <BottomNav active={a ?? ''} />}
    </FeedbackProvider>
  )
}
