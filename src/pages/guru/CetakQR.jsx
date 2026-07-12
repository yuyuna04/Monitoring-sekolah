import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';

export default function CetakQRGuru() {
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { if (selectedKelas) fetchSiswa(); }, [selectedKelas]); // eslint-disable-line

  const fetchKelas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('kelas').select('*').eq('wali_kelas_id', user.id).order('nama_kelas');
    setKelasList(data || []);
  };

  const fetchSiswa = async () => {
    setLoading(true);
    const { data } = await supabase.from('siswa').select('*').eq('kelas_id', selectedKelas).order('full_name');
    setSiswaList(data || []);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4 no-print" style={{ background: 'linear-gradient(160deg, #CC0000 0%, #FF3333 60%, #CC0000 100%)' }}>
        <button type="button" onClick={() => navigate('/guru/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Cetak Kartu QR Absensi</h1>
      </div>

      <div className="p-4 no-print">
        <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}
          className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 mb-3">
          <option value="">-- Pilih Kelas --</option>
          {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
        </select>
        {siswaList.length > 0 && (
          <button type="button" onClick={handlePrint}
            className="w-full bg-red-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2">
            <FiPrinter size={18} /> Cetak Semua Kartu
          </button>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {siswaList.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm text-center border-2 border-dashed border-gray-200">
                <QRCodeSVG value={s.nis || s.id} size={120} className="mx-auto mb-2" />
                <p className="font-bold text-gray-800 text-sm">{s.full_name}</p>
                <p className="text-xs text-gray-400">NIS: {s.nis}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}