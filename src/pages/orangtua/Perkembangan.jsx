import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function PerkembanganOrangtua() {
  const navigate = useNavigate();
  const [anakList, setAnakList] = useState([]);
  const [selectedAnak, setSelectedAnak] = useState('');
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAnak(); }, []);
  useEffect(() => { if (selectedAnak) fetchData(); }, [selectedAnak]); // eslint-disable-line

  const fetchAnak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('siswa_orangtua')
      .select('siswa(id, full_name, kelas(nama_kelas))')
      .eq('orangtua_id', user.id);
    setAnakList(data?.map(d => d.siswa) || []);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('perkembangan')
      .select('*').eq('siswa_id', selectedAnak)
      .order('created_at', { ascending: false });
    setDataList(data || []);
    setLoading(false);
  };

  const latest = dataList[0];
  const radarData = latest ? [
    { subject: 'Sikap', value: latest.skor_sikap || 0 },
    { subject: 'Pengetahuan', value: latest.skor_pengetahuan || 0 },
    { subject: 'Keterampilan', value: latest.skor_keterampilan || 0 },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/orangtua/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Perkembangan Anak</h1>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <select value={selectedAnak} onChange={e => setSelectedAnak(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="">-- Pilih Anak --</option>
            {anakList.map(a => a && (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
        </div>

        {loading ? <div className="text-center py-10">Memuat...</div>
        : !selectedAnak ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">📈</p>
            <p>Pilih anak untuk melihat perkembangan</p>
          </div>
        ) : dataList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📈</p>
            <p>Belum ada data perkembangan</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-gray-800 mb-1">
                Periode Terbaru: <span className="text-red-600">{latest.periode}</span>
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar dataKey="value" stroke="#CC0000" fill="#CC0000" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              {[
                { label: '😊 Sikap', val: latest.sikap, skor: latest.skor_sikap || 0 },
                { label: '📚 Pengetahuan', val: latest.pengetahuan, skor: latest.skor_pengetahuan || 0 },
                { label: '🎯 Keterampilan', val: latest.keterampilan, skor: latest.skor_keterampilan || 0 },
              ].map(item => (
                <div key={item.label} className="border rounded-xl p-3">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                    <span className="text-sm font-bold text-red-600">{item.skor}/100</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${item.skor}%` }} />
                  </div>
                  {item.val && <p className="text-xs text-gray-500">{item.val}</p>}
                </div>
              ))}
              {latest.catatan_guru && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">📋 Catatan Guru</p>
                  <p className="text-sm text-gray-600">{latest.catatan_guru}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}