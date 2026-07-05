import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { FiArrowLeft, FiPlus, FiX } from 'react-icons/fi';

const STATUS = {
  pending: { label: 'Menunggu Kepsek', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
};

export default function DaftarNilaiGuru() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [nilaiData, setNilaiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({ kelas_id: '', mata_pelajaran: '', semester: 'Ganjil', tahun_ajaran: '2024/2025' });
  const [previewData, setPreviewData] = useState([]);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user.id);
    const { data: kelas } = await supabase.from('kelas').select('*').order('nama_kelas');
    setKelasList(kelas || []);
    fetchList(user.id);
  };

  const fetchList = async (uid) => {
    setLoading(true);
    const { data } = await supabase.from('daftar_nilai_rekap').select('*, kelas(nama_kelas)')
      .eq('guru_id', uid).order('created_at', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const fetchPreview = async () => {
    if (!form.kelas_id || !form.mata_pelajaran) return;
    const { data: siswa } = await supabase.from('siswa').select('id, full_name, nis').eq('kelas_id', form.kelas_id).order('full_name');
    const { data: mapel } = await supabase.from('mata_pelajaran').select('id, nama').eq('kelas_id', form.kelas_id).ilike('nama', `%${form.mata_pelajaran}%`);
    if (!mapel || mapel.length === 0) { setPreviewData([]); return; }
    const { data: nilai } = await supabase.from('nilai').select('*').eq('mapel_id', mapel[0].id).eq('semester', form.semester).eq('tahun_ajaran', form.tahun_ajaran);
    const preview = (siswa || []).map(s => {
      const n = nilai?.find(v => v.siswa_id === s.id);
      return { ...s, nilai_harian: n?.nilai_harian || '-', nilai_uts: n?.nilai_uts || '-', nilai_uas: n?.nilai_uas || '-', nilai_akhir: n?.nilai_akhir || '-' };
    });
    setPreviewData(preview);
  };

  const handleSave = async () => {
    if (!form.kelas_id || !form.mata_pelajaran) { alert('Lengkapi data!'); return; }
    setSaving(true);
    const { error } = await supabase.from('daftar_nilai_rekap').upsert({
      ...form, guru_id: userId, status: 'pending'
    }, { onConflict: 'guru_id,kelas_id,mata_pelajaran,semester,tahun_ajaran' });
    setSaving(false);
    if (error) { alert('Gagal: ' + error.message); return; }
    setShowModal(false);
    fetchList(userId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/guru/administrasi')}><FiArrowLeft size={22} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Daftar Nilai</h1>
          <p className="text-red-200 text-xs">Rekap nilai siswa per mapel</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)}
          className="bg-white text-red-600 px-3 py-2 rounded-xl font-semibold flex items-center gap-1 text-sm">
          <FiPlus /> Ajukan
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📈</p>
            <p>Belum ada daftar nilai diajukan</p>
          </div>
        ) : list.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-xl">📈</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.mata_pelajaran}</p>
                <p className="text-xs text-gray-500">{item.kelas?.nama_kelas} · Semester {item.semester} · {item.tahun_ajaran}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${STATUS[item.status]?.color}`}>
                  {STATUS[item.status]?.label}
                </span>
                {item.catatan_kepsek && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">📝 {item.catatan_kepsek}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Ajukan Daftar Nilai</h2>
              <button type="button" onClick={() => setShowModal(false)}><FiX size={20} /></button>
            </div>
            <div className="space-y-3">
              <select value={form.kelas_id} onChange={e => setForm({...form, kelas_id: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
              <input value={form.mata_pelajaran} onChange={e => setForm({...form, mata_pelajaran: e.target.value})}
                placeholder="Nama Mata Pelajaran"
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}
                  className="px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
                <input value={form.tahun_ajaran} onChange={e => setForm({...form, tahun_ajaran: e.target.value})}
                  placeholder="2024/2025"
                  className="px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <button type="button" onClick={fetchPreview}
                className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold">
                👁️ Preview Nilai Siswa
              </button>
              {previewData.length > 0 && (
                <div className="bg-white rounded-xl overflow-hidden border">
                  <div className="grid grid-cols-6 gap-1 px-3 py-2 bg-gray-50 border-b">
                    <p className="col-span-2 text-xs font-semibold">Nama</p>
                    <p className="text-xs font-semibold text-center">Tugas</p>
                    <p className="text-xs font-semibold text-center">UTS</p>
                    <p className="text-xs font-semibold text-center">UAS</p>
                    <p className="text-xs font-semibold text-center">Akhir</p>
                  </div>
                  {previewData.map(s => (
                    <div key={s.id} className="grid grid-cols-6 gap-1 px-3 py-2 border-b text-xs">
                      <p className="col-span-2 truncate">{s.full_name}</p>
                      <p className="text-center">{s.nilai_harian}</p>
                      <p className="text-center">{s.nilai_uts}</p>
                      <p className="text-center">{s.nilai_uas}</p>
                      <p className="text-center font-bold">{s.nilai_akhir}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button type="button" onClick={handleSave} disabled={saving}
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