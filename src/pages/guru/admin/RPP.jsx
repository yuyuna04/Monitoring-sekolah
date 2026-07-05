import React from 'react';
import ModulTemplate from './ModulTemplate';

export default function RPPGuru() {
  return (
    <ModulTemplate
      tableName="rpp"
      judul="RPP / Modul Ajar"
      subjudul="Rencana Pelaksanaan Pembelajaran"
      icon="📝"
      iconBg="#EFF6FF"
      iconColor="#3B82F6"
      extraFields={[
        { key: 'judul', label: 'Judul RPP *', type: 'text', placeholder: 'Judul modul ajar' },
        { key: 'pertemuan_ke', label: 'Pertemuan Ke', type: 'number', placeholder: '1' },
        { key: 'alokasi_waktu', label: 'Alokasi Waktu', type: 'text', placeholder: '2 x 35 menit' },
        { key: 'tujuan_pembelajaran', label: 'Tujuan Pembelajaran', type: 'textarea', placeholder: 'Tujuan...' },
        { key: 'kegiatan_pembuka', label: 'Kegiatan Pembuka', type: 'textarea', placeholder: 'Salam, doa, apersepsi...' },
        { key: 'kegiatan_inti', label: 'Kegiatan Inti', type: 'textarea', placeholder: 'Eksplorasi, elaborasi...' },
        { key: 'kegiatan_penutup', label: 'Kegiatan Penutup', type: 'textarea', placeholder: 'Refleksi, kesimpulan...' },
      ]}
    />
  );
}