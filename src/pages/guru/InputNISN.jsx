import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiUser, FiEdit2, FiX, FiSave, FiPlus } from 'react-icons/fi';

const FIELD_GROUPS = [
  {
    title: 'Data Diri Siswa',
    fields: [
      { key: 'full_name', label: 'Nama Lengkap', type: 'text' },
      { key: 'nis', label: 'NIS', type: 'text' },
      { key: 'nisn', label: 'NISN', type: 'text' },
      { key: 'tempat_lahir', label: 'Tempat Lahir', type: 'text' },
      { key: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date' },
      { key: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
      { key: 'agama', label: 'Agama', type: 'text' },
      { key: 'alamat', label: 'Alamat', type: 'textarea' },
      { key: 'anak_ke', label: 'Anak Ke', type: 'number' },
      { key: 'jumlah_saudara', label: 'Jumlah Saudara', type: 'number' },
      { key: 'tinggi_badan', label: 'Tinggi Badan (cm)', type: 'number' },
      { key: 'berat_badan', label: 'Berat Badan (kg)', type: 'number' },
      { key: 'golongan_darah', label: 'Golongan Darah', type: 'text' },
      { key: 'hobi', label: 'Hobi', type: 'text' },
      { key: 'cita_cita', label: 'Cita-cita', type: 'text' },
    ]
  },
  {
    title: 'Data Orang Tua',
    fields: [
      { key: 'nama_ayah', label: 'Nama Ayah', type: 'text' },
      { key: 'pekerjaan_ayah', label: 'Pekerjaan Ayah', type: 'text' },
      { key: 'pendidikan_ayah', label: 'Pendidikan Ayah', type: 'text' },
      { key: 'nama_ibu', label: 'Nama Ibu', type: 'text' },
      { key: 'pekerjaan_ibu', label: 'Pekerjaan Ibu', type: 'text' },
      { key: 'pendidikan_ibu', label: 'Pendidikan Ibu', type: 'text' },
      { key: 'no_hp_ortu', label: 'No. HP Orang Tua', type: 'text' },
      { key: 'penghasilan_ortu', label: 'Penghasilan Orang Tua', type: 'text' },
      { key: 'alamat_ortu', label: 'Alamat Orang Tua', type: 'textarea' },
    ]
  },
];

const ALL_KEYS = FIELD_GROUPS.flatMap(g => g.fields.map(f => f.key));

export default function InputNISNGuru() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { if (selectedKelas) fetchSiswa(); }, [selectedKelas]); // eslint-disable-line

  const fetchKelas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('kelas').select('*').eq('wali_kelas_id', user.id).order('nama_kelas');
    if (error) console.error('Fetch kelas error:', error.message);
    setKelasList(data || []);
  };

  const fetchSiswa = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('siswa').select('*').eq('kelas_id', selectedKelas).order('full_name');
    if (error) console.error('Fetch siswa error:', error.message);
    setSiswaList(data || []);
    setLoading(false);
  };

  const openEdit = (siswa) => {
    setIsNew(false);
    setEditingSiswa(siswa);
    setFormData({ ...siswa });
  };

  const openAdd = () => {
    if (!selectedKelas) { alert('Pilih kelas dulu!'); return; }
    setIsNew(true);
    setEditingSiswa({});
    const empty = {};
    ALL_KEYS.forEach(k => { empty[k] = ''; });
    setFormData(empty);
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.full_name.trim()) {
      alert('Nama lengkap wajib diisi!');
      return;
    }
    setSaving(true);
    const payload = {};
    ALL_KEYS.forEach(k => { payload[k] = formData[k] || null; });

    if (isNew) {
      payload.kelas_id = selectedKelas;
      const { error } = await supabase.from('siswa').insert(payload);
      setSaving(false);
      if (error) { alert('Gagal tambah siswa: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('siswa').update(payload).eq('id', editingSiswa.id);
      setSaving(false);
      if (error) { alert('Gagal simpan: ' + error.message); return; }
    }

    setEditingSiswa(null);
    fetchSiswa();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4" style={{ background: 'linear-gradient(160deg, #CC0000 0%, #FF3333 60%, #CC0000 100%)' }}>
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Data Siswa Lengkap</h1>
        <button type="button" onClick={openAdd}
          className="bg-white text-red-600 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1">
          <FiPlus size={16} /> Tambah
        </button>
      </div>

      <div className="p-4">
        <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
          className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 mb-4">
          <option value="">-- Pilih Kelas --</option>
          {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
        </select>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : siswaList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">👤</p>
            <p>{selectedKelas ? 'Belum ada siswa di kelas ini' : 'Pilih kelas terlebih dahulu'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {siswaList.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="bg-red-100 text-red-600 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiUser size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{s.full_name}</p>
                  <p className="text-xs text-gray-400">NIS: {s.nis || '-'} · NISN: {s.nisn || 'Belum diisi'}</p>
                </div>
                <button type="button" onClick={() => openEdit(s)}
                  className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1">
                  <FiEdit2 size={14} /> Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingSiswa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setEditingSiswa(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg flex flex-col" style={{ height: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold">{isNew ? 'Tambah Siswa Baru' : `Edit Data: ${editingSiswa.full_name}`}</h2>
              <button type="button" onClick={() => setEditingSiswa(null)}><FiX size={22} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {FIELD_GROUPS.map(group => (
                <div key={group.title} className="mb-5">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm">{group.title}</h3>
                  <div className="space-y-3">
                    {group.fields.map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                        {f.type === 'textarea' ? (
                          <textarea
                            value={formData[f.key] || ''}
                            onChange={e => handleChange(f.key, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          />
                        ) : f.type === 'select' ? (
                          <select
                            value={formData[f.key] || ''}
                            onChange={e => handleChange(f.key, e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          >
                            <option value="">-- Pilih --</option>
                            {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type={f.type}
                            value={formData[f.key] || ''}
                            onChange={e => handleChange(f.key, e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4 flex-shrink-0">
              <button type="button" onClick={handleSave} disabled={saving}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                <FiSave size={18} /> {saving ? 'Menyimpan...' : (isNew ? 'Tambah Siswa' : 'Simpan Data')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}