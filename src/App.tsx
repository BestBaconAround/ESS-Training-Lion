import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import BackupPage from './pages/BackupPage'
import Dashboard from './pages/Dashboard'
import HomeownerPage from './pages/HomeownerPage'
import KnowledgePage from './pages/KnowledgePage'
import FeedbackPage from './pages/FeedbackPage'
import LessonPage from './pages/LessonPage'
import ModulePage from './pages/ModulePage'
import ProceduresPage from './pages/ProceduresPage'
import QuizPage from './pages/QuizPage'
import ReferencePage from './pages/ReferencePage'
import SimPage from './pages/SimPage'
import BatteryCurvePage from './pages/BatteryCurvePage'
import TicketPage from './pages/TicketPage'
import WireBoxPage from './pages/WireBoxPage'
import TopicPage from './pages/TopicPage'
import TroubleshootingPage from './pages/TroubleshootingPage'

// HashRouter keeps deep links working on GitHub Pages with no server rewrites.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="module/:moduleId" element={<ModulePage />} />
          <Route path="module/:moduleId/lesson/:lessonId" element={<LessonPage />} />
          <Route path="module/:moduleId/quiz" element={<QuizPage />} />
          <Route path="module/:moduleId/sim" element={<SimPage />} />
          <Route path="troubleshooting" element={<TroubleshootingPage />} />
          <Route path="procedures" element={<ProceduresPage />} />
          <Route path="electricity" element={<TopicPage topicId="electricity" />} />
          <Route path="solar" element={<TopicPage topicId="solar" />} />
          <Route path="codes" element={<TopicPage topicId="codes" />} />
          <Route path="competitors" element={<TopicPage topicId="competitors" />} />
          <Route path="homeowner" element={<HomeownerPage />} />
          <Route path="learn" element={<KnowledgePage />} />
          <Route path="battery-curve" element={<BatteryCurvePage />} />
          <Route path="ticket" element={<TicketPage />} />
          <Route path="wire-box" element={<WireBoxPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="reference" element={<ReferencePage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
