import React from 'react';
import ModulTemplate from './ModulTemplate';

export default function TPGuru() {
  return (
    <ModulTemplate
      tableName="tp"
      judul="TP"
      subjudul="Tujuan Pembelajaran"
      icon="🎯"
      iconBg="#FDF2F8"
      iconColor="#EC4899"
      extraFields={[
        { key: 'nomor_pertemuan', label: 'Pertemuan Ke', type: 'number', placeholder: '1' },
        { key: 'tujuan', label: 'Tujuan Pembelajaran *', type: 'textarea', placeholder: 'Peserta didik mampu...' },
        { key: 'indikator', label: 'Indikator Pencapaian', type: 'textarea', placeholder: 'Indikator...' },
      ]}
    />
  );
}