'use client';

import React from 'react';
import { motion } from 'framer-motion';

const C = {
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  white:   '#FAFAF8',
  muted:   '#8A9BB5',
  navy4:   '#111D35',
  borderG: 'rgba(201,168,76,0.2)',
};

const nodes = [
  { id: 'trigger', type: 'إدخال', label: '📧 وصول إيميل طلب شحنة جديد', x: 40, y: 40 },
  { id: 'agent',   type: 'وكيل ذكي', label: '🤖 وكيل بدلكس لتحليل الطلب', x: 220, y: 40 },
  { id: 'action1', type: 'إجراء',   label: '📦 التحقق من المخزون تلقائياً', x: 220, y: 160 },
  { id: 'action2', type: 'إجراء',   label: '🚚 حجز الشحنة مع المورد', x: 420, y: 160 },
  { id: 'end',     type: 'إخراج',   label: '✅ تحديث لوحة التحكم وإخطار العميل', x: 420, y: 40 },
];

const connections = [
  { from: 'trigger', to: 'agent' },
  { from: 'agent',   to: 'action1' },
  { from: 'action1', to: 'action2' },
  { from: 'action2', to: 'end' },
];

export default function AutomationCanvas() {
  return (
    <div style={{
      width: '100%', 
      height: '100%', 
      position: 'relative', 
      background: `linear-gradient(135deg, ${C.navy4} 0%, #061020 100%)`,
      borderRadius: '28px', 
      border: `1px solid ${C.gold}`, 
      overflow: 'hidden',
      direction: 'rtl'
    }}>
      
      <div style={{ position: 'absolute', top: 15, right: 20, fontSize: '11px', color: C.gold, fontWeight: 700, zIndex: 10, pointerEvents: 'none' }}>
        محرك الأتمتة الذكي | BidLX Orchestrator
      </div>

      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          return (
            <React.Fragment key={i}>
              <motion.path
                d={`M ${fromNode.x + 160} ${fromNode.y + 35} L ${toNode.x} ${toNode.y + 35}`}
                stroke={C.borderG} strokeWidth="1.5" fill="none"
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ duration: 1.5, delay: i * 0.4 }}
              />
              <motion.circle
                r="3" fill={C.gold2}
                animate={{ cx: [fromNode.x + 160, toNode.x], cy: [fromNode.y + 35, toNode.y + 35] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
              />
            </React.Fragment>
          );
        })}
      </svg>

      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          style={{
            position: 'absolute', left: node.x, top: node.y, width: '180px', minHeight: '60px',
            background: 'rgba(10, 22, 40, 0.95)', padding: '12px 15px', borderRadius: '12px',
            border: node.type === 'وكيل ذكي' ? `2px solid ${C.gold}` : `1px solid ${C.borderG}`,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)', zIndex: 2, cursor: 'grab', display: 'flex', flexDirection: 'column', gap: '5px'
          }}
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: i * 0.2 }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 15px ${C.gold}` }}
          drag dragConstraints={{ top: 0, left: 0, right: 400, bottom: 300 }}
        >
          <div style={{ fontSize: '10px', color: node.type === 'وكيل ذكي' ? C.gold2 : C.muted, fontWeight: 800 }}>
            {node.type}
          </div>
          <div style={{ fontSize: '12px', color: C.white, fontWeight: 500, lineHeight: 1.4 }}>
            {node.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}