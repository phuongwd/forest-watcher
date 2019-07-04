// eslint-disable-next-line import/default
import codePush from 'react-native-code-push';
import { Alert, AppState, Platform } from 'react-native';
import { Navigation } from 'react-native-navigation';
import { Provider } from 'react-redux';
import Theme from 'config/theme';
import { registerScreens } from 'screens';
import createStore from 'store';
import { setupCrashLogging } from './crashes';
import i18n from 'locales';

import {
  GFWLocationAuthorizedAlways,
  initialiseLocationFramework,
  checkLocationStatus,
  showAppSettings,
  showLocationSettings,
  startTrackingLocation
} from 'helpers/location';
import { discardActiveRoute } from './redux-modules/routes';

// Disable ios warnings
// console.disableYellowBox = true;

// Show request in chrome network tool
// GLOBAL.XMLHttpRequest = GLOBAL.originalXMLHttpRequest || GLOBAL.XMLHttpRequest;

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.MANUAL,
  installMode: codePush.InstallMode.ON_NEXT_RESUME
};

export default class App {
  constructor() {
    this.store = null;
    this.currentAppState = 'background';
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  configureCodePush() {
    const codepushEnable = !__DEV__;
    if (codepushEnable) {
      codePush.sync(codePushOptions);
    }
  }

  async launchRoot() {
    await Navigation.setDefaultOptions({
      ...Theme.navigator.styles
    });

    const state = this.store.getState();
    let screen = 'ForestWatcher.Home';
    if (state.user.loggedIn && state.app.synced) {
      screen = 'ForestWatcher.Dashboard';
    }

    await launchAppRoot(screen);
    await this._handleAppStateChange('active');
  }

  _handleAppStateChange = async nextAppState => {
    // As this can be called before the store is initialised, ensure we have a store before continuing.
    if (!this.store) {
      return;
    }

    const hasTransitionedToForeground = this.currentAppState.match(/inactive|background/) && nextAppState === 'active';
    this.currentAppState = nextAppState;

    if (!hasTransitionedToForeground) {
      return;
    }

    const activeRoute = this.store.getState().routes.activeRoute;

    // If there was no active route then we are done
    if (!activeRoute) {
      return;
    }

    // If we have an active route in state it means we should be tracking locations for it...
    const locationStatus = await checkLocationStatus();
    let trackingIsBlocked = false;

    // If the tracker is not currently running then find out what the user wants to do and possibly start it
    if (!locationStatus.isRunning) {
      // Ask the user if they want to resume tracking
      const shouldResume = await new Promise(resolve => {
        Alert.alert(i18n.t('routes.resumeTrackingDialogTitle'), i18n.t('routes.resumeTrackingDialogMessage'), [
          { text: i18n.t('routes.resumeTrackingDialogPositiveButton'), onPress: () => resolve(true) },
          {
            text: i18n.t('routes.resumeTrackingDialogNegativeButton'),
            onPress: () => resolve(false)
          }
        ]);
      });

      if (!shouldResume) {
        this.store.dispatch(discardActiveRoute());
        return;
      }

      // Attempt to start tracking. If it succeeds then we are done
      try {
        await startTrackingLocation(GFWLocationAuthorizedAlways);
        return;
      } catch (err) {
        // Could not start tracking after resuming from background - tell the user to fix their settings
        trackingIsBlocked = true;
      }
    } else {
      trackingIsBlocked =
        !locationStatus.locationServicesEnabled || locationStatus.authorization !== GFWLocationAuthorizedAlways;
    }

    // Show a message saying tracking is paused until they fix the problem, along with buttons to take them to app settings.
    if (trackingIsBlocked) {
      Alert.alert(i18n.t('routes.backgroundErrorDialogTitle'), i18n.t('routes.backgroundErrorDialogMessage'), [
        { text: i18n.t('commonText.ok') },
        {
          text: i18n.t('routes.insufficientPermissionsDialogOpenAppSettings'),
          onPress: showAppSettings
        },
        ...Platform.select({
          android: [
            {
              text: i18n.t('routes.insufficientPermissionsDialogOpenDeviceSettings'),
              onPress: showLocationSettings
            }
          ],
          ios: [{}]
        })
      ]);
    }
  };

  /**
   * Performs one-time setup tasks needed to launch the application
   *
   * If called further times it will only setup the UI
   */
  async setupApp() {
    // If we've already setup the app then store will be non-null, and we just need to launch a UI root
    if (this.store) {
      this.launchRoot();
      return;
    }

    if (!__DEV__) {
      await setupCrashLogging();
    }

    const store = createStore(async () => {
      this.store = store;
      registerScreens(store, Provider);
      initialiseLocationFramework();
      this.configureCodePush();
      createStore.runSagas();
      await this.launchRoot();
    });
  }
}

export function launchAppRoot(screen) {
  return Navigation.setRoot({
    root: {
      sideMenu: {
        center: {
          stack: {
            children: [
              {
                component: {
                  name: screen
                }
              }
            ]
          }
        },
        right: {
          component: {
            name: 'ForestWatcher.RightDrawer',
            passProps: {}
          }
        }
      }
    }
  });
}
