import React from 'react';
import ModulTemplate from './ModulTemplate';

export default function PenilaianGuru() {
  return (
    <ModulTemplate
      tableName="rubrik_penilaian"
      judul="Penilaian"
      subjudul="Rubrik & Instrumen Penilaian"
      icon="📊"
      iconBg="#FFF7ED"
      iconColor="#F97316"
      extraFields={[
        { key: 'judul', label: 'Judul Instrumen *', type: 'text', placeholder: 'Nama rubrik/instrumen' },
        { key: 'jenis', label: 'Jenis Penilaian', type: 'select', options: ['Formatif', 'Sumatif', 'Unjuk Kerja', 'Portofolio', 'Sikap'] },
      ]}
    />
  );
}