import React from 'react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { Database, Server, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminDataSourcesPage() {
  const dataSources = [
    { name: 'NASA POWER Meteorological Satellite API', status: 'CONNECTED', type: 'Solar GHI / DNI Irradiance', interval: 'Daily Update' },
    { name: 'ERA5 Reanalysis Weather Grid', status: 'CONNECTED', type: '100m Wind Speed & Direction', interval: 'Hourly Sync' },
    { name: 'SRTM DEM Elevation Layer', status: 'ACTIVE', type: 'PostGIS Terrain Slope', interval: 'Local Vector' },
    { name: 'OpenStreetMap Infrastructure Data', status: 'ACTIVE', type: 'Highways & Substations', interval: 'Weekly Ingest' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-orange-500" />
            <span>Environmental & GIS Data Sources</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage external weather satellite API connections, DEM elevation datasets, and vector infrastructure ingest feeds.
          </p>
        </div>
        <Badge type="purple">ADMIN DATA ENGINE</Badge>
      </div>

      <Card title="Active External Data Source Connections" subtitle="Environmental data providers & spatial vector ingestion">
        <div className="space-y-3 text-xs">
          {dataSources.map((ds, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-orange-200 hover:bg-orange-50/20 transition-all">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800">{ds.name}</h4>
                <p className="text-slate-500 font-mono text-[11px]">Layer Type: {ds.type} | Sync: {ds.interval}</p>
              </div>
              <Badge type="success">{ds.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
