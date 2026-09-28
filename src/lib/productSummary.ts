import { Asset, ProductSummaryItem, ProductInventoryOverview } from '../types';

/**
 * Resolves the canonical Product Name from an Asset record.
 * In the InventoryOS Assets schema:
 * - 'desc' represents the Product Name / Hardware Model (e.g. "Lenovo Legion 5", "Boom 3", "G PRO Headset").
 * - 'name' represents the Item Classification / Category (e.g. "Laptop", "Mouse", "Desk Mat").
 * 
 * If 'desc' is populated, it takes precedence as the specific Product Name.
 * If 'desc' is empty or placeholder (e.g. "—", "Nil"), it falls back to 'name'.
 */
export function getCanonicalProductName(asset: { desc?: string; name?: string; brand?: string }): string {
  if (!asset) return 'Unspecified Product';

  const desc = (asset.desc || '').trim();
  if (desc && desc !== '—' && desc !== '-' && desc.toLowerCase() !== 'nil') {
    return desc;
  }

  const name = (asset.name || '').trim();
  if (name && name !== '—' && name !== '-' && name.toLowerCase() !== 'nil') {
    return name;
  }

  const brand = (asset.brand || '').trim();
  if (brand && brand !== '—' && brand !== '-' && brand.toLowerCase() !== 'nil') {
    return `${brand} (General)`;
  }

  return 'Unspecified Product';
}

/**
 * Aggregates a list of assets into a product-wise summary.
 * Correctly combines multiple inventory rows for the same product,
 * accumulating their respective quantities and status distributions.
 */
export function computeProductSummary(assets: Asset[]): ProductSummaryItem[] {
  if (!assets || !Array.isArray(assets)) return [];

  // Group by lowercase normalized product name to handle casing consistency
  const map = new Map<string, {
    displayName: string;
    categories: Set<string>;
    brands: Set<string>;
    totalQty: number;
    inHouseQty: number;
    deliveredQty: number;
    inTransitQty: number;
    readyPickupQty: number;
    otherStatusQty: number;
    locations: Set<string>;
    serials: string[];
  }>();

  for (const asset of assets) {
    if (!asset) continue;

    const prodName = getCanonicalProductName(asset);
    const key = prodName.toLowerCase();
    
    // Canonical quantity field: asset.qty (defaulting to 1 if missing, 0, or invalid)
    const rawQty = parseInt(String(asset.qty), 10);
    const qty = !isNaN(rawQty) && rawQty > 0 ? rawQty : 1;

    let group = map.get(key);
    if (!group) {
      group = {
        displayName: prodName,
        categories: new Set(),
        brands: new Set(),
        totalQty: 0,
        inHouseQty: 0,
        deliveredQty: 0,
        inTransitQty: 0,
        readyPickupQty: 0,
        otherStatusQty: 0,
        locations: new Set(),
        serials: []
      };
      map.set(key, group);
    } else {
      // If the current entry has richer capitalization/casing, keep it
      if (prodName.length > group.displayName.length || (group.displayName === group.displayName.toLowerCase() && prodName !== prodName.toLowerCase())) {
        group.displayName = prodName;
      }
    }

    group.totalQty += qty;

    if (asset.serial && asset.serial.trim()) {
      group.serials.push(asset.serial.trim());
    }

    if (asset.name && asset.name.trim() && asset.name !== '—' && asset.name !== '-') {
      group.categories.add(asset.name.trim());
    }

    if (asset.brand && asset.brand.trim() && asset.brand !== '—' && asset.brand !== '-') {
      group.brands.add(asset.brand.trim());
    }

    if (asset.city && asset.city.trim() && asset.city !== '—' && asset.city !== '-') {
      group.locations.add(asset.city.trim());
    }

    const status = (asset.status || '').trim().toLowerCase();
    if (status === 'in house') {
      group.inHouseQty += qty;
    } else if (status === 'delivered') {
      group.deliveredQty += qty;
    } else if (status === 'in transit') {
      group.inTransitQty += qty;
    } else if (status === 'ready for pickup') {
      group.readyPickupQty += qty;
    } else {
      group.otherStatusQty += qty;
    }
  }

  const items: ProductSummaryItem[] = Array.from(map.values()).map(g => ({
    productName: g.displayName,
    category: Array.from(g.categories).join(', ') || 'General',
    brand: Array.from(g.brands).join(', ') || '—',
    totalQty: g.totalQty,
    inHouseQty: g.inHouseQty,
    deliveredQty: g.deliveredQty,
    inTransitQty: g.inTransitQty,
    readyPickupQty: g.readyPickupQty,
    otherStatusQty: g.otherStatusQty,
    locations: Array.from(g.locations).sort(),
    serialsCount: g.serials.length,
    serials: g.serials
  }));

  // Default sort: highest quantity first, then alphabetically
  items.sort((a, b) => {
    if (b.totalQty !== a.totalQty) {
      return b.totalQty - a.totalQty;
    }
    return a.productName.localeCompare(b.productName);
  });

  return items;
}

/**
 * Computes high-level aggregated metrics for the Product Inventory Overview.
 */
export function getProductInventoryOverview(assets: Asset[]): ProductInventoryOverview {
  const productSummary = computeProductSummary(assets);

  let totalQuantity = 0;
  let totalInHouse = 0;
  let totalDelivered = 0;
  let totalInTransit = 0;
  let totalReadyPickup = 0;

  for (const item of productSummary) {
    totalQuantity += item.totalQty;
    totalInHouse += item.inHouseQty;
    totalDelivered += item.deliveredQty;
    totalInTransit += item.inTransitQty;
    totalReadyPickup += item.readyPickupQty;
  }

  return {
    productSummary,
    totalUniqueProducts: productSummary.length,
    totalQuantity,
    totalInHouse,
    totalDelivered,
    totalInTransit,
    totalReadyPickup
  };
}
