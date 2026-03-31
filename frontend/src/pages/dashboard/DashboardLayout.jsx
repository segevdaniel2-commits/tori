import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, BarChart3, Users, Settings, LogOut, Menu, X,
  Bot, Bell, Check, CheckCheck, Clock, MessageSquare
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuthStore, useDashboardStore, useNotificationStore } from '../../store/useStore';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'יומן', icon: Calendar, exact: true },
  { path: '/dashboard/analytics', label: 'אנליטיקות', icon: BarChart3 },
  { path: '/dashboard/customers', label: 'לקוחות', icon: Users },
  { path: '/dashboard/bot', label: 'סימולטור בוט', icon: MessageSquare },
  { path: '/dashboard/settings', label: 'הגדרות', icon: Settings },
];

function PlanBadge({ plan }) {
  const map = {
    trial: { label: 'ניסיון', color: 'bg-amber-100 text-amber-700' },
    basic: { label: 'Basic', color: 'bg-tori-100 text-tori-700' },
    business: { label: 'Business', color: 'bg-tori-600 text-white' },
    cancelled: { label: 'מבוטל', color: 'bg-red-100 text-red-700' },
  };
  const { label, color } = map[plan] || map.trial;
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function useNightMode() {
  const [isNight, setIsNight] = useState(() => {
    const h = new Date().getHours();
    return h >= 20 || h < 6;
  });
  useEffect(() => {
    const interval = setInterval(() => {
      const h = new Date().getHours();
      setIsNight(h >= 20 || h < 6);
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  return isNight;
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'עכשיו';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} ד'`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} ש'`;
  return `לפני ${Math.floor(diff / 86400)} ימים`;
}

export default function DashboardLayout() {
  const { business, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useDashboardStore();
  const { notifications, addNotification, markAllRead } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);
  const isNight = useNightMode();

  // Desktop sidebar hover state
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Notifications dropdown
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef(null);

  // Theme
  const theme = isNight
    ? {
        outerBg: '#000000',
        surface: '#0d0d0d',
        border: 'rgba(255,255,255,0.08)',
        sidebarBg: '#000000',
        sidebarBorder: 'rgba(255,255,255,0.08)',
        titleColor: '#ffffff',
        mutedColor: 'rgba(255,255,255,0.45)',
        hoverBg: 'rgba(255,255,255,0.05)',
        activeBg: 'rgba(124,58,237,0.25)',
        activeText: '#c4b5fd',
      }
    : {
        outerBg: '#f9fafb',
        surface: '#ffffff',
        border: '#e5e7eb',
        sidebarBg: 'rgba(255,255,255,0.97)',
        sidebarBorder: 'rgba(124,58,237,0.12)',
        titleColor: '#111827',
        mutedColor: '#6b7280',
        hoverBg: '#f5f3ff',
        activeBg: '#ede9fe',
        activeText: '#7c3aed',
      };

  // Socket
  useEffect(() => {
    if (!business?.id) return;
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : '/';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'], reconnection: true });
    socketRef.current = socket;
    socket.emit('join_business', business.id);
    socket.on('appointment:created', (appt) => {
      addNotification({
        type: 'appointment',
        title: 'תור חדש!',
        message: `${appt.customer_name || 'לקוח'} · ${appt.service_name || 'שירות'}`,
        data: appt,
      });
    });
    socket.on('appointment:cancelled', ({ id }) => {
      addNotification({ type: 'cancel', title: 'תור בוטל', message: `תור #${id} בוטל` });
    });
    return () => socket.disconnect();
  }, [business?.id]);

  // Close notifications on outside click
  useEffect(() => {
    function handler(e) {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const unread = notifications.filter(n => !n.read).length;

  const currentPageTitle = {
    '/dashboard': 'יומן תורים',
    '/dashboard/analytics': 'אנליטיקות',
    '/dashboard/customers': 'לקוחות',
    '/dashboard/settings': 'הגדרות',
    '/dashboard/bot': 'סימולטור בוט',
  }[location.pathname] || 'דשבורד';

  // Shared sidebar content renderer
  function SidebarContent({ expanded }) {
    return (
      <>
        {/* Logo */}
        <div
          className="flex items-center px-4 py-5 border-b shrink-0"
          style={{ borderColor: theme.border, minHeight: 72 }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src="/logo.svg" alt="Tori" className="w-8 h-8 shrink-0" />
            <div
              className="overflow-hidden whitespace-nowrap transition-all duration-300"
              style={{ maxWidth: expanded ? 200 : 0, opacity: expanded ? 1 : 0 }}
            >
              <div className="font-black text-lg leading-none" style={{ color: theme.titleColor }}>Tori</div>
              <div className="text-xs" style={{ color: theme.mutedColor }}>ניהול תורים</div>
            </div>
          </div>
        </div>

        {/* Business info */}
        <div
          className="overflow-hidden transition-all duration-300 border-b shrink-0"
          style={{
            maxHeight: expanded ? 80 : 0,
            opacity: expanded ? 1 : 0,
            borderColor: theme.border,
          }}
        >
          <div className="px-3 py-3">
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: isNight ? 'rgba(124,58,237,0.15)' : '#f5f3ff' }}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tori-500 to-tori-700 flex items-center justify-center text-white font-bold shrink-0">
                {business?.name?.[0] || 'E'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate" style={{ color: theme.titleColor }}>{business?.name}</div>
                <PlanBadge plan={business?.plan} />
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              title={!expanded ? item.label : undefined}
              className="flex items-center rounded-xl transition-colors duration-150 group"
              style={({ isActive }) => ({
                gap: expanded ? 12 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '10px 14px' : '10px 0',
                background: isActive ? theme.activeBg : 'transparent',
                color: isActive ? theme.activeText : theme.mutedColor,
                fontWeight: isActive ? 700 : 500,
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className="shrink-0" style={{ color: isActive ? theme.activeText : theme.mutedColor }} />
                  <span
                    className="text-sm whitespace-nowrap overflow-hidden transition-all duration-300"
                    style={{ maxWidth: expanded ? 160 : 0, opacity: expanded ? 1 : 0 }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bot status */}
        <div
          className="overflow-hidden transition-all duration-300 px-2 pb-2 shrink-0"
          style={{ maxHeight: expanded ? 60 : 48 }}
        >
          {expanded ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 rounded-xl border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <Bot size={14} className="text-green-600 shrink-0" />
              <span className="text-green-700 text-xs font-semibold whitespace-nowrap">בוט פעיל</span>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* User / Logout */}
        <div className="p-2 border-t shrink-0" style={{ borderColor: theme.border }}>
          <div
            className="overflow-hidden transition-all duration-300 mb-1"
            style={{ maxHeight: expanded ? 60 : 0, opacity: expanded ? 1 : 0 }}
          >
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-tori-100 flex items-center justify-center text-tori-700 font-bold text-sm shrink-0">
                {business?.owner_name?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: theme.titleColor }}>{business?.owner_name}</div>
                <div className="text-xs truncate" style={{ color: theme.mutedColor }}>{business?.email}</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title={!expanded ? 'יציאה' : undefined}
            className="flex items-center w-full rounded-xl transition-colors duration-150"
            style={{
              gap: expanded ? 10 : 0,
              justifyContent: expanded ? 'flex-start' : 'center',
              padding: expanded ? '9px 14px' : '9px 0',
              color: '#ef4444',
            }}
          >
            <LogOut size={18} className="shrink-0" />
            <span
              className="text-sm whitespace-nowrap overflow-hidden transition-all duration-300"
              style={{ maxWidth: expanded ? 160 : 0, opacity: expanded ? 1 : 0 }}
            >
              יציאה
            </span>
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl" style={{ background: theme.outerBg }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar (overlay) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 h-full w-64 z-30 lg:hidden flex flex-col"
            style={{
              background: theme.sidebarBg,
              backdropFilter: 'blur(20px)',
              borderLeft: `1px solid ${theme.sidebarBorder}`,
            }}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="Tori" className="w-8 h-8" />
                <div>
                  <div className="font-black text-lg leading-none" style={{ color: theme.titleColor }}>Tori</div>
                  <div className="text-xs" style={{ color: theme.mutedColor }}>ניהול תורים</div>
                </div>
              </div>
              <button onClick={toggleSidebar} style={{ color: theme.mutedColor }}>
                <X size={20} />
              </button>
            </div>

            <div className="px-3 py-3 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: isNight ? 'rgba(124,58,237,0.15)' : '#f5f3ff' }}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tori-500 to-tori-700 flex items-center justify-center text-white font-bold shrink-0">
                  {business?.name?.[0] || 'E'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: theme.titleColor }}>{business?.name}</div>
                  <PlanBadge plan={business?.plan} />
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={toggleSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-violet-100 text-violet-700 font-bold' : 'hover:bg-gray-100'
                    }`
                  }
                  style={({ isActive }) => ({ color: isActive ? theme.activeText : theme.mutedColor })}
                >
                  <item.icon size={19} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-3 border-t" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-tori-100 flex items-center justify-center text-tori-700 font-bold text-sm">
                  {business?.owner_name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: theme.titleColor }}>{business?.owner_name}</div>
                  <div className="text-xs truncate" style={{ color: theme.mutedColor }}>{business?.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>יציאה</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - thin strip, hover to expand */}
      <div
        className="hidden lg:flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out relative z-10"
        style={{
          width: sidebarExpanded ? 240 : 60,
          background: theme.sidebarBg,
          borderLeft: `1px solid ${theme.sidebarBorder}`,
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <SidebarContent expanded={sidebarExpanded} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 border-b"
          style={{ background: theme.surface, borderColor: theme.border, minHeight: 60 }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ color: theme.mutedColor }}
            >
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-lg" style={{ color: theme.titleColor }}>{currentPageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Live bot indicator */}
            <motion.div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full cursor-default"
              style={{ background: isNight ? 'rgba(34,197,94,0.12)' : '#f0fdf4', border: `1px solid ${isNight ? 'rgba(34,197,94,0.25)' : '#bbf7d0'}` }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-50" />
              </div>
              <Bot size={13} className="text-green-600" />
              <span className="text-green-700 text-xs font-bold">בוט פעיל</span>
            </motion.div>

            {/* Notifications bell */}
            <div className="relative" ref={notifsRef}>
              <button
                onClick={() => { setShowNotifs(v => !v); if (!showNotifs) markAllRead(); }}
                className="relative p-2 rounded-xl transition-colors"
                style={{ color: theme.mutedColor, background: showNotifs ? theme.hoverBg : 'transparent' }}
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50"
                    style={{ background: theme.surface, borderColor: theme.border }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
                      <span className="font-bold text-sm" style={{ color: theme.titleColor }}>התראות</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
                        >
                          <CheckCheck size={13} />
                          סמן הכל כנקרא
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Bell size={28} style={{ color: theme.mutedColor, opacity: 0.4 }} />
                          <span className="text-sm" style={{ color: theme.mutedColor }}>אין התראות</span>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className="flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors"
                            style={{
                              borderColor: theme.border,
                              background: !n.read ? (isNight ? 'rgba(124,58,237,0.08)' : '#faf5ff') : 'transparent',
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: n.type === 'appointment' ? '#ede9fe' : '#fee2e2' }}
                            >
                              {n.type === 'appointment'
                                ? <Calendar size={14} className="text-violet-600" />
                                : <X size={14} className="text-red-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold" style={{ color: theme.titleColor }}>{n.title}</span>
                                {!n.read && <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: theme.mutedColor }}>{n.message}</div>
                              <div className="flex items-center gap-1 mt-1" style={{ color: theme.mutedColor, opacity: 0.6 }}>
                                <Clock size={11} />
                                <span className="text-xs">{timeAgo(n.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="lg:hidden fixed bottom-0 right-0 left-0 z-40 flex items-center justify-around px-2 py-1 border-t"
        style={{ background: theme.surface, borderColor: theme.border, paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0"
            style={({ isActive }) => ({
              color: isActive ? theme.activeText : theme.mutedColor,
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium leading-none truncate max-w-[52px] text-center">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toast notifications */}
      <div className="fixed bottom-20 lg:bottom-6 left-4 lg:left-6 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications
            .slice(0, 3)
            .filter(n => Date.now() - new Date(n.createdAt).getTime() < 8000)
            .map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.92 }}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl min-w-64 max-w-sm pointer-events-auto"
                style={{ borderRight: `4px solid ${n.type === 'appointment' ? '#7c3aed' : '#f43f5e'}` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${n.type === 'appointment' ? 'bg-violet-100' : 'bg-red-100'}`}>
                    {n.type === 'appointment'
                      ? <Calendar size={14} className="text-violet-600" />
                      : <X size={14} className="text-red-500" />
                    }
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{n.title}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{n.message}</div>
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
