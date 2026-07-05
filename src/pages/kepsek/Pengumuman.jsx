import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiCheck, FiX as FiReject } from 'react-icons/fi';

export default function PengumumanKepsek() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [filter]); // eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('pengumuman').select('*').order('created_at', { ascending: false });
    if (filter !== 'semua') query = query.eq('status_approval', filter);
    const { data } = await query;
    setList(data || []);
    setLoading(false);
  };

  const handleApprove = async (id) => {
    await supabase.from('pengumuman').update({ status_approval: 'approved' }).eq('id', id);
    fetchData();
  };

  const handleReject = async (id) => {
    if (!window.confirm('Tolak pengumuman ini?')) return;
    await supabase.from('pengumuman').update({ status_approval: 'rejected' }).eq('id', id);
    fetchData();
  };

  const statusBadge = {
    pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-600' },
    approved: { label: 'Disetujui', color: 'bg-green-100 text-green-600' },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-600' },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-purple-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/kepsek/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Approval Pengumuman</h1>
      </div>

      <div className="bg-white border-b flex">
        {[
          { id: 'pending', label: 'Menunggu' },
          { id: 'approved', label: 'Disetujui' },
          { id: 'rejected', label: 'Ditolak' },
          { id: 'semua', label: 'Semua' },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setFilter(t.id)}
            className={`flex-1 py-3 text-xs font-semibold transition ${
              filter === t.id ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📢</p>
            <p>Tidak ada pengumuman</p>
          </div>
        ) : list.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${item.penting ? 'bg-red-100' : 'bg-purple-100'}`}>
                {item.penting ? '🚨' : '📢'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{item.judul}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[item.status_approval]?.color}`}>
                    {statusBadge[item.status_approval]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{item.tanggal_tayang}</p>
                <p className="text-sm text-gray-600 mt-2">{item.isi}</p>
              </div>
            </div>
            {item.status_approval === 'pending' && (
              <div className="flex gap-2">
                <button type="button" onClick={() => handleReject(item.id)}
                  className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                  <FiReject size={16} /> Tolak
                </button>
                <button type="button" onClick={() => handleApprove(item.id)}
                  className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
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