import React from 'react';

export default function SavingsBadge() {
  const history = JSON.parse(localStorage.getItem("trade_history") || "[]");
  const totalSaved = history.reduce((acc: number, item: any) => acc + parseFloat(item.savings), 0);

  if (totalSaved <= 0) return null;

  return (
    <div style={{ backgroundColor: '#1e293b', border: '1px solid #4caf50', borderRadius: '10px', padding: '10px', marginBottom: '15px', textAlign: 'center' }}>
      <span style={{ fontSize: '11px', color: '#8897a7' }}>💰 AHORRO TOTAL VS REMITLY:</span>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>{totalSaved.toFixed(2)} €</div>
    </div>
  );
}
