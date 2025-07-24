import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import CardPage from './pages/CardPage';
import RegisterPage from './pages/RegisterPage.tsx'; 
import MapPage from './pages/MapPage.tsx'; 
import EmailVerificationPage from './pages/EmailVerificationPage.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/cards" element={<CardPage />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
      </Routes>
    </Router>
  );
}

export default App;