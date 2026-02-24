import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import { WalletProvider } from './context/WalletContext';

// Simple auth guard
function PrivateRoute({ children }) {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const raw = localStorage.getItem('user');
  if (!raw) return <Navigate to="/login" replace />;
  const user = JSON.parse(raw);
  return user.is_admin ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
        <Toaster
          position="top-center"
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1c1c27',
              color: '#f1f1f5',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              maxWidth: '360px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1c1c27' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1c1c27' },
            },
          }}
        />
      </Router>
    </WalletProvider>
  );
}

export default App;
