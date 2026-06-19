import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';

export default function PrestasiOrangtua() {
  const navigate = useNavigate();
  const [anakList, setAnakList] = useState([]);
  const [selectedAnak, setSelectedAnak] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAnak(); }, []);
  useEffect(() => { if (selectedAnak) fetchData(); }, [selectedAnak]); // eslint-disable-line

  const fetchAnak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('siswa_orangtua')
      .select('siswa(id, full_name)').eq('orangtua_id', user.id);
    setAnakList(data?.map(d => d.siswa) || []);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('prestasi')
      .select('*').eq('siswa_id', selectedAnak)
      .order('tanggal', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const tingkatColor = {
    Sekolah: 'bg-gray-100 text-gray-600',
    Kecamatan: 'bg-blue-100 text-blue-600',
    Kota: 'bg-green-100 text-green-600',
    Provinsi: 'bg-yellow-100 text-yellow-600',
    Nasional: 'bg-red-100 text-red-600'
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/orangtua/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Prestasi Anak</h1>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <select value={selectedAnak} onChange={e => setSelectedAnak(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="">-- Pilih Anak --</option>
            {anakList.map(a => a && (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
        </div>

        {loading ? <div className="text-center py-10">Memuat...</div>
        : !selectedAnak ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">🏆</p>
            <p>Pilih anak untuk melihat prestasi</p>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🏆</p>
            <p>Belum ada data prestasi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
                <div className="text-3xl">🏆</div>
                <div>
                  <p className="font-semibold text-gray-800">{item.judul}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tingkatColor[item.tingkat]}`}>
                      {item.tingkat}
                    </span>
                    <span className="text-xs text-gray-400">{item.tanggal}</span>
                  </div>
                  {item.keterangan && <p className="text-xs text-gray-500 mt-1">{item.keterangan}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}