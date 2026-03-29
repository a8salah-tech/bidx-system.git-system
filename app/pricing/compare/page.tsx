'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from "../../components/AppShell"

const tajawalFont = `'Tajawal', sans-serif`;
const S = {
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  white:   '#FAFAF8',
  muted:   '#8A9BB5',
  navy2:   '#0F2040',
  border:  'rgba(201,168,76,0.15)',
  navyBg:  '#081226',
  green:   '#10B981',
  red:     '#EF4444',
};

const fM = (v: any) => {
  const n = parseFloat(v);
  return isNaN(n) ? "0.00" : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function BridgeEdgePricingRadar() {
  const [saving, setSaving] = useState(false)
  const [allSuppliers, setAllSuppliers] = useState<any[]>([])
  const [availableProducts, setAvailableProducts] = useState<string[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [rows, setRows] = useState(Array(5).fill({ 
    supplierId: '', 
    price: '', 
    qty: '1', 
    unit: 'قطعة', 
    status: 'انتظار', 
    notes: '' 
  }))

  useEffect(() => {
    fetchInitialData()
    fetchHistory()
  }, [])

  async function fetchInitialData() {
    const { data: suppliers } = await supabase.from('suppliers').select('*')
    setAllSuppliers(suppliers || [])
    if (suppliers) {
      const pSet = new Set<string>()
      suppliers.forEach(s => {
        if (s.main_products) {
          s.main_products.split(/[،,]/).forEach((p: string) => pSet.add(p.trim()))
        }
      })
      setAvailableProducts(Array.from(pSet))
    }
  }

  async function fetchHistory() {
    const { data } = await supabase.from('pricing_sessions').select('*').order('created_at', { ascending: false })
    setHistory(data || [])
  }

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const deleteSession = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الجلسة من السجل؟')) {
      const { error } = await supabase.from('pricing_sessions').delete().eq('id', id);
      if (!error) fetchHistory();
    }
  }

  const activePrices = rows.map(r => parseFloat(r.price)).filter(p => !isNaN(p) && p > 0)
  const minPrice = activePrices.length ? Math.min(...activePrices) : 0
  const maxPrice = activePrices.length ? Math.max(...activePrices) : 0
  const avgPrice = activePrices.length ? (activePrices.reduce((a, b) => a + b, 0) / activePrices.length) : 0

  const filteredSuppliers = selectedProduct 
    ? allSuppliers.filter(s => s.main_products?.toLowerCase().includes(selectedProduct.toLowerCase()))
    : allSuppliers;

  const saveSession = async () => {
    if(saving) return
    setSaving(true)
    try {
      if (!selectedProduct) throw new Error('حدد المنتج المستهدف أولاً')
      const acceptedRow = rows.find(r => r.status === 'مقبول')
      if (!acceptedRow || !acceptedRow.price) throw new Error('يجب تعميد مورد واحد على الأقل (مقبول)')

      const rejectedSummary = rows
        .filter(r => r.supplierId && r.status !== 'مقبول')
        .map(r => {
          const sName = allSuppliers.find(s => s.id === r.supplierId)?.company_name || 'مورد';
          return `${sName}: ${r.price}`;
        }).join(' | ')

      const { error } = await supabase.from('pricing_sessions').insert([{
        product_name: selectedProduct,
        min_price: minPrice,
        avg_price: avgPrice,
        max_price: maxPrice,
        accepted_supplier: allSuppliers.find(s => s.id === acceptedRow.supplierId)?.company_name || 'مورد معتمد',
        accepted_price: Number(acceptedRow.price),
        rejected_summary: rejectedSummary
      }])

      if (error) throw error
      alert('تم اعتماد وحفظ الجلسة بنجاح ✅');
      fetchHistory();
      setRows(Array(5).fill({ supplierId: '', price: '', qty: '1', unit: 'قطعة', status: 'انتظار', notes: '' }));
      setSelectedProduct('');
    } catch(err:any) { alert(err.message) }
    finally { setSaving(false) }
  }

 
  return (
    <AppShell>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { font-family: ${tajawalFont} !important; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}} />

      <div style={{ backgroundColor: S.navyBg, minHeight: '100vh', direction: 'rtl', padding: '30px', color: S.white }}>
        
        {/* Radar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h1 style={{ color: S.gold, margin: 0, fontSize: '22px', fontWeight: 800 }}> مقارنة أسعار الموردين </h1>
              <p style={{ fontSize: '11px', color: S.muted, margin: '4px 0 0 0' }}> يتم إرسال الأسعار المحدثة لكل مورد في صفحته الخاصة بشكل آلي بعد الضغط علي حفظ التقرير
</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <StatCard label="الأدنى" value={fM(minPrice)} color={S.green} />
              <StatCard label="المتوسط" value={fM(avgPrice)} color={S.gold2} />
              <StatCard label="الأعلى" value={fM(maxPrice)} color={S.red} />
            </div>
        </div>

        {/* Product Selection */}
        <div style={{ background: S.navy2, padding: '12px 20px', borderRadius: '10px', border: `1px solid ${S.border}`, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ color: S.gold, fontWeight: 700, fontSize: '12px' }}>📦 المنتج المستهدف:</div>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${S.border}`, background: S.navyBg, color: S.white, fontSize: '13px', outline: 'none' }}>
              <option value="">-- ابحث عن منتج --</option>
              {availableProducts.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>
        </div>

        {/* Comparison Table */}
        <div style={{ background: S.navy2, borderRadius: '12px', border: `1px solid ${S.border}`, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                {['#', 'المورد', 'سعر الوحدة', 'الكمية', 'الوحدة', 'إجمالي العرض', 'الحالة', 'ملاحظات'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', fontSize: '10px', color: S.muted, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const total = (parseFloat(row.price) || 0) * (parseFloat(row.qty) || 0);
                return (
                  <tr key={index} style={{ borderBottom: `1px solid ${S.border}` }}>
                    <td style={{ padding: '12px', color: S.muted, textAlign: 'center', fontSize: '11px' }}>{index + 1}</td>
                    <td style={{ padding: '8px' }}>
                      <select value={row.supplierId} onChange={(e) => handleRowChange(index, 'supplierId', e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${S.border}`, background: S.navyBg, color: S.white, fontSize: '12px' }}>
                        <option value="">-- المورد --</option>
                        {filteredSuppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" value={row.price} onChange={(e) => handleRowChange(index, 'price', e.target.value)}
                        style={{ width: '90px', padding: '8px', borderRadius: '6px', border: `1px solid ${S.border}`, background: S.navyBg, color: S.green, fontWeight: 700, textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" value={row.qty} onChange={(e) => handleRowChange(index, 'qty', e.target.value)}
                        style={{ width: '110px', padding: '8px', borderRadius: '6px', border: `1px solid ${S.border}`, background: S.navyBg, color: S.white, textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="text" value={row.unit} onChange={(e) => handleRowChange(index, 'unit', e.target.value)}
                        style={{ width: '60px', padding: '8px', borderRadius: '6px', border: `1px solid ${S.border}`, background: S.navyBg, color: S.muted, textAlign: 'center', fontSize: '11px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ background: 'rgba(201,168,76,0.08)', padding: '8px', borderRadius: '6px', border: `1px solid ${S.border}`, color: S.gold2, fontWeight: 800, textAlign: 'center', fontSize: '12px', minWidth: '100px' }}>
                        {fM(total)}
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select value={row.status} onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                        style={{ width: '85px', padding: '6px', borderRadius: '6px', background: row.status === 'مقبول' ? S.green : row.status === 'مرفوض' ? S.red : S.navyBg, color: S.white, fontWeight: 700, fontSize: '10px', textAlign: 'center', border: 'none' }}>
                        <option value="انتظار">انتظار</option>
                        <option value="مقبول">مقبول</option>
                        <option value="مرفوض">مرفوض</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="text" value={row.notes} onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${S.border}`, background: S.navyBg, color: S.white, fontSize: '11px' }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <button onClick={saveSession} disabled={saving}
            style={{ width: '100%', padding: '16px', background: S.gold, color: S.navy2, fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            {saving ? 'جاري معالجة البيانات...' : 'اعتماد وحفظ تقرير التسعير 💾'}
          </button>
        </div>

        {/* History Table with Rejected Offers */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ color: S.gold, fontSize: '16px', marginBottom: '15px', fontWeight: 700 }}>📜 سجل جلسات التسعير السابقة</h3>
          <div style={{ background: S.navy2, borderRadius: '12px', border: `1px solid ${S.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
<thead>
  <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
     <th style={{ padding: '12px 15px', fontSize: '10px', color: S.muted, fontWeight: 700 }}>المنتج</th>
     
     {/* قم بتغيير العرض هنا (مثلاً 180px أو 200px) */}
     <th style={{ padding: '12px 15px', fontSize: '10px', color: S.muted, fontWeight: 700, width: '200px' }}>المورد المعتمد</th>
     
     <th style={{ padding: '12px 15px', fontSize: '10px', color: S.muted, fontWeight: 700 }}>السعر المعتمد</th>
     <th style={{ padding: '12px 15px', fontSize: '10px', color: S.muted, fontWeight: 700 }}>العروض الأخرى (المرفوضة)</th>
     <th style={{ padding: '12px 15px', fontSize: '10px', color: S.muted, fontWeight: 700 }}>التاريخ</th>
     <th style={{ padding: '12px 15px', fontSize: '10px', color: S.muted, fontWeight: 700 }}>حذف</th>
  </tr>
</thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${S.border}` }}>
                    <td style={{ padding: '15px', fontSize: '12px', fontWeight: 700 }}>{h.product_name}</td>
                    <td style={{ padding: '15px' }}>
                       <span style={{ color: S.green, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>{h.accepted_supplier}</span>
                    </td>
                    <td style={{ padding: '15px', fontWeight: 800, fontSize: '13px', color: S.white }}>{fM(h.accepted_price)}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {h.rejected_summary ? h.rejected_summary.split(' | ').map((rs: string, i: number) => (
                          <span key={i} style={{ fontSize: '10px', background: 'rgba(239,68,68,0.08)', color: S.muted, padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>
                            {rs}
                          </span>
                        )) : <span style={{ color: S.muted, fontSize: '10px' }}>لا توجد عروض أخرى</span>}
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: S.muted, fontSize: '11px' }}>{new Date(h.created_at).toLocaleDateString('ar-EG')}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={() => deleteSession(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.red, fontSize: '16px' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, color }: any) {
  return (
    <div style={{ background: S.navy2, padding: '8px 15px', borderRadius: '10px', border: `1px solid ${S.border}`, textAlign: 'center', minWidth: '100px' }}>
      <div style={{ color: S.muted, fontSize: '9px', fontWeight: 700, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 900, color: color }}>{value}</div>
    </div>
  )
}