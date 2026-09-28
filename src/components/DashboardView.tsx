import React, { useState, useMemo } from 'react';
import { Asset, AuditEntry, Campaign } from '../types';
import { computeProductSummary, getProductInventoryOverview } from '../lib/productSummary';
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
import { Package, Home, Send, Truck, Clock, Activity, Flag, Boxes, Search, ChevronRight, ChevronLeft } from 'lucide-react';

interface DashboardViewProps {
  assets: Asset[];
  auditLogs: AuditEntry[];
  campaigns: Campaign[];
}

export default function DashboardView({ assets, auditLogs, campaigns }: DashboardViewProps) {
  // Product Inventory Summary state
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productSortBy, setProductSortBy] = useState<'qty-desc' | 'qty-asc' | 'name-asc' | 'name-desc'>('qty-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Product-wise aggregation derived dataset
  const productSummary = useMemo(() => computeProductSummary(assets), [assets]);
  const productOverview = useMemo(() => getProductInventoryOverview(assets), [assets]);

  // Extract unique categories from product summary for filtering
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    productSummary.forEach(p => {
      if (p.category && p.category !== '—') {
        p.category.split(',').forEach(c => set.add(c.trim()));
      }
    });
    return Array.from(set).sort();
  }, [productSummary]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return productSummary.filter(p => {
      if (productSearchQuery) {
        const q = productSearchQuery.toLowerCase();
        const matches = 
          p.productName.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.locations.some(loc => loc.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (productCategoryFilter) {
        if (!p.category.toLowerCase().includes(productCategoryFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (productSortBy === 'qty-desc') return b.totalQty - a.totalQty;
      if (productSortBy === 'qty-asc') return a.totalQty - b.totalQty;
      if (productSortBy === 'name-asc') return a.productName.localeCompare(b.productName);
      if (productSortBy === 'name-desc') return b.productName.localeCompare(a.productName);
      return 0;
    });
  }, [productSummary, productSearchQuery, productCategoryFilter, productSortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

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

      {/* Product Inventory Summary Section */}
      <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E9ECEF]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7]">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#2D3436] font-display">
                  Product Inventory Summary
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#6C5CE7]/10 text-[#6C5CE7]">
                  {productSummary.length} Products
                </span>
              </div>
              <p className="text-xs text-[#636E72] mt-0.5">
                Aggregated inventory quantities and deployment status grouped by product model
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <span className="text-[#636E72] font-medium">Total Qty:</span>
              <span className="font-mono font-bold text-[#2D3436]">{productOverview.totalQuantity} units</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200/60 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-amber-900 font-medium">In House:</span>
              <span className="font-mono font-bold text-amber-800">{productOverview.totalInHouse}</span>
            </div>
            <div className="bg-green-50/70 border border-green-200/60 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-green-900 font-medium">Delivered:</span>
              <span className="font-mono font-bold text-green-800">{productOverview.totalDelivered}</span>
            </div>
            <div className="bg-blue-50/70 border border-blue-200/60 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-blue-900 font-medium">In Transit:</span>
              <span className="font-mono font-bold text-blue-800">{productOverview.totalInTransit}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#ADB5BD]" />
            <input 
              type="text"
              placeholder="Filter by product name, brand, or location..."
              value={productSearchQuery}
              onChange={(e) => {
                setProductSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-sans text-[#2D3436] placeholder-[#ADB5BD] focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
            />
            {productSearchQuery && (
              <button 
                onClick={() => setProductSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[#ADB5BD] hover:text-[#2D3436]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {uniqueCategories.length > 0 && (
              <select
                value={productCategoryFilter}
                onChange={(e) => {
                  setProductCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            <select
              value={productSortBy}
              onChange={(e) => setProductSortBy(e.target.value as any)}
              className="px-3 py-2 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
            >
              <option value="qty-desc">Sort: Highest Quantity</option>
              <option value="qty-asc">Sort: Lowest Quantity</option>
              <option value="name-asc">Sort: Product (A-Z)</option>
              <option value="name-desc">Sort: Product (Z-A)</option>
            </select>

            {(productSearchQuery || productCategoryFilter) && (
              <button
                onClick={() => {
                  setProductSearchQuery('');
                  setProductCategoryFilter('');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Product Inventory Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#E9ECEF]">
          <table className="w-full border-collapse text-left text-xs md:text-sm">
            <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF] font-sans font-bold text-[#636E72] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Brand</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Total Quantity</th>
                <th className="p-3.5">Availability / Status</th>
                <th className="p-3.5">Locations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF] bg-white">
              {paginatedProducts.map((p, idx) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <tr key={p.productName} className="hover:bg-[#F8F9FA]/70 transition-colors">
                    <td className="p-3.5 text-center font-mono text-[11px] text-[#ADB5BD]">
                      {globalIndex}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#2D3436] font-display text-sm">
                        {p.productName}
                      </div>
                      <div className="text-[11px] text-[#636E72] font-mono mt-0.5">
                        {p.serialsCount} {p.serialsCount === 1 ? 'record' : 'records'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {p.brand && p.brand !== '—' ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F1F3F5] text-[#2D3436]">
                          {p.brand}
                        </span>
                      ) : (
                        <span className="text-[#ADB5BD]">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-[#636E72] font-medium text-xs">
                      {p.category}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20 shadow-xs">
                        {p.totalQty} {p.totalQty === 1 ? 'unit' : 'units'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1.5 min-w-[180px]">
                        {/* Multi-segment distribution bar */}
                        <div className="h-2 w-full bg-[#F1F3F5] rounded-full overflow-hidden flex">
                          {p.inHouseQty > 0 && (
                            <div 
                              className="bg-amber-500 h-full" 
                              style={{ width: `${(p.inHouseQty / p.totalQty) * 100}%` }}
                              title={`In House: ${p.inHouseQty}`}
                            />
                          )}
                          {p.deliveredQty > 0 && (
                            <div 
                              className="bg-green-600 h-full" 
                              style={{ width: `${(p.deliveredQty / p.totalQty) * 100}%` }}
                              title={`Delivered: ${p.deliveredQty}`}
                            />
                          )}
                          {p.inTransitQty > 0 && (
                            <div 
                              className="bg-blue-600 h-full" 
                              style={{ width: `${(p.inTransitQty / p.totalQty) * 100}%` }}
                              title={`In Transit: ${p.inTransitQty}`}
                            />
                          )}
                          {p.readyPickupQty > 0 && (
                            <div 
                              className="bg-teal-600 h-full" 
                              style={{ width: `${(p.readyPickupQty / p.totalQty) * 100}%` }}
                              title={`Ready for Pickup: ${p.readyPickupQty}`}
                            />
                          )}
                          {p.otherStatusQty > 0 && (
                            <div 
                              className="bg-gray-400 h-full" 
                              style={{ width: `${(p.otherStatusQty / p.totalQty) * 100}%` }}
                              title={`Other: ${p.otherStatusQty}`}
                            />
                          )}
                        </div>

                        {/* Breakdown tags */}
                        <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                          {p.inHouseQty > 0 && (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                              {p.inHouseQty} in house
                            </span>
                          )}
                          {p.deliveredQty > 0 && (
                            <span className="text-green-800 bg-green-50 px-1.5 py-0.5 rounded border border-green-200/50">
                              {p.deliveredQty} delivered
                            </span>
                          )}
                          {p.inTransitQty > 0 && (
                            <span className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                              {p.inTransitQty} transit
                            </span>
                          )}
                          {p.readyPickupQty > 0 && (
                            <span className="text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/50">
                              {p.readyPickupQty} ready
                            </span>
                          )}
                          {p.otherStatusQty > 0 && (
                            <span className="text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200/50">
                              {p.otherStatusQty} other
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {p.locations.length > 0 ? (
                          p.locations.slice(0, 2).map(loc => (
                            <span key={loc} className="text-[11px] font-sans px-2 py-0.5 bg-[#F8F9FA] border border-[#DEE2E6] text-[#636E72] rounded-md">
                              {loc}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#ADB5BD]">—</span>
                        )}
                        {p.locations.length > 2 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 text-[#636E72] rounded-md" title={p.locations.slice(2).join(', ')}>
                            +{p.locations.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#ADB5BD]">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm text-[#636E72]">No matching products found</p>
                    <p className="text-xs mt-1">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Count footer */}
        {filteredProducts.length > itemsPerPage && (
          <div className="flex items-center justify-between text-xs text-[#636E72] pt-2">
            <span>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#DEE2E6] hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#DEE2E6] hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
