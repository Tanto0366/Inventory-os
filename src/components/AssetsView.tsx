import React, { useState } from 'react';
import { Asset } from '../types';
import { Search, SlidersHorizontal, Edit3, Trash2, CheckSquare, Square, ChevronDown, FileSpreadsheet, X } from 'lucide-react';
import { getUniqueItemNames } from '../lib/assetFilters';
import { exportSelectedAssetsToExcel } from '../lib/excelExport';

interface AssetsViewProps {
  assets: Asset[];
  isAdmin: boolean;
  onEditAsset: (serial: string) => void;
  onDeleteAsset: (serial: string) => void;
  onBulkDelete: (serials: string[]) => void;
}

export default function AssetsView({
  assets,
  isAdmin,
  onEditAsset,
  onDeleteAsset,
  onBulkDelete
}: AssetsViewProps) {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterItemName, setFilterItemName] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterOwner, setFilterOwner] = useState('');

  // Row selection state
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());

  // Compute selected asset records from master assets array (persisting across active filters)
  const selectedAssets = assets.filter(a => selectedSerials.has(a.serial));

  // Extract filter dropdown lists dynamically
  const uniqueItemNames = getUniqueItemNames(assets);
  const uniqueBrands = Array.from(new Set(assets.map(a => a.brand?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  const uniqueCities = Array.from(new Set(assets.map(a => a.city?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  const uniqueCampaigns = Array.from(new Set(assets.map(a => a.campaign?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  const uniqueOwners = Array.from(new Set(assets.map(a => a.owner?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));

  // Combine filters
  const filteredAssets = assets.filter(a => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        a.serial.toLowerCase().includes(q) ||
        (a.boxId || '').toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        (a.owner || '').toLowerCase().includes(q) ||
        (a.possessor || '').toLowerCase().includes(q) ||
        (a.campaign || '').toLowerCase().includes(q) ||
        (a.city || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // Dropdowns
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterItemName && (a.name || '').trim() !== filterItemName) return false;
    if (filterBrand && (a.brand || '').trim() !== filterBrand) return false;
    if (filterCity && (a.city || '').trim() !== filterCity) return false;
    if (filterCampaign && (a.campaign || '').trim() !== filterCampaign) return false;
    if (filterOwner && (a.owner || '').trim() !== filterOwner) return false;

    return true;
  });

  // Selection handlers
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSet = new Set(filteredAssets.map(a => a.serial));
      setSelectedSerials(newSet);
    } else {
      setSelectedSerials(newSet => {
        newSet.clear();
        return new Set(newSet);
      });
    }
  };

  const handleToggleSelectRow = (serial: string, checked: boolean) => {
    setSelectedSerials(prev => {
      const next = new Set(prev);
      if (checked) next.add(serial);
      else next.delete(serial);
      return next;
    });
  };

  const handleExportSelected = () => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset to export.');
      return;
    }

    const result = exportSelectedAssetsToExcel(selectedAssets);
    if (!result.success && result.error) {
      alert(result.error);
    }
  };

  const handleClearSelection = () => {
    setSelectedSerials(new Set());
  };

  const handleBulkDeleteAction = () => {
    if (selectedSerials.size === 0) return;
    if (window.confirm(`Delete ${selectedSerials.size} selected asset(s)? This will also move them to the sheet archive.`)) {
      onBulkDelete(Array.from(selectedSerials));
      setSelectedSerials(new Set());
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'In House': return 'bg-amber-100/70 text-amber-800 border border-amber-200/50';
      case 'Delivered': return 'bg-green-100/70 text-green-800 border border-green-200/50';
      case 'In Transit': return 'bg-blue-100/70 text-blue-800 border border-blue-200/50';
      case 'Ready for Pickup': return 'bg-teal-100/70 text-teal-800 border border-teal-200/50';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const allFilteredSelected = filteredAssets.length > 0 && filteredAssets.every(a => selectedSerials.has(a.serial));

  return (
    <div className="space-y-4">
      
      {/* Search and Filters Header */}
      <div className="bg-white border border-[#E9ECEF] rounded-3xl p-5 shadow-sm space-y-4">
        
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ADB5BD]" />
          <input 
            type="text" 
            placeholder="Global search by Serial number, Name, Brand, Owner, Campaign, Possessor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl text-sm text-[#2D3436] outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/10 font-sans placeholder-[#ADB5BD] transition"
          />
        </div>

        {/* Combinable Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[#ADB5BD] mr-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Filters</span>
          </div>

          <select 
            id="filter-status"
            aria-label="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
          >
            <option value="">All Statuses</option>
            <option value="In House">In House</option>
            <option value="Delivered">Delivered</option>
            <option value="In Transit">In Transit</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
          </select>

          <select 
            id="filter-item-name"
            aria-label="Filter by Item Name"
            value={filterItemName}
            onChange={(e) => setFilterItemName(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none font-sans"
          >
            <option value="">All Item Names</option>
            {uniqueItemNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <select 
            id="filter-brand"
            aria-label="Filter by Brand"
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
          >
            <option value="">All Brands</option>
            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select 
            id="filter-city"
            aria-label="Filter by City"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
          >
            <option value="">All Cities</option>
            {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            id="filter-campaign"
            aria-label="Filter by Campaign"
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
          >
            <option value="">All Campaigns</option>
            {uniqueCampaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            id="filter-owner"
            aria-label="Filter by Owner"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg text-xs font-medium text-[#636E72] focus:border-[#6C5CE7] outline-none"
          >
            <option value="">All Owners</option>
            {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {(filterStatus || filterItemName || filterBrand || filterCity || filterCampaign || filterOwner || searchQuery) && (
            <button
              id="btn-reset-filters"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
                setFilterItemName('');
                setFilterBrand('');
                setFilterCity('');
                setFilterCampaign('');
                setFilterOwner('');
                setSelectedSerials(new Set());
              }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold uppercase tracking-wider font-sans ml-auto cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

      </div>

      {/* Floating / Sticky Selection Action Toolbar */}
      {selectedSerials.size > 0 && (
        <div 
          data-testid="selection-toolbar"
          className="bg-indigo-50/70 border border-[#6C5CE7]/30 rounded-2xl px-5 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-all animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/15 flex items-center justify-center text-[#6C5CE7]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D3436] font-display">
                {selectedSerials.size} {selectedSerials.size === 1 ? 'asset selected' : 'assets selected'}
              </span>
              <span className="text-[11px] text-[#636E72] font-mono ml-2">
                ({selectedAssets.length} records ready for export)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#DEE2E6] text-[#636E72] hover:text-[#2D3436] rounded-xl text-xs font-semibold font-sans transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear Selection
            </button>

            <button
              id="btn-export-selected-excel"
              onClick={handleExportSelected}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-xl text-xs font-semibold font-sans transition shadow-xs active:scale-95 cursor-pointer"
              title="Export selected assets to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel
            </button>

            {isAdmin && (
              <button
                onClick={handleBulkDeleteAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold font-sans transition shadow-xs active:scale-95 cursor-pointer"
                title="Delete selected assets"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Bulk Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white border border-[#E9ECEF] rounded-3xl shadow-sm overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs md:text-sm">
            
            <thead className="bg-[#F1F3F5] border-b border-[#E9ECEF] font-sans font-bold text-[#636E72] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="rounded text-[#6C5CE7] border-gray-300 focus:ring-[#6C5CE7] w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-4 w-16">Asset ID</th>
                <th className="p-4">Item Name</th>
                <th className="p-4">Brand / Product Name</th>
                <th className="p-4">Serial Number</th>
                <th className="p-4">Box ID</th>
                <th className="p-4">Location</th>
                <th className="p-4">Owner</th>
                <th className="p-4">Possessor</th>
                <th className="p-4">Status</th>
                <th className="p-4">Campaign</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E9ECEF]">
              {filteredAssets.map((asset) => {
                const isSelected = selectedSerials.has(asset.serial);
                return (
                  <tr 
                    key={asset.serial}
                    className={`hover:bg-[#F8F9FA]/60 transition-colors ${isSelected ? 'bg-[#6C5CE7]/5' : ''}`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelectRow(asset.serial, e.target.checked)}
                        className="rounded text-[#6C5CE7] border-gray-300 focus:ring-[#6C5CE7] w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-[#636E72] whitespace-nowrap text-[11px]">
                      {asset.assetId || '—'}
                    </td>
                    <td className="p-4 font-semibold text-[#2D3436] font-display">
                      {asset.name}
                    </td>
                    <td className="p-4 text-[#636E72] font-medium">
                      <span className="font-semibold text-[#2D3436]">{asset.brand}</span>
                      {asset.desc && <span className="text-[11px] block text-[#ADB5BD] mt-0.5 font-sans truncate max-w-[140px]">{asset.desc}</span>}
                    </td>
                    <td className="p-4 font-mono font-bold text-[#6C5CE7] bg-[#F1F3F5] border-x border-[#E9ECEF] text-[11px] px-2.5 py-1 rounded inline-block my-2.5">
                      {asset.serial}
                    </td>
                    <td className="p-4 font-mono font-semibold text-[#2D3436] text-[11px] whitespace-nowrap">
                      {asset.boxId || '—'}
                    </td>
                    <td className="p-4 font-semibold text-[#2D3436]">
                      {asset.city}
                    </td>
                    <td className="p-4 font-medium text-[#636E72]">
                      {asset.owner || '—'}
                    </td>
                    <td className="p-4 font-semibold text-[#2D3436]">
                      {asset.possessor || '—'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${getStatusBadgeClass(asset.status)}`}>
                        {asset.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      {asset.campaign && asset.campaign !== 'Nil' ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold font-mono bg-[#F1F3F5] border border-[#E9ECEF] rounded text-[#6C5CE7]">
                          {asset.campaign}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap space-x-1">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => onEditAsset(asset.serial)}
                            className="inline-flex items-center gap-1 p-1.5 bg-white hover:bg-[#F1F3F5] border border-[#DEE2E6] text-[#2D3436] rounded-lg transition active:scale-95 cursor-pointer"
                            title="Edit Asset Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${asset.serial}? This will also delete from sheets.`)) {
                                onDeleteAsset(asset.serial);
                              }
                            }}
                            className="inline-flex items-center gap-1 p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition active:scale-95 cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-[#ADB5BD] font-mono italic">
                          Read-only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-12 text-center">
                    <p className="text-[#636E72] font-medium mb-1 text-sm">No assets match the active filters</p>
                    <p className="text-xs text-[#ADB5BD]">Try modifying your query or filters</p>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* Footer info & Bulk selection controls */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-[#F1F3F5] border-t border-[#E9ECEF] gap-3">
          <span className="text-xs text-[#636E72] font-medium">
            Showing {filteredAssets.length} of {assets.length} assets
          </span>

          {selectedSerials.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[#6C5CE7] font-mono mr-1">
                {selectedSerials.size} {selectedSerials.size === 1 ? 'asset' : 'assets'} selected
              </span>

              <button
                id="btn-footer-export-selected-excel"
                onClick={handleExportSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6C5CE7] hover:bg-[#5A4ED1] text-white rounded-lg font-semibold transition cursor-pointer"
                title="Export selected assets to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
              </button>

              <button
                onClick={handleClearSelection}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-[#DEE2E6] text-[#636E72] hover:text-[#2D3436] rounded-lg font-medium transition cursor-pointer"
              >
                Clear
              </button>

              {isAdmin && (
                <button
                  onClick={handleBulkDeleteAction}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
