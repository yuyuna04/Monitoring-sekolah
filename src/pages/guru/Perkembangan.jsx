import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import {
  RadarChart, PolarGrid, PolarAngleAxis,
  Radar, ResponsiveContainer, Tooltip
} from 'recharts';

export default function PerkembanganGuru() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState('');
  const [periode, setPeriode] = useState('Semester Ganjil 2024');
  const [form, setForm] = useState({
    sikap: '', pengetahuan: '', keterampilan: '', catatan_guru: ''
  });
  const [skor, setSkor] = useState({
    sikap: 70, pengetahuan: 70, keterampilan: 70
  });
  const [saving, setSaving] = useState(false);
  const [riwayat, setRiwayat] = useState([]);

  useEffect(() => { fetchKelas(); }, []);

  useEffect(() => {
    if (selectedKelas) fetchSiswa();
  }, [selectedKelas]);

  useEffect(() => {
    if (selectedSiswa) {
      fetchPerkembangan();
      fetchRiwayat();
    }
  }, [selectedSiswa, periode]);

  const fetchKelas = async () => {
    const { data } = await supabase
      .from('kelas').select('*').order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchSiswa = async () => {
    const { data } = await supabase
      .from('siswa').select('*')
      .eq('kelas_id', selectedKelas).order('full_name');
    setSiswaList(data || []);
  };

  const fetchPerkembangan = async () => {
    const { data } = await supabase
      .from('perkembangan').select('*')
      .eq('siswa_id', selectedSiswa)
      .eq('periode', periode)
      .maybeSingle();
    if (data) {
      setForm({
        sikap: data.sikap || '',
        pengetahuan: data.pengetahuan || '',
        keterampilan: data.keterampilan || '',
        catatan_guru: data.catatan_guru || ''
      });
      setSkor({
        sikap: data.skor_sikap || 70,
        pengetahuan: data.skor_pengetahuan || 70,
        keterampilan: data.skor_keterampilan || 70
      });
    } else {
      setForm({ sikap: '', pengetahuan: '', keterampilan: '', catatan_guru: '' });
      setSkor({ sikap: 70, pengetahuan: 70, keterampilan: 70 });
    }
  };

  const fetchRiwayat = async () => {
    const { data } = await supabase
      .from('perkembangan').select('*')
      .eq('siswa_id', selectedSiswa)
      .order('created_at');
    setRiwayat(data || []);
  };

  const handleSave = async () => {
    if (!selectedSiswa) { alert('Pilih siswa!'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('perkembangan').upsert({
        siswa_id: selectedSiswa,
        periode: periode,
        sikap: form.sikap,
        pengetahuan: form.pengetahuan,
        keterampilan: form.keterampilan,
        catatan_guru: form.catatan_guru,
        skor_sikap: skor.sikap,
        skor_pengetahuan: skor.pengetahuan,
        skor_keterampilan: skor.keterampilan,
        dicatat_oleh: user.id
      }, { onConflict: 'siswa_id,periode' });
      alert('Berhasil disimpan!');
      fetchRiwayat();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const radarData = [
    { subject: 'Sikap', value: skor.sikap },
    { subject: 'Pengetahuan', value: skor.pengetahuan },
    { subject: 'Keterampilan', value: skor.keterampilan },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/guru/dashboard')}
          className="p-1"
        >
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Perkembangan Siswa</h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
        >
          <FiSave />
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      <div className="p-6 space-y-4">

        {/* Filter Kelas & Siswa */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Pilih Kelas</label>
            <select
              value={selectedKelas}
              onChange={e => {
                setSelectedKelas(e.target.value);
                setSelectedSiswa('');
                setSiswaList([]);
              }}
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Pilih Siswa</label>
            <select
              value={selectedSiswa}
              onChange={e => setSelectedSiswa(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">-- Pilih Siswa --</option>
              {siswaList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Periode</label>
            <input
              value={periode}
              onChange={e => setPeriode(e.target.value)}
              placeholder="contoh: Semester Ganjil 2024"
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {selectedSiswa && (
          <div className="space-y-4">

            {/* Slider Skor */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">📊 Skor Perkembangan</h3>
              {[
                { key: 'sikap', label: '😊 Sikap', color: '#3B82F6' },
                { key: 'pengetahuan', label: '📚 Pengetahuan', color: '#22C55E' },
                { key: 'keterampilan', label: '🎯 Keterampilan', color: '#A855F7' },
              ].map(item => (
                <div key={item.key} className="mb-5">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">{item.label}</label>
                    <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                      {skor[item.key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skor[item.key]}
                    onChange={e => setSkor(prev => ({
                      ...prev,
                      [item.key]: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 rounded-lg cursor-pointer"
                    style={{ accentColor: item.color }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">📈 Grafik Perkembangan</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar
                    name="Skor"
                    dataKey="value"
                    stroke="#CC0000"
                    fill="#CC0000"
                    fillOpacity={0.4}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Riwayat */}
            {riwayat.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3">📉 Riwayat Per Periode</h3>
                <div className="space-y-3">
                  {riwayat.map((r, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">{r.periode}</p>
                      {[
                        { label: 'Sikap', val: r.skor_sikap || 0, color: 'bg-blue-500' },
                        { label: 'Pengetahuan', val: r.skor_pengetahuan || 0, color: 'bg-green-500' },
                        { label: 'Keterampilan', val: r.skor_keterampilan || 0, color: 'bg-purple-500' },
                      ].map(bar => (
                        <div key={bar.label} className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 w-24">{bar.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className={`${bar.color} h-2 rounded-full`}
                              style={{ width: `${bar.val}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-8 text-right">
                            {bar.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deskripsi */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800">📝 Deskripsi Perkembangan</h3>
              {[
                { key: 'sikap', label: '😊 Sikap', placeholder: 'Deskripsi sikap siswa...' },
                { key: 'pengetahuan', label: '📚 Pengetahuan', placeholder: 'Deskripsi pengetahuan...' },
                { key: 'keterampilan', label: '🎯 Keterampilan', placeholder: 'Deskripsi keterampilan...' },
                { key: 'catatan_guru', label: '📋 Catatan Guru', placeholder: 'Catatan tambahan...' },
              ].map(item => (
                <div key={item.key}>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">
                    {item.label}
                  </label>
                  <textarea
                    value={form[item.key]}
                    onChange={e => setForm(prev => ({...prev, [item.key]: e.target.value}))}
                    placeholder={item.placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                  />
                </div>
              ))}
            </div>

          </div>
        )}

        {!selectedSiswa && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">📈</div>
            <p className="font-medium">Pilih kelas dan siswa</p>
            <p className="text-sm">untuk melihat & mengisi perkembangan</p>
          </div>
        )}

      </div>
    </div>
  );
}