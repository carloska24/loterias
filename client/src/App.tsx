import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { GameGenerator } from './pages/GameGenerator';
import { ComingSoon } from './pages/ComingSoon';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/generator" element={<GameGenerator />} />
          <Route path="/history" element={<ComingSoon />} />
          <Route path="/stats" element={<ComingSoon />} />
          <Route path="/settings" element={<ComingSoon />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
