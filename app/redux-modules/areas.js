import Config from 'react-native-config';
import { getGeostore } from 'redux-modules/geostore';
import { getCachedImageByUrl, removeFolder } from 'helpers/fileManagement';
import { getBboxTiles, cacheTiles } from 'helpers/map';
import { getCoverageDataByGeostore, getInitialDatasets } from 'helpers/area';
import BoundingBox from 'boundingbox';
import CONSTANTS from 'config/constants';

// Actions
import { SET_AREA_SAVED } from 'redux-modules/setup';
import { LOGOUT_REQUEST } from 'redux-modules/user';

const GET_AREAS = 'areas/GET_AREAS';
const UPDATE_AREA = 'areas/UPDATE_AREA';
const SAVE_AREA = 'areas/SAVE_AREA';
const DELETE_AREA = 'areas/DELETE_AREA';
const SYNCING_AREAS = 'areas/SYNCING_AREA';
const UPDATE_DATE = 'areas/UPDATE_DATE';
const UPDATE_INDEX = 'areas/UPDATE_INDEX';

// Reducer
const initialState = {
  data: [],
  selectedIndex: 0,
  images: {},
  synced: false,
  syncing: false
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case GET_AREAS: {
      const areas = [...state.data];
      const images = action.payload.images;
      const newAreas = action.payload.data;
      let mergedAreas = [];
      if (areas.length > 0) {
        for (let i = 0, aLength = areas.length; i < aLength; i++) {
          for (let j = 0, naLength = newAreas.length; j < naLength; j++) {
            if (areas[i].id === areas[j].id) {
              mergedAreas.push({ ...areas[i], ...newAreas[j] });
            }
          }
        }
      } else {
        mergedAreas = newAreas;
      }
      return Object.assign({}, state, { data: mergedAreas, images, synced: true });
    }
    case SYNCING_AREAS:
      return Object.assign({}, state, { syncing: action.payload });
    case SAVE_AREA: {
      const areas = state.data.length > 0 ? state.data : [];
      const image = {};

      image[action.payload.area.id] = action.payload.snapshot;
      areas.push(action.payload.area);

      const area = {
        data: areas,
        images: Object.assign({}, state.images, image)
      };

      return Object.assign({}, state, area);
    }
    case UPDATE_AREA: {
      const areas = [...state.data];
      for (let i = 0, aLength = areas.length; i < aLength; i++) {
        if (areas[i].id === action.payload.id) {
          areas[i] = action.payload;
        }
      }

      return Object.assign({}, state, { data: areas });
    }
    case UPDATE_INDEX: {
      return Object.assign({}, state, { selectedIndex: action.payload });
    }
    case DELETE_AREA: {
      const areas = state.data;
      const images = state.images;
      const id = action.payload.id;
      const deletedArea = areas.find((a) => (a.id === id));
      areas.splice(areas.indexOf(deletedArea), 1);
      if (images[id] !== undefined) { delete images[id]; }
      return Object.assign({}, state, { data: areas, images, synced: true });
    }
    case UPDATE_DATE:
      return Object.assign({}, state, { ...action.payload });
    case LOGOUT_REQUEST: {
      return initialState;
    }
    default:
      return state;
  }
}

// Helpers
function getAreaById(areas, areaId) {
  // Using deconstructor to generate a new object
  return { ...areas.find((areaData) => (areaData.id === areaId)) };
}

function updatedCacheDatasets(datasets, datasetSlug, status) {
  if (!datasets) return [];
  return datasets.map((d) => {
    const newDataset = d;
    if (d.slug === datasetSlug) {
      newDataset.cache = status;
    }
    return newDataset;
  });
}

// Action Creators
export function getDatasets(areaId) {
  return async (dispatch, state) => {
    const area = getAreaById(state().areas.data, areaId);
    let coverage = [];
    if (area && (area.attributes.datasets && area.attributes.datasets.length === 0)) {
      try {
        coverage = await getCoverageDataByGeostore(area.attributes.geostore, state().user.token);
      } catch (e) {
        console.warn('Coverage request error', e);
      }
      area.attributes.datasets = getInitialDatasets(coverage);
      dispatch({
        type: UPDATE_AREA,
        payload: area
      });
    }
  };
}


export function getAreas() {
  const url = `${Config.API_URL}/area`;
  return (dispatch, state) => {
    if (state().offline.online) {
      fetch(url, {
        headers: {
          Authorization: `Bearer ${state().user.token}`
        }
      })
        .then(response => {
          if (response.ok) return response.json();
          throw new Error(response.statusText);
        })
        .then(async (response) => {
          // TODO: check datasets and if not create them;
          const images = Object.assign({}, state().areas.images);
          await Promise.all(response.data.map(async (area) => {
            if (area.attributes && area.attributes.geostore) {
              if (!state().geostore.data[area.attributes.geostore]) {
                await dispatch(getGeostore(area.attributes.geostore));
              }
              if (!images[area.id]) {
                images[area.id] = await getCachedImageByUrl(area.attributes.image, 'areas');
              }
            }
            return area;
          }));

          dispatch({
            type: GET_AREAS,
            payload: {
              images,
              data: response.data
            }
          });

          // TODO: split the request of the gesotres, images and datasets
          response.data.map((area) => dispatch(getDatasets(area.id)));
        })
        .catch((error) => {
          console.warn(error);
          // To-do
        });
    }
  };
}

