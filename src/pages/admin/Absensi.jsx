import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';

export default function AbsensiAdmin() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { if (selectedKelas) fetchAbsensi(); }, [selectedKelas, tanggal]); // eslint-disable-line

  const fetchKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchAbsensi = async () => {
    setLoading(true);
    const { data: siswaData } = await supabase
      .from('siswa').select('id, full_name, nis')
      .eq('kelas_id', selectedKelas).order('full_name');
    const { data: absData } = await supabase
      .from('absensi').select('*')
      .eq('kelas_id', selectedKelas).eq('tanggal', tanggal);
    const merged = (siswaData || []).map(s => ({
      ...s, status: absData?.find(a => a.siswa_id === s.id)?.status || 'Belum'
    }));
    setData(merged);
    setLoading(false);
  };

  const statusStyle = {
    Hadir: 'bg-green-100 text-green-700',
    Izin: 'bg-yellow-100 text-yellow-700',
    Sakit: 'bg-blue-100 text-blue-700',
    Alpa: 'bg-red-100 text-red-700',
    Belum: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/admin/dashboard')}><FiArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold">Rekap Absensi</h1>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Tanggal</label>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Kelas</label>
            <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          </div>
        </div>

        {data.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {['Hadir','Izin','Sakit','Alpa'].map(s => (
              <div key={s} className="bg-white rounded-xl p-3 text-center shadow-sm">
                <p className="text-xl font-bold">{data.filter(d => d.status === s).length}</p>
                <p className="text-xs text-gray-500">{s}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? <div className="text-center py-10">Memuat...</div>
        : data.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📋</p><p>Pilih kelas untuk lihat absensi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="bg-red-100 text-red-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                  {s.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{s.full_name}</p>
                  <p className="text-xs text-gray-400">NIS: {s.nis}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[s.status]}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}