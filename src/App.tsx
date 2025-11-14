import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import LandingPage from './Components/LandingPage'
import Login from './Components/Login'
import ConnectToNotion from './Components/ConnectToNotion'
import CompetitiveDashboard from './Components/CompetitiveDashboard'
import { OnboardingFlow } from './Components/OnboardingFlow'
import { NotionProvider } from './context/NotionContext'
import './App.css'

function OnboardingWrapper() {
  const navigate = useNavigate();
  
  const handleComplete = () => {
    navigate('/dashboard');
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}

function App() {
  return (
    <NotionProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<OnboardingWrapper />} />
          <Route path="/connect-notion" element={<ConnectToNotion />} />
          <Route path="/dashboard" element={<CompetitiveDashboard />} />
        </Routes>
      </Router>
    </NotionProvider>
  )
}

export default App
