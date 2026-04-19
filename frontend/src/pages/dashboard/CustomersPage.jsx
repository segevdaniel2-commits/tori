import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Phone, Calendar, Star, X, Loader2, ChevronRight, UserPlus } from 'lucide-react';
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

// ─── Quick-add bottom sheet (mobile) ─────────────────────────────────────────
function QuickAddSheet({ onClose, onSuccess }) {
  const customersApi = useCustomersApi();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const firstRef = useRef(null);

  const mutation = useMutation({
    mutationFn: () => customersApi.quickCreate({
      name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null,
      whatsapp_phone: phone.trim(),
    }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (err) => setError(err?.response?.data?.error || 'שגיאה, נסה שוב'),
  });

  function submit(e) {
    e.preventDefault();
    setError('');
    const p = phone.trim().replace(/\s/g, '');
    if (!p) return setError('נא להכניס מספר טלפון');
    mutation.mutate();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-gray-900 text-lg">לקוח חדש</h3>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">שם פרטי</label>
              <input
                ref={firstRef}
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="ישראל"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f97316] transition-all"
                style={{ fontSize: 16 }}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">שם משפחה</label>
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="ישראלי"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f97316] transition-all"
                style={{ fontSize: 16 }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">מספר טלפון <span className="text-red-400">*</span></label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="050-000-0000"
              type="tel"
              inputMode="tel"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f97316] transition-all font-mono"
              style={{ fontSize: 16 }}
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#f97316] to-[#f43f5e] shadow-lg shadow-[#f43f5e]/20 disabled:opacity-60 mt-1"
          >
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            הוסף לקוח
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [sortAZ, setSortAZ] = useState(false);
  const customersApi = useCustomersApi();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => customersApi.list({ search, page, limit: 25 }).then(r => r.data),
  });

  const rawCustomers = data?.customers || [];
  const customers = sortAZ
    ? [...rawCustomers].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
    : rawCustomers;
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
    <div className="p-3 sm:p-6 pb-32 sm:pb-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">לקוחות</h2>
          <p className="text-gray-500 text-sm mt-0.5">{total} לקוחות רשומים</p>
        </div>
        {/* Desktop add button */}
        <button
          onClick={() => setShowQuickAdd(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#f97316] to-[#f43f5e] shadow-sm"
        >
          <UserPlus size={15} />
          לקוח חדש
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pr-12 py-3 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-tori-500 focus:ring-1 focus:ring-tori-500 transition-all shadow-sm"
            placeholder="חפש לפי שם או טלפון..."
          />
        </div>
        <button
          onClick={() => setSortAZ(v => !v)}
          title="מיון א-ת"
          className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all shrink-0 ${sortAZ ? 'bg-[#f97316] border-[#f97316] text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-[#f97316] hover:text-[#f97316]'}`}
        >
          א-ת
        </button>
      </div>

      {/* Mobile: card list */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-tori-400" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">אין לקוחות</p>
            <p className="text-gray-300 text-sm">לקוחות יופיעו כשיתחילו לקיים תורים</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((customer, i) => (
              <motion.button
                key={customer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedId(customer.id)}
                className="w-full text-right flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm active:shadow-none transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-tori-500 to-tori-700 flex items-center justify-center text-white font-bold text-base shrink-0">
                  {(customer.name || customer.whatsapp_phone || 'L')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm truncate">
                    {customer.name || <span className="text-gray-400 italic">לא ידוע</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">{customer.whatsapp_phone}</div>
                </div>
                <div className="shrink-0 text-left">
                  <div className="flex items-center gap-1 justify-end">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="font-bold text-gray-900 text-sm">{customer.total_visits}</span>
                  </div>
                  {customer.total_spent > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">₪{customer.total_spent?.toLocaleString()}</div>
                  )}
                </div>
                <ChevronRight size={15} className="text-gray-300 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">לקוח</th>
              <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">טלפון</th>
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
                  <td className="px-5 py-4">
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

      {/* Mobile floating add button */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="sm:hidden fixed bottom-20 left-4 z-30 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-2xl shadow-[#f43f5e]/30 bg-gradient-to-br from-[#f97316] to-[#f43f5e] active:scale-90 transition-transform"
        aria-label="הוסף לקוח"
      >
        <UserPlus size={22} />
      </button>

      <AnimatePresence>
        {selectedId && <CustomerDrawer customerId={selectedId} onClose={() => setSelectedId(null)} />}
        {showQuickAdd && (
          <QuickAddSheet
            onClose={() => setShowQuickAdd(false)}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
