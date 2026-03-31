import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Phone, Calendar, Star, X, Loader2, ChevronRight } from 'lucide-react';
import { useCustomersApi } from '../../hooks/useApi';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

function CustomerDrawer({ customerId, onClose }) {
  const customersApi = useCustomersApi();
  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.get(customerId).then(r => r.data),
  });

  const STATUS_LABELS = { confirmed: 'מאושר', completed: 'הושלם', cancelled: 'בוטל', pending: 'ממתין' };
  const STATUS_COLORS = { confirmed: 'text-tori-600 bg-tori-50', completed: 'text-green-600 bg-green-50', cancelled: 'text-red-500 bg-red-50', pending: 'text-amber-600 bg-amber-50' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
          <h3 className="font-bold text-gray-900 text-lg">פרטי לקוח</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin text-tori-400" />
          </div>
        ) : data ? (
          <div className="p-5 space-y-5">
            {/* Customer header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tori-500 to-tori-700 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                {(data.customer?.name || data.customer?.whatsapp_phone || 'L')[0]}
              </div>
              <div>
                <div className="font-black text-gray-900 text-xl">{data.customer?.name || 'לא ידוע'}</div>
                <a href={`tel:${data.customer?.whatsapp_phone}`} className="text-tori-600 text-sm hover:underline flex items-center gap-1">
                  <Phone size={13} />
                  {data.customer?.whatsapp_phone}
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'ביקורים', value: data.customer?.total_visits || 0 },
                { label: 'הוצאה כוללת', value: `₪${data.stats?.total_spent?.toLocaleString() || 0}` },
                { label: 'נקודות', value: data.customer?.loyalty_points || 0 },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="font-black text-gray-900 text-lg">{s.value}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Appointment history */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3">היסטוריית תורים</h4>
              {data.appointments?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">אין תורים עדיין</p>
              ) : (
                <div className="space-y-2">
                  {data.appointments?.slice(0, 10).map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <Calendar size={16} className="text-tori-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{a.service_name || 'שירות'}</div>
                        <div className="text-gray-500 text-xs">
                          {format(parseISO(a.starts_at), 'd/M/yyyy HH:mm')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || 'text-gray-600 bg-gray-100'}`}>
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                        {a.price > 0 && <span className="text-gray-600 text-xs mt-1">₪{a.price}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data.customer?.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <div className="font-semibold text-amber-800 text-sm mb-1">הערות</div>
                <p className="text-amber-700 text-sm">{data.customer.notes}</p>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const customersApi = useCustomersApi();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => customersApi.list({ search, page, limit: 25 }).then(r => r.data),
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;

  function formatLastVisit(dateStr) {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'd/M/yyyy', { locale: he });
    } catch {
      return '-';
    }
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">לקוחות</h2>
          <p className="text-gray-500 text-sm mt-0.5">{total} לקוחות רשומים</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pr-12 py-3 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-tori-500 focus:ring-1 focus:ring-tori-500 transition-all shadow-sm"
          placeholder="חפש לפי שם או טלפון..."
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">לקוח</th>
              <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">טלפון</th>
              <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ביקורים</th>
              <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">ביקור אחרון</th>
              <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">הוצאה</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 size={32} className="animate-spin text-tori-400 mx-auto" />
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Users size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">אין לקוחות</p>
                  <p className="text-gray-300 text-sm">לקוחות יופיעו כשיתחילו לקיים תורים</p>
                </td>
              </tr>
            ) : (
              customers.map((customer, i) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedId(customer.id)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tori-500 to-tori-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(customer.name || customer.whatsapp_phone || 'L')[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {customer.name || <span className="text-gray-400 italic">לא ידוע</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-gray-600 text-sm font-mono">{customer.whatsapp_phone}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-gray-900 text-sm">{customer.total_visits}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-500 text-sm">{formatLastVisit(customer.last_visit_at)}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="font-semibold text-gray-900 text-sm">₪{customer.total_spent?.toLocaleString() || 0}</span>
                  </td>
                  <td className="px-5 py-4">
                    <ChevronRight size={16} className="text-gray-300" />
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex justify-center gap-2 mt-5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm"
          >
            הקודם
          </button>
          <span className="px-4 py-2 text-gray-600 text-sm">עמוד {page} מתוך {Math.ceil(total / 25)}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 25)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm"
          >
            הבא
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedId && <CustomerDrawer customerId={selectedId} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>
    </div>
  );
}
