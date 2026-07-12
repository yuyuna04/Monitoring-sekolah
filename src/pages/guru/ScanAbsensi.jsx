import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';
import { FiArrowLeft, FiCheckCircle, FiCamera, FiCameraOff } from 'react-icons/fi';

export default function ScanAbsensiGuru() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [scanning, setScanning] = useState(false);
  const [hadirList, setHadirList] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const html5QrRef = useRef(null);

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { if (selectedKelas) fetchHadirHariIni(); }, [selectedKelas]); // eslint-disable-line

  useEffect(() => {
    return () => { stopScanner(); };
  }, []); // eslint-disable-line

  const fetchKelas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('kelas').select('*').eq('wali_kelas_id', user.id).order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchHadirHariIni = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: siswaKelas } = await supabase.from('siswa').select('id').eq('kelas_id', selectedKelas);
    const siswaIds = (siswaKelas || []).map(s => s.id);
    if (siswaIds.length === 0) { setHadirList([]); return; }
    const { data } = await supabase.from('absensi')
      .select('*, siswa(full_name, nis)')
      .eq('tanggal', today)
      .in('siswa_id', siswaIds)
      .order('jam_absen', { ascending: false });
    setHadirList(data || []);
  };

  const startScanner = async () => {
    if (!selectedKelas) { alert('Pilih kelas dulu!'); return; }
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
        setStatusMsg('Gagal buka kamera: ' + err.message);
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

  const onScanSuccess = async (decodedText) => {
    const { data: siswa } = await supabase.from('siswa').select('id, full_name, nis, kelas_id')
      .eq('nis', decodedText).maybeSingle();

    if (!siswa) {
      setStatusMsg('❌ Kode tidak dikenali: ' + decodedText);
      return;
    }
    if (siswa.kelas_id !== selectedKelas) {
      setStatusMsg(`⚠️ ${siswa.full_name} bukan siswa kelas ini`);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: sudahAda } = await supabase.from('absensi')
      .select('id').eq('siswa_id', siswa.id).eq('tanggal', today).maybeSingle();

    if (sudahAda) {
      setStatusMsg(`ℹ️ ${siswa.full_name} sudah absen hari ini`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('absensi').upsert({
      siswa_id: siswa.id,
      kelas_id: selectedKelas,
      tanggal: today,
      status: 'Hadir',
      jam_absen: new Date().toISOString(),
      dicatat_oleh: user.id
    }, { onConflict: 'siswa_id,tanggal' });

    if (error) {
      setStatusMsg('❌ Gagal simpan: ' + error.message);
      return;
    }

    setStatusMsg(`✅ ${siswa.full_name} berhasil absen!`);
    fetchHadirHariIni();
  };

  const formatJam = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4" style={{ background: 'linear-gradient(160deg, #CC0000 0%, #FF3333 60%, #CC0000 100%)' }}>
        <button type="button" onClick={() => { stopScanner(); navigate('/guru/dashboard'); }}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Scan Absensi</h1>
      </div>

      <div className="p-4 space-y-3">
        <select value={selectedKelas} onChange={e => { setSelectedKelas(e.target.value); stopScanner(); }}
          disabled={scanning}
          className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="">-- Pilih Kelas --</option>
          {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
        </select>

        {!scanning ? (
          <button type="button" onClick={startScanner}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            <FiCamera size={18} /> Mulai Scan
          </button>
        ) : (
          <button type="button" onClick={stopScanner}
            className="w-full bg-gray-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            <FiCameraOff size={18} /> Stop Scan
          </button>
        )}

        <div id="qr-reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden' }}></div>

        {statusMsg && (
          <div className="bg-white rounded-xl p-3 text-center font-semibold text-gray-700 shadow-sm">
            {statusMsg}
          </div>
        )}

        {selectedKelas && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">Sudah Hadir Hari Ini ({hadirList.length})</h3>
            {hadirList.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">Belum ada yang absen</p>
            ) : hadirList.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" size={16} />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{item.siswa?.full_name}</p>
                    <p className="text-xs text-gray-400">NIS: {item.siswa?.nis}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">{formatJam(item.jam_absen)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}