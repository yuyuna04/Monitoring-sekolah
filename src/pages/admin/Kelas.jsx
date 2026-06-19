import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function KelolaKelas() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    nama_kelas: '', tingkat: '1',
    tahun_ajaran: '2024/2025', wali_kelas_id: ''
  });

  useEffect(() => { fetchKelas(); fetchGuru(); }, []);

  const fetchKelas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('kelas')
      .select('*, profiles(full_name)')
      .order('tingkat');
    setKelasList(data || []);
    setLoading(false);
  };

  const fetchGuru = async () => {
    const { data } = await supabase
      .from('profiles').select('id, full_name')
      .eq('role', 'guru');
    setGuruList(data || []);
  };

  const handleSubmit = async () => {
    if (!form.nama_kelas) return alert('Nama kelas wajib diisi!');
    const payload = {
      nama_kelas: form.nama_kelas,
      tingkat: parseInt(form.tingkat),
      tahun_ajaran: form.tahun_ajaran,
      wali_kelas_id: form.wali_kelas_id || null
    };
    if (editData) {
      await supabase.from('kelas').update(payload).eq('id', editData.id);
    } else {
      await supabase.from('kelas').insert(payload);
    }
    setShowModal(false);
    setEditData(null);
    setForm({ nama_kelas: '', tingkat: '1', tahun_ajaran: '2024/2025', wali_kelas_id: '' });
    fetchKelas();
  };

  const handleEdit = (kelas) => {
    setEditData(kelas);
    setForm({
      nama_kelas: kelas.nama_kelas,
      tingkat: String(kelas.tingkat),
      tahun_ajaran: kelas.tahun_ajaran,
      wali_kelas_id: kelas.wali_kelas_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm('Hapus kelas ' + nama + '?')) return;
    await supabase.from('kelas').delete().eq('id', id);
    fetchKelas();
  };

  const tingkatLabel = ['', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/dashboard')}><FiArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold flex-1">Kelola Kelas</h1>
        <button onClick={() => { setEditData(null); setForm({ nama_kelas: '', tingkat: '1', tahun_ajaran: '2024/2025', wali_kelas_id: '' }); setShowModal(true); }}
          className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
          <FiPlus /> Tambah
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat data...</div>
        ) : kelasList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-5xl mb-3">🏫</div>
            <p>Belum ada data kelas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {kelasList.map(kelas => (
              <div key={kelas.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="bg-yellow-100 text-yellow-600 w-12 h-12 rounded-xl flex items-center justify-center text-2xl">
                  🏫
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{kelas.nama_kelas}</p>
                  <p className="text-sm text-gray-500">
                    {tingkatLabel[kelas.tingkat]} • {kelas.tahun_ajaran}
                  </p>
                  <p className="text-xs text-gray-400">
                    Wali Kelas: {kelas.profiles?.full_name || 'Belum ditentukan'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(kelas)}
                    className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(kelas.id, kelas.nama_kelas)}
                    className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editData ? 'Edit Kelas' : 'Tambah Kelas'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Kelas *</label>
                <input value={form.nama_kelas} onChange={e => setForm({...form, nama_kelas: e.target.value})}
                  placeholder="contoh: Kelas 5A"
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tingkat</label>
                <select value={form.tingkat} onChange={e => setForm({...form, tingkat: e.target.value})}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  {[1,2,3,4,5,6].map(t => <option key={t} value={t}>Kelas {t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tahun Ajaran</label>
                <input value={form.tahun_ajaran} onChange={e => setForm({...form, tahun_ajaran: e.target.value})}
                  placeholder="contoh: 2024/2025"
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Wali Kelas</label>
                <select value={form.wali_kelas_id} onChange={e => setForm({...form, wali_kelas_id: e.target.value})}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">-- Pilih Guru --</option>
                  {guruList.map(g => <option key={g.id} value={g.id}>{g.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button onClick={handleSubmit}
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