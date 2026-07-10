import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiBookOpen } from 'react-icons/fi';

export default function MateriHarianGuru() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [materiList, setMateriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [materi, setMateri] = useState('');
  const [catatan, setCatatan] = useState('');

  useEffect(() => { fetchKelas(); fetchMateri(); }, []);

  const fetchKelas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('kelas').select('*').eq('guru_id', user.id).order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchMateri = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('materi_harian')
      .select('*, kelas(nama_kelas)')
      .eq('guru_id', user.id)
      .order('tanggal', { ascending: false });
    if (error) console.error('Fetch materi error:', error.message);
    setMateriList(data || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setSelectedKelas('');
    setTanggal(new Date().toISOString().slice(0, 10));
    setMateri('');
    setCatatan('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setSelectedKelas(item.kelas_id);
    setTanggal(item.tanggal);
    setMateri(item.materi);
    setCatatan(item.catatan || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedKelas) { alert('Pilih kelas!'); return; }
    if (!materi.trim()) { alert('Isi materi tidak boleh kosong!'); return; }

    const { data: { user } } = await supabase.auth.getUser();

    if (editingItem) {
      const { error } = await supabase.from('materi_harian').update({
        kelas_id: selectedKelas,
        tanggal,
        materi,
        catatan
      }).eq('id', editingItem.id);
      if (error) { alert('Gagal update: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('materi_harian').insert({
        kelas_id: selectedKelas,
        guru_id: user.id,
        tanggal,
        materi,
        catatan
      });
      if (error) { alert('Gagal simpan: ' + error.message); return; }
    }

    setShowModal(false);
    fetchMateri();
  };

  const handleDelete = async (item) => {
    const konfirmasi = window.confirm(`Hapus materi "${item.materi}" tanggal ${item.tanggal}?`);
    if (!konfirmasi) return;

    const { error } = await supabase.from('materi_harian').delete().eq('id', item.id);
    if (error) { alert('Gagal hapus: ' + error.message); return; }
    fetchMateri();
  };

  const formatTanggal = (tgl) => {
    return new Date(tgl).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4" style={{ background: 'linear-gradient(160deg, #CC0000 0%, #FF3333 60%, #CC0000 100%)' }}>
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Materi Harian</h1>
        <button type="button" onClick={openAddModal}
          className="bg-white text-red-600 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1">
          <FiPlus size={16} /> Tambah
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : materiList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📚</p>
            <p>Belum ada materi yang diinput</p>
            <p className="text-sm mt-1">Klik Tambah untuk mengisi materi hari ini</p>
          </div>
        ) : materiList.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-2">
              <div className="bg-red-100 text-red-600 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiBookOpen size={18} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.kelas?.nama_kelas}</p>
                <p className="text-xs text-gray-400">{formatTanggal(item.tanggal)}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-2">
              <p className="text-sm text-gray-700">{item.materi}</p>
            </div>
            {item.catatan && (
              <p className="text-xs text-gray-500 bg-yellow-50 rounded-lg p-2 mb-2">📝 {item.catatan}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => openEditModal(item)}
                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                <FiEdit2 size={14} /> Edit
              </button>
              <button type="button" onClick={() => handleDelete(item)}
                className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                <FiTrash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editingItem ? 'Edit Materi' : 'Tambah Materi'}</h2>
            <div className="space-y-3">
              <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
              <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              <textarea value={materi} onChange={e => setMateri(e.target.value)}
                placeholder="Materi yang diajarkan hari ini..." rows={3}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
                placeholder="Catatan untuk orang tua (opsional)..." rows={2}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button type="button" onClick={handleSave}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}