// Actions
const SET_COUNTRY = 'setup/SET_COUNTRY';

// Reducer
const initialState = {
  country: {},
  area: {}
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case SET_COUNTRY:
      return Object.assign({}, state, { country: action.payload });
    default:
      return state;
  }
}

export function setSetupCountry(country) {
  return {
    type: SET_COUNTRY,
    payload: country
  };
}