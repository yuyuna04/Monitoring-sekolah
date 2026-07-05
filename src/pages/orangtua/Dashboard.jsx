import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiHome, FiCalendar, FiBook, FiBell, FiUser, FiLogOut, FiX, FiCamera, FiSend, FiMessageCircle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

function AnakSDMini({ flip }) {
  return (
    <svg width="34" height="46" viewBox="0 0 30 55" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <circle cx="15" cy="9" r="8" fill="#FDBCB4" />
      <ellipse cx="15" cy="4" rx="8" ry="4.5" fill="#2C1810" />
      <circle cx="11.5" cy="9" r="1.2" fill="#1a1a1a" />
      <circle cx="18.5" cy="9" r="1.2" fill="#1a1a1a" />
      <path d="M 11 12.5 Q 15 15 19 12.5" stroke="#c0846a" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <rect x="6" y="18" width="18" height="15" rx="2" fill="white" />
      <polygon points="15,18 12,21 15,23" fill="#CC0000" />
      <polygon points="15,18 18,21 15,23" fill="#CC0000" />
      <rect x="1" y="18" width="6" height="10" rx="3" fill="white" />
      <rect x="23" y="18" width="6" height="10" rx="3" fill="white" />
      <rect x="6" y="32" width="7" height="13" rx="2" fill="#CC0000" />
      <rect x="16" y="32" width="7" height="13" rx="2" fill="#CC0000" />
      <ellipse cx="9.5" cy="47" rx="5.5" ry="3" fill="#1a1a1a" />
      <ellipse cx="19.5" cy="47" rx="5.5" ry="3" fill="#1a1a1a" />
    </svg>
  );
}

function AnakSDPerempuanMini() {
  return (
    <svg width="32" height="46" viewBox="0 0 30 55">
      <circle cx="15" cy="9" r="8" fill="#FDBCB4" />
      <ellipse cx="15" cy="5" rx="9" ry="5" fill="#2C1810" />
      <rect x="6" y="6" width="3.5" height="16" rx="1.5" fill="#2C1810" />
      <rect x="20.5" y="6" width="3.5" height="16" rx="1.5" fill="#2C1810" />
      <ellipse cx="10" cy="2.5" rx="4" ry="2.5" fill="#CC0000" />
      <ellipse cx="20" cy="2.5" rx="4" ry="2.5" fill="#CC0000" />
      <circle cx="11.5" cy="9" r="1.2" fill="#1a1a1a" />
      <circle cx="18.5" cy="9" r="1.2" fill="#1a1a1a" />
      <path d="M 11 13 Q 15 16 19 13" stroke="#c0846a" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <rect x="6" y="19" width="18" height="13" rx="2" fill="white" />
      <polygon points="15,19 12,22 15,24" fill="#CC0000" />
      <polygon points="15,19 18,22 15,24" fill="#CC0000" />
      <rect x="1" y="19" width="6" height="9" rx="3" fill="white" />
      <rect x="23" y="19" width="6" height="9" rx="3" fill="white" />
      <path d="M 5 31 L 25 31 L 27 45 L 3 45 Z" fill="#CC0000" />
      <ellipse cx="9" cy="47" rx="5" ry="2.8" fill="#1a1a1a" />
      <ellipse cx="21" cy="47" rx="5" ry="2.8" fill="#1a1a1a" />
    </svg>
  );
}

