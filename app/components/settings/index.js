import React, { Component } from 'react';
import List from 'components/common/list';
import AreaList from 'components/settings/area-list';
import {
  View,
  Text,
  TouchableHighlight,
  ScrollView,
  Image
} from 'react-native';

import LeftBtn from 'components/common/header/left-btn';
import Theme from 'config/theme';
import I18n from 'locales';
import headerStyles from 'components/common/header/styles';
import tracker from 'helpers/googleAnalytics';

import styles from './styles';

const plusIcon = require('assets/plus.png');

const aboutSections = [
  {
    text: I18n.t('settings.aboutPartners'),
    image: null,
    functionOnPress: null
  },
  {
    text: I18n.t('settings.aboutTerms'),
    image: null,
    functionOnPress: null
  }
];

class Settings extends Component {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
    // cache disabled for now
    // if (!this.props.areas || !this.props.areas.length > 0) {
    tracker.trackScreenView('Set Up');
    this.props.getAreas();
    // }
  }

  onLogoutPress = () => {
    this.props.logout();
    this.props.navigate('Home');
  }

  render() {
    const { areas, areasImages, navigate, syncing } = this.props;

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <Text style={styles.label}>
            {I18n.t('settings.loggedIn')}
          </Text>

          <View style={styles.user}>
            <View style={styles.info}>
              <Text style={styles.name}>
                {this.props.user.fullName}
              </Text>
              <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail" >
                {this.props.user.email}
              </Text>
            </View>
            <TouchableHighlight
              activeOpacity={0.5}
              underlayColor="transparent"
              onPress={this.onLogoutPress}
            >
              <Text style={styles.logout}>{I18n.t('settings.logOut')}</Text>
            </TouchableHighlight>
          </View>

          {areas && areas.length
            ? <View style={styles.areas}>
              <Text style={styles.label}>
                {I18n.t('settings.yourAreas')}
              </Text>
              <AreaList areas={areas} areasImages={areasImages} navigate={navigate} syncing={syncing} />
            </View>
          : null
          }
          <TouchableHighlight
            activeOpacity={0.5}
            underlayColor="transparent"
            onPress={() => navigate('Setup')}
          >
            <View style={styles.addButton}>
              <Image style={Theme.icon} source={plusIcon} />
              <Text style={styles.addButtonText}>
                {I18n.t('settings.addArea').toUpperCase()}
              </Text>
            </View>
          </TouchableHighlight>

          <View style={styles.aboutSection}>
            <Text style={styles.label}>
              {I18n.t('settings.aboutApp')}
            </Text>

            <List content={aboutSections} bigSeparation={false}>{}</List>

            <Text style={[styles.label, styles.footerText]}>
              {I18n.t('commonText.appName')}
            </Text>

          </View>
        </ScrollView>
      </View>
    );
  }
}

Settings.propTypes = {
  user: React.PropTypes.any,
  areas: React.PropTypes.any,
  areasImages: React.PropTypes.any,
  navigate: React.PropTypes.func.isRequired,
  getAreas: React.PropTypes.func.isRequired,
  syncing: React.PropTypes.bool.isRequired,
  logout: React.PropTypes.func.isRequired
};

Settings.navigationOptions = {
  header: ({ goBack }) => ({
    left: <LeftBtn goBack={goBack} />,
    tintColor: Theme.colors.color1,
    style: headerStyles.style,
    titleStyle: headerStyles.titleStyle,
    title: I18n.t('settings.title')
  })
};


export default Settings;
