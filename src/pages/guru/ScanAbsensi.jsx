import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';
import {
  FiArrowLeft, FiCheckCircle, FiCamera, FiCameraOff,
  FiLogIn, FiLogOut, FiClock, FiUsers
} from 'react-icons/fi';

export default function ScanAbsensiGuru() {
  const navigate = useNavigate();
  const [kelasList, setKelasList]         = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [scanning, setScanning]           = useState(false);
  const [hadirList, setHadirList]         = useState([]);
  const [statusMsg, setStatusMsg]         = useState('');
  const [statusType, setStatusType]       = useState('');
  const [mode, setMode]                   = useState('masuk'); // 'masuk' | 'pulang'
  const html5QrRef = useRef(null);

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { if (selectedKelas) fetchHadirHariIni(); }, [selectedKelas]); // eslint-disable-line
  useEffect(() => { return () => { stopScanner(); }; }, []); // eslint-disable-line

  // ── FETCH ──────────────────────────────────────────
  const fetchKelas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('kelas').select('*')
      .eq('wali_kelas_id', user.id).order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchHadirHariIni = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: siswaKelas } = await supabase.from('siswa').select('id').eq('kelas_id', selectedKelas);
    const siswaIds = (siswaKelas || []).map(s => s.id);
    if (!siswaIds.length) { setHadirList([]); return; }
    const { data } = await supabase.from('absensi')
      .select('*, siswa(full_name, nis)')
      .eq('tanggal', today)
      .in('siswa_id', siswaIds)
      .order('jam_masuk', { ascending: false });
    setHadirList(data || []);
  };

  // ── SCANNER ────────────────────────────────────────
  const startScanner = async () => {
    if (!selectedKelas) { showStatus('⚠️ Pilih kelas dulu!', 'warning'); return; }
    setScanning(true);
    setStatusMsg('');
    setTimeout(async () => {
      try {
        html5QrRef.current = new Html5Qrcode('qr-reader');
        await html5QrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {}
        );
      } catch (err) {
        showStatus('❌ Gagal buka kamera: ' + err.message, 'error');
        setScanning(false);
      }
    }, 200);
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); html5QrRef.current.clear(); } catch (e) {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  // ── SCAN SUCCESS ───────────────────────────────────
  const onScanSuccess = async (decodedText) => {
    const { data: siswa } = await supabase.from('siswa')
      .select('id, full_name, nis, kelas_id')
      .eq('nis', decodedText).maybeSingle();

    if (!siswa) { showStatus('❌ Kode tidak dikenali: ' + decodedText, 'error'); return; }
    if (siswa.kelas_id !== selectedKelas) {
      showStatus(`⚠️ ${siswa.full_name} bukan siswa kelas ini`, 'warning'); return;
    }

    const today  = new Date().toISOString().slice(0, 10);
    const nowISO = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();

    // Cek record absensi hari ini
    const { data: existing } = await supabase.from('absensi')
      .select('id, jam_masuk, jam_pulang, status')
      .eq('siswa_id', siswa.id).eq('tanggal', today).maybeSingle();

    if (mode === 'masuk') {
      // ── ABSEN MASUK ──
      if (existing) {
        showStatus(`ℹ️ ${siswa.full_name} sudah absen masuk pukul ${formatJam(existing.jam_masuk)}`, 'warning');
        return;
      }
      const { error } = await supabase.from('absensi').insert({
        siswa_id:     siswa.id,
        kelas_id:     selectedKelas,
        tanggal:      today,
        status:       'Hadir',
        jam_masuk:    nowISO,
        jam_pulang:   null,
        dicatat_oleh: user.id,
      });
      if (error) { showStatus('❌ Gagal simpan: ' + error.message, 'error'); return; }
      showStatus(`✅ ${siswa.full_name} — Masuk pukul ${formatJam(nowISO)}`, 'success');

    } else {
      // ── ABSEN PULANG ──
      if (!existing) {
        showStatus(`⚠️ ${siswa.full_name} belum absen masuk hari ini!`, 'warning'); return;
      }
      if (existing.jam_pulang) {
        showStatus(`ℹ️ ${siswa.full_name} sudah absen pulang pukul ${formatJam(existing.jam_pulang)}`, 'warning'); return;
      }
      const { error } = await supabase.from('absensi')
        .update({ jam_pulang: nowISO }).eq('id', existing.id);
      if (error) { showStatus('❌ Gagal simpan: ' + error.message, 'error'); return; }
      showStatus(`✅ ${siswa.full_name} — Pulang pukul ${formatJam(nowISO)}`, 'success');
    }

    fetchHadirHariIni();
  };

  // ── HELPERS ────────────────────────────────────────
  const showStatus = (msg, type) => {
    setStatusMsg(msg); setStatusType(type);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const formatJam = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusColor = (item) => {
    if (item.status === 'Izin')  return '#F59E0B';
    if (item.status === 'Sakit') return '#3B82F6';
    if (item.status === 'Alpa')  return '#EF4444';
    return '#10B981';
  };

  const statusBgMap    = { success: '#ECFDF5', warning: '#FFFBEB', error: '#FEF2F2' };
  const statusColorMap = { success: '#065F46', warning: '#92400E', error: '#991B1B' };
  const sudahMasuk     = hadirList.filter(h => h.jam_masuk).length;
  const sudahPulang    = hadirList.filter(h => h.jam_pulang).length;

  // ── RENDER ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#CC0000 0%,#FF3333 60%,#CC0000 100%)' }}
        className="text-white px-5 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={() => { stopScanner(); navigate('/guru/dashboard'); }}
            className="bg-white bg-opacity-20 p-2 rounded-xl">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Scan Absensi</h1>
            <p className="text-red-200 text-xs">
              {new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
        </div>
        {/* Rekap mini */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{sudahMasuk}</p>
            <p className="text-red-100 text-xs">Sudah Masuk</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{sudahPulang}</p>
            <p className="text-red-100 text-xs">Sudah Pulang</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* Pilih Kelas */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2">PILIH KELAS</p>
          <select value={selectedKelas}
            onChange={e => { setSelectedKelas(e.target.value); stopScanner(); }}
            disabled={scanning}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50">
            <option value="">-- Pilih Kelas --</option>
            {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
          </select>
        </div>

        {/* Toggle Masuk / Pulang */}
        <div className="bg-white rounded-2xl p-1 shadow-sm flex gap-1">
          <button type="button"
            onClick={() => { setMode('masuk'); stopScanner(); setStatusMsg(''); }}
            style={mode === 'masuk' ? { background: '#CC0000', color: 'white' } : { color: '#6B7280' }}
            className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
            <FiLogIn size={16} /> Absen Masuk
          </button>
          <button type="button"
            onClick={() => { setMode('pulang'); stopScanner(); setStatusMsg(''); }}
            style={mode === 'pulang' ? { background: '#1D4ED8', color: 'white' } : { color: '#6B7280' }}
            className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
            <FiLogOut size={16} /> Absen Pulang
          </button>
        </div>

        {/* Info mode aktif */}
        <div style={{
          background: mode === 'masuk' ? '#FEF2F2' : '#EFF6FF',
          border: `1.5px solid ${mode === 'masuk' ? '#FECACA' : '#BFDBFE'}`,
          borderRadius: 12, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <FiClock size={15} style={{ color: mode === 'masuk' ? '#CC0000' : '#1D4ED8', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: mode === 'masuk' ? '#991B1B' : '#1E40AF', fontWeight: 600 }}>
            {mode === 'masuk'
              ? 'Mode MASUK — Scan QR siswa saat tiba di sekolah'
              : 'Mode PULANG — Scan QR siswa saat hendak pulang'}
          </p>
        </div>

        {/* Tombol Scan */}
        {!scanning ? (
          <button type="button" onClick={startScanner}
            style={{ background: mode === 'masuk' ? '#CC0000' : '#1D4ED8' }}
            className="w-full text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md">
            <FiCamera size={18} />
            Mulai Scan {mode === 'masuk' ? 'Masuk' : 'Pulang'}
          </button>
        ) : (
          <button type="button" onClick={stopScanner}
            className="w-full bg-gray-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2">
            <FiCameraOff size={18} /> Stop Scan
          </button>
        )}

        {/* QR Reader */}
        <div id="qr-reader" style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }}></div>

        {/* Status Message */}
        {statusMsg && (
          <div style={{
            background: statusBgMap[statusType] || '#F9FAFB',
            border: `1.5px solid ${statusType === 'success' ? '#6EE7B7' : statusType === 'warning' ? '#FCD34D' : '#FCA5A5'}`,
            borderRadius: 12, padding: '12px 16px',
            color: statusColorMap[statusType] || '#374151',
            fontWeight: 700, fontSize: 14, textAlign: 'center'
          }}>
            {statusMsg}
          </div>
        )}

        {/* Daftar Absensi Hari Ini */}
        {selectedKelas && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

            {/* Header tabel */}
            <div style={{ background: '#F9FAFB', padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}
              className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiUsers size={16} style={{ color: '#CC0000' }} />
                <p className="font-bold text-gray-800 text-sm">Rekap Absensi Hari Ini</p>
              </div>
              <span style={{ background: '#FEF2F2', color: '#CC0000', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                {hadirList.length} siswa
              </span>
            </div>

            {hadirList.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 36 }}>📋</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>Belum ada yang absen hari ini</p>
              </div>
            ) : (
              <div>
                {/* Kolom header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px',
                  padding: '8px 14px', background: '#F3F4F6',
                  fontSize: 10, fontWeight: 700, color: '#6B7280', gap: 4
                }}>
                  <span>SISWA</span>
                  <span style={{ textAlign: 'center' }}>MASUK</span>
                  <span style={{ textAlign: 'center' }}>PULANG</span>
                  <span style={{ textAlign: 'center' }}>STATUS</span>
                </div>

                {hadirList.map(item => (
                  <div key={item.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px',
                    padding: '10px 14px', borderBottom: '1px solid #F9FAFB',
                    alignItems: 'center', gap: 4
                  }}>
                    {/* Nama siswa */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: getStatusColor(item) + '20',
                        color: getStatusColor(item),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, flexShrink: 0
                      }}>
                        {item.siswa?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{item.siswa?.full_name}</p>
                        <p style={{ fontSize: 10, color: '#9CA3AF' }}>{item.siswa?.nis}</p>
                      </div>
                    </div>

                    {/* Jam Masuk */}
                    <div style={{ textAlign: 'center' }}>
                      {item.jam_masuk ? (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{formatJam(item.jam_masuk)}</p>
                          <p style={{ fontSize: 9, color: '#9CA3AF' }}>WIB</p>
                        </div>
                      ) : <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>}
                    </div>

                    {/* Jam Pulang */}
                    <div style={{ textAlign: 'center' }}>
                      {item.jam_pulang ? (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>{formatJam(item.jam_pulang)}</p>
                          <p style={{ fontSize: 9, color: '#9CA3AF' }}>WIB</p>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          background: '#FEF3C7', color: '#92400E',
                          padding: '2px 6px', borderRadius: 20
                        }}>Belum</span>
                      )}
                    </div>

                    {/* Status */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: getStatusColor(item) + '20',
                        color: getStatusColor(item),
                        padding: '3px 6px', borderRadius: 20
                      }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}