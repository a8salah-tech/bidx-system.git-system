'use client'

import React from 'react';

// التنسيقات الثابتة لهوية Bridge Edge البصرية
const S = {
  navy2: '#0F2040',
  gold: '#C9A84C',
  border: 'rgba(255,255,255,0.08)',
  white: '#FAFAF8',
  rowHover: 'rgba(201,168,76,0.05)'
};

interface TableProps {
  headers: string[];
  children: React.ReactNode; // هنا نضع صفوف الجدول (tr)
}

export default function UnifiedTable({ headers, children }: TableProps) {
  return (
    <div style={{
      background: S.navy2,
      borderRadius: '12px',
      overflow: 'hidden',
      border: `1px solid ${S.border}`,
      width: '100%',
      direction: 'rtl'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
            {headers.map((header, index) => (
              <th key={index} style={{
                padding: '16px',
                color: S.gold,
                fontSize: '14px',
                fontWeight: 700,
                borderBottom: `2px solid rgba(201,168,76,0.2)`
              }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ color: S.white }}>
          {children}
        </tbody>
      </table>
    </div>
  );
}