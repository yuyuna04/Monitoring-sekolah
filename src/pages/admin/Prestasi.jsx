import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';

export default function PrestasiAdmin() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('prestasi')
      .select('*, siswa(full_name, kelas(nama_kelas))')
      .order('tanggal', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const filtered = list.filter(item =>
    item.siswa?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.judul?.toLowerCase().includes(search.toLowerCase())
  );

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
        <button type="button" onClick={() => navigate('/admin/dashboard')}><FiArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold">Data Prestasi</h1>
      </div>
      <div className="p-6 space-y-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari siswa atau prestasi..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        {loading ? <div className="text-center py-10">Memuat...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">🏆</p><p>Belum ada data prestasi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
                <div className="text-3xl">🏆</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.judul}</p>
                  <p className="text-sm text-gray-600">{item.siswa?.full_name}</p>
                  <p className="text-xs text-gray-400">{item.siswa?.kelas?.nama_kelas}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tingkatColor[item.tingkat]}`}>{item.tingkat}</span>
                    <span className="text-xs text-gray-400">{item.tanggal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}