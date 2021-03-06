// @flow
import type { LayerType } from 'types/sharing.types';
import React, { Component } from 'react';

import {
  View,
  Text,
  TouchableHighlight,
  Image,
  ImageBackground,
  Platform,
  TouchableNativeFeedback
} from 'react-native';
import i18n from 'i18next';

import ProgressBar from 'react-native-progress/Bar';

import { GFW_CONTEXTUAL_LAYERS_METADATA } from 'config/constants';
import Theme from 'config/theme';
import styles from './styles';
import type { Layer } from 'types/layers.types';
import queryLayerFiles from 'helpers/layer-store/queryLayerFiles';
import { manifestBundleSize } from 'helpers/sharing/calculateBundleSize';
import { formatBytes } from 'helpers/data';

const infoIcon = require('assets/info.png');
const refreshIcon = require('assets/refreshLayer.png');
const downloadIcon = require('assets/downloadGrey.png');
const downloadedIcon = require('assets/downloadedGrey.png');
const checkboxOff = require('assets/checkbox_off.png');
const checkboxOn = require('assets/checkbox_on.png');
const deleteIcon = require('assets/settingsDelete.png');
const renameIcon = require('assets/settingsEdit.png');

const icons = {
  basemap: {
    placeholder: require('assets/basemap_placeholder.png')
  },
  contextual_layer: {
    placeholder: require('assets/layerPlaceholder.png')
  }
};

type Props = {
  downloaded?: boolean,
  downloading?: boolean,
  inEditMode: boolean,
  layer: Layer,
  layerType: LayerType,
  onDeletePress: () => void,
  onDownloadPress?: ?() => void | Promise<void>,
  onPress?: ?() => void,
  onInfoPress?: () => void,
  onRenamePress?: () => void,
  selected?: ?boolean
};

type State = {
  sizeInBytes: ?number
};

export default class MappingFileRow extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      sizeInBytes: null
    };
  }

  componentDidMount() {
    this._calculateSize();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.downloaded !== prevProps.downloaded) {
      this._calculateSize();
    }
  }

  _calculateSize = async () => {
    const { layer, layerType } = this.props;

    if (!layerType === 'basemap') {
      return;
    }

    const layerFiles = await queryLayerFiles(layerType, { whitelist: [layer.id], blacklist: [] });
    const sizeInBytes = manifestBundleSize({
      layerFiles,
      reportFiles: []
    });
    this.setState({
      sizeInBytes
    });
  };

  renderIcons = () => {
    const { inEditMode, layer, layerType, selected } = this.props;
    const isCustom = !!layer.isCustom;
    const isRenamable = isCustom;
    const isPresentOnDisk = (this.state.sizeInBytes ?? 0) > 0 || this.props.downloaded;

    const isDeletable =
      isPresentOnDisk || isCustom || (layerType === 'contextual_layer' && !!GFW_CONTEXTUAL_LAYERS_METADATA[layer.id]);
    const isRefreshable = this.props.downloaded && layerType === 'contextual_layer';
    const isDownloadable = (layerType === 'contextual_layer' || (layerType === 'basemap' && layer.url)) && !isCustom;

    if (inEditMode) {
      return (
        <React.Fragment>
          {isRenamable && this.renderIcon(renameIcon, this.props.onRenamePress)}
          {isDeletable && this.renderIcon(deleteIcon, this.props.onDeletePress)}
        </React.Fragment>
      );
    }
    if (selected === false) {
      return this.renderIcon(checkboxOff, this.props.onPress);
    } else if (selected === true) {
      return this.renderIcon(checkboxOn, this.props.onPress);
    }

    return (
      <React.Fragment>
        {this.props.onInfoPress && this.renderIcon(infoIcon, this.props.onInfoPress)}
        {this.renderIcon(
          this.props.downloaded ? (isRefreshable ? refreshIcon : downloadedIcon) : isDownloadable ? downloadIcon : null,
          this.props.onDownloadPress
        )}
      </React.Fragment>
    );
  };

  renderIcon = (icon: ?number, onPress: ?() => void) => {
    const Touchable = Platform.select({
      android: TouchableNativeFeedback,
      ios: TouchableHighlight
    });

    if (icon == null) {
      return null;
    }

    return (
      <Touchable
        disabled={onPress == null}
        onPress={onPress}
        background={Platform.select({
          // hide ripple as hitbox is wider than icon
          android: TouchableNativeFeedback.Ripple('rgba(0, 0, 0, 0)'),
          ios: undefined
        })}
        underlayColor={Platform.select({
          android: undefined,
          ios: 'white'
        })}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Image source={icon} />
        </View>
      </Touchable>
    );
  };

  render() {
    const { layer, layerType, downloaded, downloading } = this.props;

    const titleKey =
      layerType === 'basemap' && !layer.isCustom && layer.name ? `basemaps.names.${layer.name}` : layer.name;
    const title = i18n.t(titleKey);

    const subtitle =
      layerType === 'basemap' && !layer.isCustom
        ? downloaded
          ? i18n.t('importLayer.gfw.downloaded')
          : i18n.t('importLayer.gfw.notYetDownloaded')
        : this.state.sizeInBytes != null
        ? formatBytes(this.state.sizeInBytes)
        : '';

    const image = layer.image ?? icons[layerType].placeholder;

    // We should only show the image if one exists, and we're showing a basemap.
    const shouldShowImage = image != null && layerType !== 'contextual_layer';

    return (
      <View style={styles.item}>
        {shouldShowImage && (
          <View style={styles.imageContainer}>
            {<ImageBackground resizeMode={'cover'} style={styles.image} source={image} />}
          </View>
        )}
        <View style={styles.contentContainer}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          {!!subtitle && (
            <View style={styles.subtitleContainer}>
              <Text style={styles.title}>{subtitle}</Text>
            </View>
          )}
        </View>
        {!downloading && <View style={styles.iconsContainer}>{this.renderIcons()}</View>}
        {downloading && (
          <View style={styles.progressBarContainer}>
            <ProgressBar
              indeterminate={true}
              width={Theme.screen.width}
              height={4}
              color={Theme.colors.turtleGreen}
              borderRadius={0}
              borderColor="transparent"
            />
          </View>
        )}
      </View>
    );
  }
}
