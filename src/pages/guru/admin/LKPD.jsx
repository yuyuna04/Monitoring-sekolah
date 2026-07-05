import React from 'react';
import ModulTemplate from './ModulTemplate';

export default function LKPDGuru() {
  return (
    <ModulTemplate
      tableName="lkpd"
      judul="LKPD"
      subjudul="Lembar Kerja Peserta Didik"
      icon="📋"
      iconBg="#ECFEFF"
      iconColor="#06B6D4"
      extraFields={[
        { key: 'judul', label: 'Judul LKPD *', type: 'text', placeholder: 'Judul LKPD' },
        { key: 'tujuan', label: 'Tujuan', type: 'textarea', placeholder: 'Tujuan LKPD...' },
        { key: 'petunjuk', label: 'Petunjuk Pengerjaan', type: 'textarea', placeholder: 'Petunjuk untuk siswa...' },
      ]}
    />
  );
}