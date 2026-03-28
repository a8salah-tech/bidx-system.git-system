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
  borderG: 'rgba(201,168,76,0.15)',
  navyBg:  '#081226',
  green:   '#10B981',
  red:     '#EF4444',
};

export default function BridgeEdgePricingRadar() {
  const [saving,setSaving] = useState(false)
  const [allSuppliers, setAllSuppliers] = useState<any[]>([])
  const [availableProducts, setAvailableProducts] = useState<string[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  
  // إضافة field الملاحظات في الحالة الابتدائية
  const [rows, setRows] = useState(Array(5).fill({ supplierId: '', price: '', status: 'انتظار', notes: '' }))

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

// دالة الحذف لازم تكون هنا عشان "تشوف" الدالة اللي فوقها
const deleteSession = async (id: string) => {
  const confirmDelete = window.confirm('هل أنت متأكد من حذف هذه الجلسة؟');
  if (confirmDelete) {
    const { error } = await supabase.from('pricing_sessions').delete().eq('id', id);
    if (error) {
      alert(`فشل الحذف: ${error.message}`);
    } else {
      alert('تم الحذف بنجاح ✅');
      // تأكد إن الاسم هنا مطابق تماماً لاسم الدالة اللي فوق
      await fetchHistory(); 
    }
  }
};

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const currentPrices = rows.map(r => parseFloat(r.price)).filter(p => !isNaN(p))
  const minPrice = currentPrices.length ? Math.min(...currentPrices) : 0
  const avgPrice = currentPrices.length ? (currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length).toFixed(2) : 0
  const maxPrice = currentPrices.length ? Math.max(...currentPrices) : 0

  const filteredSuppliers = selectedProduct 
    ? allSuppliers.filter(s => s.main_products?.toLowerCase().includes(selectedProduct.toLowerCase()))
    : allSuppliers;

const saveSession = async () => {

if(saving) return

try{

setSaving(true)

if (!selectedProduct) {
  setSaving(false)
  return alert('يرجى تحديد المنتج أولاً')
}
    const acceptedRow = rows.find(r => r.status === 'مقبول')
  if (!acceptedRow || !acceptedRow.price){
  setSaving(false)
  return alert('يرجى اختيار مورد مقبول وإدخال سعره')
}
    const rejectedSummary = rows
      .filter(r => r.supplierId && r.supplierId !== '')
      .map(r => {
        const name = allSuppliers.find(s => s.id === r.supplierId)?.company_name || 'مورد'
        const noteText = r.notes ? ` (${r.notes})` : ''
        return `${name}: ${r.price}${noteText} [${r.status}]`
      }).join(' | ')

    const payload = {
      product_name: selectedProduct,
      min_price: Number(minPrice),
      avg_price: Number(avgPrice),
      max_price: Number(maxPrice),
      accepted_supplier: allSuppliers.find(s => s.id === acceptedRow.supplierId)?.company_name || 'مورد معتمد',
      accepted_price: Number(acceptedRow.price),
      rejected_summary: rejectedSummary
    }

    const { error } = await supabase
      .from('pricing_sessions')
      .insert([payload])

    if (error) {
      alert(`فشل الإرسال: ${error.message}`)
      return
    }

    /* ⭐ الجزء الجديد */
const historyPayload = rows
.filter(r => r.supplierId && r.price)
.map(r => ({
  supplier_id: r.supplierId,
  product_name: selectedProduct,
  price: Number(r.price),
  status: r.status,
  notes: r.notes || null
}))

   if (historyPayload.length > 0) {

  console.log("historyPayload", historyPayload)
      await supabase
        .from('supplier_prices_history')
        .insert(historyPayload)
    }

    alert('تم اعتماد الجلسة وحفظ الملاحظات بنجاح ✅')

    fetchHistory()

    setRows(Array(5).fill({
      supplierId: '',
      price: '',
      status: 'انتظار',
      notes: ''
    }))

    setSelectedProduct('')

}catch(err:any){

alert(`خطأ: ${err.message}`)

}finally{

setSaving(false)

}
}

  return (
    <AppShell>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        * { font-family: ${tajawalFont} !important; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}} />

      <div style={{ backgroundColor: S.navyBg, minHeight: '100vh', direction: 'rtl', padding: '25px', color: S.white }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h1 style={{ color: S.gold, margin: 0, fontSize: '22px', fontWeight: 700 }}> مقارنة أسعار </h1>
              <div style={{ fontSize: '12px', color: S.muted, fontWeight: 500 }}>
                يتم إرسال الأسعار المحدثة لكل مورد في صفحته الخاصة بشكل آلي بعد الضغط علي حفظ التقرير
           </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
  <StatCard label="أقل عرض" value={`${minPrice}`} color={S.green} />
  <StatCard label="المتوسط" value={`${avgPrice}`} color={S.gold2} />
  <StatCard label="أعلى عرض" value={`${maxPrice}`} color={S.red} />
</div>
        </div>

        <div style={{ background: S.navy2, padding: '20px', borderRadius: '16px', border: `1px solid ${S.borderG}`, marginBottom: '25px' }}>
            <label style={{ display: 'block', color: S.gold2, fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>📦 المنتج المستهدف</label>
            <select 
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${S.borderG}`, background: S.navyBg, color: S.white, fontSize: '14px', outline: 'none' }}
            >
              <option value="">-- ابحث عن منتج --</option>
              {availableProducts.map((prod, idx) => (
                <option key={idx} value={prod}>{prod}</option>
              ))}
            </select>
        </div>

        <div style={{ background: S.navy2, borderRadius: '16px', border: `1px solid ${S.borderG}`, overflow: 'hidden', marginBottom: '40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'rgba(201, 168, 76, 0.08)', color: S.gold, fontSize: '12px' }}>
                <th style={{ padding: '15px', width: '50px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '15px' }}>المورد</th>
                <th style={{ padding: '15px' }}>السعر </th>
                <th style={{ padding: '15px' }}>الحالة</th>
                <th style={{ padding: '15px' }}>الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} style={{ borderBottom: `1px solid ${S.borderG}` }}>
                  <td style={{ padding: '12px', color: S.muted, textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: '12px' }}>
                    <select 
                      value={row.supplierId}
                      onChange={(e) => handleRowChange(index, 'supplierId', e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${S.borderG}`, background: S.navyBg, color: S.white, fontSize: '13px' }}
                    >
                      <option value="">-- اختر مورد --</option>
                      {filteredSuppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="number" 
                      value={row.price}
                      onChange={(e) => handleRowChange(index, 'price', e.target.value)}
                      placeholder="0.00"
                      style={{ width: '90px', padding: '10px', borderRadius: '8px', border: `1px solid ${S.borderG}`, background: S.navyBg, color: S.green, fontWeight: 700, textAlign: 'center' }} 
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select 
                      value={row.status}
                      onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                      style={{ 
                        width: '95px', padding: '8px', borderRadius: '8px', border: 'none',
                        background: row.status === 'مقبول' ? S.green : row.status === 'مرفوض' ? S.red : S.navyBg,
                        color: S.white, fontWeight: 700, fontSize: '11px', textAlign: 'center'
                      }}
                    >
                      <option value="انتظار">انتظار</option>
                      <option value="مقبول">مقبول ✅</option>
                      <option value="مرفوض">مرفوض ❌</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="text" 
                      value={row.notes}
                      onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                      placeholder="جودة، شحن..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${S.borderG}`, background: S.navyBg, color: S.white, fontSize: '12px' }} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
<button
  onClick={saveSession}
  disabled={saving}
  style={{
    width:'100%',
    padding:'16px',
    background:saving ? S.muted : S.gold,
    color:S.navy2,
    fontWeight:800,
    border:'none',
    cursor:saving ? 'not-allowed':'pointer',
    fontSize:'16px'
  }}
>
  {saving ? 'جارٍ الحفظ...' : 'حفظ التقرير 💾'}
</button>

        </div>

        <h3 style={{ color: S.gold, marginBottom: '15px', fontSize: '18px' }}>📜 سجل العمليات</h3>
        <div style={{ background: S.navy2, borderRadius: '16px', border: `1px solid ${S.borderG}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', color: S.gold2, fontSize: '12px' }}>
                <th style={{ padding: '15px', width: '50px', textAlign: 'center' }}>#</th>
<th style={{ padding: '15px' }}>المنتج</th>
                <th style={{ padding: '15px' }}>المعتمد</th>
                <th style={{ padding: '15px' }}>السعر</th>
                <th style={{ padding: '15px' }}>التفاصيل والملاحظات</th>
                <th style={{ padding: '15px' }}>التاريخ</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
 <tbody style={{ fontSize: '13px' }}>
  {history.map((item, idx) => (
    <tr key={item.id || idx} style={{ borderBottom: `1px solid ${S.borderG}` }}>
      {/* 1. الرقم التسلسلي */}
      <td style={{ padding: '15px', color: S.muted, textAlign: 'center', fontWeight: 500 }}>
        {idx + 1}
      </td>

      {/* 2. اسم المنتج */}
      <td style={{ padding: '15px', fontWeight: 700 }}>{item.product_name}</td>

      {/* 3. المورد المعتمد */}
      <td style={{ padding: '15px', color: S.green }}>{item.accepted_supplier}</td>

      {/* 4. السعر المعتمد */}
      <td style={{ padding: '15px', fontWeight: 700 }}>{item.accepted_price}</td>

      {/* 5. التفاصيل والملاحظات */}
      <td style={{ padding: '15px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {item.rejected_summary?.split(' | ').map((rs: string, i: number) => (
            <span key={i} style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', color: S.muted, padding: '3px 10px', borderRadius: '6px', border: `1px solid ${S.borderG}` }}>
              {rs}
            </span>
          ))}
        </div>
      </td>

      {/* 6. التاريخ */}
      <td style={{ padding: '15px', color: S.muted, fontSize: '11px' }}>
        {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : '---'}
      </td>

      {/* 7. زر الحذف */}
      <td style={{ padding: '15px', textAlign: 'center' }}>
        <button 
          onClick={() => deleteSession(item.id)} 
          style={{ background: 'none', border: 'none', color: S.red, cursor: 'pointer', fontSize: '16px' }}
        >
          🗑️
        </button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, color }: any) {
  return (
    <div style={{ background: S.navy2, padding: '10px 18px', borderRadius: '12px', border: `1px solid ${S.borderG}`, textAlign: 'center', minWidth: '100px' }}>
      <div style={{ color: S.muted, fontSize: '10px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: color }}>{value}</div>
    </div>
  )
}