import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiFileText, FiBook, FiTarget, FiCalendar, FiClipboard, FiEdit3, FiLayers, FiCheckSquare, FiBookOpen } from 'react-icons/fi';

export default function AdministrasiGuru() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tables = ['atp','tp','rpp','prota','promes','bahan_ajar','lkpd','rubrik_penilaian'];
    const results = {};

    for (const tbl of tables) {
      const { count: total } = await supabase.from(tbl).select('*', { count: 'exact', head: true }).eq('guru_id', user.id);
      const { count: pending } = await supabase.from(tbl).select('*', { count: 'exact', head: true }).eq('guru_id', user.id).eq('status', 'pending');
      const { count: approved } = await supabase.from(tbl).select('*', { count: 'exact', head: true }).eq('guru_id', user.id).eq('status', 'approved');
      results[tbl] = { total: total || 0, pending: pending || 0, approved: approved || 0 };
    }

    const { count: jurnal } = await supabase.from('jurnal_mengajar').select('*', { count: 'exact', head: true }).eq('guru_id', user.id);
    results['jurnal_mengajar'] = { total: jurnal || 0, pending: 0, approved: 0 };

    setStats(results);
    setLoading(false);
  };

  const menus = [
    {
      icon: <FiTarget size={26} />,
      label: 'ATP',
      sublabel: 'Alur Tujuan Pembelajaran',
      path: '/guru/admin/atp',
      key: 'atp',
      color: '#8B5CF6',
      bg: '#F5F3FF'
    },
    {
      icon: <FiCheckSquare size={26} />,
      label: 'TP',
      sublabel: 'Tujuan Pembelajaran',
      path: '/guru/admin/tp',
      key: 'tp',
      color: '#EC4899',
      bg: '#FDF2F8'
    },
    {
      icon: <FiFileText size={26} />,
      label: 'RPP / Modul Ajar',
      sublabel: 'Rencana Pelaksanaan Pembelajaran',
      path: '/guru/admin/rpp',
      key: 'rpp',
      color: '#3B82F6',
      bg: '#EFF6FF'
    },
    {
      icon: <FiCalendar size={26} />,
      label: 'Prota',
      sublabel: 'Program Tahunan',
      path: '/guru/admin/prota',
      key: 'prota',
      color: '#F59E0B',
      bg: '#FFFBEB'
    },
    {
      icon: <FiCalendar size={26} />,
      label: 'Promes',
      sublabel: 'Program Semester',
      path: '/guru/admin/promes',
      key: 'promes',
      color: '#10B981',
      bg: '#ECFDF5'
    },
    {
      icon: <FiBook size={26} />,
      label: 'Bahan Ajar',
      sublabel: 'Materi pembelajaran',
      path: '/guru/admin/bahan-ajar',
      key: 'bahan_ajar',
      color: '#EF4444',
      bg: '#FEF2F2'
    },
    {
      icon: <FiLayers size={26} />,
      label: 'LKPD',
      sublabel: 'Lembar Kerja Peserta Didik',
      path: '/guru/admin/lkpd',
      key: 'lkpd',
      color: '#06B6D4',
      bg: '#ECFEFF'
    },
    {
      icon: <FiClipboard size={26} />,
      label: 'Penilaian',
      sublabel: 'Rubrik & Instrumen Penilaian',
      path: '/guru/admin/penilaian',
      key: 'rubrik_penilaian',
      color: '#F97316',
      bg: '#FFF7ED'
    },
    {
      icon: <FiBookOpen size={26} />,
      label: 'Daftar Nilai',
      sublabel: 'Rekap nilai siswa',
      path: '/guru/admin/daftar-nilai',
      key: 'daftar_nilai_rekap',
      color: '#0EA5E9',
      bg: '#F0F9FF'
    },
    {
      icon: <FiEdit3 size={26} />,
      label: 'Jurnal Mengajar',
      sublabel: 'Catatan kegiatan mengajar',
      path: '/guru/admin/jurnal',
      key: 'jurnal_mengajar',
      color: '#84CC16',
      bg: '#F7FEE7'
    },
  ];

  const totalPending = Object.values(stats).reduce((a, b) => a + (b.pending || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Administrasi Pembelajaran</h1>
          <p className="text-red-200 text-xs">Kelola semua dokumen mengajar</p>
        </div>
        {totalPending > 0 && (
          <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
            {totalPending} pending
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && (
        <div className="px-4 py-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-800">
              {Object.values(stats).reduce((a, b) => a + (b.total || 0), 0)}
            </p>
            <p className="text-xs text-gray-500">Total Dokumen</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
            <p className="text-xs text-yellow-600">Menunggu</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">
              {Object.values(stats).reduce((a, b) => a + (b.approved || 0), 0)}
            </p>
            <p className="text-xs text-green-600">Disetujui</p>
          </div>
        </div>
      )}

      <div className="px-4 pb-8 space-y-3">
        {menus.map((m, i) => {
          const s = stats[m.key] || { total: 0, pending: 0, approved: 0 };
          return (
            <button key={i} type="button" onClick={() => navigate(m.path)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left">
              <div style={{ background: m.bg, color: m.color, width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {m.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">{m.label}</p>
                <p className="text-xs text-gray-400">{m.sublabel}</p>
                {!loading && m.key !== 'jurnal_mengajar' && (
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-500">{s.total} dokumen</span>
                    {s.pending > 0 && <span className="text-xs text-yellow-600 font-medium">· {s.pending} pending</span>}
                    {s.approved > 0 && <span className="text-xs text-green-600 font-medium">· {s.approved} disetujui</span>}
                  </div>
                )}
                {!loading && m.key === 'jurnal_mengajar' && (
                  <span className="text-xs text-gray-500">{s.total} entri</span>
                )}
              </div>
              <span className="text-gray-300 text-xl">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}