export function updateArea(area) {
  const url = `${Config.API_URL}/area/${area.id}`;
  return (dispatch, state) => {
    const form = new FormData();
    if (area.attributes.name) {
      form.append('name', area.attributes.name);
    }
    if (area.attributes.datasets) {
      form.append('datasets', JSON.stringify(area.attributes.datasets));
    }

    const fetchConfig = {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${state().user.token}`
      },
      body: form
    };

    fetch(url, fetchConfig)
      .then(response => {
        if (response.ok) return response.json();
        throw new Error(response._bodyText); // eslint-disable-line
      })
      .then(() => {
        dispatch({
          type: UPDATE_AREA,
          payload: area
        });
      })
      .catch((error) => {
        console.warn(error);
        // To-do
      });
  };
}

export function updateSelectedIndex(index) {
  return (dispatch) => {
    dispatch({
      type: UPDATE_INDEX,
      payload: index
    });
  };
}

async function downloadArea(bbox, areaId, datasetSlug) {
  const zooms = CONSTANTS.maps.cachedZoomLevels;
  const tilesArray = getBboxTiles(bbox, zooms);
  await cacheTiles(tilesArray, areaId, datasetSlug);
}

export function saveArea(params) {
  const url = `${Config.API_URL}/area`;
  return (dispatch, state) => {
    if (state().offline.online) {
      dispatch({
        type: SYNCING_AREAS,
        payload: true
      });
      const form = new FormData();
      form.append('name', params.area.name);
      form.append('geostore', params.area.geostore);
      const image = {
        uri: params.snapshot,
        type: 'image/png',
        name: `${params.area.name}.png`
      };
      if (params.datasets) {
        form.append('datasets', JSON.stringify(params.datasets));
      }
      form.append('image', image);

      const fetchConfig = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state().user.token}`
        },
        body: form
      };

      fetch(url, fetchConfig)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error(response._bodyText); // eslint-disable-line
        })
        .then(async (res) => {
          dispatch({
            type: SYNCING_AREAS,
            payload: false
          });
          dispatch({
            type: SAVE_AREA,
            payload: {
              area: res.data,
              snapshot: params.snapshot
            }
          });
          dispatch({
            type: SET_AREA_SAVED,
            payload: {
              status: true,
              areaId: res.data.id
            }
          });
        })
        .catch((error) => {
          console.warn('Error saving data', error);
          dispatch({
            type: SET_AREA_SAVED,
            payload: {
              status: false
            }
          });
          console.warn(error);
          // To-do
        });
    }
  };
}

export function cacheArea(areaId, datasetSlug) {
  return async (dispatch, state) => {
    const area = getAreaById(state().areas.data, areaId);

    if (area && state().offline.online) {
      const geojson = state().geostore.data[area.attributes.geostore];
      if (geojson) {
        area.attributes.datasets = updatedCacheDatasets(area.attributes.datasets, datasetSlug, true);
        dispatch({
          type: UPDATE_AREA,
          payload: area
        });
        try {
          const bboxArea = new BoundingBox(geojson.features[0]);
          if (bboxArea) {
            const bbox = [
              { lat: bboxArea.minlat, lng: bboxArea.maxlon },
              { lat: bboxArea.maxlat, lng: bboxArea.minlon }
            ];
            await downloadArea(bbox, areaId, datasetSlug);
          }
          console.info(`cache of ${datasetSlug} is on`, area);
        } catch (e) {
          area.attributes.datasets = updatedCacheDatasets(area.attributes.datasets, datasetSlug, false);
          dispatch({
            type: UPDATE_AREA,
            payload: area
          });
        }
      }
    }
  };
}

export function setAreaDatasetStatus(areaId, datasetSlug, status) {
  return async (dispatch, state) => {
    const area = getAreaById(state().areas.data, areaId);
    if (area) {
      area.attributes.datasets = area.attributes.datasets.map((item) => {
        if (item.slug !== datasetSlug) {
          return status === true
            ? { ...item, active: false }
            : item;
        }
        return { ...item, active: status };
      });
      dispatch(updateArea(area));
    }
  };
}

export function updateDate(areaId, datasetSlug, date) {
  return async (dispatch, state) => {
    const area = getAreaById(state().areas.data, areaId);
    const dateKeys = Object.keys(date) || [];
    if (area) {
      area.attributes.datasets = area.attributes.datasets.map((d) => {
        const newDataset = d;
        if (d.slug === datasetSlug) {
          dateKeys.forEach((dKey) => {
            if (d[dKey]) {
              newDataset[dKey] = date[dKey];
            }
          });
        }
        return newDataset;
      });
      dispatch(updateArea(area));
    }
  };
}

export function removeCachedArea(areaId, datasetSlug) {
  return async (dispatch, state) => {
    const area = getAreaById(state().areas.data, areaId);
    if (area) {
      area.attributes.datasets = updatedCacheDatasets(area.attributes.datasets, datasetSlug, false);
      dispatch({
        type: UPDATE_AREA,
        payload: area
      });
      try {
        const folder = `${CONSTANTS.maps.tilesFolder}/${areaId}/${datasetSlug}`;
        await removeFolder(folder);
      } catch (e) {
        area.attributes.datasets = updatedCacheDatasets(area.attributes.datasets, datasetSlug, true);
        dispatch({
          type: UPDATE_AREA,
          payload: area
        });
      }
    }
  };
}

export function deleteArea(id) {
  const url = `${Config.API_URL}/area/${id}`;
  return (dispatch, state) => {
    if (state().offline.online) {
      const fetchConfig = {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${state().user.token}`
        }
      };
      fetch(url, fetchConfig)
        .then(response => {
          if (response.ok && response.status === 204) return response.ok;
          throw new Error(response.statusText);
        })
        .then(() => {
          dispatch({
            type: DELETE_AREA,
            payload: {
              id
            }
          });
        })
        .catch((error) => {
          console.warn(error);
          // To-do
        });
    }
  };
}
