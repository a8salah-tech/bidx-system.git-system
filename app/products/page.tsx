'use client'

// ===== الاستيرادات =====
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx';

// ===== الألوان =====
const S = {
  navy: '#0A1628', navy2: '#0F2040', navy3: '#152A52',
  gold: '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.12)',
  white: '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.08)',
  green: '#22C55E', red: '#EF4444', blue: '#3B82F6', amber: '#F59E0B',
  card: 'rgba(255,255,255,0.04)', card2: 'rgba(255,255,255,0.08)',
}

export default function ProductsPage() {
  const router = useRouter()

  // ===== الـ State =====
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [filterCountry, setFilterCountry] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [statusFilter, setStatusFilter] = useState('active')
  const [supplier, setSupplier] = useState<any>(null);
//------

  // ===== تحميل البيانات =====
  useEffect(() => {
    async function fetchData() {
      let query = supabase.from('suppliers').select('id,company_name,main_products,rating,country,city,status')
      if (statusFilter === 'active') query = query.eq('status', 'active')
      const { data } = await query
      setSuppliers(data || [])
      setLoading(false)
    }
    fetchData()
  }, [statusFilter])
//=========


  // 1. دالة التصدير داخل المكون
  const exportToExcel = () => {
    if (!supplier) return alert('لا توجد بيانات لتصديرها');

    const dataToExport = [{
      "اسم الشركة": supplier.company_name,
      "الدولة": supplier.country,
      "المنتجات": supplier.main_products,
      "الموقع": supplier.website || '—',
      "التقييم": supplier.rating
    }];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "بيانات المورد");
    
    // ضبط الاتجاه للعربية
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'] = [{ RTL: true }];

    XLSX.writeFile(workbook, `Bridge_Edge_${supplier.company_name}.xlsx`);
  };

  // ===== بناء خريطة المنتجات =====
  const productMap: Record<string, any[]> = {}
  suppliers.forEach(s => {
    if (!s.main_products) return
    s.main_products.split('،').forEach((p: string) => {
      const name = p.trim()
      if (!name) return
      if (!productMap[name]) productMap[name] = []
      productMap[name].push(s)
    })
  })

  // ===== ترتيب وفلترة المنتجات =====
  const sortedProducts = Object.entries(productMap)
    .sort((a, b) => b[1].length - a[1].length)
    .filter(([name]) => name.includes(search) || search === '')
    .filter(([, sups]) => filterCountry ? sups.some(s => s.country === filterCountry) : true)

  const totalProducts = Object.keys(productMap).length
  const totalSuppliers = suppliers.length
  const mostPopular = sortedProducts[0]

  return (
    // ===== المحتوى الرئيسي فقط — بدون sidebar أو header خارجي =====
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal,sans-serif', direction: 'rtl' }}>

      {/* ===== شريط المعلومات العلوي ===== */}
      
     <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>

        {/* الأزرار على اليمين */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => (true)} style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + إضافة منتج
          </button>
<button 
  style={{ background: S.card2, color: S.white, border: `1px solid rgba(255,255,255,0.18)`, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
>
  📤 تصدير
</button>
        </div>
        </div>

      {/* ===== المحتوى =====  */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ===== الإحصائيات ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'إجمالي المنتجات', val: totalProducts, color: S.gold },
            { label: 'إجمالي الموردين', val: totalSuppliers, color: S.green },
            { label: 'أكثر منتج تكراراً', val: mostPopular ? mostPopular[0] : '—', color: S.blue, small: true },
            { label: 'متوسط منتجات/مورد', val: totalSuppliers ? (Object.values(productMap).reduce((a, v) => a + v.length, 0) / totalSuppliers).toFixed(1) : 0, color: S.amber },
          ].map((s, i) => (
            <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
              <div style={{ fontSize: s.small ? '14px' : '28px', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: S.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ===== البحث والفلاتر ===== */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* البحث */}
          <input type="text" placeholder="🔍 ابحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />

          {/* فلتر الدولة */}
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            style={{ background: S.navy2, color: filterCountry ? S.white : S.muted, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="">كل الدول</option>
            {[...new Set(suppliers.map(s => s.country).filter(Boolean))].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* تبديل العرض */}
          <button onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            style={{ background: S.navy2, color: S.muted, border: `1px solid ${S.border}`, padding: '10px 14px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {viewMode === 'table' ? '⊞ بطاقات' : '☰ جدول'}
          </button>

          {/* فلتر الحالة */}
          <div style={{ display: 'flex', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            {[{ key: 'active', label: 'نشط' }, { key: 'all', label: 'الكل' }].map(t => (
              <button key={t.key} onClick={() => setStatusFilter(t.key)}
                style={{ padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: statusFilter === t.key ? S.green : 'transparent', color: statusFilter === t.key ? '#fff' : S.muted, transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>

        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '80px 0' }}>جاري التحميل...</div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

            {/* ===== الجدول ===== */}
            {viewMode === 'table' && (
              <div style={{ flex: selectedProduct ? '0 0 55%' : '1', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                      {['#', 'المنتج', 'عدد الموردين', 'التوزيع', 'متوسط التقييم', 'الدول'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '10px', color: S.muted, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map(([name, sups], i) => {
                      const avgRating = (sups.reduce((a, s) => a + (s.rating || 0), 0) / sups.length).toFixed(1)
                      const countries = [...new Set(sups.map(s => s.country).filter(Boolean))]
                      const isSelected = selectedProduct === name
                      return (
                        <tr key={name} onClick={() => setSelectedProduct(isSelected ? null : name)}
                          style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, background: isSelected ? 'rgba(201,168,76,0.08)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 0.15s', height: '48px' }}>

                          {/* الرقم */}
                          <td style={{ padding: '12px 14px', fontSize: '11px', color: S.muted, textAlign: 'right' }}>{i + 1}</td>

                          {/* اسم المنتج */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', direction: 'rtl' }}>
                            <div style={{ display: 'flex-start', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', direction: 'rtl' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>📦 {name}</span>
                                {i === 0 && <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(201,168,76,0.12)', color: S.gold, fontWeight: 700, marginRight: '7px'}}>الأكثر</span>}
                            </div>
                          </td>

                          {/* عدد الموردين */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: S.gold }}>{sups.length}</span>
                            <span style={{ fontSize: '11px', color: S.muted, marginRight: '4px' }}>مورد</span>
                          </td>

                          {/* التوزيع */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: '10px', color: S.muted }}>{((sups.length / totalSuppliers) * 100).toFixed(0)}%</span>
                              <div style={{ width: '60px', height: '4px', background: S.border, borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(sups.length / totalSuppliers) * 100}%`, background: i === 0 ? S.gold : i === 1 ? S.green : S.blue, borderRadius: '2px' }} />
                              </div>
                            </div>
                          </td>

                          {/* متوسط التقييم */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                              {[1,2,3,4,5].map(j => (
                                <svg key={j} width="10" height="10" viewBox="0 0 16 16" style={{ fill: j <= Math.round(Number(avgRating) / 2) ? S.gold : 'rgba(201,168,76,0.2)' }}>
                                  <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
                                </svg>
                              ))}
                              <span style={{ fontSize: '10px', color: S.muted, marginRight: '4px' }}>{avgRating}</span>
                            </div>
                          </td>

                          {/* الدول */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {countries.slice(0, 2).map(c => (
                                <span key={c} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }}>{c}</span>
                              ))}
                              {countries.length > 2 && <span style={{ fontSize: '9px', color: S.muted }}>+{countries.length - 2}</span>}
                            </div>
                          </td>

                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ===== البطاقات ===== */}
            {viewMode === 'cards' && (
              <div style={{ flex: selectedProduct ? '0 0 55%' : '1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {sortedProducts.map(([name, sups], i) => {
                  const avgRating = (sups.reduce((a, s) => a + (s.rating || 0), 0) / sups.length).toFixed(1)
                  const isSelected = selectedProduct === name
                  return (
                    <div key={name} onClick={() => setSelectedProduct(isSelected ? null : name)}
                      style={{ background: isSelected ? S.navy3 : S.navy2, border: `1px solid ${isSelected ? S.gold : S.border}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>📦</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>{name}</div>
                      {i === 0 && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(201,168,76,0.12)', color: S.gold, fontWeight: 700 }}>الأكثر</span>}
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: S.muted }}>{avgRating} ⭐</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: S.gold }}>{sups.length} مورد</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ===== لوحة تفاصيل المنتج ===== */}
            {selectedProduct && productMap[selectedProduct] && (
              <div style={{ flex: '0 0 43%', background: S.navy2, border: `1px solid ${S.gold}`, borderRadius: '14px', padding: '20px', position: 'sticky', top: 0, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>📦 {selectedProduct}</div>
                    <div style={{ fontSize: '11px', color: S.muted, marginTop: '2px' }}>{productMap[selectedProduct].length} مورد يبيع هذا المنتج</div>
                  </div>
                </div>

                {/* إحصائيات */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'من الموردين', val: ((productMap[selectedProduct].length / totalSuppliers) * 100).toFixed(0) + '%', color: S.gold },
                    { label: 'متوسط التقييم', val: (productMap[selectedProduct].reduce((a, s) => a + (s.rating || 0), 0) / productMap[selectedProduct].length).toFixed(1), color: S.green },
                    { label: 'عدد الدول', val: [...new Set(productMap[selectedProduct].map(s => s.country).filter(Boolean))].length, color: S.blue },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: S.card, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: stat.color }}>{stat.val}</div>
                      <div style={{ fontSize: '10px', color: S.muted, marginTop: '4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* قائمة الموردين */}
                <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '10px', textAlign: 'right' }}>الموردين</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productMap[selectedProduct].map(s => (
                    <div key={s.id} onClick={() => router.push(`/suppliers/${s.id}`)}
                      style={{ background: S.card2, borderRadius: '10px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1,2,3,4,5].map(i => (
                            <svg key={i} width="10" height="10" viewBox="0 0 16 16" style={{ fill: i <= Math.round((s.rating || 0) / 2) ? S.gold : 'rgba(201,168,76,0.2)' }}>
                              <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
                            </svg>
                          ))}
                        </div>
                        <span style={{ fontSize: '10px', color: S.muted }}>{s.rating || 0}/10</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{s.company_name}</div>
                        <div style={{ fontSize: '10px', color: S.muted }}>{s.country || '—'}{s.city ? ` / ${s.city}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
