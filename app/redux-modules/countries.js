import Config from 'react-native-config';
import I18n from 'locales';

// Actions
const GET_COUNTRIES = 'countries/GET_COUNTRIES';

// Reducer
const initialState = {
  data: null
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case GET_COUNTRIES:
      return Object.assign({}, state, { data: action.payload.data });
    default:
      return state;
  }
}

// Action Creators
export function getCountries() {
  const url = `${Config.API_URL}/query/${Config.DATASET_COUNTRIES}?sql=
    SELECT ${I18n.t('countries.nameColumn')} as name, iso, centroid
    FROM gadm28_countries`;

  return (dispatch) => {
    fetch(url)
      .then(response => response.json())
      .then((data) => {
        dispatch({
          type: GET_COUNTRIES,
          payload: data
        });
      })
      .catch((error) => {
        console.warn(error);
        // To-do
      });
  };
}
