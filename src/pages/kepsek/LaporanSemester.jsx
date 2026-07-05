import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiCheck, FiX, FiFileText } from 'react-icons/fi';

export default function LaporanSemesterKepsek() {
  const navigate = useNavigate();
  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLaporan(); }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('laporan_semester')
      .select('*, kelas(nama_kelas)')
      .order('created_at', { ascending: false });
    if (error) console.error('Fetch laporan error:', error.message);
    setLaporanList(data || []);
    setLoading(false);
  };

  const handleApprove = async (item) => {
    const konfirmasi = window.confirm(`Setujui laporan ${item.kelas?.nama_kelas} - Semester ${item.semester}?`);
    if (!konfirmasi) return;

    const catatan = window.prompt('Catatan untuk guru (boleh kosong):', '') || '';

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('laporan_semester').update({
      status: 'approved',
      catatan_kepsek: catatan,
      disetujui_oleh: user.id,
      disetujui_pada: new Date().toISOString()
    }).eq('id', item.id).select();

    if (error) { alert('Gagal update: ' + error.message); return; }
    if (!data || data.length === 0) {
      alert('PERINGATAN: Update tidak mengubah baris apapun! Kemungkinan diblokir RLS. User ID: ' + user.id);
      return;
    }
    alert('Laporan berhasil disetujui!');
    fetchLaporan();
  };

  const handleReject = async (item) => {
    const konfirmasi = window.confirm(`Tolak laporan ${item.kelas?.nama_kelas} - Semester ${item.semester}?`);
    if (!konfirmasi) return;

    const catatan = window.prompt('Alasan penolakan (boleh kosong):', '') || '';

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('laporan_semester').update({
      status: 'rejected',
      catatan_kepsek: catatan,
      disetujui_oleh: user.id,
      disetujui_pada: new Date().toISOString()
    }).eq('id', item.id).select();

    if (error) { alert('Gagal update: ' + error.message); return; }
    if (!data || data.length === 0) {
      alert('PERINGATAN: Update tidak mengubah baris apapun! Kemungkinan diblokir RLS. User ID: ' + user.id);
      return;
    }
    alert('Laporan ditolak.');
    fetchLaporan();
  };

  const statusBadge = {
    pending: { label: 'Menunggu Persetujuan', color: 'bg-yellow-100 text-yellow-600' },
    approved: { label: 'Disetujui', color: 'bg-green-100 text-green-600' },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-600' },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-purple-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/kepsek/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Approval Laporan Semester</h1>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : laporanList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📄</p>
            <p>Belum ada laporan diajukan</p>
            <p className="text-sm mt-1">Laporan dari guru akan muncul di sini</p>
          </div>
        ) : laporanList.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-2">
              <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiFileText size={18} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.kelas?.nama_kelas} — Semester {item.semester}</p>
                <p className="text-xs text-gray-400">Tahun Ajaran {item.tahun_ajaran}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${statusBadge[item.status]?.color}`}>
                  {statusBadge[item.status]?.label}
                </span>
              </div>
            </div>
            {item.catatan_kepsek && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">📝 {item.catatan_kepsek}</p>
            )}
            {item.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => handleReject(item)}
                  className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                  <FiX size={16} /> Tolak
                </button>
                <button type="button" onClick={() => handleApprove(item)}
                  className="flex-1 bg-green-50 text-green-600 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                  <FiCheck size={16} /> Setujui
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}