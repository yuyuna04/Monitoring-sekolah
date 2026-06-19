import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiLogOut, FiCalendar, FiBook, FiTrendingUp, FiAward, FiBell } from 'react-icons/fi';

export default function DashboardGuru() {
  const navigate = useNavigate();
  const [guruName, setGuruName] = useState('Guru');
  const [stats, setStats] = useState({ siswa: 0, kelas: 0 });
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 15) setGreeting('Selamat Siang');
    else if (hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles')
        .select('full_name').eq('id', user.id).single();
      if (data) setGuruName(data.full_name);

      const { count: siswaCount } = await supabase
        .from('siswa').select('*', { count: 'exact', head: true });
      const { count: kelasCount } = await supabase
        .from('kelas').select('*', { count: 'exact', head: true });
      setStats({ siswa: siswaCount || 0, kelas: kelasCount || 0 });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menus = [
    {
      icon: <FiCalendar size={28} />,
      label: 'Input Absensi',
      desc: 'Catat kehadiran siswa',
      path: '/guru/absensi',
      color: '#3B82F6',
      bg: '#EFF6FF'
    },
    {
      icon: <FiBook size={28} />,
      label: 'Input Nilai',
      desc: 'Kelola nilai siswa',
      path: '/guru/nilai',
      color: '#10B981',
      bg: '#ECFDF5'
    },
    {
      icon: <FiTrendingUp size={28} />,
      label: 'Perkembangan',
      desc: 'Pantau perkembangan',
      path: '/guru/perkembangan',
      color: '#F59E0B',
      bg: '#FFFBEB'
    },
    {
      icon: <FiAward size={28} />,
      label: 'Prestasi',
      desc: 'Data prestasi siswa',
      path: '/guru/prestasi',
      color: '#8B5CF6',
      bg: '#F5F3FF'
    },
    {
      icon: <FiBell size={28} />,
      label: 'Pengumuman',
      desc: 'Buat pengumuman',
      path: '/guru/pengumuman',
      color: '#EF4444',
      bg: '#FEF2F2'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #CC0000 0%, #FF4444 100%)',
        padding: '0 0 60px 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Dekorasi */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🏫</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: '600' }}>
              Portal Guru
            </span>
          </div>
          <button type="button" onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', padding: '8px 12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
            <FiLogOut size={16} /> Keluar
          </button>
        </div>

        {/* Greeting */}
        <div style={{ padding: '20px 20px 0' }}>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '0' }}>
            {greeting},
          </p>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: '4px 0 0', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {guruName} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '6px 0 0' }}>
            Semangat mendidik generasi bangsa!
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: '0 16px', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#FEF3C7', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
              👨‍🎓
            </div>
            <div>
              <p style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', margin: '0' }}>{stats.siswa}</p>
              <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>Total Siswa</p>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#EDE9FE', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
              🏫
            </div>
            <div>
              <p style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', margin: '0' }}>{stats.kelas}</p>
              <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>Total Kelas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: '20px 16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 14px' }}>
          Menu Guru
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {menus.map((m, i) => (
            <button key={i} type="button" onClick={() => navigate(m.path)}
              style={{
                background: 'white', border: 'none', borderRadius: '18px',
                padding: '16px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '16px', textAlign: 'left',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'transform 0.1s, box-shadow 0.1s',
                width: '100%'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Icon */}
              <div style={{
                width: '54px', height: '54px', borderRadius: '16px',
                background: m.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: m.color, flexShrink: 0
              }}>
                {m.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>
                  {m.label}
                </p>
                <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>
                  {m.desc}
                </p>
              </div>

              {/* Arrow */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: m.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: m.color, fontWeight: 'bold',
                fontSize: '16px', flexShrink: 0
              }}>
                ›
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '10px 0 30px', color: '#ccc', fontSize: '12px' }}>
        ❤️ Monitoring Siswa SD
      </div>
    </div>
  );
}