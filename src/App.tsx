import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import LandingPage from './Components/LandingPage'
import Login from './Components/Login'
import CompetitiveDashboard from './Components/CompetitiveDashboard'
import { OnboardingFlow } from './Components/OnboardingFlow'
import './App.css'

function OnboardingWrapper() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const handleComplete = () => {
    navigate('/dashboard');
  };

  // Get initial step from URL params (default to 1)
  const initialStep = parseInt(searchParams.get('step') || '1', 10);

  return <OnboardingFlow onComplete={handleComplete} initialStep={initialStep} />;
}

function App() {
  return (  
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<OnboardingWrapper />} />
          <Route path="/dashboard" element={<CompetitiveDashboard />} />
        </Routes>
      </Router>
  )
}

export default App
