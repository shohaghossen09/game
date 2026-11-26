/** Synchronous PREVIEW tile fallback used by the streaming manager when a
 *  district has no baked OpenStreetMap data. Clearly labeled — never
 *  presented as real map data. */

import type { DhakaTile } from '../world/dhakaTile';
import { previewTile } from '../world/dhakaTile';

export function previewTileFallback(): DhakaTile {
  return previewTile();
}
