import React from 'react';
import ModulTemplate from './ModulTemplate';

export default function BahanAjarGuru() {
  return (
    <ModulTemplate
      tableName="bahan_ajar"
      judul="Bahan Ajar"
      subjudul="Materi Pembelajaran"
      icon="📖"
      iconBg="#FEF2F2"
      iconColor="#EF4444"
      extraFields={[
        { key: 'judul', label: 'Judul Bahan Ajar *', type: 'text', placeholder: 'Judul materi' },
        { key: 'deskripsi', label: 'Deskripsi', type: 'textarea', placeholder: 'Deskripsi singkat materi...' },
      ]}
    />
  );
}