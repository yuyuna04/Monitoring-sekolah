import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiLogOut, FiBarChart2, FiBell, FiFileText, FiClipboard, FiMessageCircle } from 'react-icons/fi';

export default function DashboardKepsek() {
  const navigate = useNavigate();
  const [namaKepsek, setNamaKepsek] = useState('');
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [totalKelas, setTotalKelas] = useState(0);
  const [totalGuru, setTotalGuru] = useState(0);
  const [pendingLaporanCount, setPendingLaporanCount] = useState(0);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);

  useEffect(() => { fetchProfile(); fetchStats(); }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (profile) setNamaKepsek(profile.full_name);
  };

  const fetchStats = async () => {
    const { count: siswaCount } = await supabase.from('siswa').select('*', { count: 'exact', head: true });
    setTotalSiswa(siswaCount || 0);

    const { count: kelasCount } = await supabase.from('kelas').select('*', { count: 'exact', head: true });
    setTotalKelas(kelasCount || 0);

    const { count: guruCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guru');
    setTotalGuru(guruCount || 0);

    const { count: laporanCount } = await supabase.from('laporan_semester').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    setPendingLaporanCount(laporanCount || 0);

    const tables = ['atp','tp','rpp','prota','promes','bahan_ajar','lkpd','rubrik_penilaian'];
    let total = 0;
    for (const tbl of tables) {
      const { count } = await supabase.from(tbl).select('*', { count: 'exact', head: true }).eq('status', 'pending');
      total += count || 0;
    }
    setPendingAdminCount(total);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menus = [
    { icon: <FiBarChart2 size={24} />, label: 'Rekap', sublabel: 'Rekap data sekolah', path: '/kepsek/rekap', color: '#3B82F6', bg: '#EFF6FF' },
    { icon: <FiBell size={24} />, label: 'Pengumuman', sublabel: 'Buat pengumuman sekolah', path: '/kepsek/pengumuman', color: '#EF4444', bg: '#FEF2F2' },
    {
      icon: <FiFileText size={24} />,
      label: 'Laporan Semester',
      sublabel: 'Approval laporan dari guru',
      path: '/kepsek/laporan',
      color: '#7C3AED',
      bg: '#F5F3FF',
      badge: pendingLaporanCount > 0 ? `${pendingLaporanCount} pending` : null
    },
    {
      icon: <FiClipboard size={24} />,
      label: 'Review Administrasi',
      sublabel: 'ATP, RPP, Prota, Promes & lainnya',
      path: '/kepsek/administrasi',
      color: '#CC0000',
      bg: '#FFF0F0',
      badge: pendingAdminCount > 0 ? `${pendingAdminCount} pending` : null
    },
    { icon: <FiMessageCircle size={24} />, label: 'Chat Orang Tua', sublabel: 'Tanggapi keluhan orang tua', path: '/kepsek/chat', color: '#10B981', bg: '#ECFDF5' },
  ];

  const jam = new Date().getHours();
  const sapa = jam < 11 ? 'Selamat Pagi' : jam < 15 ? 'Selamat Siang' : jam < 18 ? 'Selamat Sore' : 'Selamat Malam';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-600 text-white px-5 pt-8 pb-6" style={{ background: 'linear-gradient(160deg, #CC0000 0%, #FF3333 60%, #CC0000 100%)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-red-200 text-sm">🏫 Portal Kepala Sekolah</p>
            <p className="text-red-100 text-xs mt-0.5">{sapa},</p>
            <h1 className="text-xl font-bold mt-0.5">{namaKepsek || 'Kepala Sekolah'} 👋</h1>
            <p className="text-red-200 text-xs mt-1">Semangat memimpin sekolah!</p>
          </div>
          <button type="button" onClick={handleLogout} className="bg-white bg-opacity-20 p-2 rounded-xl">
            <FiLogOut size={20} color="white" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white bg-opacity-20 rounded-2xl p-3">
            <p className="text-2xl font-bold">{totalSiswa}</p>
            <p className="text-red-100 text-xs">Total Siswa</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-2xl p-3">
            <p className="text-2xl font-bold">{totalKelas}</p>
            <p className="text-red-100 text-xs">Total Kelas</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-2xl p-3">
            <p className="text-2xl font-bold">{totalGuru}</p>
            <p className="text-red-100 text-xs">Total Guru</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-sm font-bold text-gray-500 mb-3">Menu Kepala Sekolah</p>
        <div className="space-y-3">
          {menus.map((m, i) => (
            <button key={i} type="button" onClick={() => navigate(m.path)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left">
              <div style={{ background: m.bg, color: m.color, width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {m.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{m.label}</p>
                <p className="text-xs text-gray-400">{m.sublabel}</p>
                {m.badge && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">
                    ⏳ {m.badge}
                  </span>
                )}
              </div>
              <span className="text-gray-300 text-xl">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}