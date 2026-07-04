import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentPortal from './pages/StudentPortal';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotWidget from './components/ChatbotWidget';
import Logout from './components/logout';

export default function App() {
  const { user } = useContext(AuthContext);
 

  return (
    <BrowserRouter>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
            duration: 4000,
            style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
        }} 
      />

      <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
        
        <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                H
              </div>
              <span className="font-bold text-lg tracking-wide text-white group-hover:text-indigo-300 transition-colors">
                HSB <span className="text-xs font-normal text-slate-400 block -mt-1">Portal</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <NavLink 
                to="/" 
                className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Home
              </NavLink>

              {user?.role === 'admin' && (
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  ⚡ Admin Dashboard
                </NavLink>
              )}

              {user && (
                <NavLink 
                  to="/student" 
                  className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  🎓 Student Portal
                </NavLink>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-semibold text-white leading-none">{user.name}</div>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      {user.role}
                    </span>
                  </div>
                 <Logout />
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Sign In
                </Link>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/student" 
              element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentPortal />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>

        {user && <ChatbotWidget />}

      </div>
    </BrowserRouter>
  );
}