import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiHome, FiCalendar, FiBook, FiBell, FiUser, FiLogOut, FiX, FiCamera, FiSend, FiMessageCircle, FiBookOpen, FiChevronRight, FiShield, FiGlobe, FiMoon, FiPhone, FiMapPin, FiBriefcase, FiMail } from 'react-icons/fi';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardOrangtua() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [namaOrtu, setNamaOrtu] = useState('');
  const [emailOrtu, setEmailOrtu] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [userId, setUserId] = useState(null);
  const [anakList, setAnakList] = useState([]);
  const [selectedAnak, setSelectedAnak] = useState(null);
  const [absensiRekap, setAbsensiRekap] = useState({ Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, total: 0 });
  const [riwayatAbsensi, setRiwayatAbsensi] = useState([]);
  const [streak, setStreak] = useState(0);
  const [nilaiList, setNilaiList] = useState([]);
  const [prestasi, setPrestasi] = useState([]);
  const [pengumuman, setPengumuman] = useState([]);
  const [activeTab, setActiveTab] = useState('beranda');
  const [showAnakModal, setShowAnakModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilForm, setProfilForm] = useState({ full_name: '', no_hp: '', alamat: '', pekerjaan: '' });
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilError, setProfilError] = useState('');
  const [chatList, setChatList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifOn, setNotifOn] = useState(true);

  useEffect(() => { fetchProfile(); fetchPengumuman(); }, []);
  useEffect(() => { if (selectedAnak) { fetchAbsensi(); fetchNilai(); fetchPrestasi(); } }, [selectedAnak]); // eslint-disable-line

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
      const { data: profile } = await supabase.from('profiles')
        .select('full_name, email, no_hp, alamat, pekerjaan').eq('id', user.id).single();
      if (profile) {
        setNamaOrtu(profile.full_name || '');
        setEmailOrtu(profile.email || user.email || '');
        setNoHp(profile.no_hp || '');
        setAlamat(profile.alamat || '');
        setPekerjaan(profile.pekerjaan || '');
      } else {
        setEmailOrtu(user.email || '');
      }
      const { data: relasi } = await supabase.from('siswa_orangtua')
        .select('siswa(id, full_name, nis, foto_url, kelas(nama_kelas))').eq('orangtua_id', user.id);
      const anak = relasi?.map(r => r.siswa).filter(Boolean) || [];
      setAnakList(anak);
      if (anak.length > 0) setSelectedAnak(anak[0]);
    }
  };

  const fetchAbsensi = async () => {
    const { data } = await supabase.from('absensi').select('*')
      .eq('siswa_id', selectedAnak.id).order('tanggal', { ascending: false });
    const hadir = data?.filter(d => d.status === 'Hadir').length || 0;
    const izin = data?.filter(d => d.status === 'Izin').length || 0;
    const sakit = data?.filter(d => d.status === 'Sakit').length || 0;
    const alpa = data?.filter(d => d.status === 'Alpa').length || 0;
    setAbsensiRekap({ Hadir: hadir, Izin: izin, Sakit: sakit, Alpa: alpa, total: data?.length || 0 });
    setRiwayatAbsensi((data || []).slice(0, 20));

    let s = 0;
    for (const item of data || []) {
      if (item.status === 'Hadir') s++;
      else break;
    }
    setStreak(s);
  };

  const fetchNilai = async () => {
    const { data } = await supabase.from('nilai').select('*, mata_pelajaran(nama)')
      .eq('siswa_id', selectedAnak.id).order('created_at', { ascending: false });
    setNilaiList(data || []);
  };

  const fetchPrestasi = async () => {
    const { data } = await supabase.from('prestasi').select('*')
      .eq('siswa_id', selectedAnak.id).order('tanggal', { ascending: false }).limit(5);
    setPrestasi(data || []);
  };

  const fetchPengumuman = async () => {
    const { data } = await supabase.from('pengumuman').select('*')
      .order('created_at', { ascending: false }).limit(10);
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

  const openProfilModal = () => {
    setProfilForm({ full_name: namaOrtu, no_hp: noHp, alamat: alamat, pekerjaan: pekerjaan });
    setProfilError('');
    setShowProfilModal(true);
  };

  const handleSaveProfil = async () => {
    if (!profilForm.full_name.trim()) { setProfilError('Nama tidak boleh kosong.'); return; }
    if (!profilForm.no_hp.trim()) { setProfilError('Nomor HP/WhatsApp wajib diisi.'); return; }
    const phoneOk = /^[0-9+\s-]{8,15}$/.test(profilForm.no_hp.trim());
    if (!phoneOk) { setProfilError('Format nomor HP tidak valid.'); return; }

    setProfilError('');
    setSavingProfil(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profilForm.full_name.trim(),
      no_hp: profilForm.no_hp.trim(),
      alamat: profilForm.alamat.trim(),
      pekerjaan: profilForm.pekerjaan.trim(),
    }).eq('id', userId);
    setSavingProfil(false);

    if (error) { setProfilError('Gagal menyimpan: ' + error.message); return; }

    setNamaOrtu(profilForm.full_name.trim());
    setNoHp(profilForm.no_hp.trim());
    setAlamat(profilForm.alamat.trim());
    setPekerjaan(profilForm.pekerjaan.trim());
    setShowProfilModal(false);
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
  const nilaiTerbaru = nilaiList.length > 0 ? nilaiList[0].nilai_akhir : 0;
  const persen = absensiRekap.total > 0
    ? Math.round((absensiRekap.Hadir / absensiRekap.total) * 100) : 0;
  const pieData = [
    { name: 'Hadir', value: absensiRekap.Hadir, color: '#22C55E' },
    { name: 'Izin', value: absensiRekap.Izin, color: '#EAB308' },
    { name: 'Sakit', value: absensiRekap.Sakit, color: '#3B82F6' },
    { name: 'Alpa', value: absensiRekap.Alpa, color: '#EF4444' },
  ].filter(d => d.value > 0);
  const nilaiChartData = [...nilaiList].reverse().map(n => ({ name: n.mata_pelajaran?.nama?.substring(0, 5), nilai: n.nilai_akhir || 0 }));
  const tingkatMedal = { Sekolah: '🥉', Kecamatan: '🎖️', Kota: '🥈', Provinsi: '🥇', Nasional: '🏆' };

  const statusStyle = darkMode
    ? { Hadir: 'bg-green-900 text-green-300', Izin: 'bg-yellow-900 text-yellow-300', Sakit: 'bg-blue-900 text-blue-300', Alpa: 'bg-red-900 text-red-300' }
    : { Hadir: 'bg-green-100 text-green-700', Izin: 'bg-yellow-100 text-yellow-700', Sakit: 'bg-blue-100 text-blue-700', Alpa: 'bg-red-100 text-red-700' };

  const bottomNav = [
    { id: 'beranda', icon: <FiHome size={22} />, label: 'Beranda' },
    { id: 'absensi', icon: <FiCalendar size={22} />, label: 'Absensi' },
    { id: 'nilai', icon: <FiBook size={22} />, label: 'Nilai' },
    { id: 'pengumuman', icon: <FiBell size={22} />, label: 'Pengumuman' },
    { id: 'akun', icon: <FiUser size={22} />, label: 'Akun' },
  ];

  const headerGradient = { background: 'linear-gradient(135deg, #E11D2A 0%, #F97316 100%)' };

  const pageBg = darkMode ? 'bg-gray-950' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400';
  const textSub = darkMode ? 'text-gray-300' : 'text-gray-600';
  const navBg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const borderCol = darkMode ? 'border-gray-700' : 'border-gray-200';
  const dividerCol = darkMode ? 'divide-gray-700' : 'divide-gray-200';
  const inputCls = darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800';
  const trackBg = darkMode ? 'bg-gray-700' : 'bg-gray-100';
  const pillCls = darkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-white text-gray-600 border';
  const emptyCardCls = darkMode ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-400';

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col max-w-lg mx-auto transition-colors duration-300`}>
      <style>{`
        @keyframes runBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes legL { 0%,100% { transform: rotate(24deg); } 50% { transform: rotate(-24deg); } }
        @keyframes legR { 0%,100% { transform: rotate(-24deg); } 50% { transform: rotate(24deg); } }
        @keyframes armL { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(20deg); } }
        @keyframes armR { 0%,100% { transform: rotate(20deg); } 50% { transform: rotate(-20deg); } }
        .kid-run { animation: runBounce .55s ease-in-out infinite; }
        .kid-legL { transform-box: fill-box; transform-origin: 50% 0%; animation: legL .55s ease-in-out infinite; }
        .kid-legR { transform-box: fill-box; transform-origin: 50% 0%; animation: legR .55s ease-in-out infinite; }
        .kid-armL { transform-box: fill-box; transform-origin: 50% 0%; animation: armL .55s ease-in-out infinite; }
        .kid-armR { transform-box: fill-box; transform-origin: 50% 0%; animation: armR .55s ease-in-out infinite; }
      `}</style>

      <div style={{ flex: 1, paddingBottom: '90px' }}>

        {activeTab === 'beranda' && (
          <div>
            <div className="text-white px-5 pt-8 pb-8 relative overflow-hidden" style={headerGradient}>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-white text-opacity-80 text-sm">Halo,</p>
                  <h1 className="text-2xl font-bold">Orang Tua {selectedAnak?.full_name?.split(' ')[0] || ''}</h1>
                </div>
                <button type="button" onClick={() => setActiveTab('akun')}
                  className="bg-white bg-opacity-25 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {namaOrtu?.charAt(0)?.toUpperCase() || 'O'}
                </button>
              </div>

              {/* Animated running kid — siswa SD, seragam putih-merah, dasi, wajah, tangan & kaki nyambung */}
              <svg viewBox="0 0 100 112" width="100" height="112" className="kid-run absolute -bottom-2 right-4 z-0 opacity-95 pointer-events-none">
                {/* Kepala */}
                <circle cx="50" cy="18" r="12" fill="#F2C089" />
                <circle cx="38" cy="19" r="2.6" fill="#F2C089" />
                <circle cx="62" cy="19" r="2.6" fill="#F2C089" />
                {/* Rambut */}
                <path d="M37 13 Q50 1 63 13 Q62 19 57 15 Q50 11 43 15 Q38 19 37 13 Z" fill="#2B1B12" />
                {/* Wajah */}
                <circle cx="45" cy="19" r="1.5" fill="#2B1B12" />
                <circle cx="55" cy="19" r="1.5" fill="#2B1B12" />
                <circle cx="42" cy="23" r="1.8" fill="#F5A9A0" opacity="0.6" />
                <circle cx="58" cy="23" r="1.8" fill="#F5A9A0" opacity="0.6" />
                <path d="M45 25 Q50 28 55 25" stroke="#8B4513" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                {/* Leher */}
                <rect x="46" y="28" width="8" height="6" fill="#F2C089" />
                {/* Lengan kiri — nempel persis di bahu (y=34) */}
                <g className="kid-armL">
                  <rect x="27" y="34" width="9" height="21" rx="4.5" fill="#FFFFFF" stroke="#e5e5e5" />
                  <rect x="27" y="50" width="9" height="5" rx="2.5" fill="#DC2626" />
                  <circle cx="31.5" cy="57" r="4" fill="#F2C089" />
                </g>
                {/* Lengan kanan — nempel persis di bahu (y=34) */}
                <g className="kid-armR">
                  <rect x="64" y="34" width="9" height="21" rx="4.5" fill="#FFFFFF" stroke="#e5e5e5" />
                  <rect x="64" y="50" width="9" height="5" rx="2.5" fill="#DC2626" />
                  <circle cx="68.5" cy="57" r="4" fill="#F2C089" />
                </g>
                {/* Badan kemeja putih */}
                <rect x="35" y="34" width="30" height="24" rx="8" fill="#FFFFFF" stroke="#e5e5e5" />
                <path d="M42 34 L50 41 L58 34 Z" fill="#F3F4F6" stroke="#e5e5e5" />
                {/* Dasi merah */}
                <path d="M50 35 L46 42 L50 46 L54 42 Z" fill="#DC2626" />
                <rect x="48.3" y="46" width="3.4" height="12" fill="#DC2626" />
                {/* Celana merah — nyambung ke badan */}
                <rect x="35" y="55" width="30" height="18" rx="4" fill="#DC2626" />
                {/* Kaki kiri — nempel persis di pinggang (y=73) */}
                <g className="kid-legL">
                  <rect x="39" y="73" width="9" height="24" rx="4.5" fill="#F2C089" />
                  <rect x="37" y="94" width="13" height="7" rx="3.5" fill="#1F2937" />
                </g>
                {/* Kaki kanan — nempel persis di pinggang (y=73) */}
                <g className="kid-legR">
                  <rect x="52" y="73" width="9" height="24" rx="4.5" fill="#F2C089" />
                  <rect x="50" y="94" width="13" height="7" rx="3.5" fill="#1F2937" />
                </g>
              </svg>
            </div>

            <div className="px-4 -mt-5 space-y-4">
              {selectedAnak ? (
                <div className={`${cardBg} rounded-2xl p-4 shadow-md grid grid-cols-4 divide-x ${dividerCol}`}>
                  <div className="text-center px-1">
                    <p className="text-2xl">🔥</p>
                    <p className={`font-bold ${textMain} mt-1`}>{streak}</p>
                    <p className={`text-xs ${textMuted}`}>Beruntun</p>
                  </div>
                  <div className="text-center px-1">
                    <p className="text-2xl">🏅</p>
                    <p className={`font-bold ${textMain} mt-1`}>{nilaiTerbaru || '-'}</p>
                    <p className={`text-xs ${textMuted}`}>Nilai terbaru</p>
                  </div>
                  <div className="text-center px-1">
                    <p className="text-2xl">📊</p>
                    <p className={`font-bold ${textMain} mt-1`}>{rataRata > 0 ? rataRata : '-'}</p>
                    <p className={`text-xs ${textMuted}`}>Rata-rata</p>
                  </div>
                  <div className="text-center px-1">
                    <p className="text-2xl">📣</p>
                    <p className={`font-bold ${textMain} mt-1`}>{pengumuman.length}</p>
                    <p className={`text-xs ${textMuted}`}>Pengumuman</p>
                  </div>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-yellow-950 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} border rounded-2xl p-4 text-center`}>
                  <p className={`${darkMode ? 'text-yellow-400' : 'text-yellow-700'} text-sm`}>⚠️ Data anak belum dihubungkan. Hubungi admin sekolah.</p>
                </div>
              )}

              {anakList.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {anakList.map(a => (
                    <button key={a.id} type="button" onClick={() => setSelectedAnak(a)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold flex-shrink-0 ${selectedAnak?.id === a.id ? 'bg-red-600 text-white' : pillCls}`}>
                      {a.full_name}
                    </button>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => navigate('/orangtua/materi')}
                className={`w-full ${cardBg} rounded-2xl p-4 shadow-sm flex items-center gap-4 text-left`}>
                <div style={{ background: darkMode ? '#3A1414' : '#FFF0F0', color: darkMode ? '#FF6B6B' : '#CC0000', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiBookOpen size={22} />
                </div>
                <div className="flex-1">
                  <p className={`font-bold ${textMain}`}>Materi Harian</p>
                  <p className={`text-xs ${textMuted}`}>Lihat materi yang diajarkan hari ini</p>
                </div>
                <FiChevronRight className={textMuted} size={20} />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setActiveTab('absensi')} className={`${cardBg} rounded-2xl p-4 shadow-sm text-left`}>
                  <FiCalendar className="text-red-600 mb-2" size={20} />
                  <p className={`font-bold ${textMain}`}>Absensi</p>
                  <p className={`text-xs ${textMuted}`}>{persen}% hadir</p>
                </button>
                <button type="button" onClick={() => setActiveTab('nilai')} className={`${cardBg} rounded-2xl p-4 shadow-sm text-left`}>
                  <FiBook className="text-red-600 mb-2" size={20} />
                  <p className={`font-bold ${textMain}`}>Nilai</p>
                  <p className={`text-xs ${textMuted}`}>{nilaiList.length} mapel tercatat</p>
                </button>
              </div>

              {nilaiChartData.length > 0 && (
                <div className={`${cardBg} rounded-2xl p-4 shadow-sm`}>
                  <h3 className={`font-bold ${textMain} mb-3`}>📊 Grafik Nilai</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={nilaiChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#374151' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#374151' }} />
                      <Tooltip contentStyle={darkMode ? { background: '#1f2937', border: 'none', color: '#f3f4f6' } : undefined} />
                      <Line type="monotone" dataKey="nilai" stroke="#E11D2A" strokeWidth={2} dot={{ fill: '#E11D2A', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {prestasi.length > 0 && (
                <div className={`${cardBg} rounded-2xl p-4 shadow-sm`}>
                  <h3 className={`font-bold ${textMain} mb-3`}>🏆 Prestasi Terbaru</h3>
                  {prestasi.map(p => (
                    <div key={p.id} className={`flex items-center gap-3 py-2 border-b ${borderCol} last:border-0`}>
                      <span className="text-2xl">{tingkatMedal[p.tingkat] || '🏆'}</span>
                      <div>
                        <p className={`font-semibold ${textMain} text-sm`}>{p.judul}</p>
                        <p className={`text-xs ${textMuted}`}>Tingkat {p.tingkat} • {p.tanggal}</p>
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
            <div className="text-white px-5 pt-8 pb-8" style={headerGradient}>
              <p className="text-white text-opacity-80 text-sm">Kehadiran</p>
              <h2 className="text-2xl font-bold">Absensi</h2>
            </div>
            <div className="px-4 -mt-5 space-y-4">
              {selectedAnak ? (
                <>
                  <div className={`${cardBg} rounded-2xl p-4 shadow-md flex items-center gap-6`}>
                    <div className="relative w-24 h-24 flex-shrink-0">
                      {pieData.length > 0 ? (
                        <PieChart width={96} height={96}>
                          <Pie data={pieData} cx={44} cy={44} innerRadius={30} outerRadius={44} dataKey="value">
                            {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      ) : (
                        <div className={`w-24 h-24 rounded-full ${trackBg} flex items-center justify-center`}><span className={`${textMuted} text-xs`}>Belum ada</span></div>
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-lg font-bold ${textMain}`}>{persen}%</span>
                        <span className={`text-xs ${textMuted}`}>hadir</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[{ label: 'Hadir', val: absensiRekap.Hadir, color: 'bg-green-500' }, { label: 'Izin', val: absensiRekap.Izin, color: 'bg-yellow-400' }, { label: 'Sakit', val: absensiRekap.Sakit, color: 'bg-blue-500' }, { label: 'Alpa', val: absensiRekap.Alpa, color: 'bg-red-500' }].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className={`text-sm ${textSub}`}>{item.label}</span>
                          <span className={`text-sm font-bold ${textMain}`}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {streak > 0 && (
                    <div className={`${darkMode ? 'bg-orange-950 border-orange-900' : 'bg-orange-50 border-orange-100'} border rounded-2xl p-4 flex items-center gap-3`}>
                      <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-100'} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>🔥</div>
                      <div>
                        <p className={`font-bold ${textMain}`}>{streak} hari beruntun hadir!</p>
                        <p className={`text-xs ${textMuted}`}>Pertahankan agar terus bertambah</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className={`text-xs font-bold ${textMuted} mb-2 uppercase tracking-wide`}>Riwayat Absensi</p>
                    <div className="space-y-2">
                      {riwayatAbsensi.length === 0 ? (
                        <p className={`text-center ${emptyCardCls} py-6 text-sm rounded-2xl`}>Belum ada data</p>
                      ) : riwayatAbsensi.map(item => (
                        <div key={item.id} className={`${cardBg} rounded-2xl p-3 flex items-center justify-between shadow-sm`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-8 rounded-full ${item.status === 'Hadir' ? 'bg-green-500' : item.status === 'Izin' ? 'bg-yellow-400' : item.status === 'Sakit' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                            <p className={`font-medium ${textMain} text-sm`}>{item.tanggal}</p>
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[item.status]}`}>{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : <div className={`text-center py-10 ${textMuted}`}><p className="text-4xl mb-2">📋</p><p>Data anak belum tersedia</p></div>}
            </div>
          </div>
        )}

        {activeTab === 'nilai' && (
          <div>
            <div className="text-white px-5 pt-8 pb-8" style={headerGradient}>
              <p className="text-white text-opacity-80 text-sm">Rapor Digital</p>
              <h2 className="text-2xl font-bold">Nilai</h2>
            </div>
            <div className="px-4 -mt-5 space-y-3">
              {nilaiChartData.length > 0 && (
                <div className={`${cardBg} rounded-2xl p-4 shadow-sm mb-3`}>
                  <h3 className={`font-bold ${textMain} mb-3`}>📊 Grafik Nilai</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={nilaiChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#374151' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: darkMode ? '#9CA3AF' : '#374151' }} />
                      <Tooltip contentStyle={darkMode ? { background: '#1f2937', border: 'none', color: '#f3f4f6' } : undefined} />
                      <Line type="monotone" dataKey="nilai" stroke="#E11D2A" strokeWidth={2} dot={{ fill: '#E11D2A', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <p className={`text-xs font-bold ${textMuted} mb-1 uppercase tracking-wide px-1`}>Nilai Mata Pelajaran</p>
              {nilaiList.length > 0 ? (
                nilaiList.map(item => {
                  const nilai = item.nilai_akhir || 0;
                  return (
                    <div key={item.id} className={`${cardBg} rounded-2xl p-4 shadow-sm`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`font-semibold ${textMain} flex items-center gap-2`}>🎓 {item.mata_pelajaran?.nama}</p>
                        <span className="text-lg font-bold text-red-600">{nilai || '-'}</span>
                      </div>
                      <div className={`w-full h-2 ${trackBg} rounded-full overflow-hidden`}>
                        <div className="h-full rounded-full" style={{ width: `${nilai}%`, background: 'linear-gradient(90deg, #E11D2A, #F97316)' }}></div>
                      </div>
                    </div>
                  );
                })
              ) : <div className={`text-center py-10 ${textMuted} ${cardBg} rounded-2xl`}><p className="text-4xl mb-2">📝</p><p>Belum ada data nilai</p></div>}
              {rataRata > 0 && (
                <div className={`${cardBg} rounded-2xl p-4 shadow-sm flex items-center justify-between`}>
                  <p className={`font-semibold ${textSub}`}>Rata-rata Nilai</p>
                  <p className="text-xl font-bold text-red-600">{rataRata}</p>
                </div>
              )}

              {prestasi.length > 0 && (
                <div className={`${cardBg} rounded-2xl p-4 shadow-sm`}>
                  <h3 className={`font-bold ${textMain} mb-3`}>🏆 Prestasi</h3>
                  {prestasi.map(p => (
                    <div key={p.id} className={`flex items-center gap-3 py-2 border-b ${borderCol} last:border-0`}>
                      <span className="text-2xl">{tingkatMedal[p.tingkat] || '🏆'}</span>
                      <div>
                        <p className={`font-semibold ${textMain} text-sm`}>{p.judul}</p>
                        <p className={`text-xs ${textMuted}`}>Tingkat {p.tingkat} • {p.tanggal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pengumuman' && (
          <div>
            <div className="text-white px-5 pt-8 pb-8" style={headerGradient}>
              <p className="text-white text-opacity-80 text-sm">Info Sekolah</p>
              <h2 className="text-2xl font-bold">Pengumuman</h2>
            </div>
            <div className="px-4 -mt-5 space-y-3">
              {pengumuman.length === 0
                ? <div className={`text-center py-10 ${textMuted} ${cardBg} rounded-2xl`}><p className="text-4xl mb-2">📢</p><p>Belum ada pengumuman</p></div>
                : pengumuman.map(item => (
                  <div key={item.id} className={`${cardBg} rounded-2xl p-4 shadow-sm flex items-center gap-3`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${item.penting ? (darkMode ? 'bg-red-950' : 'bg-red-100') : (darkMode ? 'bg-orange-950' : 'bg-orange-50')}`}>📣</div>
                    <div className="flex-1">
                      <p className={`font-semibold ${textMain}`}>{item.judul}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.penting ? (darkMode ? 'bg-red-950 text-red-400' : 'bg-red-100 text-red-600') : (darkMode ? 'bg-orange-950 text-orange-400' : 'bg-orange-50 text-orange-600')}`}>
                          {item.penting ? 'Penting' : 'Info'}
                        </span>
                        <span className={`text-xs ${textMuted}`}>{item.tanggal_tayang}</span>
                      </div>
                      <p className={`text-sm ${textSub} mt-2`}>{item.isi}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'akun' && (
          <div>
            <div className="text-white px-5 pt-8 pb-10" style={headerGradient}>
              <p className="text-white text-opacity-80 text-sm">Akun</p>
              <h2 className="text-2xl font-bold">Pengaturan & Profil</h2>
            </div>
            <div className="px-4 -mt-6 space-y-4">
              <div className={`${cardBg} rounded-2xl p-4 shadow-md flex items-center gap-4`}>
                <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {namaOrtu?.charAt(0)?.toUpperCase() || 'O'}
                </div>
                <div className="flex-1">
                  <p className={`font-bold ${textMain}`}>{namaOrtu || 'Orang Tua Siswa'}</p>
                  <p className={`text-sm ${textMuted}`}>Wali dari <span className="text-red-600 font-medium">{selectedAnak?.full_name}</span> · {selectedAnak?.kelas?.nama_kelas}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs ${darkMode ? 'bg-green-950 text-green-400' : 'bg-green-100 text-green-700'} px-2 py-0.5 rounded-full font-medium`}>✓ Terverifikasi</span>
                    <span className={`text-xs ${textMuted}`}>NIS: {selectedAnak?.nis}</span>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} rounded-2xl shadow-sm overflow-hidden`}>
                <div className={`flex items-center gap-3 px-4 py-3 border-b ${borderCol}`}>
                  <FiMail className={textMuted} size={16} />
                  <p className={`text-sm ${textSub} flex-1 truncate`}>{emailOrtu || '-'}</p>
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 border-b ${borderCol}`}>
                  <FiPhone className={textMuted} size={16} />
                  <p className={`text-sm ${textSub} flex-1`}>{noHp || 'Belum diisi'}</p>
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 border-b ${borderCol}`}>
                  <FiMapPin className={textMuted} size={16} />
                  <p className={`text-sm ${textSub} flex-1`}>{alamat || 'Belum diisi'}</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <FiBriefcase className={textMuted} size={16} />
                  <p className={`text-sm ${textSub} flex-1`}>{pekerjaan || 'Belum diisi'}</p>
                </div>
              </div>

              <div>
                <p className={`text-xs font-bold ${textMuted} mb-2 uppercase tracking-wide px-1`}>Preferensi</p>
                <div className={`${cardBg} rounded-2xl shadow-sm overflow-hidden`}>
                  <div className={`flex items-center justify-between px-4 py-4 border-b ${borderCol}`}>
                    <div className="flex items-center gap-3">
                      <FiMoon className="text-red-600" size={18} />
                      <div>
                        <p className={`font-medium ${textMain} text-sm`}>Mode Gelap</p>
                        <p className={`text-xs ${textMuted}`}>{darkMode ? 'Aktif' : 'Nonaktif'}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setDarkMode(!darkMode)}
                      className={`w-11 h-6 rounded-full transition relative ${darkMode ? 'bg-red-600' : 'bg-gray-300'}`}>
                      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: darkMode ? '22px' : '2px' }}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                      <FiBell className="text-red-600" size={18} />
                      <div>
                        <p className={`font-medium ${textMain} text-sm`}>Notifikasi Pengumuman</p>
                        <p className={`text-xs ${textMuted}`}>Dapat pemberitahuan real-time</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setNotifOn(!notifOn)}
                      className={`w-11 h-6 rounded-full transition relative ${notifOn ? 'bg-red-600' : 'bg-gray-300'}`}>
                      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: notifOn ? '22px' : '2px' }}></span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className={`text-xs font-bold ${textMuted} mb-2 uppercase tracking-wide px-1`}>Akun</p>
                <div className={`${cardBg} rounded-2xl shadow-sm overflow-hidden`}>
                  <button type="button" onClick={openProfilModal}
                    className={`w-full flex items-center gap-3 px-4 py-4 border-b ${borderCol} text-left`}>
                    <FiUser className="text-red-600" size={18} />
                    <div className="flex-1">
                      <p className={`font-medium ${textMain} text-sm`}>Profil Orang Tua</p>
                      <p className={`text-xs ${textMuted}`}>Kelola data diri & kontak</p>
                    </div>
                    <FiChevronRight className={textMuted} size={18} />
                  </button>
                  <button type="button" onClick={() => setShowChatModal(true)}
                    className={`w-full flex items-center gap-3 px-4 py-4 border-b ${borderCol} text-left`}>
                    <FiShield className="text-red-600" size={18} />
                    <div className="flex-1">
                      <p className={`font-medium ${textMain} text-sm`}>Bantuan</p>
                      <p className={`text-xs ${textMuted}`}>Chat dengan admin sekolah</p>
                    </div>
                    <FiChevronRight className={textMuted} size={18} />
                  </button>
                  <button type="button" onClick={() => setShowAnakModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left">
                    <FiGlobe className="text-red-600" size={18} />
                    <div className="flex-1">
                      <p className={`font-medium ${textMain} text-sm`}>Data Anak</p>
                      <p className={`text-xs ${textMuted}`}>Lihat & ubah foto anak</p>
                    </div>
                    <FiChevronRight className={textMuted} size={18} />
                  </button>
                </div>
              </div>

              <button type="button" onClick={handleLogout} className="w-full bg-red-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2">
                <FiLogOut /> Keluar
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '512px', margin: '0 auto', borderTop: '1px solid', display: 'flex', zIndex: 50 }}
        className={navBg}>
        {bottomNav.map(item => (
          <button key={item.id} type="button" onClick={() => setActiveTab(item.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition ${activeTab === item.id ? 'text-red-600' : textMuted}`}>
            <div className="relative">
              {item.icon}
              {item.id === 'pengumuman' && pengumuman.some(p => p.penting) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
            {activeTab === item.id && <div className="w-1 h-1 bg-red-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      {showAnakModal && selectedAnak && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowAnakModal(false)}>
          <div className={`${cardBg} rounded-2xl p-6 w-full max-w-sm`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${textMain}`}>Data Anak</h2>
              <button type="button" onClick={() => setShowAnakModal(false)}><FiX size={20} className={textSub} /></button>
            </div>
            <div className="text-center mb-4">
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', display: 'inline-block' }} disabled={uploading}>
                {selectedAnak.foto_url
                  ? <img src={selectedAnak.foto_url} alt="" className="w-24 h-24 rounded-full object-cover mx-auto" />
                  : <div className={`${darkMode ? 'bg-red-950 text-red-400' : 'bg-red-100 text-red-600'} w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto`}>{selectedAnak.full_name?.charAt(0)}</div>}
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#CC0000', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white' }}>
                  <FiCamera size={14} color="white" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
              <p className={`text-xs ${textMuted} mt-2`}>{uploading ? '⏳ Mengupload...' : 'Tap foto untuk mengubah'}</p>
            </div>
            <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-xl p-4 space-y-2`}>
              <div className="flex justify-between"><span className={`text-sm ${textMuted}`}>Nama</span><span className={`text-sm font-medium ${textMain}`}>{selectedAnak.full_name}</span></div>
              <div className="flex justify-between"><span className={`text-sm ${textMuted}`}>NIS</span><span className={`text-sm font-medium ${textMain}`}>{selectedAnak.nis}</span></div>
              <div className="flex justify-between"><span className={`text-sm ${textMuted}`}>Kelas</span><span className={`text-sm font-medium ${textMain}`}>{selectedAnak.kelas?.nama_kelas}</span></div>
            </div>
          </div>
        </div>
      )}

      {showProfilModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setShowProfilModal(false)}>
          <div className={`${cardBg} rounded-t-2xl w-full max-w-lg flex flex-col`} style={{ maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>
            <div className="text-white px-5 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0" style={headerGradient}>
              <div className="flex items-center gap-2"><FiUser size={20} /><h2 className="text-lg font-bold">Profil Orang Tua</h2></div>
              <button type="button" onClick={() => setShowProfilModal(false)}><FiX size={20} /></button>
            </div>

            <div style={{ overflowY: 'auto' }} className="p-5 space-y-4">
              <div>
                <label className={`text-xs font-bold ${textMuted} uppercase tracking-wide`}>Nama Lengkap</label>
                <input
                  value={profilForm.full_name}
                  onChange={e => setProfilForm({ ...profilForm, full_name: e.target.value })}
                  placeholder="Nama lengkap sesuai KTP"
                  className={`w-full mt-1.5 px-4 py-3 border rounded-xl focus:outline-none focus:border-red-500 text-sm ${inputCls}`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold ${textMuted} uppercase tracking-wide`}>Email</label>
                <input
                  value={emailOrtu}
                  disabled
                  className={`w-full mt-1.5 px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                />
                <p className={`text-xs ${textMuted} mt-1`}>Email tidak dapat diubah dari sini.</p>
              </div>

              <div>
                <label className={`text-xs font-bold ${textMuted} uppercase tracking-wide`}>No. HP / WhatsApp</label>
                <input
                  value={profilForm.no_hp}
                  onChange={e => setProfilForm({ ...profilForm, no_hp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                  className={`w-full mt-1.5 px-4 py-3 border rounded-xl focus:outline-none focus:border-red-500 text-sm ${inputCls}`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold ${textMuted} uppercase tracking-wide`}>Alamat</label>
                <textarea
                  value={profilForm.alamat}
                  onChange={e => setProfilForm({ ...profilForm, alamat: e.target.value })}
                  placeholder="Alamat lengkap rumah"
                  rows={3}
                  className={`w-full mt-1.5 px-4 py-3 border rounded-xl focus:outline-none focus:border-red-500 text-sm resize-none ${inputCls}`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold ${textMuted} uppercase tracking-wide`}>Pekerjaan <span className="normal-case font-normal">(opsional)</span></label>
                <input
                  value={profilForm.pekerjaan}
                  onChange={e => setProfilForm({ ...profilForm, pekerjaan: e.target.value })}
                  placeholder="Contoh: Wiraswasta"
                  className={`w-full mt-1.5 px-4 py-3 border rounded-xl focus:outline-none focus:border-red-500 text-sm ${inputCls}`}
                />
              </div>

              {profilError && (
                <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'} font-medium`}>{profilError}</p>
              )}
            </div>

            <div className={`p-4 border-t ${borderCol} flex gap-3 flex-shrink-0`}>
              <button type="button" onClick={() => setShowProfilModal(false)}
                className={`flex-1 py-3 rounded-xl font-semibold border ${borderCol} ${textSub}`}>
                Batal
              </button>
              <button type="button" onClick={handleSaveProfil} disabled={savingProfil}
                className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white disabled:opacity-50">
                {savingProfil ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setShowChatModal(false)}>
          <div className={`${cardBg} rounded-t-2xl w-full max-w-lg flex flex-col`} style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="text-white px-5 py-4 rounded-t-2xl flex items-center justify-between" style={headerGradient}>
              <div className="flex items-center gap-2"><FiMessageCircle size={20} /><h2 className="text-lg font-bold">Bantuan Admin</h2></div>
              <button type="button" onClick={() => setShowChatModal(false)}><FiX size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {chatList.length === 0
                ? <div className={`text-center py-10 ${textMuted}`}><p className="text-4xl mb-2">💬</p><p className="text-sm">Belum ada percakapan</p></div>
                : chatList.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.pengirim === 'orangtua' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                    <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: '16px', background: msg.pengirim === 'orangtua' ? '#E11D2A' : (darkMode ? '#374151' : '#F3F4F6'), color: msg.pengirim === 'orangtua' ? 'white' : (darkMode ? '#F3F4F6' : '#1a1a1a') }}>
                      {msg.pengirim === 'admin' && <p className="text-xs font-bold text-red-500 mb-1">Admin Sekolah</p>}
                      <p className="text-sm">{msg.isi_pesan}</p>
                    </div>
                  </div>
                ))}
              <div ref={chatEndRef} />
            </div>
            <div className={`border-t ${borderCol} p-3 flex items-center gap-2`}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Tulis pesan..."
                className={`flex-1 px-4 py-2.5 border rounded-full focus:outline-none text-sm ${inputCls}`} />
              <button type="button" onClick={handleSendChat} disabled={sendingChat || !chatInput.trim()} className="bg-red-600 text-white p-3 rounded-full disabled:opacity-50"><FiSend size={18} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}