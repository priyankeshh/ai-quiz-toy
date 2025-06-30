import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Main app routes */}
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<App />} />
        <Route path="/topics" element={<App />} />
        <Route path="/quiz" element={<App />} />
        <Route path="/results" element={<App />} />

        {/* Catch all route - redirect to register */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
