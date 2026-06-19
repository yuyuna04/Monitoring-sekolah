import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiSave, FiCalendar, FiBarChart2, FiList } from 'react-icons/fi';

export default function AbsensiGuru() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('harian');
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [semester, setSemester] = useState('Ganjil');
  const [absensi, setAbsensi] = useState({});
  const [rekapBulan, setRekapBulan] = useState([]);
  const [rekapSemester, setRekapSemester] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => {
    if (selectedKelas) {
      fetchSiswa();
      if (activeTab === 'bulanan') fetchRekapBulan();
      if (activeTab === 'semester') fetchRekapSemester();
    }
  }, [selectedKelas, activeTab, bulan, semester]); // eslint-disable-line

  const fetchKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchSiswa = async () => {
    const { data } = await supabase.from('siswa').select('*')
      .eq('kelas_id', selectedKelas).order('full_name');
    setSiswaList(data || []);
    const init = {};
    data?.forEach(s => { init[s.id] = 'Hadir'; });
    setAbsensi(init);
  };

  const fetchRekapBulan = async () => {
    setLoading(true);
    const { data: siswa } = await supabase.from('siswa').select('*')
      .eq('kelas_id', selectedKelas).order('full_name');
    const startDate = bulan + '-01';
    const endDate = bulan + '-31';
    const { data: abs } = await supabase.from('absensi').select('*')
      .eq('kelas_id', selectedKelas)
      .gte('tanggal', startDate).lte('tanggal', endDate);

    const rekap = (siswa || []).map(s => {
      const siswaAbs = abs?.filter(a => a.siswa_id === s.id) || [];
      return {
        ...s,
        hadir: siswaAbs.filter(a => a.status === 'Hadir').length,
        izin: siswaAbs.filter(a => a.status === 'Izin').length,
        sakit: siswaAbs.filter(a => a.status === 'Sakit').length,
        alpa: siswaAbs.filter(a => a.status === 'Alpa').length,
        total: siswaAbs.length,
      };
    });
    setRekapBulan(rekap);
    setLoading(false);
  };

  const fetchRekapSemester = async () => {
    setLoading(true);
    const { data: siswa } = await supabase.from('siswa').select('*')
      .eq('kelas_id', selectedKelas).order('full_name');

    const tahun = new Date().getFullYear();
    let startDate, endDate;
    if (semester === 'Ganjil') {
      startDate = `${tahun}-07-01`;
      endDate = `${tahun}-12-31`;
    } else {
      startDate = `${tahun}-01-01`;
      endDate = `${tahun}-06-30`;
    }

    const { data: abs } = await supabase.from('absensi').select('*')
      .eq('kelas_id', selectedKelas)
      .gte('tanggal', startDate).lte('tanggal', endDate);

    const rekap = (siswa || []).map(s => {
      const siswaAbs = abs?.filter(a => a.siswa_id === s.id) || [];
      const total = siswaAbs.length;
      const hadir = siswaAbs.filter(a => a.status === 'Hadir').length;
      return {
        ...s,
        hadir,
        izin: siswaAbs.filter(a => a.status === 'Izin').length,
        sakit: siswaAbs.filter(a => a.status === 'Sakit').length,
        alpa: siswaAbs.filter(a => a.status === 'Alpa').length,
        total,
        persen: total > 0 ? Math.round((hadir / total) * 100) : 0,
      };
    });
    setRekapSemester(rekap);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedKelas || siswaList.length === 0) { alert('Pilih kelas dulu!'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const rows = siswaList.map(s => ({
      siswa_id: s.id, kelas_id: selectedKelas,
      tanggal, status: absensi[s.id] || 'Hadir', dicatat_oleh: user.id
    }));
    await supabase.from('absensi').upsert(rows, { onConflict: 'siswa_id,tanggal' });
    setSaving(false);
    alert('✅ Absensi berhasil disimpan!');
  };

  const statusStyle = {
    Hadir: 'bg-green-500 text-white',
    Izin: 'bg-yellow-400 text-white',
    Sakit: 'bg-blue-500 text-white',
    Alpa: 'bg-red-500 text-white',
  };

  const tabs = [
    { id: 'harian', label: 'Harian', icon: <FiCalendar size={16} /> },
    { id: 'bulanan', label: 'Bulanan', icon: <FiList size={16} /> },
    { id: 'semester', label: 'Semester', icon: <FiBarChart2 size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Absensi Siswa</h1>
        {activeTab === 'harian' && (
          <button type="button" onClick={handleSave} disabled={saving}
            className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
            <FiSave size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        )}
      </div>

      {/* Tab */}
      <div className="bg-white border-b flex">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition ${
              activeTab === t.id
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">

        {/* ===== HARIAN ===== */}
        {activeTab === 'harian' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Tanggal</label>
                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Kelas</label>
                <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
            </div>

            {siswaList.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {['Hadir','Izin','Sakit','Alpa'].map(s => (
                  <div key={s} className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <p className="text-xl font-bold text-gray-800">
                      {Object.values(absensi).filter(v => v === s).length}
                    </p>
                    <p className="text-xs text-gray-500">{s}</p>
                  </div>
                ))}
              </div>
            )}

            {siswaList.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-2">📋</p>
                <p>Pilih kelas untuk mulai absensi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {siswaList.map((siswa, idx) => (
                  <div key={siswa.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{siswa.full_name}</p>
                        <p className="text-xs text-gray-400">NIS: {siswa.nis}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['Hadir','Izin','Sakit','Alpa'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setAbsensi({...absensi, [siswa.id]: s})}
                          className={`py-2 rounded-xl text-xs font-semibold transition ${
                            absensi[siswa.id] === s ? statusStyle[s] : 'bg-gray-100 text-gray-600'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== BULANAN ===== */}
        {activeTab === 'bulanan' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Bulan</label>
                <input type="month" value={bulan} onChange={e => setBulan(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Kelas</label>
                <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-500">Memuat rekap...</div>
            ) : rekapBulan.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-2">📊</p>
                <p>Pilih kelas untuk lihat rekap bulanan</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-red-600 text-white px-4 py-3">
                  <p className="font-bold text-sm">Rekap Absensi Bulan {bulan}</p>
                </div>
                {/* Header tabel */}
                <div className="grid grid-cols-6 gap-1 px-4 py-2 bg-gray-50 border-b">
                  <p className="col-span-2 text-xs font-semibold text-gray-600">Nama</p>
                  <p className="text-xs font-semibold text-green-600 text-center">H</p>
                  <p className="text-xs font-semibold text-yellow-600 text-center">I</p>
                  <p className="text-xs font-semibold text-blue-600 text-center">S</p>
                  <p className="text-xs font-semibold text-red-600 text-center">A</p>
                </div>
                {rekapBulan.map((siswa, i) => (
                  <div key={siswa.id} className={`grid grid-cols-6 gap-1 px-4 py-3 border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{siswa.full_name}</p>
                      <p className="text-xs text-gray-400">{siswa.total} hari</p>
                    </div>
                    <p className="text-sm font-bold text-green-600 text-center">{siswa.hadir}</p>
                    <p className="text-sm font-bold text-yellow-600 text-center">{siswa.izin}</p>
                    <p className="text-sm font-bold text-blue-600 text-center">{siswa.sakit}</p>
                    <p className="text-sm font-bold text-red-600 text-center">{siswa.alpa}</p>
                  </div>
                ))}
                {/* Total */}
                <div className="grid grid-cols-6 gap-1 px-4 py-3 bg-gray-100">
                  <p className="col-span-2 text-sm font-bold text-gray-700">TOTAL</p>
                  <p className="text-sm font-bold text-green-600 text-center">{rekapBulan.reduce((a,b) => a+b.hadir, 0)}</p>
                  <p className="text-sm font-bold text-yellow-600 text-center">{rekapBulan.reduce((a,b) => a+b.izin, 0)}</p>
                  <p className="text-sm font-bold text-blue-600 text-center">{rekapBulan.reduce((a,b) => a+b.sakit, 0)}</p>
                  <p className="text-sm font-bold text-red-600 text-center">{rekapBulan.reduce((a,b) => a+b.alpa, 0)}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== SEMESTER ===== */}
        {activeTab === 'semester' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Semester</label>
                  <select value={semester} onChange={e => setSemester(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Kelas</label>
                  <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="">-- Pilih --</option>
                    {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-500">Memuat rekap...</div>
            ) : rekapSemester.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-2">📈</p>
                <p>Pilih kelas untuk lihat rekap semester</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-red-600 text-white px-4 py-3">
                    <p className="font-bold text-sm">Rekap Semester {semester}</p>
                  </div>
                  {rekapSemester.map((siswa, i) => (
                    <div key={siswa.id} className={`px-4 py-3 border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{siswa.full_name}</p>
                          <p className="text-xs text-gray-400">{siswa.total} hari total</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          siswa.persen >= 90 ? 'bg-green-100 text-green-600'
                          : siswa.persen >= 75 ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-red-100 text-red-600'
                        }`}>
                          {siswa.persen}%
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { label: 'Hadir', val: siswa.hadir, color: 'text-green-600' },
                          { label: 'Izin', val: siswa.izin, color: 'text-yellow-600' },
                          { label: 'Sakit', val: siswa.sakit, color: 'text-blue-600' },
                          { label: 'Alpa', val: siswa.alpa, color: 'text-red-600' },
                        ].map(item => (
                          <div key={item.label} className="bg-gray-50 rounded-lg py-1">
                            <p className={`text-sm font-bold ${item.color}`}>{item.val}</p>
                            <p className="text-xs text-gray-400">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${
                          siswa.persen >= 90 ? 'bg-green-500'
                          : siswa.persen >= 75 ? 'bg-yellow-500'
                          : 'bg-red-500'
                        }`} style={{ width: `${siswa.persen}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}