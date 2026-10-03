import React from 'react';
import { Asset, AuditEntry, Campaign } from '../types';
import ProductInventorySummary from './ProductInventorySummary';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from 'recharts';
import { Package, Home, Send, Truck, Clock, Activity, Flag } from 'lucide-react';

interface DashboardViewProps {
  assets: Asset[];
  auditLogs: AuditEntry[];
  campaigns: Campaign[];
}

export default function DashboardView({ assets, auditLogs, campaigns }: DashboardViewProps) {
  // 1. Calculate Metrics
  const totalAssets = assets.length;
  const inHouse = assets.filter(a => a.status === 'In House').length;
  const delivered = assets.filter(a => a.status === 'Delivered').length;
  const inTransit = assets.filter(a => a.status === 'In Transit').length;
  const readyPickup = assets.filter(a => a.status === 'Ready for Pickup').length;
  
  // Calculate total unit quantity
  const totalUnits = assets.reduce((sum, a) => sum + (a.qty || 1), 0);

  // 2. Prepare charts data
  // A. Status Distribution
  const statusData = [
    { name: 'In House', value: inHouse, color: '#b45309' }, // Amber-700
    { name: 'Delivered', value: delivered, color: '#15803d' }, // Green-700
    { name: 'In Transit', value: inTransit, color: '#1d4ed8' }, // Blue-700
    { name: 'Ready for Pickup', value: readyPickup, color: '#0f766e' } // Teal-700
  ].filter(d => d.value > 0);

  // B. Brand Distribution
  const brandMap: { [key: string]: number } = {};
  assets.forEach(a => {
    if (a.brand) {
      brandMap[a.brand] = (brandMap[a.brand] || 0) + 1;
    }
  });
  const brandData = Object.entries(brandMap).map(([name, value]) => ({ name, value }));
  const BRAND_COLORS = ['#1e1b4b', '#1d4ed8', '#0369a1', '#0f766e', '#15803d', '#a21caf', '#be123c', '#b45309'];

  // C. Owner Distribution
  const ownerMap: { [key: string]: number } = {};
  assets.forEach(a => {
    const ownerName = a.owner && a.owner !== 'No info' ? a.owner : 'Other';
    ownerMap[ownerName] = (ownerMap[ownerName] || 0) + 1;
  });
  const ownerData = Object.entries(ownerMap).map(([name, count]) => ({ name, count }));

  // D. City Stocks (Heatmap)
  const cityMap: { [key: string]: number } = {};
  assets.forEach(a => {
    if (a.city) {
      cityMap[a.city] = (cityMap[a.city] || 0) + (a.qty || 1);
    }
  });
  const sortedCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]);
  const maxCityValue = sortedCities.length > 0 ? sortedCities[0][1] : 1;

  // E. Campaign Util
  const campaignUtilMap: { [key: string]: { total: number; active: number } } = {};
  assets.forEach(a => {
    const campName = a.campaign && a.campaign !== 'Nil' ? a.campaign : 'Uncategorized';
    if (!campaignUtilMap[campName]) {
      campaignUtilMap[campName] = { total: 0, active: 0 };
    }
    campaignUtilMap[campName].total += (a.qty || 1);
    if (a.status === 'Delivered' || a.status === 'In Transit') {
      campaignUtilMap[campName].active += (a.qty || 1);
    }
  });
  const campaignUtilData = Object.entries(campaignUtilMap).slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-5 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 text-[#636E72] mb-3">
            <div className="p-2.5 rounded-xl bg-[#F1F3F5] text-[#2D3436]">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase font-sans">Total Assets</span>
          </div>
          <div className="text-3xl font-bold font-display text-[#2D3436]">{totalAssets}</div>
          <div className="text-xs text-[#636E72] font-mono mt-1">{totalUnits} total units</div>
        </div>

        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-5 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 text-amber-600 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase font-sans">In House</span>
          </div>
          <div className="text-3xl font-bold font-display text-amber-700">{inHouse}</div>
          <div className="text-xs text-[#636E72] font-sans mt-1">At main warehouses</div>
        </div>

        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-5 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 text-green-600 mb-3">
            <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase font-sans">Delivered</span>
          </div>
          <div className="text-3xl font-bold font-display text-green-700">{delivered}</div>
          <div className="text-xs text-[#636E72] font-sans mt-1">In field / assigned</div>
        </div>

        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-5 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 text-blue-600 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase font-sans">In Transit</span>
          </div>
          <div className="text-3xl font-bold font-display text-blue-700">{inTransit}</div>
          <div className="text-xs text-[#636E72] font-sans mt-1">On active shipments</div>
        </div>

        <div className="bg-white border border-[#E9ECEF] rounded-2xl p-5 hover:shadow-sm transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 text-teal-600 mb-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase font-sans">Ready Pickup</span>
          </div>
          <div className="text-3xl font-bold font-display text-teal-700">{readyPickup}</div>
          <div className="text-xs text-[#636E72] font-sans mt-1">Awaiting transport</div>
        </div>

      </div>

      {/* Product Inventory Summary Section */}
      <ProductInventorySummary assets={assets} />

      {/* Primary Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Breakdown */}
        <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#2D3436] tracking-wide uppercase font-sans mb-4">
            Status Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} assets`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs font-medium">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#636E72]">{item.name}</span>
                <span className="text-[#ADB5BD]">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Distribution */}
        <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#2D3436] tracking-wide uppercase font-sans mb-4">
            Brand Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brandData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {brandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} assets`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs font-medium max-h-16 overflow-y-auto">
            {brandData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length] }} />
                <span className="text-[#636E72]">{item.name}</span>
                <span className="text-[#ADB5BD]">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary Row: Heatmaps & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* City Heatmap */}
        <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#2D3436] tracking-wide uppercase font-sans mb-4">
            Warehouse Heatmap — City Stock
          </h3>
          
          <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
            {sortedCities.map(([city, cnt]) => {
              const ratio = cnt / maxCityValue;
              let barColor = 'bg-[#F1F3F5]';
              if (ratio > 0.7) barColor = 'bg-[#5A4ED1]';
              else if (ratio > 0.3) barColor = 'bg-[#6C5CE7]';

              return (
                <div key={city} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-semibold text-[#2D3436] truncate font-display">{city}</span>
                  <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                      style={{ width: `${Math.round(ratio * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-mono font-bold text-[#636E72]">{cnt}</span>
                </div>
              );
            })}
            {sortedCities.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No city records found</div>
            )}
          </div>
        </div>

        {/* Campaign progress */}
        <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#2D3436] tracking-wide uppercase font-sans mb-4">
            Campaign Utilization
          </h3>
          
          <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
            {campaignUtilData.map(([name, d]) => {
              const pct = d.total > 0 ? Math.round((d.active / d.total) * 100) : 0;
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-[#2D3436] truncate max-w-xs font-display">{name}</span>
                    <span className="text-xs font-mono text-[#636E72]">{d.active} / {d.total} deployed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#6C5CE7] rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#2D3436] w-8 text-right font-mono">{pct}%</span>
                  </div>
                </div>
              );
            })}
            {campaignUtilData.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No campaign deployments found</div>
            )}
          </div>
        </div>

      </div>

      {/* Tertiary Row: Owner Graph & Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Owner Graph */}
        <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#2D3436] tracking-wide uppercase font-sans mb-4">
            Owner Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ownerData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="count" fill="#6C5CE7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#2D3436] tracking-wide uppercase font-sans mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#6C5CE7] animate-pulse" />
              Recent Activity Feed
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {auditLogs.slice(0, 6).map((log, index) => (
                <div key={index} className="flex gap-3 text-xs border-b border-[#E9ECEF] pb-2.5 last:border-0 last:pb-0">
                  <span className="text-[10px] text-[#ADB5BD] font-mono w-28 shrink-0">{log.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2D3436] font-mono text-[11px] truncate">
                      {log.serial}
                    </p>
                    <p className="text-[#636E72] mt-0.5">
                      <span className="font-medium text-[#2D3436]">{log.field}</span> changed: {log.from || 'None'} → {log.to}
                    </p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">No recent transactions tracked</div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
