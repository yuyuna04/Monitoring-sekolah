import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function PrestasiGuru() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    siswa_id: '', judul: '', tingkat: 'Sekolah', tanggal: '', keterangan: ''
  });

  useEffect(() => { fetchData(); fetchSiswa(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('prestasi')
      .select('*, siswa(full_name)').order('tanggal', { ascending: false });
    setList(data || []);
  };

  const fetchSiswa = async () => {
    const { data } = await supabase.from('siswa').select('id, full_name').order('full_name');
    setSiswaList(data || []);
  };

  const handleSubmit = async () => {
    if (!form.siswa_id || !form.judul || !form.tanggal) { alert('Lengkapi data!'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('prestasi').insert({ ...form, diinput_oleh: user.id });
    setShowModal(false);
    setForm({ siswa_id: '', judul: '', tingkat: 'Sekolah', tanggal: '', keterangan: '' });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus prestasi ini?')) return;
    await supabase.from('prestasi').delete().eq('id', id);
    fetchData();
  };

  const tingkatMedal = {
    Sekolah: '🥉', Kecamatan: '🎖️', Kota: '🥈', Provinsi: '🥇', Nasional: '🏆'
  };
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
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Prestasi Siswa</h1>
        <button type="button" onClick={() => setShowModal(true)}
          className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
          <FiPlus /> Tambah
        </button>
      </div>

      <div className="p-6 space-y-3">
        {list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">🏆</p>
            <p>Belum ada data prestasi</p>
          </div>
        ) : list.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className="text-3xl">{tingkatMedal[item.tingkat] || '🏆'}</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{item.judul}</p>
              <p className="text-sm text-gray-600">{item.siswa?.full_name}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tingkatColor[item.tingkat]}`}>
                  {item.tingkat}
                </span>
                <span className="text-xs text-gray-400">{item.tanggal}</span>
              </div>
              {item.keterangan && <p className="text-xs text-gray-500 mt-1">{item.keterangan}</p>}
            </div>
            <button type="button" onClick={() => handleDelete(item.id)}
              className="bg-red-50 text-red-600 p-2 rounded-lg">
              <FiTrash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Tambah Prestasi</h2>
            <div className="space-y-3">
              <select value={form.siswa_id} onChange={e => setForm({...form, siswa_id: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              <input value={form.judul} onChange={e => setForm({...form, judul: e.target.value})}
                placeholder="Judul prestasi *"
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              <select value={form.tingkat} onChange={e => setForm({...form, tingkat: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                {['Sekolah','Kecamatan','Kota','Provinsi','Nasional'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              <textarea value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})}
                placeholder="Keterangan tambahan" rows={2}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button type="button" onClick={handleSubmit}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}