import React, { Component } from 'react';
import {
  Text,
  View,
  Alert
} from 'react-native';
import Theme from 'config/theme';
import CONSTANTS from 'config/constants';
import I18n from 'locales';

import ActionButton from 'components/common/action-button';
import styles from './styles';

const saveReportIcon = require('assets/save_for_later.png');

class Answers extends Component {
  static navigatorStyle = {
    navBarTextColor: Theme.colors.color1,
    navBarButtonColor: Theme.colors.color1,
    topBarElevationShadowEnabled: false,
    navBarBackgroundColor: Theme.background.main
  };

  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    results: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        question: React.PropTypes.object,
        answers: React.PropTypes.array
      })
    ),
    enableDraft: React.PropTypes.bool.isRequired,
    saveReport: React.PropTypes.func.isRequired,
    form: React.PropTypes.string.isRequired,
    finish: React.PropTypes.func.isRequired
  };

  static defaultProps = {
    enableDraft: true
  };

  constructor(props) {
    super(props);
    if (this.props.enableDraft) {
      this.props.navigator.setButtons({
        rightButtons: [
          {
            icon: saveReportIcon,
            id: 'draft'
          }
        ]
      });
      this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent);
    }
  }

  onPressDraft = () => {
    const { form } = this.props;
    Alert.alert(
      I18n.t('report.saveLaterTitle'),
      I18n.t('report.saveLaterDescription'),
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'OK',
          onPress: () => {
            if (this.props.saveReport) {
              this.props.saveReport(form, {
                status: CONSTANTS.status.draft
              });
            }
            this.props.navigator.popToRoot({ animate: true });
          }
        }
      ],
      { cancelable: false }
    );
  }

  onPressSave = () => {
    const { form, finish, navigator } = this.props;
    finish(form);
    navigator.popToRoot({ animate: true });
  }

  onNavigatorEvent = (event) => {
    if (event.type === 'NavBarButtonPress') {
      if (event.id === 'draft') this.onPressDraft();
    }
  }

  render() {
    const { results } = this.props;
    return (
      <View>
        {
          results.map(result => (
            <Text key={result.question.id}>{result.question.label} - {result.answers}</Text>
          ))
        }
        <ActionButton
          style={styles.buttonPos}
          onPress={this.onPressSave}
          text={I18n.t('commonText.save')}
        />
      </View>
    );
  }
}

export default Answers;
