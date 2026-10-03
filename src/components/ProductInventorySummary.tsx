import React, { useState, useMemo } from 'react';
import { Asset } from '../types';
import { Boxes, Search, ArrowUpDown, LayoutGrid, Table as TableIcon, Layers } from 'lucide-react';

export interface ProductInventorySummaryProps {
  assets: Asset[];
}

export interface ProductSummaryRow {
  name: string;
  totalQty: number;
  recordsCount: number;
  brands: string[];
  locations: string[];
  inHouse: number;
  delivered: number;
  inTransit: number;
  readyPickup: number;
}

export default function ProductInventorySummary({ assets }: ProductInventorySummaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'qty-desc' | 'qty-asc' | 'name-asc' | 'name-desc'>('qty-desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Aggregation of assets array: grouping by 'name' and summing 'qty'
  const productSummary = useMemo(() => {
    if (!assets || !Array.isArray(assets)) return [];

    const map = new Map<string, ProductSummaryRow>();

    for (const asset of assets) {
      if (!asset) continue;

      // Grouping by 'name'
      const rawName = (asset.name || asset.desc || 'Unspecified').trim();
      const name = rawName || 'Unspecified';
      
      // Summing the 'qty' field (defaulting to 1 if not set or invalid)
      const parsedQty = parseInt(String(asset.qty), 10);
      const qty = !isNaN(parsedQty) && parsedQty > 0 ? parsedQty : 1;
      const status = (asset.status || '').trim().toLowerCase();

      let entry = map.get(name);
      if (!entry) {
        entry = {
          name,
          totalQty: 0,
          recordsCount: 0,
          brands: [],
          locations: [],
          inHouse: 0,
          delivered: 0,
          inTransit: 0,
          readyPickup: 0
        };
        map.set(name, entry);
      }

      entry.totalQty += qty;
      entry.recordsCount += 1;

      if (asset.brand && asset.brand.trim() && asset.brand !== '—' && !entry.brands.includes(asset.brand.trim())) {
        entry.brands.push(asset.brand.trim());
      }

      if (asset.city && asset.city.trim() && asset.city !== '—' && !entry.locations.includes(asset.city.trim())) {
        entry.locations.push(asset.city.trim());
      }

      if (status === 'in house') {
        entry.inHouse += qty;
      } else if (status === 'delivered') {
        entry.delivered += qty;
      } else if (status === 'in transit') {
        entry.inTransit += qty;
      } else if (status === 'ready for pickup') {
        entry.readyPickup += qty;
      }
    }

    return Array.from(map.values());
  }, [assets]);

  // Total units across all products
  const totalAggregatedUnits = useMemo(() => {
    return productSummary.reduce((sum, item) => sum + item.totalQty, 0);
  }, [productSummary]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return productSummary
      .filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.brands.some(b => b.toLowerCase().includes(q)) ||
          item.locations.some(l => l.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'qty-desc') return b.totalQty - a.totalQty;
        if (sortBy === 'qty-asc') return a.totalQty - b.totalQty;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        return 0;
      });
  }, [productSummary, searchQuery, sortBy]);

  return (
    <div className="bg-white border border-[#E9ECEF] rounded-3xl p-6 shadow-sm space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E9ECEF]">
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
                {productSummary.length} {productSummary.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <p className="text-xs text-[#636E72] mt-0.5">
              Aggregated unit quantities grouped by product item name across all warehouses
            </p>
          </div>
        </div>

        {/* Action Controls & Metric Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="bg-[#F8F9FA] border border-[#DEE2E6] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-sans">
            <span className="text-[#636E72]">Total Stock:</span>
            <span className="font-mono font-bold text-[#2D3436]">{totalAggregatedUnits} units</span>
          </div>

          <div className="flex items-center bg-[#F1F3F5] p-1 rounded-xl border border-[#DEE2E6]">
            <button
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-white text-[#6C5CE7] shadow-xs font-semibold'
                  : 'text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'grid'
                  ? 'bg-white text-[#6C5CE7] shadow-xs font-semibold'
                  : 'text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#ADB5BD]" />
          <input
            type="text"
            placeholder="Search by product name, brand, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-sans text-[#2D3436] placeholder-[#ADB5BD] focus:border-[#6C5CE7] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/10 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-[#ADB5BD] hover:text-[#2D3436]"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#636E72]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#ADB5BD]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
            >
              <option value="qty-desc">Quantity: High to Low</option>
              <option value="qty-asc">Quantity: Low to High</option>
              <option value="name-asc">Product Name: A to Z</option>
              <option value="name-desc">Product Name: Z to A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        /* Scrollable Table View */
        <div className="rounded-2xl border border-[#E9ECEF] overflow-hidden">
          <div className="max-h-80 overflow-y-auto overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs md:text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#E9ECEF] font-sans font-bold text-[#636E72] text-[11px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="p-3.5 w-12 text-center bg-[#F8F9FA]">#</th>
                  <th className="p-3.5 bg-[#F8F9FA]">Product Name</th>
                  <th className="p-3.5 bg-[#F8F9FA]">Brand(s)</th>
                  <th className="p-3.5 text-center bg-[#F8F9FA]">Total Quantity</th>
                  <th className="p-3.5 bg-[#F8F9FA]">Status Distribution</th>
                  <th className="p-3.5 bg-[#F8F9FA]">Locations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF] bg-white">
                {filteredProducts.map((p, idx) => (
                  <tr key={p.name} className="hover:bg-[#F8F9FA]/70 transition-colors">
                    <td className="p-3.5 text-center font-mono text-[11px] text-[#ADB5BD]">
                      {idx + 1}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#2D3436] font-display text-sm">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[#636E72] font-mono mt-0.5">
                        {p.recordsCount} {p.recordsCount === 1 ? 'row record' : 'row records'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {p.brands.length > 0 ? (
                          p.brands.map(b => (
                            <span key={b} className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F1F3F5] text-[#2D3436]">
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#ADB5BD]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20">
                        {p.totalQty} {p.totalQty === 1 ? 'unit' : 'units'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1.5 min-w-[180px]">
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-[#F1F3F5] rounded-full overflow-hidden flex">
                          {p.inHouse > 0 && (
                            <div
                              className="bg-amber-500 h-full"
                              style={{ width: `${(p.inHouse / p.totalQty) * 100}%` }}
                              title={`In House: ${p.inHouse}`}
                            />
                          )}
                          {p.delivered > 0 && (
                            <div
                              className="bg-green-600 h-full"
                              style={{ width: `${(p.delivered / p.totalQty) * 100}%` }}
                              title={`Delivered: ${p.delivered}`}
                            />
                          )}
                          {p.inTransit > 0 && (
                            <div
                              className="bg-blue-600 h-full"
                              style={{ width: `${(p.inTransit / p.totalQty) * 100}%` }}
                              title={`In Transit: ${p.inTransit}`}
                            />
                          )}
                          {p.readyPickup > 0 && (
                            <div
                              className="bg-teal-600 h-full"
                              style={{ width: `${(p.readyPickup / p.totalQty) * 100}%` }}
                              title={`Ready for Pickup: ${p.readyPickup}`}
                            />
                          )}
                        </div>

                        {/* Breakdown Badges */}
                        <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                          {p.inHouse > 0 && (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                              {p.inHouse} In House
                            </span>
                          )}
                          {p.delivered > 0 && (
                            <span className="text-green-800 bg-green-50 px-1.5 py-0.5 rounded border border-green-200/50">
                              {p.delivered} Delivered
                            </span>
                          )}
                          {p.inTransit > 0 && (
                            <span className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                              {p.inTransit} Transit
                            </span>
                          )}
                          {p.readyPickup > 0 && (
                            <span className="text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/50">
                              {p.readyPickup} Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {p.locations.length > 0 ? (
                          p.locations.map(loc => (
                            <span key={loc} className="text-[11px] font-sans px-2 py-0.5 bg-[#F8F9FA] border border-[#DEE2E6] text-[#636E72] rounded-md">
                              {loc}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#ADB5BD]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#ADB5BD]">
                      <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-sm text-[#636E72]">No matching products found</p>
                      <p className="text-xs mt-1">Try adjusting your search criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Scrollable Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-1">
          {filteredProducts.map((p) => (
            <div
              key={p.name}
              className="bg-[#F8F9FA]/60 hover:bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl p-4 transition-all hover:shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-[#2D3436] font-display text-sm line-clamp-1" title={p.name}>
                    {p.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6C5CE7]/10 text-[#6C5CE7] shrink-0">
                    {p.totalQty}
                  </span>
                </div>
                <div className="text-[11px] text-[#636E72] font-mono mt-0.5">
                  {p.recordsCount} {p.recordsCount === 1 ? 'record' : 'records'}
                </div>

                {p.brands.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.brands.map(b => (
                      <span key={b} className="text-[10px] font-semibold px-1.5 py-0.5 bg-white border border-[#DEE2E6] text-[#2D3436] rounded">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Chips */}
              <div className="pt-2 border-t border-[#E9ECEF] flex flex-wrap gap-1 text-[10px] font-mono">
                {p.inHouse > 0 && (
                  <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                    {p.inHouse} In House
                  </span>
                )}
                {p.delivered > 0 && (
                  <span className="text-green-800 bg-green-50 px-1.5 py-0.5 rounded">
                    {p.delivered} Delivered
                  </span>
                )}
                {p.inTransit > 0 && (
                  <span className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">
                    {p.inTransit} Transit
                  </span>
                )}
                {p.readyPickup > 0 && (
                  <span className="text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                    {p.readyPickup} Ready
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-[#ADB5BD]">
              <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-sm text-[#636E72]">No matching products found</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-[11px] text-[#636E72] flex items-center justify-between pt-1">
        <span>Showing {filteredProducts.length} of {productSummary.length} aggregated products</span>
        <span className="font-mono">{totalAggregatedUnits} total unit quantity</span>
      </div>
    </div>
  );
}
