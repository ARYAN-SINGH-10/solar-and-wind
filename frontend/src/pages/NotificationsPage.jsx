import React, { useState, useEffect } from 'react';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
} from '../services/platformService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  Bell, CheckCircle2, Trash2, BellOff, ShieldCheck,
  Zap, FileText, GitCompare, FolderOpen, MapPin, CloudSun, Info,
  CloudLightning, Compass, ShieldAlert, TrendingUp, AlertTriangle, Radio
} from 'lucide-react';

const TYPE_META = {
  // 6 Required Notification Types
  WEATHER_ALERT:        { icon: CloudLightning, color: 'text-amber-400', badge: 'warning', label: 'Weather Alert' },
  SUITABILITY_UPDATE:   { icon: Compass,        color: 'text-emerald-400', badge: 'success', label: 'Suitability Update' },
  ENVIRONMENTAL_RISK:   { icon: ShieldAlert,    color: 'text-rose-400',    badge: 'error',   label: 'Environmental Risk' },
  FORECAST_UPDATE:      { icon: TrendingUp,     color: 'text-sky-400',     badge: 'info',    label: 'Forecast Update' },
  PROJECT_NOTIFICATION: { icon: FolderOpen,     color: 'text-purple-400',  badge: 'purple',  label: 'Project Notification' },
  SYSTEM_NOTIFICATION:  { icon: ShieldCheck,    color: 'text-cyan-400',    badge: 'info',    label: 'System Notification' },
  
  // Legacy / Additional event codes
  ANALYSIS_COMPLETE:       { icon: Zap,         color: 'text-amber-400',   badge: 'warning', label: 'Analysis Complete' },
  OPTIMIZATION_COMPLETE:   { icon: Zap,         color: 'text-sky-400',     badge: 'info',    label: 'Optimization' },
  RECOMMENDATION_GENERATED:{ icon: CheckCircle2,color: 'text-emerald-400', badge: 'success', label: 'Recommendation' },
  REPORT_GENERATED:        { icon: FileText,    color: 'text-sky-400',     badge: 'info',    label: 'Report Generated' },
  PROJECT_STATUS_CHANGE:   { icon: FolderOpen,  color: 'text-purple-400',  badge: 'purple',  label: 'Status Change' },
  SITE_ADDED:              { icon: MapPin,      color: 'text-sky-400',     badge: 'info',    label: 'Site Added' },
  DATA_FETCH_COMPLETE:     { icon: CloudSun,    color: 'text-cyan-400',    badge: 'info',    label: 'Data Fetch' },
  SYSTEM_ALERT:            { icon: AlertTriangle, color: 'text-rose-400',  badge: 'error',   label: 'System Alert' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotificationsApi(unreadOnly);
      setNotifications(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [unreadOnly]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_status: true } : n)
      );
    } catch {
      setError('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    } catch {
      setError('Failed to mark all read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotificationApi(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      setError('Failed to delete notification.');
    }
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" />
            <span>Notification & Event Alert System</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Predefined rule-based alerts for weather events, suitability shifts, environmental risk, forecast updates, & project milestone changes. Zero AI generated text!
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge type="warning">{unreadCount} Unread Alerts</Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs border transition-all ${
              unreadOnly
                ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
            }`}
          >
            <BellOff className="w-4 h-4" />
            {unreadOnly ? 'Showing Unread Only' : 'Show All Notifications'}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark All as Read
          </button>
        )}
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <Loading message="Loading notification alerts from PostgreSQL..." />
      ) : notifications.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-slate-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              {unreadOnly ? 'No unread notifications.' : 'No notifications found.'}
            </p>
            {unreadOnly && (
              <button
                onClick={() => setUnreadOnly(false)}
                className="mt-3 text-xs text-orange-600 hover:underline font-bold"
              >
                Show all notifications
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const meta = TYPE_META[notif.type] || { icon: Info, color: 'text-slate-400', badge: 'info', label: notif.type };
            const Icon = meta.icon;
            return (
              <div
                key={notif.id}
                className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  notif.read_status
                    ? 'bg-slate-50 border-slate-200 opacity-70'
                    : 'bg-white border-slate-200 shadow-sm hover:border-orange-200 hover:bg-orange-50/20'
                }`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-sm">{notif.title}</span>
                    {!notif.read_status && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700 border border-orange-300">
                        UNREAD
                      </span>
                    )}
                    <Badge type={meta.badge}>{meta.label || notif.type}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-2 flex items-center gap-2">
                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span>{timeAgo(notif.created_at)}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notif.read_status && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      title="Mark as read"
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-400 hover:text-emerald-600 transition-all text-xs font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    title="Delete"
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
