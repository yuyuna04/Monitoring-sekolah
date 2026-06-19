import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const emptyForm = {
  nis: '', full_name: '', kelas_id: '', jenis_kelamin: 'L',
  tanggal_lahir: '', tempat_lahir: '', agama: '',
  alamat: '', anak_ke: '', jumlah_saudara: '',
  tinggi_badan: '', berat_badan: '', golongan_darah: '',
  hobi: '', cita_cita: '',
  nama_ayah: '', pekerjaan_ayah: '', pendidikan_ayah: '',
  nama_ibu: '', pekerjaan_ibu: '', pendidikan_ibu: '',
  no_hp_ortu: '', penghasilan_ortu: '', alamat_ortu: '',
  jarak_rumah: '', transportasi: '',
  nama_wali: '', pekerjaan_wali: '', no_hp_wali: ''
};

export default function DataSiswa() {
  const navigate = useNavigate();
  const [siswaList, setSiswaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('data');

  useEffect(() => { fetchSiswa(); fetchKelas(); }, []);

  const fetchSiswa = async () => {
    setLoading(true);
    const { data } = await supabase.from('siswa')
      .select('*, kelas(nama_kelas)').order('full_name');
    setSiswaList(data || []);
    setLoading(false);
  };

  const fetchKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('nama_kelas');
    setKelasList(data || []);
  };

  const handleSubmit = async () => {
    if (!form.nis || !form.full_name) return alert('NIS dan Nama wajib diisi!');
    const payload = { ...form };
    if (!payload.kelas_id) delete payload.kelas_id;
    if (editData) {
      await supabase.from('siswa').update(payload).eq('id', editData.id);
    } else {
      await supabase.from('siswa').insert(payload);
    }
    setShowModal(false);
    setEditData(null);
    setForm(emptyForm);
    fetchSiswa();
  };

  const handleEdit = (siswa) => {
    setEditData(siswa);
    const f = { ...emptyForm };
    Object.keys(emptyForm).forEach(k => { f[k] = siswa[k] || ''; });
    setForm(f);
    setActiveTab('data');
    setShowModal(true);
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm('Hapus siswa ' + nama + '?')) return;
    await supabase.from('siswa').delete().eq('id', id);
    fetchSiswa();
  };

  const filtered = siswaList.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.nis?.includes(search)
  );

  const tabs = [
    { id: 'data', label: '📋 Data Diri' },
    { id: 'fisik', label: '💪 Fisik' },
    { id: 'ortu', label: '👨‍👩‍👧 Orang Tua' },
    { id: 'wali', label: '🏠 Wali' },
  ];

  const agamaList = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
  const pendidikanList = ['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3', 'Tidak Sekolah'];
  const golDarahList = ['A', 'B', 'AB', 'O', 'Tidak Tahu'];
  const penghasilanList = ['< Rp 1 Juta', 'Rp 1-3 Juta', 'Rp 3-5 Juta', 'Rp 5-10 Juta', '> Rp 10 Juta'];
  const transportasiList = ['Jalan Kaki', 'Sepeda', 'Motor', 'Mobil', 'Angkutan Umum'];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/admin/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Data Siswa</h1>
        <button type="button" onClick={() => { setEditData(null); setForm(emptyForm); setActiveTab('data'); setShowModal(true); }}
          className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
          <FiPlus /> Tambah
        </button>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau NIS..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-red-600">{siswaList.length}</p>
            <p className="text-xs text-gray-500">Total Siswa</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">
              {siswaList.filter(s => s.jenis_kelamin === 'L').length}
            </p>
            <p className="text-xs text-gray-500">Laki-laki</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-pink-600">
              {siswaList.filter(s => s.jenis_kelamin === 'P').length}
            </p>
            <p className="text-xs text-gray-500">Perempuan</p>
          </div>
        </div>

        {/* List */}
        {loading ? <div className="text-center py-10">Memuat...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">👨‍🎓</p>
            <p>Belum ada data siswa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(siswa => (
              <div key={siswa.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${siswa.jenis_kelamin === 'P' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                    {siswa.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{siswa.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {siswa.kelas?.nama_kelas || 'Belum ada kelas'} • NIS: {siswa.nis}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDetail(showDetail === siswa.id ? null : siswa.id)}
                      className="bg-gray-50 text-gray-600 p-2 rounded-lg">
                      {showDetail === siswa.id ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    <button type="button" onClick={() => handleEdit(siswa)}
                      className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                      <FiEdit2 />
                    </button>
                    <button type="button" onClick={() => handleDelete(siswa.id, siswa.full_name)}
                      className="bg-red-50 text-red-600 p-2 rounded-lg">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                {/* Detail Panel */}
                {showDetail === siswa.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div><span className="text-gray-500">Tempat Lahir:</span> <span className="font-medium">{siswa.tempat_lahir || '-'}</span></div>
                      <div><span className="text-gray-500">Tgl Lahir:</span> <span className="font-medium">{siswa.tanggal_lahir || '-'}</span></div>
                      <div><span className="text-gray-500">Agama:</span> <span className="font-medium">{siswa.agama || '-'}</span></div>
                      <div><span className="text-gray-500">Gol. Darah:</span> <span className="font-medium">{siswa.golongan_darah || '-'}</span></div>
                      <div><span className="text-gray-500">Tinggi:</span> <span className="font-medium">{siswa.tinggi_badan ? siswa.tinggi_badan + ' cm' : '-'}</span></div>
                      <div><span className="text-gray-500">Berat:</span> <span className="font-medium">{siswa.berat_badan ? siswa.berat_badan + ' kg' : '-'}</span></div>
                      <div><span className="text-gray-500">Anak ke:</span> <span className="font-medium">{siswa.anak_ke || '-'}</span></div>
                      <div><span className="text-gray-500">Jml Saudara:</span> <span className="font-medium">{siswa.jumlah_saudara || '-'}</span></div>
                      <div><span className="text-gray-500">Hobi:</span> <span className="font-medium">{siswa.hobi || '-'}</span></div>
                      <div><span className="text-gray-500">Cita-cita:</span> <span className="font-medium">{siswa.cita_cita || '-'}</span></div>
                      <div className="col-span-2 border-t pt-2 mt-1">
                        <p className="font-semibold text-gray-700 mb-1">👨 Ayah</p>
                        <p>{siswa.nama_ayah || '-'} • {siswa.pekerjaan_ayah || '-'} • {siswa.pendidikan_ayah || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-semibold text-gray-700 mb-1">👩 Ibu</p>
                        <p>{siswa.nama_ibu || '-'} • {siswa.pekerjaan_ibu || '-'} • {siswa.pendidikan_ibu || '-'}</p>
                      </div>
                      <div><span className="text-gray-500">No HP Ortu:</span> <span className="font-medium">{siswa.no_hp_ortu || '-'}</span></div>
                      <div><span className="text-gray-500">Penghasilan:</span> <span className="font-medium">{siswa.penghasilan_ortu || '-'}</span></div>
                      <div><span className="text-gray-500">Transportasi:</span> <span className="font-medium">{siswa.transportasi || '-'}</span></div>
                      <div><span className="text-gray-500">Jarak Rumah:</span> <span className="font-medium">{siswa.jarak_rumah || '-'}</span></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editData ? 'Edit Siswa' : 'Tambah Siswa'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)}
                className="text-gray-400 text-2xl">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                    activeTab === t.id
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-500'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-3">
              {/* Tab Data Diri */}
              {activeTab === 'data' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">NIS *</label>
                    <input value={form.nis} onChange={e => setForm({...form, nis: e.target.value})}
                      placeholder="Nomor Induk Siswa"
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nama Lengkap *</label>
                    <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                      placeholder="Nama lengkap siswa"
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kelas</label>
                    <select value={form.kelas_id} onChange={e => setForm({...form, kelas_id: e.target.value})}
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">-- Pilih Kelas --</option>
                      {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Jenis Kelamin</label>
                      <select value={form.jenis_kelamin} onChange={e => setForm({...form, jenis_kelamin: e.target.value})}
                        className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Agama</label>
                      <select value={form.agama} onChange={e => setForm({...form, agama: e.target.value})}
                        className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="">-- Pilih --</option>
                        {agamaList.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tempat Lahir</label>
                      <input value={form.tempat_lahir} onChange={e => setForm({...form, tempat_lahir: e.target.value})}
                        placeholder="Kota lahir"
                        className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tanggal Lahir</label>
                      <input type="date" value={form.tanggal_lahir} onChange={e => setForm({...form, tanggal_lahir: e.target.value})}
                        className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Anak ke</label>
                      <input type="number" value={form.anak_ke} onChange={e => setForm({...form, anak_ke: e.target.value})}
                        placeholder="1"
                        className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Jumlah Saudara</label>
                      <input type="number" value={form.jumlah_saudara} onChange={e => setForm({...form, jumlah_saudara: e.target.value})}
                        placeholder="2"
                        className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hobi</label>
                    <input value={form.hobi} onChange={e => setForm({...form, hobi: e.target.value})}
                      placeholder="Hobi siswa"
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cita-cita</label>
                    <input value={form.cita_cita} onChange={e => setForm({...form, cita_cita: e.target.value})}
                      placeholder="Cita-cita siswa"
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Alamat Siswa</label>
                    <textarea value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})}
                      placeholder="Alamat lengkap" rows={2}
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </>
              )}

              {/* Tab Fisik */}
              {activeTab === 'fisik' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tinggi Badan (cm)</label>
                      <input type="number" value={form.tinggi_badan} onChange={e => setForm({...form, tinggi_badan: e.target.value})}
                        placeholder="120"
                        className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Berat Badan (kg)</label>
                      <input type="number" value={form.berat_badan} onChange={e => setForm({...form, berat_badan: e.target.value})}
                        placeholder="25"
                        className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Golongan Darah</label>
                    <select value={form.golongan_darah} onChange={e => setForm({...form, golongan_darah: e.target.value})}
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">-- Pilih --</option>
                      {golDarahList.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Transportasi ke Sekolah</label>
                    <select value={form.transportasi} onChange={e => setForm({...form, transportasi: e.target.value})}
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">-- Pilih --</option>
                      {transportasiList.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Jarak Rumah ke Sekolah</label>
                    <input value={form.jarak_rumah} onChange={e => setForm({...form, jarak_rumah: e.target.value})}
                      placeholder="contoh: 2 km"
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </>
              )}

              {/* Tab Orang Tua */}
              {activeTab === 'ortu' && (
                <>
                  <p className="font-bold text-gray-700">👨 Data Ayah</p>
                  <input value={form.nama_ayah} onChange={e => setForm({...form, nama_ayah: e.target.value})}
                    placeholder="Nama Ayah"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <input value={form.pekerjaan_ayah} onChange={e => setForm({...form, pekerjaan_ayah: e.target.value})}
                    placeholder="Pekerjaan Ayah"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pendidikan Ayah</label>
                    <select value={form.pendidikan_ayah} onChange={e => setForm({...form, pendidikan_ayah: e.target.value})}
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">-- Pilih --</option>
                      {pendidikanList.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <p className="font-bold text-gray-700 mt-2">👩 Data Ibu</p>
                  <input value={form.nama_ibu} onChange={e => setForm({...form, nama_ibu: e.target.value})}
                    placeholder="Nama Ibu"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <input value={form.pekerjaan_ibu} onChange={e => setForm({...form, pekerjaan_ibu: e.target.value})}
                    placeholder="Pekerjaan Ibu"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pendidikan Ibu</label>
                    <select value={form.pendidikan_ibu} onChange={e => setForm({...form, pendidikan_ibu: e.target.value})}
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">-- Pilih --</option>
                      {pendidikanList.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <p className="font-bold text-gray-700 mt-2">📞 Kontak & Ekonomi</p>
                  <input value={form.no_hp_ortu} onChange={e => setForm({...form, no_hp_ortu: e.target.value})}
                    placeholder="No HP Orang Tua"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Penghasilan Orang Tua</label>
                    <select value={form.penghasilan_ortu} onChange={e => setForm({...form, penghasilan_ortu: e.target.value})}
                      className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">-- Pilih --</option>
                      {penghasilanList.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <textarea value={form.alamat_ortu} onChange={e => setForm({...form, alamat_ortu: e.target.value})}
                    placeholder="Alamat Orang Tua (jika berbeda)" rows={2}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                </>
              )}

              {/* Tab Wali */}
              {activeTab === 'wali' && (
                <>
                  <p className="text-sm text-gray-500 mb-2">Isi jika siswa tinggal bersama wali</p>
                  <input value={form.nama_wali} onChange={e => setForm({...form, nama_wali: e.target.value})}
                    placeholder="Nama Wali"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <input value={form.pekerjaan_wali} onChange={e => setForm({...form, pekerjaan_wali: e.target.value})}
                    placeholder="Pekerjaan Wali"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <input value={form.no_hp_wali} onChange={e => setForm({...form, no_hp_wali: e.target.value})}
                    placeholder="No HP Wali"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex gap-3">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-3 border rounded-xl text-gray-700 font-medium">
                Batal
              </button>
              <button type="button" onClick={handleSubmit}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold">
                {editData ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}