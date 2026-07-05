import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';

export default function RekapKepsek() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { if (selectedKelas) fetchRekap(); }, [selectedKelas]); // eslint-disable-line

  const fetchKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('nama_kelas');
    setKelasList(data || []);
    if (data && data.length > 0) setSelectedKelas(data[0].id);
  };

  const fetchRekap = async () => {
    setLoading(true);
    const { data: siswa } = await supabase.from('siswa').select('*')
      .eq('kelas_id', selectedKelas).order('full_name');

    const { data: absensi } = await supabase.from('absensi').select('*').eq('kelas_id', selectedKelas);
    const { data: nilai } = await supabase.from('nilai').select('*').in('siswa_id', siswa?.map(s => s.id) || []);

    const rekap = (siswa || []).map(s => {
      const absSiswa = absensi?.filter(a => a.siswa_id === s.id) || [];
      const hadir = absSiswa.filter(a => a.status === 'Hadir').length;
      const total = absSiswa.length;
      const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;

      const nilaiSiswa = nilai?.filter(n => n.siswa_id === s.id && n.nilai_akhir != null) || [];
      const rataNilai = nilaiSiswa.length > 0
        ? (nilaiSiswa.reduce((a, b) => a + b.nilai_akhir, 0) / nilaiSiswa.length).toFixed(1)
        : '-';

      return { ...s, persen, rataNilai, totalHari: total };
    });
    setSiswaList(rekap);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-purple-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/kepsek/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Rekap Nilai & Absensi</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700">Pilih Kelas</label>
          <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
            className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
            {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat data...</div>
        ) : siswaList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📊</p>
            <p>Belum ada data siswa di kelas ini</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-5 gap-1 px-3 py-2 bg-gray-50 border-b">
              <p className="col-span-2 text-xs font-semibold text-gray-600">Nama</p>
              <p className="text-xs font-semibold text-green-600 text-center">Hadir%</p>
              <p className="text-xs font-semibold text-blue-600 text-center">Rata Nilai</p>
              <p className="text-xs font-semibold text-gray-600 text-center">Status</p>
            </div>
            {siswaList.map((siswa, i) => (
              <div key={siswa.id} className={`grid grid-cols-5 gap-1 px-3 py-3 border-b items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{siswa.full_name}</p>
                  <p className="text-xs text-gray-400">NIS: {siswa.nis}</p>
                </div>
                <p className={`text-sm font-bold text-center ${
                  siswa.persen >= 90 ? 'text-green-600' : siswa.persen >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>{siswa.persen}%</p>
                <p className="text-sm font-bold text-blue-600 text-center">{siswa.rataNilai}</p>
                <div className="text-center">
                  {siswa.rataNilai !== '-' && siswa.persen >= 75 ? (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Baik</span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">Perhatian</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}