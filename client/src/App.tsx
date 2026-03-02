import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { GameGenerator } from './pages/GameGenerator';
import { History } from './pages/History';
import { Results } from './pages/Results';
import { Statistics } from './pages/Statistics';
import { ComingSoon } from './pages/ComingSoon';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/generator" element={<GameGenerator />} />
          <Route path="/history" element={<History />} />
          <Route path="/results" element={<Results />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/settings" element={<ComingSoon />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