export default function DashboardOrangtua() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [namaOrtu, setNamaOrtu] = useState('');
  const [userId, setUserId] = useState(null);
  const [anakList, setAnakList] = useState([]);
  const [selectedAnak, setSelectedAnak] = useState(null);
  const [absensiRekap, setAbsensiRekap] = useState({ Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, total: 0 });
  const [nilaiList, setNilaiList] = useState([]);
  const [prestasi, setPrestasi] = useState([]);
  const [pengumuman, setPengumuman] = useState([]);
  const [activeTab, setActiveTab] = useState('beranda');
  const [frame, setFrame] = useState(0);
  const [pos, setPos] = useState({ a1: 10, a2: 150 });
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [showAnakModal, setShowAnakModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingNama, setEditingNama] = useState(false);
  const [namaInput, setNamaInput] = useState('');
  const [savingNama, setSavingNama] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  useEffect(() => { fetchProfile(); fetchPengumuman(); }, []);
  useEffect(() => { if (selectedAnak) { fetchAbsensi(); fetchNilai(); fetchPrestasi(); } }, [selectedAnak]); // eslint-disable-line

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(f => f + 1);
      setPos(p => ({
        a1: p.a1 >= 280 ? -30 : p.a1 + 1.2,
        a2: p.a2 >= 280 ? -30 : p.a2 + 0.9,
      }));
    }, 70);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showChatModal && userId) {
      fetchChat();
      const channel = supabase
        .channel('pesan_bantuan_changes_' + userId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pesan_bantuan' }, () => {
          fetchChat();
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [showChatModal, userId]); // eslint-disable-line

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatList]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
      if (profile) setNamaOrtu(profile.full_name);
      const { data: relasi } = await supabase.from('siswa_orangtua')
        .select('siswa(id, full_name, nis, foto_url, kelas(nama_kelas))').eq('orangtua_id', user.id);
      const anak = relasi?.map(r => r.siswa).filter(Boolean) || [];
      setAnakList(anak);
      if (anak.length > 0) setSelectedAnak(anak[0]);
    }
  };

  const fetchAbsensi = async () => {
    const { data } = await supabase.from('absensi').select('*').eq('siswa_id', selectedAnak.id);
    const hadir = data?.filter(d => d.status === 'Hadir').length || 0;
    const izin = data?.filter(d => d.status === 'Izin').length || 0;
    const sakit = data?.filter(d => d.status === 'Sakit').length || 0;
    const alpa = data?.filter(d => d.status === 'Alpa').length || 0;
    setAbsensiRekap({ Hadir: hadir, Izin: izin, Sakit: sakit, Alpa: alpa, total: data?.length || 0 });
  };

  const fetchNilai = async () => {
    const { data } = await supabase.from('nilai').select('*, mata_pelajaran(nama)')
      .eq('siswa_id', selectedAnak.id).eq('semester', 'Genap');
    setNilaiList(data || []);
  };

  const fetchPrestasi = async () => {
    const { data } = await supabase.from('prestasi').select('*')
      .eq('siswa_id', selectedAnak.id).order('tanggal', { ascending: false }).limit(3);
    setPrestasi(data || []);
  };

  const fetchPengumuman = async () => {
    const { data } = await supabase.from('pengumuman').select('*')
      .order('created_at', { ascending: false }).limit(3);
    setPengumuman(data || []);
  };

  const fetchChat = async () => {
    if (!userId) return;
    const { data } = await supabase.from('pesan_bantuan').select('*')
      .eq('orangtua_id', userId).order('created_at', { ascending: true });
    setChatList(data || []);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !userId) return;
    setSendingChat(true);
    await supabase.from('pesan_bantuan').insert({
      orangtua_id: userId, pengirim: 'orangtua', isi_pesan: chatInput.trim(), dibaca: false
    });
    setSendingChat(false);
    setChatInput('');
    fetchChat();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSaveNama = async () => {
    if (!namaInput.trim()) return;
    setSavingNama(true);
    await supabase.from('profiles').update({ full_name: namaInput.trim() }).eq('id', userId);
    setSavingNama(false);
    setNamaOrtu(namaInput.trim());
    setEditingNama(false);
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedAnak) return;
    if (file.size > 2 * 1024 * 1024) { alert('Maksimal 2MB!'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${selectedAnak.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('foto-siswa').upload(fileName, file, { upsert: true });
    if (error) { alert('Gagal upload: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('foto-siswa').getPublicUrl(fileName);
    await supabase.from('siswa').update({ foto_url: urlData.publicUrl }).eq('id', selectedAnak.id);
    setSelectedAnak({ ...selectedAnak, foto_url: urlData.publicUrl });
    setAnakList(anakList.map(a => a.id === selectedAnak.id ? { ...a, foto_url: urlData.publicUrl } : a));
    setUploading(false);
  };

  const rataRata = nilaiList.length > 0
    ? (nilaiList.reduce((a, b) => a + (b.nilai_akhir || 0), 0) / nilaiList.length).toFixed(1) : 0;
  const persen = absensiRekap.total > 0
    ? Math.round((absensiRekap.Hadir / absensiRekap.total) * 100) : 0;
  const pieData = [
    { name: 'Hadir', value: absensiRekap.Hadir, color: '#22C55E' },
    { name: 'Izin', value: absensiRekap.Izin, color: '#EAB308' },
    { name: 'Sakit', value: absensiRekap.Sakit, color: '#3B82F6' },
    { name: 'Alpa', value: absensiRekap.Alpa, color: '#EF4444' },
  ].filter(d => d.value > 0);
  const nilaiChartData = nilaiList.map(n => ({ name: n.mata_pelajaran?.nama?.substring(0, 5), nilai: n.nilai_akhir || 0 }));
  const tingkatMedal = { Sekolah: '🥉', Kecamatan: '🎖️', Kota: '🥈', Provinsi: '🥇', Nasional: '🏆' };
  const bob1 = Math.sin(frame * 0.4) * 1.5;
  const bob2 = Math.sin(frame * 0.4 + 2) * 1.5;

  const bottomNav = [
    { id: 'beranda', icon: <FiHome size={22} />, label: 'Beranda' },
    { id: 'absensi', icon: <FiCalendar size={22} />, label: 'Absensi' },
    { id: 'nilai', icon: <FiBook size={22} />, label: 'Nilai' },
    { id: 'pengumuman', icon: <FiBell size={22} />, label: 'Pengumuman' },
    { id: 'akun', icon: <FiUser size={22} />, label: 'Akun' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <div style={{ flex: 1, paddingBottom: '90px' }}>

        {activeTab === 'beranda' && (
          <div>
            <div className="bg-red-600 text-white px-5 pt-8 pb-2 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #CC0000 0%, #FF3333 60%, #CC0000 100%)' }}>
              <p className="text-red-200 text-sm">Halo,</p>
              <h1 className="text-xl font-bold">{namaOrtu || 'Orang Tua'} 👋</h1>
              <p className="text-red-100 text-xs mt-1 mb-3">Berikut perkembangan belajar anak Anda</p>
              <div style={{ position: 'relative', height: '56px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: 0, left: `${pos.a1}%`, transform: `translateY(${bob1}px)` }}><AnakSDMini /></div>
                <div style={{ position: 'absolute', bottom: 0, left: `${pos.a2}%`, transform: `translateY(${bob2}px)` }}><AnakSDPerempuanMini /></div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>

            <div className="px-4 pt-4 space-y-4">
              {selectedAnak && (
                <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                  <button type="button" onClick={() => setShowAnakModal(true)} style={{ position: 'relative', flexShrink: 0 }}>
                    {selectedAnak.foto_url
                      ? <img src={selectedAnak.foto_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                      : <div className="bg-red-100 text-red-600 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold">{selectedAnak.full_name?.charAt(0)}</div>}
                    <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#CC0000', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                      <FiCamera size={10} color="white" />
                    </div>
                  </button>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{selectedAnak.full_name}</p>
                    <p className="text-red-500 text-sm font-medium">{selectedAnak.kelas?.nama_kelas}</p>
                    <p className="text-gray-400 text-xs">NIS: {selectedAnak.nis}</p>
                  </div>
                  {anakList.length > 1 && (
                    <select onChange={e => setSelectedAnak(anakList.find(a => a.id === e.target.value))} className="text-xs border rounded-lg px-2 py-1 text-red-600">
                      {anakList.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>
                  )}
                </div>
              )}

              {!selectedAnak && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                  <p className="text-yellow-700 text-sm">⚠️ Data anak belum dihubungkan. Hubungi admin sekolah.</p>
                </div>
              )}

              {selectedAnak && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Kehadiran</p>
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14">
                        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22C55E" strokeWidth="3" strokeDasharray={`${persen} ${100 - persen}`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-600">{persen}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-800">{absensiRekap.Hadir}</p>
                        <p className="text-xs text-gray-400">dari {absensiRekap.total} hari</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Rata-rata Nilai</p>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-600">{rataRata}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{nilaiList.length} mapel</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {nilaiList.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3">📊 Grafik Nilai</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={nilaiChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="nilai" stroke="#CC0000" strokeWidth={2} dot={{ fill: '#CC0000', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {prestasi.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3">🏆 Prestasi Terbaru</h3>
                  {prestasi.map(p => (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className="text-2xl">{tingkatMedal[p.tingkat] || '🏆'}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{p.judul}</p>
                        <p className="text-xs text-gray-400">Tingkat {p.tingkat} • {p.tanggal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pengumuman.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">📢 Pengumuman</h3>
                    <button type="button" onClick={() => setActiveTab('pengumuman')} className="text-xs text-red-600 font-medium">Lihat Semua</button>
                  </div>
                  {pengumuman.map(p => (
                    <div key={p.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                      <span className="text-xl">{p.penting ? '🚨' : '📢'}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{p.judul}</p>
                        <p className="text-xs text-gray-400">{p.tanggal_tayang}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'absensi' && (
          <div>
            <div className="bg-red-600 text-white px-5 py-4"><h2 className="text-xl font-bold">Absensi</h2></div>
            <div className="p-4 space-y-4">
              {selectedAnak ? (
                <>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Ringkasan Absensi</h3>
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24">
                        {pieData.length > 0 ? (
                          <PieChart width={96} height={96}>
                            <Pie data={pieData} cx={44} cy={44} innerRadius={30} outerRadius={44} dataKey="value">
                              {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Pie>
                          </PieChart>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-gray-400 text-xs">Belum ada</span></div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {[{ label: 'Hadir', val: absensiRekap.Hadir, color: 'bg-green-500' }, { label: 'Izin', val: absensiRekap.Izin, color: 'bg-yellow-400' }, { label: 'Sakit', val: absensiRekap.Sakit, color: 'bg-blue-500' }, { label: 'Alpa', val: absensiRekap.Alpa, color: 'bg-red-500' }].map(item => (
                          <div key={item.label} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <span className="text-sm text-gray-600">{item.label}</span>
                            <span className="text-sm font-bold text-gray-800">{item.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <AbsensiDetail siswaId={selectedAnak.id} />
                </>
              ) : <div className="text-center py-10 text-gray-400"><p className="text-4xl mb-2">📋</p><p>Data anak belum tersedia</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'nilai' && (
          <div>
            <div className="bg-red-600 text-white px-5 py-4"><h2 className="text-xl font-bold">Nilai</h2></div>
            <div className="p-4 space-y-4">
              {nilaiList.length > 0 ? (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3">Nilai Mata Pelajaran</h3>
                  {nilaiList.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <p className="text-gray-700 font-medium">{item.mata_pelajaran?.nama}</p>
                      <span className="text-lg font-bold text-gray-800">{item.nilai_akhir || '-'}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-10 text-gray-400"><p className="text-4xl mb-2">📝</p><p>Belum ada data nilai</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'pengumuman' && (
          <div>
            <div className="bg-red-600 text-white px-5 py-4"><h2 className="text-xl font-bold">Pengumuman</h2></div>
            <div className="p-4 space-y-3">
              {pengumuman.length === 0
                ? <div className="text-center py-10 text-gray-400"><p className="text-4xl mb-2">📢</p><p>Belum ada pengumuman</p></div>
                : pengumuman.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${item.penting ? 'bg-red-100' : 'bg-purple-100'}`}>{item.penting ? '🚨' : '📢'}</div>
                      <div>
                        <p className="font-semibold text-gray-800">{item.judul}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.tanggal_tayang}</p>
                        <p className="text-sm text-gray-600 mt-2">{item.isi}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'akun' && (
          <div>
            <div className="bg-red-600 text-white px-5 py-4"><h2 className="text-xl font-bold">Akun</h2></div>
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button type="button" onClick={() => setShowProfilModal(true)} className="w-full flex items-center gap-4 px-4 py-4 border-b text-left">
                  <span className="text-2xl">👤</span>
                  <div className="flex-1"><p className="font-medium text-gray-800">Profil Orang Tua</p><p className="text-xs text-gray-400">{namaOrtu}</p></div>
                  <span className="text-gray-300">›</span>
                </button>
                <button type="button" onClick={() => setShowChatModal(true)} className="w-full flex items-center gap-4 px-4 py-4 border-b text-left">
                  <span className="text-2xl">💬</span>
                  <div className="flex-1"><p className="font-medium text-gray-800">Bantuan</p><p className="text-xs text-gray-400">Chat dengan admin sekolah</p></div>
                  <span className="text-gray-300">›</span>
                </button>
              </div>
              <button type="button" onClick={handleLogout} className="w-full bg-red-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2">
                <FiLogOut /> Keluar
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '512px', margin: '0 auto', background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', zIndex: 50 }}>
        {bottomNav.map(item => (
          <button key={item.id} type="button" onClick={() => setActiveTab(item.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition ${activeTab === item.id ? 'text-red-600' : 'text-gray-400'}`}>
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
            {activeTab === item.id && <div className="w-1 h-1 bg-red-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      {showProfilModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => { setShowProfilModal(false); setEditingNama(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Profil Orang Tua</h2>
              <button type="button" onClick={() => setShowProfilModal(false)}><FiX size={20} /></button>
            </div>
            <div className="text-center mb-4">
              <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">{namaOrtu?.charAt(0) || 'O'}</div>
              {editingNama ? (
                <div className="px-2">
                  <input value={namaInput} onChange={e => setNamaInput(e.target.value)} autoFocus className="w-full text-center px-3 py-2 border-2 border-red-300 rounded-xl focus:outline-none font-bold text-lg" />
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => setEditingNama(false)} className="flex-1 py-2 border rounded-xl text-gray-600 text-sm">Batal</button>
                    <button type="button" onClick={handleSaveNama} disabled={savingNama} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">{savingNama ? 'Menyimpan...' : 'Simpan'}</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-bold text-xl text-gray-800">{namaOrtu}</p>
                  <button type="button" onClick={() => { setNamaInput(namaOrtu); setEditingNama(true); }} className="text-xs text-red-600 font-semibold border border-red-200 rounded-full px-4 py-1.5 mt-2">✏️ Edit Nama</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAnakModal && selectedAnak && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowAnakModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Data Anak</h2>
              <button type="button" onClick={() => setShowAnakModal(false)}><FiX size={20} /></button>
            </div>
            <div className="text-center mb-4">
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', display: 'inline-block' }} disabled={uploading}>
                {selectedAnak.foto_url
                  ? <img src={selectedAnak.foto_url} alt="" className="w-24 h-24 rounded-full object-cover mx-auto" />
                  : <div className="bg-red-100 text-red-600 w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto">{selectedAnak.full_name?.charAt(0)}</div>}
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#CC0000', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white' }}>
                  <FiCamera size={14} color="white" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
              <p className="text-xs text-gray-400 mt-2">{uploading ? '⏳ Mengupload...' : 'Tap foto untuk mengubah'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Nama</span><span className="text-sm font-medium text-gray-800">{selectedAnak.full_name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">NIS</span><span className="text-sm font-medium text-gray-800">{selectedAnak.nis}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Kelas</span><span className="text-sm font-medium text-gray-800">{selectedAnak.kelas?.nama_kelas}</span></div>
            </div>
          </div>
        </div>
      )}

      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setShowChatModal(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg flex flex-col" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2"><FiMessageCircle size={20} /><h2 className="text-lg font-bold">Bantuan Admin</h2></div>
              <button type="button" onClick={() => setShowChatModal(false)}><FiX size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {chatList.length === 0
                ? <div className="text-center py-10 text-gray-400"><p className="text-4xl mb-2">💬</p><p className="text-sm">Belum ada percakapan</p></div>
                : chatList.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.pengirim === 'orangtua' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                    <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: '16px', background: msg.pengirim === 'orangtua' ? '#CC0000' : '#F3F4F6', color: msg.pengirim === 'orangtua' ? 'white' : '#1a1a1a' }}>
                      {msg.pengirim === 'admin' && <p className="text-xs font-bold text-red-600 mb-1">Admin Sekolah</p>}
                      <p className="text-sm">{msg.isi_pesan}</p>
                    </div>
                  </div>
                ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t p-3 flex items-center gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Tulis pesan..." className="flex-1 px-4 py-2.5 border rounded-full focus:outline-none text-sm" />
              <button type="button" onClick={handleSendChat} disabled={sendingChat || !chatInput.trim()} className="bg-red-600 text-white p-3 rounded-full disabled:opacity-50"><FiSend size={18} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AbsensiDetail({ siswaId }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    supabase.from('absensi').select('*').eq('siswa_id', siswaId).order('tanggal', { ascending: false }).limit(20).then(({ data }) => setList(data || []));
  }, [siswaId]);
  const statusStyle = { Hadir: 'bg-green-100 text-green-700', Izin: 'bg-yellow-100 text-yellow-700', Sakit: 'bg-blue-100 text-blue-700', Alpa: 'bg-red-100 text-red-700' };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-3">Riwayat Absensi</h3>
      {list.length === 0
        ? <p className="text-center text-gray-400 py-4">Belum ada data</p>
        : list.map(item => (
          <div key={item.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
            <p className="font-medium text-gray-800 text-sm">{item.tanggal}</p>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[item.status]}`}>{item.status}</span>
          </div>
        ))}
    </div>
  );
}