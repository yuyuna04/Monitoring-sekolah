import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { FiArrowLeft, FiPlus, FiX, FiUpload, FiExternalLink } from 'react-icons/fi';

const STATUS = {
  pending: { label: 'Menunggu Kepsek', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
};

export default function ATPGuru() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({
    kelas_id: '', mata_pelajaran: '', semester: 'Ganjil',
    tahun_ajaran: '2024/2025', konten: '', file_url: ''
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
    const { data } = await supabase.from('atp').select('*, kelas(nama_kelas)')
      .eq('guru_id', uid).order('created_at', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Maksimal 10MB!'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `atp_${userId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('dokumen-administrasi').upload(fileName, file, { upsert: true });
    if (error) { alert('Gagal upload: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('dokumen-administrasi').getPublicUrl(fileName);
    setForm({ ...form, file_url: urlData.publicUrl });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.kelas_id || !form.mata_pelajaran) { alert('Kelas dan mata pelajaran wajib diisi!'); return; }
    if (!form.konten && !form.file_url) { alert('Isi konten atau upload file!'); return; }
    setSaving(true);
    const { error } = await supabase.from('atp').insert({
      ...form, guru_id: userId, status: 'pending'
    });
    setSaving(false);
    if (error) { alert('Gagal: ' + error.message); return; }
    setShowModal(false);
    setForm({ kelas_id: '', mata_pelajaran: '', semester: 'Ganjil', tahun_ajaran: '2024/2025', konten: '', file_url: '' });
    fetchData(userId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus ATP ini?')) return;
    await supabase.from('atp').delete().eq('id', id);
    fetchData(userId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/guru/administrasi')}><FiArrowLeft size={22} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">ATP</h1>
          <p className="text-red-200 text-xs">Alur Tujuan Pembelajaran</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)}
          className="bg-white text-red-600 px-3 py-2 rounded-xl font-semibold flex items-center gap-1 text-sm">
          <FiPlus /> Tambah
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 mx-4 mt-4 rounded-xl p-3 text-xs text-blue-700">
        ℹ️ Semua ATP yang ditambahkan akan dikirim ke Kepala Sekolah untuk disetujui
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">🎯</p>
            <p>Belum ada ATP</p>
            <p className="text-sm mt-1">Klik + Tambah untuk membuat ATP baru</p>
          </div>
        ) : list.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                ATP
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.mata_pelajaran}</p>
                <p className="text-xs text-gray-500">{item.kelas?.nama_kelas} · Semester {item.semester} · {item.tahun_ajaran}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${STATUS[item.status]?.color}`}>
                  {STATUS[item.status]?.label}
                </span>
                {item.catatan_kepsek && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">
                    📝 Catatan Kepsek: {item.catatan_kepsek}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 flex items-center gap-1">
                      <FiExternalLink size={12} /> Lihat File
                    </a>
                  )}
                  {item.status === 'rejected' && (
                    <button type="button" onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-600">Hapus</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Tambah ATP</h2>
              <button type="button" onClick={() => setShowModal(false)}><FiX size={20} /></button>
            </div>

            <div className="space-y-3">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Semester</label>
                  <select value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}
                    className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tahun Ajaran</label>
                  <input value={form.tahun_ajaran} onChange={e => setForm({...form, tahun_ajaran: e.target.value})}
                    placeholder="2024/2025"
                    className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Isi ATP (opsional jika upload file)</label>
                <textarea value={form.konten} onChange={e => setForm({...form, konten: e.target.value})}
                  placeholder="Ketik alur tujuan pembelajaran di sini..." rows={6}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Upload File (PDF/Word, maks 10MB)</label>
                <label className="mt-1 w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center cursor-pointer hover:border-red-400 transition">
                  <FiUpload size={24} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{uploading ? 'Mengupload...' : form.file_url ? '✅ File terupload' : 'Klik untuk pilih file'}</p>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
                </label>
                {form.file_url && (
                  <a href={form.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <FiExternalLink size={12} /> Lihat file yang diupload
                  </a>
                )}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                ⚠️ Setelah disimpan, ATP akan dikirim ke Kepala Sekolah untuk disetujui. Status akan berubah setelah ada keputusan.
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button type="button" onClick={handleSave} disabled={saving || uploading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold">
                {saving ? 'Menyimpan...' : 'Kirim ke Kepsek'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}