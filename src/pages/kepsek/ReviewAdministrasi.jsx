import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiCheck, FiX, FiExternalLink } from 'react-icons/fi';

const MODULES = [
  { key: 'atp', label: 'ATP', icon: '🎯' },
  { key: 'tp', label: 'TP', icon: '✅' },
  { key: 'rpp', label: 'RPP / Modul Ajar', icon: '📝' },
  { key: 'prota', label: 'Prota', icon: '📅' },
  { key: 'promes', label: 'Promes', icon: '📆' },
  { key: 'bahan_ajar', label: 'Bahan Ajar', icon: '📖' },
  { key: 'lkpd', label: 'LKPD', icon: '📋' },
  { key: 'rubrik_penilaian', label: 'Penilaian', icon: '📊' },
  { key: 'daftar_nilai_rekap', label: 'Daftar Nilai', icon: '📈' },
];

const STATUS = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
};

export default function ReviewAdministrasiKepsek() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('atp');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCatatanModal, setShowCatatanModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState('');
  const [catatan, setCatatan] = useState('');
  const [moduleCounts, setModuleCounts] = useState({});

  useEffect(() => { fetchAllCounts(); }, []);
  useEffect(() => { fetchData(); }, [activeModule, filterStatus]); // eslint-disable-line

  const fetchAllCounts = async () => {
    const counts = {};
    for (const m of MODULES) {
      const { count } = await supabase.from(m.key).select('*', { count: 'exact', head: true }).eq('status', 'pending');
      counts[m.key] = count || 0;
    }
    setModuleCounts(counts);
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from(activeModule)
      .select('*, kelas(nama_kelas), profiles!guru_id(full_name)')
      .order('created_at', { ascending: false });
    if (filterStatus !== 'semua') query = query.eq('status', filterStatus);
    const { data } = await query;
    setList(data || []);
    setLoading(false);
  };

  const openAction = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setCatatan('');
    setShowCatatanModal(true);
  };

  const handleAction = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from(activeModule).update({
      status: actionType,
      catatan_kepsek: catatan,
      disetujui_oleh: user.id,
      disetujui_pada: new Date().toISOString()
    }).eq('id', selectedItem.id);

    if (error) { alert('Gagal: ' + error.message); return; }
    setShowCatatanModal(false);
    fetchData();
    fetchAllCounts();
  };

  const getTitle = (item) => item.judul || item.mata_pelajaran || '-';
  const totalPending = Object.values(moduleCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-purple-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/kepsek/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Review Administrasi Guru</h1>
          <p className="text-purple-200 text-xs">{totalPending} dokumen menunggu persetujuan</p>
        </div>
      </div>

      {/* Module Tabs - horizontal scroll */}
      <div className="bg-white border-b overflow-x-auto flex" style={{ scrollbarWidth: 'none' }}>
        {MODULES.map(m => (
          <button key={m.key} type="button" onClick={() => setActiveModule(m.key)}
            className={`flex-shrink-0 px-4 py-3 flex items-center gap-1.5 text-xs font-semibold transition border-b-2 ${
              activeModule === m.key ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent'
            }`}>
            {m.icon} {m.label}
            {moduleCounts[m.key] > 0 && (
              <span className="bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                {moduleCounts[m.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex bg-gray-100 mx-4 mt-4 rounded-xl p-1 gap-1">
        {['pending', 'approved', 'rejected', 'semua'].map(s => (
          <button key={s} type="button" onClick={() => setFilterStatus(s)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              filterStatus === s ? 'bg-white text-purple-600 shadow' : 'text-gray-500'
            }`}>
            {s === 'pending' ? 'Menunggu' : s === 'approved' ? 'Disetujui' : s === 'rejected' ? 'Ditolak' : 'Semua'}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📄</p>
            <p>Tidak ada dokumen</p>
          </div>
        ) : list.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                {MODULES.find(m => m.key === activeModule)?.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{getTitle(item)}</p>
                <p className="text-xs text-gray-500">
                  {item.profiles?.full_name} · {item.kelas?.nama_kelas}
                  {item.semester ? ` · Semester ${item.semester}` : ''}
                  {item.tahun_ajaran ? ` · ${item.tahun_ajaran}` : ''}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${STATUS[item.status]?.color}`}>
                  {STATUS[item.status]?.label}
                </span>
                {item.catatan_kepsek && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">📝 {item.catatan_kepsek}</p>
                )}
              </div>
            </div>

            {item.konten && (
              <div className="bg-gray-50 rounded-xl p-3 mb-3 max-h-24 overflow-hidden">
                <p className="text-xs text-gray-600 line-clamp-3">{item.konten}</p>
              </div>
            )}

            {item.file_url && (
              <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg p-2 mb-3">
                <FiExternalLink size={14} /> Lihat File Dokumen
              </a>
            )}

            {item.status === 'pending' && (
              <div className="flex gap-2">
                <button type="button" onClick={() => openAction(item, 'rejected')}
                  className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                  <FiX size={16} /> Tolak
                </button>
                <button type="button" onClick={() => openAction(item, 'approved')}
                  className="flex-1 bg-green-50 text-green-600 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                  <FiCheck size={16} /> Setujui
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Catatan */}
      {showCatatanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowCatatanModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">
              {actionType === 'approved' ? '✅ Setujui Dokumen' : '❌ Tolak Dokumen'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{selectedItem && getTitle(selectedItem)}</p>
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
              placeholder="Catatan untuk guru (opsional)..." rows={3}
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCatatanModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button type="button" onClick={handleAction}
                className={`flex-1 py-2.5 rounded-xl text-white font-semibold ${
                  actionType === 'approved' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                {actionType === 'approved' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}