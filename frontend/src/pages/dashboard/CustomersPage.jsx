import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Phone, Calendar, X, Loader2, UserPlus, Pencil, Trash2, Check } from 'lucide-react';
import { useCustomersApi } from '../../hooks/useApi';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

function CustomerDrawer({ customerId, onClose, onEdit, onDelete }) {
  const customersApi = useCustomersApi();
  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.get(customerId).then(r => r.data),
  });

  const STATUS_LABELS = { confirmed: 'מאושר', completed: 'הושלם', cancelled: 'בוטל', pending: 'ממתין' };
  const STATUS_COLORS = { confirmed: 'text-orange-600 bg-orange-50', completed: 'text-green-600 bg-green-50', cancelled: 'text-red-500 bg-red-50', pending: 'text-amber-600 bg-amber-50' };

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
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-gray-900 text-lg">פרטי לקוח</h3>
          <div className="flex items-center gap-2">
            {data?.customer && (
              <>
                <button onClick={() => onEdit(data.customer)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><Pencil size={15} /></button>
                <button onClick={() => onDelete(data.customer)} className="p-2 rounded-xl hover:bg-red-50 text-red-400"><Trash2 size={15} /></button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18} /></button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin text-orange-400" />
          </div>
        ) : data ? (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#f43f5e] flex items-center justify-center text-white font-black text-2xl shadow-lg">
                {(data.customer?.name || 'L')[0]}
              </div>
              <div>
                <div className="font-black text-gray-900 text-xl">{data.customer?.name || 'לא ידוע'}</div>
                <a href={`tel:${data.customer?.whatsapp_phone}`} className="text-[#f97316] text-sm hover:underline flex items-center gap-1 mt-0.5">
                  <Phone size={13} />{data.customer?.whatsapp_phone}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'ביקורים', value: data.customer?.total_visits || 0 },
                { label: 'הוצאה כוללת', value: `₪${(data.stats?.total_spent || 0).toLocaleString()}` },
                { label: 'נקודות', value: data.customer?.loyalty_points || 0 },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="font-black text-gray-900 text-lg">{s.value}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">היסטוריית תורים</h4>
              {data.appointments?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">אין תורים עדיין</p>
              ) : (
                <div className="space-y-2">
                  {data.appointments?.slice(0, 10).map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <Calendar size={14} className="text-[#f97316]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{a.service_name || 'שירות'}</div>
                        <div className="text-gray-500 text-xs">{format(parseISO(a.starts_at), 'd/M/yyyy HH:mm')}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || 'text-gray-600 bg-gray-100'}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

function EditCustomerModal({ customer, onClose, onSaved }) {
  const customersApi = useCustomersApi();
  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.whatsapp_phone || '');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => customersApi.update(customer.id, { name: name.trim(), whatsapp_phone: phone.trim().replace(/\s/g, '') }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: err => setError(err?.response?.data?.error || 'שגיאה'),
  });

  function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('נא להכניס שם');
    if (!phone.trim()) return setError('נא להכניס טלפון');
    mutation.mutate();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">עריכת לקוח</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">שם מלא</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f97316] transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">טלפון</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f97316] transition-all font-mono" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">ביטול</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-[#f97316] to-[#f43f5e] disabled:opacity-60 flex items-center justify-center gap-1.5">
              {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              שמור
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({ customer, onClose, onDeleted }) {
  const customersApi = useCustomersApi();
  const mutation = useMutation({
    mutationFn: () => customersApi.delete(customer.id),
    onSuccess: () => { onDeleted(); onClose(); },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">מחיקת לקוח</h3>
        <p className="text-gray-500 text-sm mb-5">האם למחוק את <span className="font-semibold text-gray-800">{customer.name}</span> ואת כל התורים שלו? לא ניתן לבטל פעולה זו.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">ביטול</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold bg-red-500 hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-1.5">
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            מחק
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-gray-900 text-lg">לקוח חדש</h3>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">שם פרטי</label>
              <input ref={firstRef} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="ישראל" autoFocus
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f97316] transition-all" style={{ fontSize: 16 }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">שם משפחה</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="ישראלי"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f97316] transition-all" style={{ fontSize: 16 }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">מספר טלפון <span className="text-red-400">*</span></label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-000-0000" type="tel" inputMode="tel"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f97316] transition-all font-mono" style={{ fontSize: 16 }} />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={mutation.isPending}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#f97316] to-[#f43f5e] shadow-lg shadow-[#f43f5e]/20 disabled:opacity-60 mt-1">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            הוסף לקוח
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function CustomerCard({ customer, onClick, onEdit, onDelete, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.018 }}
      className="bg-white border border-gray-100 rounded-2xl p-3.5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group relative flex flex-col gap-2.5"
      onClick={() => onClick(customer.id)}
    >
      {/* Hover actions */}
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={e => { e.stopPropagation(); onEdit(customer); }}
          className="w-6 h-6 rounded-lg bg-white border border-gray-200 shadow hover:border-[#f97316] hover:text-[#f97316] text-gray-500 flex items-center justify-center transition-all">
          <Pencil size={10} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(customer); }}
          className="w-6 h-6 rounded-lg bg-white border border-gray-200 shadow hover:border-red-400 hover:text-red-500 text-gray-500 flex items-center justify-center transition-all">
          <Trash2 size={10} />
        </button>
      </div>

      {/* Name + phone */}
      <div className="min-w-0 pt-1">
        <div className="font-black text-gray-900 text-[15px] leading-tight truncate">{customer.name || 'לא ידוע'}</div>
        <div className="text-xs text-gray-400 font-mono truncate mt-1" dir="ltr">{customer.whatsapp_phone}</div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-0 pt-2 border-t border-gray-100 mt-auto">
        <div className="flex-1 text-center">
          <div className="text-sm font-black text-gray-800 leading-none">{customer.total_visits || 0}</div>
          <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">ביקורים</div>
        </div>
        <div className="w-px h-5 bg-gray-100" />
        <div className="flex-1 text-center">
          <div className="text-sm font-black text-gray-800 leading-none">₪{(customer.total_spent || 0).toLocaleString()}</div>
          <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">הוצאה</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [sortAZ, setSortAZ] = useState(true);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const customersApi = useCustomersApi();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => customersApi.list({ search, page, limit: 48 }).then(r => r.data),
  });

  const rawCustomers = data?.customers || [];
  const customers = sortAZ
    ? [...rawCustomers].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
    : rawCustomers;
  const total = data?.total || 0;

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customer'] });
    setSelectedId(null);
  }

  return (
    <div className="p-4 sm:p-6 pb-32 sm:pb-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">לקוחות</h2>
          <p className="text-gray-400 text-sm mt-0.5">{total} לקוחות רשומים</p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#f97316] to-[#f43f5e] shadow-sm"
        >
          <UserPlus size={15} />
          <span className="hidden sm:inline">לקוח חדש</span>
          <span className="sm:hidden">הוסף</span>
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pr-10 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#f97316] transition-all"
            placeholder="חפש לפי שם או טלפון..."
          />
        </div>
        <button
          onClick={() => setSortAZ(v => !v)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all shrink-0 ${sortAZ ? 'bg-[#f97316] border-[#f97316] text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-[#f97316] hover:text-[#f97316]'}`}
        >
          א-ת
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#f97316]" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">אין לקוחות</p>
          <p className="text-gray-400 text-sm mt-1">לקוחות יופיעו עם שם מלא ומספר טלפון</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {customers.map((customer, i) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                index={i}
                onClick={setSelectedId}
                onEdit={setEditCustomer}
                onDelete={setDeleteCustomer}
              />
            ))}
          </div>

          {/* Pagination */}
          {total > 48 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 hover:border-[#f97316] hover:text-[#f97316] transition-all">
                הקודם
              </button>
              <span className="text-sm text-gray-500">עמוד {page} מתוך {Math.ceil(total / 48)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 48)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 hover:border-[#f97316] hover:text-[#f97316] transition-all">
                הבא
              </button>
            </div>
          )}
        </>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="sm:hidden fixed bottom-[84px] right-4 w-14 h-14 rounded-full z-40 flex items-center justify-center shadow-xl"
        style={{ background: 'linear-gradient(135deg, #f97316, #f43f5e)', boxShadow: '0 8px 24px rgba(244,63,94,0.4)' }}
      >
        <UserPlus size={20} className="text-white" />
      </button>

      <AnimatePresence>
        {selectedId && (
          <CustomerDrawer
            customerId={selectedId}
            onClose={() => setSelectedId(null)}
            onEdit={c => { setSelectedId(null); setEditCustomer(c); }}
            onDelete={c => { setSelectedId(null); setDeleteCustomer(c); }}
          />
        )}
        {showQuickAdd && (
          <QuickAddSheet
            onClose={() => setShowQuickAdd(false)}
            onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setShowQuickAdd(false); }}
          />
        )}
        {editCustomer && (
          <EditCustomerModal
            customer={editCustomer}
            onClose={() => setEditCustomer(null)}
            onSaved={() => { refreshAll(); setEditCustomer(null); }}
          />
        )}
        {deleteCustomer && (
          <DeleteConfirmModal
            customer={deleteCustomer}
            onClose={() => setDeleteCustomer(null)}
            onDeleted={() => { refreshAll(); setDeleteCustomer(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
