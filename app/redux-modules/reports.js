import Config from 'react-native-config';
import RNFetchBlob from 'react-native-fetch-blob';

import CONSTANTS from 'config/constants';

const defaultReport = CONSTANTS.reports.default;

// Actions
const GET_QUESTIONS = 'report/GET_QUESTIONS';
const SET_REPORT_STATUS = 'report/SET_REPORT_STATUS';


// Reducer
const initialNavState = {
  forms: {},
  answers: {
    idForm: 'idAlert'
  }
};

export default function reducer(state = initialNavState, action) {
  switch (action.type) {
    case GET_QUESTIONS: {
      return Object.assign({}, state, { forms: action.payload });
    }
    case SET_REPORT_STATUS: {
      return Object.assign({}, state, { answers: action.payload });
    }
    default: {
      return state;
    }
  }
}

// Action Creators
export function getQuestions() {
  return (dispatch, state) => {
    const url = `${Config.API_URL}/questionnaire/${Config.QUESTIONNARIE_ID}`;
    const fetchConfig = {
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${state().user.token}`
      }
    };
    fetch(url, fetchConfig)
      .then(response => {
        if (response.ok) return response.json();
        throw Error(response);
      })
      .then((data) => {
        let form = [];
        if (data && data.data && data.data[0]) form = data.data[0].attributes;
        form.questions = form.questions.sort((a, b) => parseInt(a.order, 10) - parseInt(b.order, 10));
        dispatch({
          type: GET_QUESTIONS,
          payload: form
        });
      })
      .catch((err) => {
        // TODO: handle error
        console.warn(err);
      });
  };
}

export function saveReport(reportName) {
  const reportStatus = {};
  reportStatus[reportName] = {
    status: CONSTANTS.status.draft
  };
  return {
    type: SET_REPORT_STATUS,
    payload: reportStatus
  };
}

export function finishReport(report) {
  return (dispatch, state) => {
    const reportStatus = {};
    reportStatus[defaultReport] = { // GET THE REPORT FROM PARAMS
      status: CONSTANTS.status.complete
    };
    dispatch({
      type: SET_REPORT_STATUS,
      payload: reportStatus
    });
    const form = new FormData();
    const promises = [];
    const keys = [];
    Object.keys(report).forEach((key) => {
      if (report[key].indexOf('jpg') >= 0) { // TODO: improve this
        promises.push(RNFetchBlob.fs.readFile(report[key], 'base64'));
        keys.push(key);
      } else {
        form.append(key, report[key]);
      }
    });
    if (promises.length > 0) {
      Promise.all(promises).then((data) => {
        for (let i = 0, pLenght = promises.length; i < pLenght; i++) {
          form.append(keys[i], data[i]);
        }
      });
    }
    const user = state().user;
    const userName = (user && user.data && user.data.attributes && user.data.attributes.fullName) || 'Guest user';
    const oganization = (user && user.data && user.data.attributes && user.data.attributes.organization) || 'Vizzuality';
    const date = new Date().toISOString();
    // TODO GET REAL DATA
    const position = 'lat/lng';

    form.append('name', userName);
    form.append('organization', oganization);
    form.append('date', date);
    form.append('position', position);

    const url = `${Config.API_URL}/questionnaire/${Config.QUESTIONNARIE_ID}/answer`;

    // const xhr = new XMLHttpRequest();
    // xhr.withCredentials = true;
    // xhr.open('POST', url);
    // xhr.setRequestHeader('authorization', `Bearer ${state().user.token}`);

    // xhr.addEventListener('readystatechange', () => {
    //   if (xhr.readyState === 4) {
    //     if (xhr.status === 200) {
    //       reportStatus[defaultReport].status = CONSTANTS.status.uploaded;
    //       console.log('iuuuuhuuuuuu', xhr.responseText);
    //       dispatch({
    //         type: SET_REPORT_STATUS,
    //         payload: reportStatus
    //       });
    //     } else {
    //       console.log('TODO: handle error', xhr.responseText);
    //     }
    //   }
    // });
    // xhr.send(form);

    // FETCH not working
    const fetchConfig = {
      headers: {
        Authorization: `Bearer ${state().user.token}`
      },
      method: 'POST',
      body: form
    };
    fetch(url, fetchConfig)
      .then((response) => {
        if (response.ok) return response.json();
        throw Error(response);
      })
      .then((data) => {
        console.log(data, 'form data response');
        reportStatus[defaultReport].status = CONSTANTS.status.uploaded;
        dispatch({
          type: SET_REPORT_STATUS,
          payload: reportStatus
        });
      })
      .catch((err) => {
        console.log('TODO: handle error', err);
      });
  };
}
