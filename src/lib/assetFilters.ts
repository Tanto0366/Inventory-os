import { Asset } from '../types';

export interface AssetFilterCriteria {
  searchQuery?: string;
  status?: string;
  itemName?: string;
  brand?: string;
  city?: string;
  campaign?: string;
  owner?: string;
}

/**
 * Extracts unique item names from inventory assets:
 * - Automatically populates from unique asset.name values
 * - Removes duplicates
 * - Sorts values alphabetically
 */
export function getUniqueItemNames(assets: Asset[]): string[] {
  if (!assets || !Array.isArray(assets)) return [];
  const names = assets
    .map(a => a?.name?.trim())
    .filter((n): n is string => Boolean(n));
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}

/**
 * Extracts unique values for any string property from inventory assets,
 * deduplicated and sorted alphabetically.
 */
export function getUniquePropertyValues(
  assets: Asset[], 
  prop: keyof Pick<Asset, 'brand' | 'city' | 'campaign' | 'owner' | 'status'>
): string[] {
  if (!assets || !Array.isArray(assets)) return [];
  const values = assets
    .map(a => (a?.[prop] ? String(a[prop]).trim() : ''))
    .filter(Boolean);
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

/**
 * Filters assets according to search and dropdown criteria.
 */
export function filterAssets(assets: Asset[], criteria: AssetFilterCriteria): Asset[] {
  if (!assets || !Array.isArray(assets)) return [];

  const searchQ = (criteria.searchQuery || '').trim().toLowerCase();
  const filterStatus = (criteria.status || '').trim();
  const filterItemName = (criteria.itemName || '').trim();
  const filterBrand = (criteria.brand || '').trim();
  const filterCity = (criteria.city || '').trim();
  const filterCampaign = (criteria.campaign || '').trim();
  const filterOwner = (criteria.owner || '').trim();

  return assets.filter(a => {
    if (!a) return false;

    // Global text search
    if (searchQ) {
      const match = 
        (a.serial || '').toLowerCase().includes(searchQ) ||
        (a.boxId || '').toLowerCase().includes(searchQ) ||
        (a.name || '').toLowerCase().includes(searchQ) ||
        (a.brand || '').toLowerCase().includes(searchQ) ||
        (a.desc || '').toLowerCase().includes(searchQ) ||
        (a.owner || '').toLowerCase().includes(searchQ) ||
        (a.possessor || '').toLowerCase().includes(searchQ) ||
        (a.campaign || '').toLowerCase().includes(searchQ) ||
        (a.city || '').toLowerCase().includes(searchQ);
      if (!match) return false;
    }

    // Item Name filter
    if (filterItemName && (a.name || '').trim() !== filterItemName) return false;

    // Status filter
    if (filterStatus && a.status !== filterStatus) return false;

    // Brand filter
    if (filterBrand && (a.brand || '').trim() !== filterBrand) return false;

    // City / Location filter
    if (filterCity && (a.city || '').trim() !== filterCity) return false;

    // Campaign filter
    if (filterCampaign && (a.campaign || '').trim() !== filterCampaign) return false;

    // Owner filter
    if (filterOwner && (a.owner || '').trim() !== filterOwner) return false;

    return true;
  });
}
