import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';

export default function LaporanSemesterGuru() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [semester, setSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025');

  useEffect(() => { fetchKelas(); fetchLaporan(); }, []);

  const fetchKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchLaporan = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('laporan_semester')
      .select('*, kelas(nama_kelas)')
      .eq('diajukan_oleh', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Fetch laporan error:', error.message);
    setLaporanList(data || []);
    setLoading(false);
  };

  const handleAjukan = async () => {
    if (!selectedKelas) { alert('Pilih kelas!'); return; }
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('laporan_semester').upsert({
      kelas_id: selectedKelas,
      semester,
      tahun_ajaran: tahunAjaran,
      status: 'pending',
      diajukan_oleh: user.id
    }, { onConflict: 'kelas_id,semester,tahun_ajaran' });

    if (error) { alert('Gagal upload: ' + error.message); return; }
    setShowModal(false);
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
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Laporan Semester</h1>
        <button type="button" onClick={() => setShowModal(true)}
          className="bg-white text-purple-600 px-3 py-2 rounded-xl text-sm font-semibold">
          + Ajukan
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : laporanList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📄</p>
            <p>Belum ada laporan diajukan</p>
            <p className="text-sm mt-1">Klik + Ajukan untuk membuat pengajuan baru</p>
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
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">📝 Catatan Kepsek: {item.catatan_kepsek}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal Ajukan */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Ajukan Laporan Semester</h2>
            <div className="space-y-3">
              <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
              <select value={semester} onChange={e => setSemester(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
              <input value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)}
                placeholder="2024/2025"
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button type="button" onClick={handleAjukan}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold">Ajukan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}