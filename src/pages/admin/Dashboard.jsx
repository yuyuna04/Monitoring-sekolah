import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiLogOut, FiUsers, FiGrid, FiBell, FiLink, FiMessageCircle, FiMenu, FiX, FiHome, FiClock, FiCalendar } from 'react-icons/fi';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [stats, setStats] = useState({ siswa: 0, kelas: 0, guru: 0 });
  const [unreadChat, setUnreadChat] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agenda, setAgenda] = useState([]);
  const [aktivitas, setAktivitas] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchUnreadChat();
    fetchAgenda();
    fetchAktivitas();

    const channel = supabase
      .channel('pesan_bantuan_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesan_bantuan' }, () => {
        fetchUnreadChat();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles')
        .select('full_name').eq('id', user.id).single();
      if (data) setAdminName(data.full_name);

      const { count: siswaCount } = await supabase.from('siswa').select('*', { count: 'exact', head: true });
      const { count: kelasCount } = await supabase.from('kelas').select('*', { count: 'exact', head: true });
      const { count: guruCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'guru');
      setStats({ siswa: siswaCount || 0, kelas: kelasCount || 0, guru: guruCount || 0 });
    }
  };

  const fetchUnreadChat = async () => {
    const { count } = await supabase.from('pesan_bantuan')
      .select('*', { count: 'exact', head: true })
      .eq('pengirim', 'orangtua').eq('dibaca', false);
    setUnreadChat(count || 0);
  };

  const fetchAgenda = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from('pengumuman')
      .select('*').gte('tanggal_tayang', today)
      .order('tanggal_tayang', { ascending: true }).limit(3);
    setAgenda(data || []);
  };

  const fetchAktivitas = async () => {
    const results = [];

    const { data: nilaiData } = await supabase.from('nilai')
      .select('created_at, mata_pelajaran(nama), kelas(nama_kelas), profiles!diinput_oleh(full_name)')
      .order('created_at', { ascending: false }).limit(3);
    (nilaiData || []).forEach(n => {
      results.push({
        text: `${n.profiles?.full_name || 'Guru'} menginput nilai ${n.mata_pelajaran?.nama || ''} kelas ${n.kelas?.nama_kelas || ''}`,
        time: n.created_at
      });
    });

    const { data: pengumumanData } = await supabase.from('pengumuman')
      .select('created_at, judul').order('created_at', { ascending: false }).limit(3);
    (pengumumanData || []).forEach(p => {
      results.push({ text: `Pengumuman baru: "${p.judul}" ditambahkan`, time: p.created_at });
    });

    const { data: materiData } = await supabase.from('materi_harian')
      .select('created_at, kelas(nama_kelas), profiles!guru_id(full_name)')
      .order('created_at', { ascending: false }).limit(3);
    (materiData || []).forEach(m => {
      results.push({
        text: `${m.profiles?.full_name || 'Guru'} menambah materi kelas ${m.kelas?.nama_kelas || ''}`,
        time: m.created_at
      });
    });

    results.sort((a, b) => new Date(b.time) - new Date(a.time));
    setAktivitas(results.slice(0, 5));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const waktuLalu = (iso) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffJam = Math.floor(diffMin / 60);
    if (diffJam < 24) return `${diffJam} jam lalu`;
    const diffHari = Math.floor(diffJam / 24);
    return `${diffHari} hari lalu`;
  };

  const formatTanggalPendek = (tgl) => {
    const d = new Date(tgl);
    return { tanggal: d.getDate(), bulan: d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase() };
  };

  const menus = [
    { icon: <FiHome size={20} />, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { icon: <FiUsers size={20} />, label: 'Data Siswa', path: '/admin/siswa' },
    { icon: <FiGrid size={20} />, label: 'Kelola Kelas', path: '/admin/kelas' },
    { icon: <FiLink size={20} />, label: 'Hubungkan Siswa & Ortu', path: '/admin/hubung-siswa' },
    { icon: <FiBell size={20} />, label: 'Pengumuman', path: '/admin/pengumuman' },
    { icon: <FiMessageCircle size={20} />, label: 'Live Chat Orang Tua', path: '/admin/chat', badge: unreadChat },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6E9', position: 'relative', maxWidth: '480px', margin: '0 auto', overflow: 'hidden' }}>

      {/* ===== TOP BAR ===== */}
      <div style={{
        background: '#1E293B',
        padding: '16px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button type="button" onClick={() => setSidebarOpen(true)}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E2E8F0', cursor: 'pointer' }}>
          <FiMenu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🏫</span>
          <span style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '700' }}>Admin Panel</span>
        </div>
        <button type="button" onClick={handleLogout}
          style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171', cursor: 'pointer' }}>
          <FiLogOut size={18} />
        </button>
      </div>

      {/* ===== GREETING STRIP ===== */}
      <div style={{ padding: '20px 16px 8px', background: '#1E293B' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'linear-gradient(90deg, #FBBF24, #F59E0B)', color: '#1a1a1a',
          padding: '4px 12px', borderRadius: '999px', fontSize: '10px', fontWeight: '800',
          letterSpacing: '0.5px', marginBottom: '10px'
        }}>
          👑 ADMINISTRATOR
        </div>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: '0' }}>
          Halo, {adminName}
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '12px', margin: '4px 0 16px' }}>
          Kontrol penuh data sekolah dari sini
        </p>
      </div>

      {/* ===== SCROLLABLE CREAM CONTENT ===== */}
      <div style={{ background: '#FDF6E9', borderRadius: '24px 24px 0 0', marginTop: '-8px', minHeight: 'calc(100vh - 160px)', padding: '24px 16px 40px' }}>

        {/* Ringkasan Data */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px', scrollbarWidth: 'none' }}>
          {[
            { label: 'Siswa', value: stats.siswa, path: '/admin/siswa', color: '#3B82F6', bg: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
            { label: 'Kelas', value: stats.kelas, path: '/admin/kelas', color: '#10B981', bg: 'linear-gradient(135deg, #10B981, #34D399)' },
            { label: 'Guru', value: stats.guru, path: '/admin/siswa', color: '#8B5CF6', bg: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' },
            { label: 'Chat', value: unreadChat, path: '/admin/chat', color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B, #FBBF24)' },
          ].map((c, i) => (
            <button key={i} type="button" onClick={() => navigate(c.path)}
              style={{ background: c.bg, border: 'none', borderRadius: '18px', padding: '14px 18px', minWidth: '110px', flexShrink: 0, textAlign: 'left', cursor: 'pointer', boxShadow: `0 8px 20px ${c.color}30` }}>
              <p style={{ color: 'white', fontSize: '24px', fontWeight: '800', margin: '0' }}>{c.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: '600', margin: '4px 0 0' }}>{c.label}</p>
            </button>
          ))}
        </div>

        {/* Agenda Mendatang */}
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', color: '#78350F', margin: '0 0 12px' }}>
          Agenda Mendatang
        </p>
        <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #F3E5C8', boxShadow: '0 2px 10px rgba(120,53,15,0.05)' }}>
          {agenda.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>Belum ada agenda mendatang</p>
          ) : agenda.map((item, i) => {
            const { tanggal, bulan } = formatTanggalPendek(item.tanggal_tayang);
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderBottom: i < agenda.length - 1 ? '1px solid #F3E5C8' : 'none' }}>
                <div style={{ background: '#FEF3E2', borderRadius: '10px', width: '48px', height: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#78350F' }}>{tanggal}</span>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#B45309' }}>{bulan}</span>
                </div>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1E293B', margin: 0, fontWeight: '600' }}>{item.judul}</p>
              </div>
            );
          })}
        </div>

        {/* Aktivitas Terbaru */}
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', color: '#78350F', margin: '0 0 12px' }}>
          Aktivitas Terbaru
        </p>
        <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #F3E5C8', boxShadow: '0 2px 10px rgba(120,53,15,0.05)' }}>
          {aktivitas.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>Belum ada aktivitas</p>
          ) : aktivitas.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderBottom: i < aktivitas.length - 1 ? '1px solid #F3E5C8' : 'none' }}>
              <FiClock size={16} color="#B45309" style={{ marginTop: '3px', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '14px', color: '#1E293B', margin: 0, lineHeight: '1.4' }}>{item.text}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }}>{waktuLalu(item.time)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Semua Menu */}
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', color: '#78350F', margin: '0 0 12px' }}>
          Semua Menu
        </p>
        <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', border: '1px solid #F3E5C8', boxShadow: '0 2px 10px rgba(120,53,15,0.05)' }}>
          {menus.filter(m => !m.active).map((m, i, arr) => (
            <button key={i} type="button" onClick={() => navigate(m.path)}
              style={{
                width: '100%', background: 'none', border: 'none',
                borderBottom: i < arr.length - 1 ? '1px solid #F3E5C8' : 'none',
                padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', textAlign: 'left'
              }}>
              <span style={{ color: '#92703C' }}>{m.icon}</span>
              <span style={{ flex: 1, fontSize: '15px', color: '#1E293B', fontWeight: '500' }}>{m.label}</span>
              {m.badge > 0 && (
                <span style={{
                  background: '#EF4444', color: 'white', borderRadius: '999px',
                  minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '10px', fontWeight: '700', padding: '0 5px'
                }}>{m.badge}</span>
              )}
              <span style={{ color: '#D6C7A1' }}>›</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== SIDEBAR DRAWER ===== */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setSidebarOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '78%', maxWidth: '300px',
            background: '#1E293B', display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ padding: '24px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(90deg, #FBBF24, #F59E0B)', color: '#1a1a1a',
                  padding: '3px 10px', borderRadius: '999px', fontSize: '9px', fontWeight: '800',
                  marginBottom: '8px'
                }}>
                  👑 ADMIN
                </div>
                <p style={{ color: 'white', fontWeight: '700', fontSize: '16px', margin: '0' }}>{adminName}</p>
              </div>
              <button type="button" onClick={() => setSidebarOpen(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E2E8F0', cursor: 'pointer' }}>
                <FiX size={18} />
              </button>
            </div>

            <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
              {menus.map((m, i) => (
                <button key={i} type="button"
                  onClick={() => { navigate(m.path); setSidebarOpen(false); }}
                  style={{
                    width: '100%', background: m.active ? 'rgba(239,68,68,0.15)' : 'none',
                    border: 'none', borderRadius: '12px', padding: '13px 14px',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    cursor: 'pointer', textAlign: 'left', marginBottom: '4px'
                  }}>
                  <span style={{ color: m.active ? '#F87171' : '#94A3B8' }}>{m.icon}</span>
                  <span style={{ flex: 1, fontSize: '14px', color: m.active ? '#F87171' : '#CBD5E1', fontWeight: m.active ? '700' : '500' }}>
                    {m.label}
                  </span>
                  {m.badge > 0 && (
                    <span style={{
                      background: '#EF4444', color: 'white', borderRadius: '999px',
                      minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '10px', fontWeight: '700', padding: '0 5px'
                    }}>{m.badge}</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid #334155' }}>
              <button type="button" onClick={handleLogout}
                style={{
                  width: '100%', background: 'rgba(239,68,68,0.12)', border: 'none',
                  borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', color: '#F87171', fontWeight: '700',
                  fontSize: '13px', cursor: 'pointer'
                }}>
                <FiLogOut size={16} /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}