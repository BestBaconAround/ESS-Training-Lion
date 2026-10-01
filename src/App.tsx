import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import BackupPage from './pages/BackupPage'
import Dashboard from './pages/Dashboard'
import ModulePage from './pages/ModulePage'

// HashRouter keeps deep links working on GitHub Pages with no server rewrites.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="module/:moduleId" element={<ModulePage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
