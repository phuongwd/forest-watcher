import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text
} from 'react-native';
import MapView from 'react-native-maps';
import styles from './styles';

function ClusterMarker(props) {
  const clusterCoordinates = {
    latitude: props.marker.geometry.coordinates[1],
    longitude: props.marker.geometry.coordinates[0]
  };
  return (
    <MapView.Marker
      coordinate={clusterCoordinates}
      zIndex={1}
      anchor={{ x: 0.5, y: 0.5 }}
      pointerEvents={'none'}
      onPress={() => props.zoomTo(clusterCoordinates)}
    >
      <View style={styles.container}>
        <View style={props.datasetSlug === 'viirs' ? styles.bubbleViirs : styles.bubbleGlad}>
          <Text style={styles.number}>{props.marker.properties.point_count}</Text>
        </View>
      </View>
    </MapView.Marker>

  );
}

ClusterMarker.propTypes = {
  marker: PropTypes.object.isRequired,
  zoomTo: PropTypes.func.isRequired,
  datasetSlug: PropTypes.string.isRequired
};

export default ClusterMarker;
