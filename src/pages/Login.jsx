import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiKey, FiCalendar, FiDownload, FiX } from 'react-icons/fi';

const KODE_GURU   = 'GURU2024';
const KODE_KEPSEK = 'KEPSEK2024';

// ── Install Button (inline) ───────────────────────────────────────────────────
function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton]         = useState(false);
  const [dismissed, setDismissed]           = useState(false);

  useEffect(() => {
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (alreadyInstalled) return;
    const wasDismissed = localStorage.getItem('installPromptDismissed');
    if (wasDismissed) setDismissed(true);
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const handleAppInstalled = () => { setShowButton(false); setDeferredPrompt(null); };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowButton(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowButton(false);
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showButton || dismissed) return null;

  return (
    <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm flex items-center gap-3 mb-4">
      <div style={{ background: '#FFF0F0', color: '#CC0000', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FiDownload size={20} />
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-800 text-sm">Install Aplikasi SIAP</p>
        <p className="text-xs text-gray-400">Akses lebih cepat langsung dari layar utama HP</p>
      </div>
      <button type="button" onClick={handleInstallClick}
        className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full flex-shrink-0">
        Install
      </button>
      <button type="button" onClick={handleDismiss} className="text-gray-300 flex-shrink-0">
        <FiX size={18} />
      </button>
    </div>
  );
}

// ── Ilustrasi anak-anak ───────────────────────────────────────────────────────
function AnakLaki({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="15" cy="10" r="9" fill="#FDBCB4" />
      <ellipse cx="15" cy="4" rx="9" ry="5" fill="#2C1810" />
      <circle cx="6"  cy="10" r="2.5" fill="#FDBCB4" />
      <circle cx="24" cy="10" r="2.5" fill="#FDBCB4" />
      <circle cx="11" cy="10" r="1.5" fill="#1a1a1a" />
      <circle cx="19" cy="10" r="1.5" fill="#1a1a1a" />
      <circle cx="11.5" cy="9.5" r="0.5" fill="white" />
      <circle cx="19.5" cy="9.5" r="0.5" fill="white" />
      <path d="M 10 14 Q 15 17 20 14" stroke="#c0846a" strokeWidth="1" fill="none" strokeLinecap="round" />
      <rect x="12" y="18" width="6"  height="4"  fill="#FDBCB4" />
      <rect x="6"  y="22" width="18" height="18" rx="2" fill="white" />
      <line x1="15" y1="22" x2="15" y2="40" stroke="#ddd" strokeWidth="0.5" />
      <polygon points="15,22 11,26 15,28" fill="#CC0000" />
      <polygon points="15,22 19,26 15,28" fill="#CC0000" />
      <rect x="0"  y="22" width="6" height="12" rx="3" fill="white" />
      <rect x="24" y="22" width="6" height="12" rx="3" fill="white" />
      <circle cx="3"  cy="35" r="3" fill="#FDBCB4" />
      <circle cx="27" cy="35" r="3" fill="#FDBCB4" />
      <rect x="6"  y="39" width="8" height="16" rx="2" fill="#CC0000" />
      <rect x="16" y="39" width="8" height="16" rx="2" fill="#CC0000" />
      <rect x="13" y="39" width="4" height="3"  fill="#AA0000" />
      <rect x="7"  y="54" width="6" height="5"  rx="1" fill="white" />
      <rect x="17" y="54" width="6" height="5"  rx="1" fill="white" />
      <ellipse cx="10" cy="60" rx="7" ry="3.5" fill="#1a1a1a" />
      <ellipse cx="20" cy="60" rx="7" ry="3.5" fill="#1a1a1a" />
    </g>
  );
}

function AnakPerempuan({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="15" cy="10" r="9" fill="#FDBCB4" />
      <ellipse cx="15" cy="5" rx="10" ry="6" fill="#2C1810" />
      <rect x="5"  y="6" width="4" height="20" rx="2" fill="#2C1810" />
      <rect x="21" y="6" width="4" height="20" rx="2" fill="#2C1810" />
      <ellipse cx="10" cy="3" rx="5" ry="3" fill="#CC0000" />
      <ellipse cx="20" cy="3" rx="5" ry="3" fill="#CC0000" />
      <circle cx="15" cy="3" r="2" fill="#AA0000" />
      <circle cx="6"  cy="10" r="2.5" fill="#FDBCB4" />
      <circle cx="24" cy="10" r="2.5" fill="#FDBCB4" />
      <circle cx="11" cy="10" r="1.5" fill="#1a1a1a" />
      <circle cx="19" cy="10" r="1.5" fill="#1a1a1a" />
      <path d="M 10 14 Q 15 18 20 14" stroke="#c0846a" strokeWidth="1" fill="none" strokeLinecap="round" />
      <rect x="12" y="18" width="6"  height="4"  fill="#FDBCB4" />
      <rect x="6"  y="22" width="18" height="16" rx="2" fill="white" />
      <polygon points="15,22 11,26 15,28" fill="#CC0000" />
      <polygon points="15,22 19,26 15,28" fill="#CC0000" />
      <rect x="0"  y="22" width="6" height="10" rx="3" fill="white" />
      <rect x="24" y="22" width="6" height="10" rx="3" fill="white" />
      <path d="M 5 37 L 25 37 L 28 55 L 2 55 Z" fill="#CC0000" />
      <rect x="6"  y="54" width="7" height="7" rx="1" fill="white" />
      <rect x="17" y="54" width="7" height="7" rx="1" fill="white" />
      <ellipse cx="9.5"  cy="62" rx="6" ry="3" fill="#1a1a1a" />
      <ellipse cx="20.5" cy="62" rx="6" ry="3" fill="#1a1a1a" />
    </g>
  );
}

function LoginScene({ frame, pos }) {
  const bob1 = Math.sin(frame * 0.4)     * 2;
  const bob2 = Math.sin(frame * 0.4 + 2) * 2;
  const bob3 = Math.sin(frame * 0.4 + 4) * 2;
  return (
    <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="120" fill="transparent" />
      <rect x="0" y="90" width="400" height="30" fill="#8B7355" />
      <rect x="0" y="88" width="400" height="4"  fill="#A0896B" />
      <ellipse cx="0"   cy="88" rx="30" ry="8" fill="#2D8A2D" />
      <ellipse cx="400" cy="88" rx="30" ry="8" fill="#2D8A2D" />
      <rect x="350" y="60" width="6" height="30" fill="#5C3D1E" />
      <circle cx="353" cy="55" r="18" fill="#2D7A2D" />
      <rect x="30" y="65" width="5" height="25" fill="#5C3D1E" />
      <circle cx="32" cy="60" r="15" fill="#3D9A3D" />
      <g transform={`translate(${pos.a1}, ${25 + bob1})`}><AnakLaki      x={0} y={0} /></g>
      <g transform={`translate(${pos.a2}, ${22 + bob2})`}><AnakPerempuan x={0} y={0} /></g>
      <g transform={`translate(${pos.a3 + 30}, ${25 + bob3}) scale(-1, 1)`}><AnakLaki x={0} y={0} /></g>
    </svg>
  );
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode]           = useState('login');
  const [tipeAkun, setTipeAkun]   = useState('orangtua');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [nama, setNama]           = useState('');
  const [nisAnak, setNisAnak]     = useState('');
  const [hubungan, setHubungan]   = useState('Ayah');
  const [kodeAkses, setKodeAkses] = useState('');
  const [daftarKelas, setDaftarKelas]           = useState([]);
  const [kelasDipilih, setKelasDipilih]         = useState('');
  const [tahunAjaranList, setTahunAjaranList]   = useState([]);
  const [tahunAjaranAktif, setTahunAjaranAktif] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [frame, setFrame] = useState(0);
  const [pos, setPos]     = useState({ a1: 20, a2: 160, a3: 290 });

  // Animasi
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(f => f + 1);
      setPos(p => ({
        a1: p.a1 >= 380 ? -40 : p.a1 + 1.5,
        a2: p.a2 >= 380 ? -40 : p.a2 + 1.0,
        a3: p.a3 >= 380 ? -40 : p.a3 + 1.8,
      }));
    }, 60);
    return () => clearInterval(timer);
  }, []);

  // Fetch tahun ajaran
  useEffect(() => { fetchTahunAjaran(); }, []);

  const fetchTahunAjaran = async () => {
    const { data } = await supabase.from('tahun_ajaran').select('id, nama, aktif').order('nama', { ascending: false });
    if (data) {
      setTahunAjaranList(data);
      const aktif = data.find(t => t.aktif);
      if (aktif) setTahunAjaranAktif(aktif.id);
    }
  };

  // Fetch kelas saat mode daftar guru
  useEffect(() => {
    if (tipeAkun === 'guru' && mode === 'daftar') fetchKelas();
  }, [tipeAkun, mode, tahunAjaranAktif]); // eslint-disable-line

  const fetchKelas = async () => {
    let query = supabase.from('kelas').select('id, nama_kelas').order('nama_kelas');
    if (tahunAjaranAktif) query = query.eq('tahun_ajaran_id', tahunAjaranAktif);
    const { data } = await query;
    setDaftarKelas(data || []);
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await new Promise(r => setTimeout(r, 500));
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (!profile) { setError('Profile tidak ditemukan!'); setLoading(false); return; }
      if      (profile.role === 'admin')          navigate('/admin/dashboard');
      else if (profile.role === 'guru')           navigate('/guru/dashboard');
      else if (profile.role === 'orangtua')       navigate('/orangtua/dashboard');
      else if (profile.role === 'kepala_sekolah') navigate('/kepsek/dashboard');
    } catch { setError('Email atau password salah!'); }
    finally  { setLoading(false); }
  };

  // Daftar
  const handleDaftar = async (e) => {
    e.preventDefault();
    if (!nama || !email || !password)              { setError('Semua field wajib diisi!');              return; }
    if (password.length < 6)                       { setError('Password minimal 6 karakter!');          return; }
    if (tipeAkun === 'orangtua' && !nisAnak)       { setError('NIS anak wajib diisi!');                 return; }
    if (tipeAkun === 'guru' && kodeAkses !== KODE_GURU)    { setError('Kode akses guru tidak valid!');           return; }
    if (tipeAkun === 'guru' && !kelasDipilih)              { setError('Pilih kelas yang akan diampu!');          return; }
    if (tipeAkun === 'kepsek' && kodeAkses !== KODE_KEPSEK){ setError('Kode akses kepala sekolah tidak valid!'); return; }

    setLoading(true); setError('');
    try {
      let siswa = null;
      if (tipeAkun === 'orangtua') {
        const { data: siswaData, error: siswaErr } = await supabase
          .from('siswa').select('id, full_name, status').eq('nis', nisAnak.trim()).single();
        if (siswaErr || !siswaData) { setError('NIS anak tidak ditemukan!'); setLoading(false); return; }
        if (siswaData.status && siswaData.status !== 'Aktif') {
          setError(`Siswa dengan NIS ${nisAnak} sudah tidak aktif (${siswaData.status}). Hubungi admin.`);
          setLoading(false); return;
        }
        siswa = siswaData;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        const role = tipeAkun === 'kepsek' ? 'kepala_sekolah' : tipeAkun;
        await supabase.from('profiles').insert({ id: data.user.id, full_name: nama, email, role });

        if (tipeAkun === 'orangtua' && siswa) {
          await supabase.from('siswa_orangtua').insert({ siswa_id: siswa.id, orangtua_id: data.user.id, hubungan });
          setSuccess(`Akun berhasil dibuat dan terhubung dengan ${siswa.full_name}! Silakan login.`);
        } else if (tipeAkun === 'guru') {
          await supabase.from('kelas').update({ wali_kelas_id: data.user.id }).eq('id', kelasDipilih);
          setSuccess('Akun guru berhasil dibuat dan terhubung ke kelas! Silakan login.');
        } else {
          setSuccess('Akun kepala sekolah berhasil dibuat! Silakan login.');
        }
      }

      setMode('login');
      setNama(''); setEmail(''); setPassword('');
      setNisAnak(''); setKodeAkses(''); setHubungan('Ayah'); setKelasDipilih('');
    } catch (err) { setError(err.message || 'Gagal membuat akun!'); }
    finally       { setLoading(false); }
  };

  // Lupa password
  const handleLupa = async (e) => {
    e.preventDefault();
    if (!email) { setError('Masukkan email!'); return; }
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setSuccess('Link reset password dikirim ke email! Cek inbox Anda.');
    } catch { setError('Gagal kirim email reset!'); }
    finally   { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px 14px 44px',
    border: '1.5px solid #E0E0E0', borderRadius: '14px',
    fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box'
  };
  const inputNoIcon = { ...inputStyle, paddingLeft: '16px' };
  const labelStyle  = { fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '6px' };
  const iconStyle   = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' };

  const taAktifNama = tahunAjaranList.find(t => t.id === tahunAjaranAktif)?.nama;

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ maxWidth: '480px', margin: '0 auto' }}>

      {/* HEADER ANIMASI */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #CC0000 0%, #FF3333 60%, #CC0000 100%)', minHeight: '280px' }}>
        <div style={{ textAlign: 'center', paddingTop: '60px', position: 'relative', zIndex: 10 }}>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800', margin: '0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            SDN 03 Manado
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '700', margin: '4px 0 0' }}>
            Monitoring Siswa SD
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', margin: '2px 0 0' }}>
            Pantau perkembangan anak Anda
          </p>
          {taAktifNama && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20, padding: '4px 14px', marginTop: 8, fontSize: 12, fontWeight: 700, color: 'white' }}>
              📅 TA {taAktifNama}
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', overflow: 'hidden' }}>
          <LoginScene frame={frame} pos={pos} />
        </div>
      </div>

      {/* FORM AREA */}
      <div style={{ flex: 1, background: '#F8F9FA', borderRadius: '28px 28px 0 0', marginTop: '-16px', padding: '24px 20px 40px', position: 'relative', zIndex: 20, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>

        {/* Tombol Install PWA */}
        <InstallButton />

        {/* Tab Masuk/Daftar */}
        {mode !== 'lupa' && (
          <div style={{ display: 'flex', background: '#E9ECEF', borderRadius: '16px', padding: '4px', marginBottom: '20px' }}>
            {['login','daftar'].map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', background: mode === m ? '#CC0000' : 'transparent', color: mode === m ? 'white' : '#666', boxShadow: mode === m ? '0 2px 8px rgba(204,0,0,0.4)' : 'none' }}>
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>
        )}

        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px' }}>
          {mode === 'login' ? '👋 Selamat Datang!' : mode === 'daftar' ? '📝 Buat Akun Baru' : '🔑 Lupa Password'}
        </h2>
        <p style={{ color: '#888', fontSize: '13px', margin: '0 0 16px' }}>
          {mode === 'login'  ? 'Masuk untuk memantau perkembangan anak'
          : mode === 'daftar' ? 'Pilih jenis akun yang ingin didaftarkan'
          : 'Reset password via email Anda'}
        </p>

        {error   && <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', color: '#CC0000', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px' }}>⚠️ {error}</div>}
        {success && <div style={{ background: '#F0FFF4', border: '1px solid #C8E6C9', color: '#2E7D32', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px' }}>✅ {success}</div>}

        {/* ── FORM LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><FiMail size={17} /></span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" required style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><FiLock size={17} /></span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" required style={{ ...inputStyle, paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <button type="button" onClick={() => { setMode('lupa'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: '#CC0000', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Lupa Password?
              </button>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? '#E57373' : '#CC0000', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(204,0,0,0.35)' }}>
              {loading ? '⏳ Memproses...' : 'MASUK →'}
            </button>
          </form>
        )}

        {/* ── FORM DAFTAR ── */}
        {mode === 'daftar' && (
          <form onSubmit={handleDaftar}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Daftar Sebagai</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[{ val:'orangtua', label:'👨‍👩‍👧 Orang Tua' },{ val:'guru', label:'👨‍🏫 Guru' },{ val:'kepsek', label:'🎓 Kepsek' }].map(t => (
                  <button key={t.val} type="button" onClick={() => { setTipeAkun(t.val); setKodeAkses(''); setKelasDipilih(''); setError(''); }}
                    style={{ padding: '10px 6px', borderRadius: '12px', border: '2px solid', borderColor: tipeAkun === t.val ? '#CC0000' : '#E0E0E0', background: tipeAkun === t.val ? '#FFF0F0' : 'white', color: tipeAkun === t.val ? '#CC0000' : '#666', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Nama Lengkap</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><FiUser size={17} /></span>
                <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama lengkap Anda" required style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><FiMail size={17} /></span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" required style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><FiLock size={17} /></span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 karakter" required style={{ ...inputStyle, paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>

            {tipeAkun === 'orangtua' && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>NIS Anak</label>
                  <input type="text" value={nisAnak} onChange={e => setNisAnak(e.target.value)} placeholder="Contoh: 2024001" required style={inputNoIcon} />
                  <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>NIS bisa dilihat di rapor atau tanya wali kelas</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Hubungan dengan Anak</label>
                  <select value={hubungan} onChange={e => setHubungan(e.target.value)} style={inputNoIcon}>
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Wali">Wali</option>
                  </select>
                </div>
              </>
            )}

            {tipeAkun === 'guru' && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Tahun Ajaran</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconStyle}><FiCalendar size={17} /></span>
                    <select value={tahunAjaranAktif} onChange={e => { setTahunAjaranAktif(e.target.value); setKelasDipilih(''); }} style={inputStyle}>
                      <option value="">-- Pilih Tahun Ajaran --</option>
                      {tahunAjaranList.map(t => <option key={t.id} value={t.id}>TA {t.nama} {t.aktif ? '(Aktif)' : ''}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Kelas yang Diampu</label>
                  <select value={kelasDipilih} onChange={e => setKelasDipilih(e.target.value)} required style={inputNoIcon}>
                    <option value="">-- Pilih Kelas --</option>
                    {daftarKelas.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                  </select>
                  {daftarKelas.length === 0 && <p style={{ fontSize: '11px', color: '#CC0000', marginTop: '4px' }}>Belum ada kelas. Hubungi admin.</p>}
                </div>
              </>
            )}

            {(tipeAkun === 'guru' || tipeAkun === 'kepsek') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Kode Akses {tipeAkun === 'guru' ? 'Guru' : 'Kepala Sekolah'}</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconStyle}><FiKey size={17} /></span>
                  <input type="password" value={kodeAkses} onChange={e => setKodeAkses(e.target.value)} placeholder="Masukkan kode akses" required style={inputStyle} />
                </div>
                <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Kode akses diberikan oleh admin sekolah</p>
              </div>
            )}

            <div style={{ background: '#EBF5FB', border: '1px solid #BDE0F5', borderRadius: '12px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#1565C0' }}>
              {tipeAkun === 'orangtua' && 'ℹ️ Akun akan otomatis terhubung ke data anak berdasarkan NIS.'}
              {tipeAkun === 'guru'     && 'ℹ️ Akun guru otomatis terhubung ke kelas yang dipilih sebagai wali kelas.'}
              {tipeAkun === 'kepsek'   && 'ℹ️ Akun kepala sekolah memerlukan kode akses khusus dari admin.'}
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? '#E57373' : '#CC0000', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(204,0,0,0.35)' }}>
              {loading ? '⏳ Memproses...' : 'DAFTAR →'}
            </button>
          </form>
        )}

        {/* ── FORM LUPA PASSWORD ── */}
        {mode === 'lupa' && (
          <form onSubmit={handleLupa}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email Terdaftar</label>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><FiMail size={17} /></span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" required style={inputStyle} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: '#CC0000', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(204,0,0,0.35)', marginBottom: '12px' }}>
              {loading ? '⏳ Mengirim...' : '📧 Kirim Link Reset'}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ width: '100%', padding: '14px', background: 'white', color: '#555', border: '2px solid #E0E0E0', borderRadius: '14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              ← Kembali ke Login
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', color: '#bbb', fontSize: '12px', marginTop: '20px' }}>
          ❤️ Bersama Membangun Generasi Cerdas & Berprestasi
        </p>
      </div>
    </div>
  );
}