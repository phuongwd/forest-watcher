import { offline } from 'redux-offline';
import offlineConfig from 'redux-offline/lib/defaults';
import detectNetworkNative from 'redux-offline/lib/defaults/detectNetwork.native';
import { AsyncStorage } from 'react-native'; // eslint-disable-line import/no-unresolved
import { persistStore } from 'redux-persist';

const persistNative = (store, options, callback) => (
  persistStore(store, { storage: AsyncStorage, ...options }, callback) // .purge to clean the offline data
);

const config = params => ({
  ...offlineConfig,
  rehydrate: true,
  persist: persistNative,
  detectNetwork: detectNetworkNative,
  persistOptions: {
    blacklist: ['setup']
  },
  persistCallback: params.persistCallback
});

export default params => offline(config(params));
