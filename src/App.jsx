import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { AppStateProvider } from './state/AppState.jsx'
import Shell from './components/Shell.jsx'
import Today from './pages/Today.jsx'
import Program from './pages/Program.jsx'
import Courses from './pages/Courses.jsx'
import Grades from './pages/Grades.jsx'
import Graduation from './pages/Graduation.jsx'
import Registration from './pages/Registration.jsx'
import Other from './pages/Other.jsx'
import PreSelect from './pages/PreSelect.jsx'

function NotFound() {
  return (
    <div className="panel empty">
      <h1 style={{ marginBottom: 8 }}>Bu sayfa yok</h1>
      <p>Adres değişmiş olabilir. <Link to="/">Bugün sayfasına dön</Link> ya da Ctrl+K ile ara.</p>
    </div>
  )
}

// GitHub Pages'te sunucu yönlendirmesi olmadığı için HashRouter kullanıyoruz.
export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Today />} />
            <Route path="program" element={<Program />} />
            <Route path="kayit" element={<Registration />} />
            <Route path="onden-secim" element={<PreSelect />} />
            <Route path="dersler" element={<Courses />} />
            <Route path="notlar" element={<Grades />} />
            <Route path="mezuniyet" element={<Graduation />} />
            <Route path="diger" element={<Other />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
