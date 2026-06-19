import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function PengumumanGuru() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    judul: '', isi: '', penting: false,
    tanggal_tayang: '', tanggal_berakhir: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('pengumuman')
      .select('*').order('created_at', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.judul || !form.isi) { alert('Judul dan isi wajib!'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...form,
      dibuat_oleh: user.id,
      tanggal_tayang: form.tanggal_tayang || new Date().toISOString().split('T')[0]
    };
    if (editData) {
      await supabase.from('pengumuman').update(payload).eq('id', editData.id);
    } else {
      await supabase.from('pengumuman').insert(payload);
    }
    setShowModal(false);
    setEditData(null);
    setForm({ judul: '', isi: '', penting: false, tanggal_tayang: '', tanggal_berakhir: '' });
    fetchData();
  };

  const handleEdit = (item) => {
    setEditData(item);
    setForm({
      judul: item.judul, isi: item.isi, penting: item.penting,
      tanggal_tayang: item.tanggal_tayang || '',
      tanggal_berakhir: item.tanggal_berakhir || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, judul) => {
    if (!window.confirm('Hapus "' + judul + '"?')) return;
    await supabase.from('pengumuman').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Pengumuman</h1>
        <button type="button"
          onClick={() => {
            setEditData(null);
            setForm({ judul: '', isi: '', penting: false, tanggal_tayang: '', tanggal_berakhir: '' });
            setShowModal(true);
          }}
          className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
          <FiPlus /> Tambah
        </button>
      </div>

      <div className="p-6 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📢</p>
            <p>Belum ada pengumuman</p>
            <p className="text-sm mt-1">Klik + Tambah untuk membuat pengumuman</p>
          </div>
        ) : list.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${item.penting ? 'bg-red-100' : 'bg-purple-100'}`}>
                {item.penting ? '🚨' : '📢'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{item.judul}</p>
                  {item.penting && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Penting</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1 line-clamp-2">{item.isi}</p>
                <p className="text-xs text-gray-400">{item.tanggal_tayang}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleEdit(item)}
                  className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100">
                  <FiEdit2 size={16} />
                </button>
                <button type="button" onClick={() => handleDelete(item.id, item.judul)}
                  className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editData ? 'Edit Pengumuman' : 'Tambah Pengumuman'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Judul *</label>
                <input value={form.judul} onChange={e => setForm({...form, judul: e.target.value})}
                  placeholder="Judul pengumuman"
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Isi *</label>
                <textarea value={form.isi} onChange={e => setForm({...form, isi: e.target.value})}
                  placeholder="Isi pengumuman" rows={4}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tanggal Tayang</label>
                  <input type="date" value={form.tanggal_tayang}
                    onChange={e => setForm({...form, tanggal_tayang: e.target.value})}
                    className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tanggal Berakhir</label>
                  <input type="date" value={form.tanggal_berakhir}
                    onChange={e => setForm({...form, tanggal_berakhir: e.target.value})}
                    className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.penting}
                  onChange={e => setForm({...form, penting: e.target.checked})}
                  className="w-4 h-4 accent-red-600" />
                <span className="text-sm text-gray-700 font-medium">🚨 Tandai sebagai penting</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700 font-medium">
                Batal
              </button>
              <button type="button" onClick={handleSubmit}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold">
                {editData ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}