import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import DashboardAdmin from './pages/admin/Dashboard';
import DashboardGuru from './pages/guru/Dashboard';
import DashboardOrangtua from './pages/orangtua/Dashboard';
import DashboardKepsek from './pages/kepsek/Dashboard';
import RekapKepsek from './pages/kepsek/Rekap';
import PengumumanKepsek from './pages/kepsek/Pengumuman';
import LaporanSemesterKepsek from './pages/kepsek/LaporanSemester';
import ReviewAdministrasiKepsek from './pages/kepsek/ReviewAdministrasi';
import ChatOrangtuaKepsek from './pages/kepsek/ChatOrangtua';
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
import AdministrasiGuru from './pages/guru/Administrasi';
import LaporanSemesterGuru from './pages/guru/LaporanSemester';
import MateriHarianGuru from './pages/guru/MateriHarian';
import ATPGuru from './pages/guru/admin/ATP';
import TPGuru from './pages/guru/admin/TP';
import RPPGuru from './pages/guru/admin/RPP';
import ProtaGuru from './pages/guru/admin/Prota';
import PromesGuru from './pages/guru/admin/Promes';
import BahanAjarGuru from './pages/guru/admin/Bahanajar';
import LKPDGuru from './pages/guru/admin/LKPD';
import PenilaianGuruAdmin from './pages/guru/admin/Penilaian';
import DaftarNilaiGuru from './pages/guru/admin/DaftarNilai';
import JurnalGuru from './pages/guru/admin/Jurnal';
import MateriHarianOrangtua from './pages/orangtua/MateriHarian';


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
        <Route path="/guru/administrasi" element={<ProtectedRoute><AdministrasiGuru /></ProtectedRoute>} />
        <Route path="/guru/laporan" element={<ProtectedRoute><LaporanSemesterGuru /></ProtectedRoute>} />
        <Route path="/guru/materi" element={<ProtectedRoute><MateriHarianGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/atp" element={<ProtectedRoute><ATPGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/tp" element={<ProtectedRoute><TPGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/rpp" element={<ProtectedRoute><RPPGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/prota" element={<ProtectedRoute><ProtaGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/promes" element={<ProtectedRoute><PromesGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/bahan-ajar" element={<ProtectedRoute><BahanAjarGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/lkpd" element={<ProtectedRoute><LKPDGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/penilaian" element={<ProtectedRoute><PenilaianGuruAdmin /></ProtectedRoute>} />
        <Route path="/guru/admin/daftar-nilai" element={<ProtectedRoute><DaftarNilaiGuru /></ProtectedRoute>} />
        <Route path="/guru/admin/jurnal" element={<ProtectedRoute><JurnalGuru /></ProtectedRoute>} />

        {/* ===== ORANG TUA ===== */}
        <Route path="/orangtua/dashboard" element={<ProtectedRoute><DashboardOrangtua /></ProtectedRoute>} />
        <Route path="/orangtua/materi" element={<ProtectedRoute><MateriHarianOrangtua /></ProtectedRoute>} />

        {/* ===== KEPALA SEKOLAH ===== */}
        <Route path="/kepsek/dashboard" element={<ProtectedRoute><DashboardKepsek /></ProtectedRoute>} />
        <Route path="/kepsek/rekap" element={<ProtectedRoute><RekapKepsek /></ProtectedRoute>} />
        <Route path="/kepsek/pengumuman" element={<ProtectedRoute><PengumumanKepsek /></ProtectedRoute>} />
        <Route path="/kepsek/laporan" element={<ProtectedRoute><LaporanSemesterKepsek /></ProtectedRoute>} />
        <Route path="/kepsek/administrasi" element={<ProtectedRoute><ReviewAdministrasiKepsek /></ProtectedRoute>} />
        <Route path="/kepsek/chat" element={<ProtectedRoute><ChatOrangtuaKepsek /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;