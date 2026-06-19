import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiLogOut, FiUsers, FiGrid, FiBell, FiLink, FiMessageCircle, FiMenu, FiX, FiHome } from 'react-icons/fi';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [stats, setStats] = useState({ siswa: 0, kelas: 0, guru: 0 });
  const [unreadChat, setUnreadChat] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUnreadChat();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menus = [
    { icon: <FiHome size={20} />, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { icon: <FiUsers size={20} />, label: 'Data Siswa', path: '/admin/siswa' },
    { icon: <FiGrid size={20} />, label: 'Kelola Kelas', path: '/admin/kelas' },
    { icon: <FiLink size={20} />, label: 'Hubungkan Siswa & Ortu', path: '/admin/hubung-siswa' },
    { icon: <FiBell size={20} />, label: 'Pengumuman', path: '/admin/pengumuman' },
    { icon: <FiMessageCircle size={20} />, label: 'Live Chat Orang Tua', path: '/admin/chat', badge: unreadChat },
  ];

  const quickCards = [
    { label: 'Data Siswa', desc: 'Kelola data siswa', value: stats.siswa, unit: 'siswa', path: '/admin/siswa', color: '#3B82F6', bg: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
    { label: 'Kelola Kelas', desc: 'Atur kelas & tahun ajaran', value: stats.kelas, unit: 'kelas', path: '/admin/kelas', color: '#10B981', bg: 'linear-gradient(135deg, #10B981, #34D399)' },
    { label: 'Data Guru', desc: 'Total guru aktif', value: stats.guru, unit: 'guru', path: '/admin/siswa', color: '#8B5CF6', bg: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' },
    { label: 'Live Chat', desc: 'Pesan belum dibalas', value: unreadChat, unit: 'pesan', path: '/admin/chat', color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B, #FBBF24)' },
  ];

  const actionMenus = [
    { icon: <FiLink size={24} />, label: 'Hubungkan Siswa & Ortu', path: '/admin/hubung-siswa', color: '#8B5CF6' },
    { icon: <FiBell size={24} />, label: 'Buat Pengumuman', path: '/admin/pengumuman', color: '#EF4444' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', position: 'relative', maxWidth: '480px', margin: '0 auto', overflow: 'hidden' }}>

      {/* ===== TOP BAR ===== */}
      <div style={{
        background: '#1E293B',
        padding: '16px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #334155'
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
      <div style={{ padding: '20px 16px 8px' }}>
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
        <p style={{ color: '#94A3B8', fontSize: '12px', margin: '4px 0 0' }}>
          Kontrol penuh data sekolah dari sini
        </p>
      </div>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <div style={{ background: '#F1F5F9', borderRadius: '24px 24px 0 0', marginTop: '16px', minHeight: 'calc(100vh - 160px)', padding: '20px 16px 40px' }}>

        {/* Quick stat cards - horizontal scroll */}
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: '0 0 12px' }}>Ringkasan Data</p>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px', scrollbarWidth: 'none' }}>
          {quickCards.map((c, i) => (
            <button key={i} type="button" onClick={() => navigate(c.path)}
              style={{
                background: c.bg, border: 'none', borderRadius: '20px',
                padding: '16px', minWidth: '140px', flexShrink: 0,
                textAlign: 'left', cursor: 'pointer',
                boxShadow: `0 8px 20px ${c.color}40`
              }}>
              <p style={{ color: 'white', fontSize: '28px', fontWeight: '800', margin: '0' }}>{c.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: '600', margin: '4px 0 0' }}>{c.unit}</p>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: '700', margin: '8px 0 0' }}>{c.label}</p>
            </button>
          ))}
        </div>

        {/* Action grid 2 columns */}
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: '0 0 12px' }}>Aksi Cepat</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {actionMenus.map((m, i) => (
            <button key={i} type="button" onClick={() => navigate(m.path)}
              style={{
                background: 'white', border: 'none', borderRadius: '18px',
                padding: '18px', cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${m.color}15`, color: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '10px'
              }}>
                {m.icon}
              </div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0' }}>{m.label}</p>
            </button>
          ))}
        </div>

        {/* Full menu list */}
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: '0 0 12px' }}>Semua Menu</p>
        <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {menus.filter(m => !m.active).map((m, i) => (
            <button key={i} type="button" onClick={() => navigate(m.path)}
              style={{
                width: '100%', background: 'none', border: 'none',
                borderBottom: i < menus.length - 2 ? '1px solid #F1F5F9' : 'none',
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', textAlign: 'left'
              }}>
              <span style={{ color: '#64748B' }}>{m.icon}</span>
              <span style={{ flex: 1, fontSize: '14px', color: '#334155', fontWeight: '500' }}>{m.label}</span>
              {m.badge > 0 && (
                <span style={{
                  background: '#EF4444', color: 'white', borderRadius: '999px',
                  minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '10px', fontWeight: '700', padding: '0 5px'
                }}>{m.badge}</span>
              )}
              <span style={{ color: '#CBD5E1' }}>›</span>
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
            {/* Sidebar header */}
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

            {/* Sidebar menu */}
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

            {/* Sidebar footer */}
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