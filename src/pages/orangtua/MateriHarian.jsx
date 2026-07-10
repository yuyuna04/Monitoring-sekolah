import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';

export default function MateriHarianOrangtua() {
  const navigate = useNavigate();
  const [materiList, setMateriList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMateri(); }, []);

  const fetchMateri = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Ambil data siswa milik orangtua ini untuk tahu kelas_id anaknya
    const { data: siswaData } = await supabase.from('siswa').select('kelas_id').eq('orangtua_id', user.id);
    const kelasIds = [...new Set((siswaData || []).map(s => s.kelas_id))];

    if (kelasIds.length === 0) {
      setMateriList([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('materi_harian')
      .select('*, kelas(nama_kelas), profiles!guru_id(full_name)')
      .in('kelas_id', kelasIds)
      .order('tanggal', { ascending: false });
    if (error) console.error('Fetch materi error:', error.message);
    setMateriList(data || []);
    setLoading(false);
  };

  const formatTanggal = (tgl) => {
    return new Date(tgl).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4" style={{ background: 'linear-gradient(160deg, #CC0000 0%, #FF3333 60%, #CC0000 100%)' }}>
        <button type="button" onClick={() => navigate('/orangtua/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Materi Harian</h1>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : materiList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📚</p>
            <p>Belum ada materi yang diinput</p>
          </div>
        ) : materiList.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-2">
              <div className="bg-red-100 text-red-600 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiBookOpen size={18} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.kelas?.nama_kelas}</p>
                <p className="text-xs text-gray-400">{formatTanggal(item.tanggal)} · {item.profiles?.full_name}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-2">
              <p className="text-sm text-gray-700">{item.materi}</p>
            </div>
            {item.catatan && (
              <p className="text-xs text-gray-600 bg-yellow-50 rounded-lg p-2">📝 {item.catatan}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}