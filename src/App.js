import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import DashboardAdmin from './pages/admin/Dashboard';
import DashboardGuru from './pages/guru/Dashboard';
import DashboardOrangtua from './pages/orangtua/Dashboard';
import DataSiswa from './pages/admin/Siswa';
import KelolaKelas from './pages/admin/Kelas';
import PengumumanAdmin from './pages/admin/Pengumuman';
import HubungSiswa from './pages/admin/HubungSiswa';
import ChatAdmin from './pages/admin/Chat';
import AbsensiGuru from './pages/guru/Absensi';
import NilaiGuru from './pages/guru/Nilai';
import PerkembanganGuru from './pages/guru/Perkembangan';
import PrestasiGuru from './pages/guru/Prestasi';
import PengumumanGuru from './pages/guru/Pengumuman';

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center">
        <div className="text-5xl mb-3">🏫</div>
        <p className="text-red-600 font-semibold">Memuat...</p>
      </div>
    </div>
  );

  if (!session) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* ===== ADMIN ===== */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><DashboardAdmin /></ProtectedRoute>} />
        <Route path="/admin/siswa" element={<ProtectedRoute><DataSiswa /></ProtectedRoute>} />
        <Route path="/admin/kelas" element={<ProtectedRoute><KelolaKelas /></ProtectedRoute>} />
        <Route path="/admin/pengumuman" element={<ProtectedRoute><PengumumanAdmin /></ProtectedRoute>} />
        <Route path="/admin/hubung-siswa" element={<ProtectedRoute><HubungSiswa /></ProtectedRoute>} />
        <Route path="/admin/chat" element={<ProtectedRoute><ChatAdmin /></ProtectedRoute>} />

        {/* ===== GURU ===== */}
        <Route path="/guru/dashboard" element={<ProtectedRoute><DashboardGuru /></ProtectedRoute>} />
        <Route path="/guru/absensi" element={<ProtectedRoute><AbsensiGuru /></ProtectedRoute>} />
        <Route path="/guru/nilai" element={<ProtectedRoute><NilaiGuru /></ProtectedRoute>} />
        <Route path="/guru/perkembangan" element={<ProtectedRoute><PerkembanganGuru /></ProtectedRoute>} />
        <Route path="/guru/prestasi" element={<ProtectedRoute><PrestasiGuru /></ProtectedRoute>} />
        <Route path="/guru/pengumuman" element={<ProtectedRoute><PengumumanGuru /></ProtectedRoute>} />

        {/* ===== ORANG TUA ===== */}
        <Route path="/orangtua/dashboard" element={<ProtectedRoute><DashboardOrangtua /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;