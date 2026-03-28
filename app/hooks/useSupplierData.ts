'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useSupplierData(id: string) {

  const [supplier, setSupplier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pricingHistory, setPricingHistory] = useState<any[]>([])

  // ===============================
  // Fetch Function
  // ===============================

  const fetchData = useCallback(async () => {
    if (!id) return

    setLoading(true)

    try {

      // 1️⃣ بيانات المورد
      const { data: sData, error: sError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()

      if (sError) throw sError

      setSupplier(sData || null)

      // 2️⃣ سجل الرادار
      const { data: hData, error: hError } = await supabase
        .from('supplier_individual_history')
        .select('*')
        .eq('supplier_id', id)
        .order('created_at', { ascending: false })

      if (hError) throw hError

      setPricingHistory(hData || [])

    } catch (error) {

      console.error("Error fetching supplier data:", error)

    } finally {

      setLoading(false)

    }

  }, [id])

  useEffect(() => {

    fetchData()

  }, [fetchData])


  // ===============================
  // Stats Calculation (Optimized)
  // ===============================

  const stats = useMemo(() => {

    const totalDeals = pricingHistory?.length || 0

    const wonDeals =
      pricingHistory?.filter(h => h.status === 'مقبول').length || 0

    const lostDeals =
      pricingHistory?.filter(h => h.status === 'مرفوض').length || 0

    const totalAmount =
      pricingHistory
        ?.filter(h => h.status === 'مقبول')
        ?.reduce((sum, item) => sum + (Number(item.my_price) || 0), 0) || 0

    const avgRating = supplier
      ? Math.round(
          (
            ((supplier.quality_rating || 0) +
              (supplier.delivery_rating || 0) +
              (supplier.comm_rating || 0) +
              (supplier.price_rating || 0) +
              (supplier.flex_rating || 0)) /
            5
          ) * 10
        ) / 10
      : 0

    return {

      totalDeals,
      wonDeals,
      lostDeals,
      totalAmount,
      avgRating

    }

  }, [pricingHistory, supplier])


  // ===============================
  // Refresh Function
  // ===============================

  const refresh = async () => {

    await fetchData()

  }


  return {

    supplier,
    loading,
    pricingHistory,
    stats,
    refresh

  }

}