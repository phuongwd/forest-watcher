// @flow
import type { MBTileBasemapMetadata } from './types.js';
import MBTilesSource from './tileSource';

import ReactNativeMBTiles from './nativeModule.js';

const getMBTilesMetadata = async (path: string): Promise<MBTileBasemapMetadata> => {
  return await new Promise((resolve, reject) => {
    // We use the path here as a temporary ID - this source will be thrown away so it isn't important.
    ReactNativeMBTiles.getMetadata(path, path, (error, metadata) => {
      if (error || !metadata) {
        reject(error);
        return;
      } else if (!metadata) {
        reject(new Error('3SC MBTile Import - There was an error'));
        return;
      }

      resolve(metadata);
    });
  });
};

export default ReactNativeMBTiles;
export { MBTilesSource, getMBTilesMetadata };
export type { MBTileBasemapMetadata };
