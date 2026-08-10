import { Asset } from '../types';

/**
 * Ensures that every asset record represents exactly 1 unit (qty = 1).
 * If an asset has qty > 1 (e.g. qty: 8), it expands the record into
 * `qty` separate, individual asset records, each with a unique `assetId`
 * and a unique `serial`.
 */
export function expandAssetsWithQuantities(assets: Asset[]): Asset[] {
  if (!assets || !Array.isArray(assets)) return [];

  const expanded: Asset[] = [];
  const usedSerials = new Set<string>();
  const usedAssetIds = new Set<string>();

  // Find max numerical AST-xxxxxx ID
  let maxIdNum = 0;
  for (const a of assets) {
    if (a && a.assetId) {
      const match = a.assetId.match(/AST-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxIdNum) {
          maxIdNum = num;
        }
      }
    }
  }

  const generateNewAssetId = (): string => {
    while (true) {
      maxIdNum++;
      const candidate = `AST-${String(maxIdNum).padStart(6, '0')}`;
      if (!usedAssetIds.has(candidate)) {
        usedAssetIds.add(candidate);
        return candidate;
      }
    }
  };

  const makeUniqueSerial = (baseSerial: string, unitIndex: number, totalUnits: number): string => {
    const raw = (baseSerial || 'NIL').trim();
    let candidate = totalUnits > 1 ? `${raw}-${unitIndex}` : raw;
    let count = unitIndex;
    while (usedSerials.has(candidate.toLowerCase())) {
      candidate = `${raw}-${count}`;
      count++;
    }
    usedSerials.add(candidate.toLowerCase());
    return candidate;
  };

  for (const item of assets) {
    if (!item) continue;
    const quantity = Math.max(1, parseInt(String(item.qty)) || 1);

    if (quantity === 1) {
      let finalSerial = item.serial?.trim() || `SN-${Date.now()}`;
      if (usedSerials.has(finalSerial.toLowerCase())) {
        let suffix = 1;
        while (usedSerials.has(`${finalSerial}-${suffix}`.toLowerCase())) {
          suffix++;
        }
        finalSerial = `${finalSerial}-${suffix}`;
      }
      usedSerials.add(finalSerial.toLowerCase());

      let finalAssetId = item.assetId?.trim() || generateNewAssetId();
      usedAssetIds.add(finalAssetId);

      expanded.push({
        ...item,
        sn: expanded.length + 1,
        assetId: finalAssetId,
        serial: finalSerial,
        qty: 1
      });
    } else {
      // Multi-quantity asset! Expand into `quantity` individual assets
      const baseSerial = item.serial?.trim() || item.assetId || 'UNIT';
      const baseBoxId = item.boxId || '—';

      for (let k = 1; k <= quantity; k++) {
        const uniqueSerial = makeUniqueSerial(baseSerial, k, quantity);
        let uniqueAssetId = (k === 1 && item.assetId && !usedAssetIds.has(item.assetId))
          ? item.assetId
          : generateNewAssetId();
        usedAssetIds.add(uniqueAssetId);

        expanded.push({
          ...item,
          sn: expanded.length + 1,
          assetId: uniqueAssetId,
          serial: uniqueSerial,
          boxId: baseBoxId,
          qty: 1
        });
      }
    }
  }

  // Renumber sequence
  return expanded.map((item, idx) => ({
    ...item,
    sn: idx + 1
  }));
}
