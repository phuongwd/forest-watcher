import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  ScrollView,
  Platform,
  Text
} from 'react-native';

import AreaList from 'containers/common/area-list';
import Row from 'components/common/row';
import Theme from 'config/theme';
import tracker from 'helpers/googleAnalytics';
import I18n from 'locales';
import styles from './styles';

const settingsIcon = require('assets/settings.png');
const nextIcon = require('assets/next.png');

const { RNLocation: Location } = require('NativeModules'); // eslint-disable-line

class Dashboard extends PureComponent {

  static propTypes = {
    navigator: PropTypes.object.isRequired,
    actionsPending: PropTypes.number.isRequired,
    syncModalOpen: PropTypes.bool.isRequired,
    syncSkip: PropTypes.bool.isRequired,
    pristine: PropTypes.bool.isRequired,
    setSyncModal: PropTypes.func.isRequired,
    updateSelectedIndex: PropTypes.func.isRequired,
    setPristine: PropTypes.func.isRequired
  };

  static navigatorStyle = {
    navBarTextColor: Theme.colors.color1,
    navBarButtonColor: Theme.colors.color1,
    topBarElevationShadowEnabled: false,
    navBarBackgroundColor: Theme.background.main,
    navBarNoBorder: true
  };

  static navigatorButtons = {
    rightButtons: [
      {
        icon: settingsIcon,
        id: 'settings'
      }
    ]
  };

  static disableListener() {
    return false;
  }

  constructor(props) {
    super(props);
    this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent);
    this.reportsAction = {
      callback: this.onPressReports,
      icon: nextIcon
    };
  }

  componentDidMount() {
    if (Platform.OS === 'ios') {
      Location.requestAlwaysAuthorization();
    }
    tracker.trackScreenView('DashBoard');
  }

  onAreaPress = (areaId, name, index) => {
    if (typeof index === 'undefined') return;
    this.props.updateSelectedIndex(index);
    this.props.navigator.push({
      screen: 'ForestWatcher.Map',
      title: I18n.t('dashboard.map')
    });
  }

  onPressReports = () => {
    this.props.navigator.push({
      screen: 'ForestWatcher.Reports',
      title: I18n.t('dashboard.myReports')
    });
  }

  onNavigatorEvent = (event) => {
    const { actionsPending, syncModalOpen, syncSkip } = this.props;
    if (event.type === 'NavBarButtonPress') {
      if (event.id === 'settings') {
        this.props.navigator.push({
          screen: 'ForestWatcher.Settings',
          title: 'Settings'
        });
      }
    } else if (event.id === 'didAppear') {
      if (actionsPending > 0 && !syncModalOpen && !syncSkip && !this.syncModalOpen) {
        this.syncModalOpen = true;
        this.props.setSyncModal(true);
        this.props.navigator.showModal({
          screen: 'ForestWatcher.Sync',
          passProps: {
            goBackDisabled: true
          }
        });
      }
    } else if (event.id === 'willDisappear') {
      this.props.setPristine(false);
    }
  }

  getPristine = () => (this.props.pristine)

  disablePristine = () => {
    this.props.setPristine(false);
  }

  render() {
    const { pristine } = this.props;
    const isIOS = Platform.OS === 'ios';
    // we remove the event handler to improve performance

    // this is done this way because in android the event listener needs to be at...
    // ...the root and in iOS needs to be a children to scroll view
    const disablePristine = pristine ? this.disablePristine : undefined;
    const androidListener = !isIOS ? this.getPristine : Dashboard.disableListener;
    const iOSListener = isIOS ? this.getPristine : Dashboard.disableListener;
    const androidHandler = !isIOS ? this.disablePristine : undefined;
    const iOSHandler = isIOS ? this.disablePristine : undefined;
    return (
      <View
        style={styles.container}
        onStartShouldSetResponder={androidListener}
        onResponderRelease={androidHandler}
      >
        <View style={styles.backgroundHack} />
        <ScrollView
          style={styles.containerScroll}
          onScroll={disablePristine}
        >
          <View
            onStartShouldSetResponder={iOSListener}
            onResponderRelease={iOSHandler}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            scrollEnabled
          >
            <View>
              <Text style={styles.label}>
                {I18n.t('settings.yourAreas')}
              </Text>
              <AreaList onAreaPress={this.onAreaPress} showCache pristine={pristine} />
            </View>
          </View>
        </ScrollView>
        <Row style={styles.row} action={this.reportsAction}>
          <Text style={styles.textMyReports}>{I18n.t('dashboard.myReports')}</Text>
        </Row>
      </View>
    );
  }
}

export default Dashboard;
