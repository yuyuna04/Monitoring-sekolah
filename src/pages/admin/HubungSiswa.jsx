import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiPlus, FiTrash2, FiUserPlus, FiLink2, FiEye, FiEyeOff } from 'react-icons/fi';

export default function HubungSiswa() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('buat'); // 'buat' atau 'hubungkan'
  const [siswaList, setSiswaList] = useState([]);
  const [ortuList, setOrtuList] = useState([]);
  const [relasiList, setRelasiList] = useState([]);

  // Form hubungkan akun yang sudah ada
  const [selectedSiswa, setSelectedSiswa] = useState('');
  const [selectedOrtu, setSelectedOrtu] = useState('');
  const [hubungan, setHubungan] = useState('Ayah');
  const [saving, setSaving] = useState(false);

  // Form buat akun baru
  const [namaBaru, setNamaBaru] = useState('');
  const [emailBaru, setEmailBaru] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [siswaBaru, setSiswaBaru] = useState('');
  const [hubunganBaru, setHubunganBaru] = useState('Ayah');
  const [savingBaru, setSavingBaru] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: siswa } = await supabase.from('siswa').select('id, full_name, nis').order('full_name');
    const { data: ortu } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'orangtua');
    const { data: relasi } = await supabase.from('siswa_orangtua')
      .select('*, siswa(full_name, nis), profiles(full_name, email)');
    setSiswaList(siswa || []);
    setOrtuList(ortu || []);
    setRelasiList(relasi || []);
  };

  const handleHubungkan = async () => {
    if (!selectedSiswa || !selectedOrtu) return alert('Pilih siswa dan orang tua!');
    setSaving(true);
    const { error } = await supabase.from('siswa_orangtua').insert({
      siswa_id: selectedSiswa,
      orangtua_id: selectedOrtu,
      hubungan
    });
    if (error) alert('Gagal: ' + error.message);
    else {
      alert('Berhasil dihubungkan!');
      setSelectedSiswa('');
      setSelectedOrtu('');
      fetchAll();
    }
    setSaving(false);
  };

  const handleBuatAkunBaru = async () => {
    if (!namaBaru || !emailBaru || !passwordBaru || !siswaBaru) {
      alert('Semua field wajib diisi!');
      return;
    }
    if (passwordBaru.length < 6) {
      alert('Password minimal 6 karakter!');
      return;
    }
    setSavingBaru(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: emailBaru, password: passwordBaru });
      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id, full_name: namaBaru, email: emailBaru, role: 'orangtua'
        });

        const { error: relasiError } = await supabase.from('siswa_orangtua').insert({
          siswa_id: siswaBaru, orangtua_id: data.user.id, hubungan: hubunganBaru
        });

        if (relasiError) {
          alert('Akun berhasil dibuat, tapi gagal menghubungkan ke siswa: ' + relasiError.message);
        } else {
          alert('✅ Akun orang tua berhasil dibuat dan langsung terhubung ke siswa!');
        }
      }

      setNamaBaru(''); setEmailBaru(''); setPasswordBaru(''); setSiswaBaru(''); setHubunganBaru('Ayah');
      fetchAll();
    } catch (err) {
      alert('Gagal membuat akun: ' + err.message);
    } finally {
      setSavingBaru(false);
    }
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Hapus relasi ini?')) return;
    await supabase.from('siswa_orangtua').delete().eq('id', id);
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/admin/dashboard')}><FiArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold">Hubungkan Siswa & Orang Tua</h1>
      </div>

      <div className="p-6 space-y-4">

        {/* Tab Switch */}
        <div className="flex bg-gray-200 rounded-2xl p-1">
          <button type="button" onClick={() => setActiveTab('buat')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'buat' ? 'bg-red-600 text-white shadow' : 'text-gray-500'
            }`}>
            <FiUserPlus size={16} /> Buat Akun Baru
          </button>
          <button type="button" onClick={() => setActiveTab('hubungkan')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'hubungkan' ? 'bg-red-600 text-white shadow' : 'text-gray-500'
            }`}>
            <FiLink2 size={16} /> Akun Sudah Ada
          </button>
        </div>

        {/* ===== TAB: BUAT AKUN BARU ===== */}
        {activeTab === 'buat' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800">👤 Buat Akun Orang Tua Baru</h3>
            <p className="text-xs text-gray-500 -mt-2">Akun langsung dibuat dan terhubung ke siswa yang dipilih</p>

            <div>
              <label className="text-sm font-medium text-gray-700">Nama Orang Tua</label>
              <input type="text" value={namaBaru} onChange={e => setNamaBaru(e.target.value)}
                placeholder="Nama lengkap orang tua"
                className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={emailBaru} onChange={e => setEmailBaru(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input type={showPasswordBaru ? 'text' : 'password'} value={passwordBaru}
                  onChange={e => setPasswordBaru(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full mt-1 px-4 py-2.5 pr-11 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
                <button type="button" onClick={() => setShowPasswordBaru(!showPasswordBaru)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPasswordBaru ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Pilih Siswa (Anak)</label>
              <select value={siswaBaru} onChange={e => setSiswaBaru(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map(s => <option key={s.id} value={s.id}>{s.full_name} - {s.nis}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Hubungan</label>
              <select value={hubunganBaru} onChange={e => setHubunganBaru(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="Ayah">Ayah</option>
                <option value="Ibu">Ibu</option>
                <option value="Wali">Wali</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
              ℹ️ Orang tua bisa langsung login menggunakan email dan password ini.
            </div>

            <button type="button" onClick={handleBuatAkunBaru} disabled={savingBaru}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
              <FiUserPlus /> {savingBaru ? 'Membuat Akun...' : 'Buat Akun & Hubungkan'}
            </button>
          </div>
        )}

        {/* ===== TAB: HUBUNGKAN AKUN YANG SUDAH ADA ===== */}
        {activeTab === 'hubungkan' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800">🔗 Buat Relasi Baru</h3>
            <p className="text-xs text-gray-500 -mt-2">Untuk akun orang tua yang sudah terdaftar sebelumnya</p>
            <div>
              <label className="text-sm font-medium text-gray-700">Pilih Siswa</label>
              <select value={selectedSiswa} onChange={e => setSelectedSiswa(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map(s => <option key={s.id} value={s.id}>{s.full_name} - {s.nis}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pilih Orang Tua</label>
              <select value={selectedOrtu} onChange={e => setSelectedOrtu(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">-- Pilih Orang Tua --</option>
                {ortuList.map(o => <option key={o.id} value={o.id}>{o.full_name} - {o.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Hubungan</label>
              <select value={hubungan} onChange={e => setHubungan(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="Ayah">Ayah</option>
                <option value="Ibu">Ibu</option>
                <option value="Wali">Wali</option>
              </select>
            </div>
            <button type="button" onClick={handleHubungkan} disabled={saving}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
              <FiPlus /> {saving ? 'Menyimpan...' : 'Hubungkan'}
            </button>
          </div>
        )}

        {/* Daftar Relasi */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">📋 Daftar Relasi ({relasiList.length})</h3>
          {relasiList.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-3xl mb-2">👨‍👩‍👧</p>
              <p className="text-sm">Belum ada relasi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {relasiList.map(rel => (
                <div key={rel.id} className="border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👨‍🎓</span>
                      <p className="font-semibold text-gray-800 text-sm">{rel.siswa?.full_name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">👨‍</span>
                      <p className="text-sm text-gray-600">{rel.profiles?.full_name}</p>
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{rel.hubungan}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleHapus(rel.id)}
                    className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}