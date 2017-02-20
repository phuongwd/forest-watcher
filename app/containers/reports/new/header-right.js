import { connect } from 'react-redux';
import { saveReport } from 'redux-modules/reports';

import HeaderRight from 'components/reports/new/header-right';
import CONSTANTS from 'config/constants';

const defaultReport = CONSTANTS.reports.default;

 // TODO: handle form identifier

function getAnswers(form) {
  if (!form) return null;
  if (form[defaultReport] && form[defaultReport].values) return form[defaultReport].values;
  return {};
}

function mapStateToProps(state) {
  return {
    answers: getAnswers(state.form)
  };
}

function mapDispatchToProps(dispatch, { navigation }) {
  return {
    saveReport: (report) => {
      dispatch(saveReport(report));
    },
    goBack: () => {
      navigation.goBack();
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HeaderRight);