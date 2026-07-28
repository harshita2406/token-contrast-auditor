import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuditApp from './AuditApp';
import LandingPage from './components/LandingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/audit" element={<AuditApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
