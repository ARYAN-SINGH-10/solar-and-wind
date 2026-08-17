import React, { useState, useEffect, useRef } from 'react';
import { Sun, Wind, Search, Bell, LogOut, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getUnreadCountApi,
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi
} from '../../services/platformService';

export default function Navbar({ systemHealth }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentUnread, setRecentUnread] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Poll unread notification count
  const fetchUnread = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getUnreadCountApi();
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Silently handle
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleDropdown = async () => {
    if (!dropdownOpen) {
      setLoadingNotifs(true);
      try {
        const notifs = await getNotificationsApi(true); // unread only
        setRecentUnread(notifs.slice(0, 5));
      } catch {
        // Silently handle
      } finally {
        setLoadingNotifs(false);
      }
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationReadApi(id);
      setRecentUnread(prev => prev.filter(n => n.id !== id));
      fetchUnread();
    } catch {
      // Fail silently
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsReadApi();
      setRecentUnread([]);
      setUnreadCount(0);
    } catch {
      // Fail silently
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 p-1 flex items-center justify-center shadow-xs">
              <Sun className="w-5 h-5 text-orange-500" />
              <Wind className="w-4 h-4 text-sky-500 -ml-1" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                SOLAR & WIND <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 font-mono font-bold">PLATFORM</span>
              </span>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">Deployment Intelligence Engine</p>
            </div>
          </Link>

          {/* Search Bar — Authenticated Users Only */}
          {isAuthenticated && (
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, candidate sites, or GIS layers..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </form>
          )}

          {/* Right Side Controls */}
          <div className="flex items-center space-x-3 flex-shrink-0 relative" ref={dropdownRef}>
            {/* Notifications Dropdown — Authenticated Users Only */}
            {isAuthenticated && (
              <>
                <button
                  onClick={toggleDropdown}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:bg-orange-50/50 relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center px-0.5 shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
                    <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-orange-500" />
                        Unread Notifications ({unreadCount})
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-orange-600 hover:underline font-mono font-bold"
                        >
                          Mark All Read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {loadingNotifs ? (
                        <p className="p-4 text-slate-400 text-center animate-pulse">Loading alerts...</p>
                      ) : recentUnread.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                          <p className="text-xs text-slate-500">No unread notifications.</p>
                        </div>
                      ) : (
                        recentUnread.map(n => (
                          <div key={n.id} className="p-3 hover:bg-orange-50/40 flex items-start gap-2.5 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-[11px] truncate">{n.title}</p>
                              <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 mt-0.5">{n.message}</p>
                              <span className="text-[9px] text-slate-400 font-mono block mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleMarkRead(n.id, e)}
                              title="Mark read"
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setDropdownOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline"
                      >
                        View All Notifications Page <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Profile Avatar / Logout or Login / Register */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <Link to="/profile" className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="text-slate-900 font-semibold leading-none">{user?.name}</p>
                    <span className="inline-block text-orange-600 font-mono text-[10px] leading-none mt-1 font-bold">
                      {user?.role_name}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

}
