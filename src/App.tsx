import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './Components/LandingPage'
import Login from './Components/Login'
import ConnectToNotion from './Components/ConnectToNotion'
import CompetitiveDashboard from './Components/CompetitiveDashboard'
import { NotionProvider } from './context/NotionContext'
import './App.css'

function App() {
  return (
    <NotionProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/connect-notion" element={<ConnectToNotion />} />
          <Route path="/dashboard" element={<CompetitiveDashboard />} />
        </Routes>
      </Router>
    </NotionProvider>
  )
}

export default App
