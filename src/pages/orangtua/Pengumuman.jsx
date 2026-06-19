import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';

export default function PengumumanOrangtua() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('pengumuman')
      .select('*').order('created_at', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/orangtua/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Pengumuman Sekolah</h1>
      </div>

      <div className="p-6 space-y-3">
        {loading ? <div className="text-center py-10">Memuat...</div>
        : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📢</p>
            <p>Belum ada pengumuman</p>
          </div>
        ) : list.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                📢
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{item.judul}</p>
                  {item.penting && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Penting</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.isi}</p>
                <p className="text-xs text-gray-400">{item.tanggal_tayang}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}