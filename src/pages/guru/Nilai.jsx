import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiSave, FiPlus } from 'react-icons/fi';

export default function NilaiGuru() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tugas');
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [semester, setSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025');
  const [nilaiData, setNilaiData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showMapelModal, setShowMapelModal] = useState(false);
  const [namaMapel, setNamaMapel] = useState('');

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { if (selectedKelas) { fetchSiswa(); fetchMapel(); } }, [selectedKelas]); // eslint-disable-line
  useEffect(() => { if (selectedMapel && siswaList.length > 0) fetchNilai(); }, [selectedMapel, semester, activeTab]); // eslint-disable-line

  const fetchKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchSiswa = async () => {
    const { data } = await supabase.from('siswa').select('*')
      .eq('kelas_id', selectedKelas).order('full_name');
    setSiswaList(data || []);
  };

  const fetchMapel = async () => {
    const { data } = await supabase.from('mata_pelajaran').select('*').eq('kelas_id', selectedKelas);
    setMapelList(data || []);
  };

  const fetchNilai = async () => {
    const { data } = await supabase.from('nilai').select('*')
      .eq('mapel_id', selectedMapel).eq('semester', semester).eq('tahun_ajaran', tahunAjaran);
    const mapped = {};
    data?.forEach(n => { mapped[n.siswa_id] = n; });
    setNilaiData(mapped);
  };

  const handleTambahMapel = async () => {
    if (!namaMapel) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('mata_pelajaran').insert({ nama: namaMapel, kelas_id: selectedKelas, guru_id: user.id });
    if (error) { alert('Gagal menambah mapel: ' + error.message); return; }
    setNamaMapel('');
    setShowMapelModal(false);
    fetchMapel();
  };

  const handleSave = async () => {
    if (!selectedMapel) { alert('Pilih mata pelajaran!'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    let hasError = false;
    let errorMsg = '';

    for (const siswa of siswaList) {
      const n = nilaiData[siswa.id] || {};
      const { error } = await supabase.from('nilai').upsert({
        siswa_id: siswa.id, mapel_id: selectedMapel,
        semester, tahun_ajaran: tahunAjaran,
        nilai_harian: n.nilai_harian ? parseFloat(n.nilai_harian) : null,
        nilai_uts: n.nilai_uts ? parseFloat(n.nilai_uts) : null,
        nilai_uas: n.nilai_uas ? parseFloat(n.nilai_uas) : null,
        nilai_akhir: n.nilai_akhir ? parseFloat(n.nilai_akhir) : null,
        diinput_oleh: user.id
      }, { onConflict: 'siswa_id,mapel_id,semester,tahun_ajaran' });

      if (error) {
        hasError = true;
        errorMsg = error.message;
        break;
      }
    }

    setSaving(false);
    if (hasError) {
      alert('❌ Gagal menyimpan: ' + errorMsg);
    } else {
      alert('✅ Nilai berhasil disimpan!');
      fetchNilai();
    }
  };

  const updateNilai = (siswaId, field, value) => {
    setNilaiData(prev => ({ ...prev, [siswaId]: { ...prev[siswaId], [field]: value } }));
  };

  const hitungRaport = (n) => {
    if (!n) return '';
    const vals = [n.nilai_harian, n.nilai_uts, n.nilai_uas].filter(v => v);
    if (vals.length === 0) return '';
    return (vals.reduce((a, b) => a + parseFloat(b), 0) / vals.length).toFixed(1);
  };

  const tabs = [
    { id: 'tugas', label: 'Nilai Tugas' },
    { id: 'uts', label: 'Nilai UTS' },
    { id: 'uas', label: 'Nilai UAS' },
    { id: 'raport', label: 'Nilai Raport' },
  ];

  const fieldMap = { tugas: 'nilai_harian', uts: 'nilai_uts', uas: 'nilai_uas' };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Input Nilai</h1>
        {activeTab !== 'raport' && (
          <button type="button" onClick={handleSave} disabled={saving}
            className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
            <FiSave size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        )}
      </div>

      <div className="bg-white border-b flex overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 text-xs font-semibold whitespace-nowrap px-2 transition ${
              activeTab === t.id ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="">-- Pilih Kelas --</option>
            {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
          </select>

          {selectedKelas && (
            <div className="flex gap-2">
              <select value={selectedMapel} onChange={e => setSelectedMapel(e.target.value)}
                className="flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">-- Pilih Mapel --</option>
                {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
              <button type="button" onClick={() => setShowMapelModal(true)}
                className="bg-red-600 text-white px-3 rounded-xl">
                <FiPlus />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <select value={semester} onChange={e => setSemester(e.target.value)}
              className="px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
            <input value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)}
              placeholder="2024/2025"
              className="px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>

        {!selectedMapel ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📝</p>
            <p>Pilih kelas dan mata pelajaran</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
              {tabs.find(t => t.id === activeTab)?.label}
              {activeTab === 'raport' && ' (Dihitung Otomatis)'}
            </div>

            {activeTab !== 'raport' && siswaList.map((siswa, idx) => (
              <div key={siswa.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{siswa.full_name}</p>
                  <p className="text-xs text-gray-400">NIS: {siswa.nis}</p>
                </div>
                <input
                  type="number" min="0" max="100"
                  value={nilaiData[siswa.id]?.[fieldMap[activeTab]] ?? ''}
                  onChange={e => updateNilai(siswa.id, fieldMap[activeTab], e.target.value)}
                  placeholder="0-100"
                  className="w-20 px-3 py-2 border-2 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg"
                />
              </div>
            ))}

            {activeTab === 'raport' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-600">
                  ℹ️ Nilai raport dihitung otomatis dari rata-rata Tugas + UTS + UAS
                </div>
                {siswaList.map((siswa, idx) => {
                  const n = nilaiData[siswa.id];
                  const raport = hitungRaport(n);
                  const grade = !raport ? '-' : raport >= 90 ? 'A' : raport >= 80 ? 'B' : raport >= 70 ? 'C' : 'D';
                  const gradeColor = !raport ? 'bg-gray-100 text-gray-400' : raport >= 90 ? 'bg-green-100 text-green-600' : raport >= 80 ? 'bg-blue-100 text-blue-600' : raport >= 70 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600';

                  return (
                    <div key={siswa.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{siswa.full_name}</p>
                            <p className="text-xs text-gray-400">NIS: {siswa.nis}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-800">{raport || '-'}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor}`}>{grade}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'Tugas', val: n?.nilai_harian },
                          { label: 'UTS', val: n?.nilai_uts },
                          { label: 'UAS', val: n?.nilai_uas },
                        ].map(item => (
                          <div key={item.label} className="bg-gray-50 rounded-xl p-2">
                            <p className="text-sm font-bold text-gray-700">{item.val || '-'}</p>
                            <p className="text-xs text-gray-400">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      {raport && (
                        <div className="mt-2 bg-gray-100 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${raport}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {showMapelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Tambah Mata Pelajaran</h2>
            <input value={namaMapel} onChange={e => setNamaMapel(e.target.value)}
              placeholder="Nama mata pelajaran"
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 mb-4" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowMapelModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-gray-700">Batal</button>
              <button type="button" onClick={handleTambahMapel}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold">Tambah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}