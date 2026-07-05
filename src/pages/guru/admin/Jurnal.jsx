import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { FiArrowLeft, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';

export default function JurnalGuru() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({
    kelas_id: '', mata_pelajaran: '',
    tanggal: new Date().toISOString().split('T')[0],
    pertemuan_ke: '', materi: '', kehadiran_siswa: '',
    kegiatan: '', catatan: '', tindak_lanjut: ''
  });

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user.id);
    const { data: kelas } = await supabase.from('kelas').select('*').order('nama_kelas');
    setKelasList(kelas || []);
    fetchData(user.id);
  };

  const fetchData = async (uid) => {
    setLoading(true);
    const { data } = await supabase.from('jurnal_mengajar').select('*, kelas(nama_kelas)')
      .eq('guru_id', uid).order('tanggal', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.kelas_id || !form.mata_pelajaran || !form.materi) {
      alert('Kelas, mata pelajaran, dan materi wajib diisi!');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('jurnal_mengajar').insert({ ...form, guru_id: userId });
    setSaving(false);
    if (error) { alert('Gagal: ' + error.message); return; }
    setShowModal(false);
    setForm({ kelas_id: '', mata_pelajaran: '', tanggal: new Date().toISOString().split('T')[0], pertemuan_ke: '', materi: '', kehadiran_siswa: '', kegiatan: '', catatan: '', tindak_lanjut: '' });
    fetchData(userId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus jurnal ini?')) return;
    await supabase.from('jurnal_mengajar').delete().eq('id', id);
    fetchData(userId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/guru/administrasi')}><FiArrowLeft size={22} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Jurnal Mengajar</h1>
          <p className="text-red-200 text-xs">Catatan kegiatan mengajar harian</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)}
          className="bg-white text-red-600 px-3 py-2 rounded-xl font-semibold flex items-center gap-1 text-sm">
          <FiPlus /> Tambah
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📓</p>
            <p>Belum ada jurnal mengajar</p>
          </div>
        ) : list.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 text-green-600 w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">📓</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">{item.mata_pelajaran}</p>
                  <p className="text-xs text-gray-400">{item.tanggal}</p>
                </div>
                <p className="text-xs text-gray-500">{item.kelas?.nama_kelas} {item.pertemuan_ke ? `· Pertemuan ${item.pertemuan_ke}` : ''}</p>
                <p className="text-sm text-gray-700 mt-1 font-medium">📚 {item.materi}</p>
                {item.kehadiran_siswa && <p className="text-xs text-gray-500">👥 Hadir: {item.kehadiran_siswa} siswa</p>}
                {item.catatan && <p className="text-xs text-gray-500 mt-1">📝 {item.catatan}</p>}
                {item.tindak_lanjut && <p className="text-xs text-blue-600 mt-1">➡️ {item.tindak_lanjut}</p>}
              </div>
              <button type="button" onClick={() => handleDelete(item.id)}
                className="text-red-400 p-1">
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Tambah Jurnal Mengajar</h2>
              <button type="button" onClick={() => setShowModal(false)}><FiX size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tanggal *</label>
                  <input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})}
                    className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pertemuan Ke</label>
                  <input type="number" value={form.pertemuan_ke} onChange={e => setForm({...form, pertemuan_ke: e.target.value})}
                    placeholder="1"
                    className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Kelas *</label>
                <select value={form.kelas_id} onChange={e => setForm({...form, kelas_id: e.target.value})}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mata Pelajaran *</label>
                <input value={form.mata_pelajaran} onChange={e => setForm({...form, mata_pelajaran: e.target.value})}
                  placeholder="Nama mata pelajaran"
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Materi yang Diajarkan *</label>
                <input value={form.materi} onChange={e => setForm({...form, materi: e.target.value})}
                  placeholder="Topik/materi hari ini"
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Jumlah Siswa Hadir</label>
                <input type="number" value={form.kehadiran_siswa} onChange={e => setForm({...form, kehadiran_siswa: e.target.value})}
                  placeholder="Contoh: 28"
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Kegiatan Pembelajaran</label>
                <textarea value={form.kegiatan} onChange={e => setForm({...form, kegiatan: e.target.value})}
                  placeholder="Deskripsi kegiatan yang dilakukan..." rows={3}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Catatan</label>
                <textarea value={form.catatan} onChange={e => setForm({...form, catatan: e.target.value})}
                  placeholder="Kendala, situasi kelas, dll..." rows={2}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tindak Lanjut</label>
                <textarea value={form.tindak_lanjut} onChange={e => setForm({...form, tindak_lanjut: e.target.value})}
                  placeholder="Rencana pertemuan berikutnya, remedial, dll..." rows={2}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold">
                {saving ? 'Menyimpan...' : 'Simpan Jurnal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}