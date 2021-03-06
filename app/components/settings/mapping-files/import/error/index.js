// @flow
import type { LayerType } from 'types/sharing.types';
import React, { Component } from 'react';
import { View, Text, Image } from 'react-native';
import { Navigation } from 'react-native-navigation';
import i18n from 'i18next';
import styles from './styles';
import ActionButton from 'components/common/action-button';
import { withSafeArea } from 'react-native-safe-area';
import { ACCEPTED_FILE_TYPES_CONTEXTUAL_LAYERS, ACCEPTED_FILE_TYPES_BASEMAPS } from 'config/constants';
import type { File } from 'types/file.types';
import { formatBytes } from 'helpers/data';
const SafeAreaView = withSafeArea(View, 'margin', 'vertical');

const fileIcon = require('assets/fileIcon.png');

export type ImportError = 'fileSize' | 'fileFormat' | 'vectorTiles';

type Props = {
  componentId: string,
  error: ImportError,
  file: File,
  mappingFileType: LayerType,
  onRetry: () => {}
};

export default class ImportMappingFileError extends Component<Props> {
  static options(passProps: {}) {
    return {
      topBar: {
        drawBehind: true,
        visible: false,
        background: {
          color: 'transparent'
        }
      }
    };
  }

  i18nKeyFor(key: string): string {
    const base = this.props.mappingFileType === 'basemap' ? 'basemaps' : 'contextualLayers';
    return `${base}.import.${key}`;
  }

  acceptedFileTypes = (mappingFileType: LayerType = this.props.mappingFileType): Array<string> => {
    return mappingFileType === 'contextual_layer'
      ? ACCEPTED_FILE_TYPES_CONTEXTUAL_LAYERS
      : ACCEPTED_FILE_TYPES_BASEMAPS;
  };

  renderFileTypeComponent = (fileType: string, error: ImportError) => {
    const text = error === 'vectorTiles' && fileType === 'mbtiles' ? `mbtiles*` : fileType;

    return (
      <View style={styles.fileTypeContainer}>
        <Image source={fileIcon} />
        <Text style={styles.fileTypeText} key={text}>
          .{text}
        </Text>
      </View>
    );
  };

  /**
    Returns the title to display based on the error type 
  */
  getDescription() {
    let descriptionKey;
    switch (this.props.error) {
      case 'fileFormat':
        descriptionKey = 'fileTypeNotSupportedDesc';
        break;
      case 'fileSize':
        descriptionKey = 'fileSizeTooLargeDesc';
        break;
      case 'vectorTiles':
        descriptionKey = 'fileContainsVectorTiles';
        break;
      default:
        descriptionKey = 'fileTypeNotSupportedDesc';
        break;
    }
    return i18n.t(this.i18nKeyFor(descriptionKey));
  }

  /**
    Returns the title to display based on the error type 
  */
  getTitle() {
    let titleKey;
    switch (this.props.error) {
      case 'fileFormat':
        titleKey = 'fileTypeNotSupported';
        break;
      case 'fileSize':
        titleKey = 'fileSizeTooLarge';
        break;
      case 'vectorTiles':
        titleKey = 'vectorTilesNotSupported';
        break;
      default:
        titleKey = 'fileTypeNotSupported';
        break;
    }
    return i18n.t(this.i18nKeyFor(titleKey));
  }

  onPressChooseAnother = async () => {
    await Navigation.dismissModal(this.props.componentId);
    this.props.onRetry();
  };

  onPressCancel = () => {
    Navigation.dismissModal(this.props.componentId);
  };

  render() {
    const { error, file } = this.props;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.titleText}>{this.getTitle()}</Text>
          <Text style={styles.fileName}>
            {"'"}
            {file.name}
            {"'"}
            {error === 'fileSize' && ` (${formatBytes(file.size)})`}
          </Text>
          <Text style={styles.description}>{this.getDescription()}</Text>
          {error !== 'fileSize' && (
            <React.Fragment>
              <Text style={styles.fileTypesDescription}>{i18n.t(this.i18nKeyFor('supportedFileTypesInclude'))}</Text>
              <View style={styles.acceptedFileTypes}>
                {this.acceptedFileTypes().map(fileType => this.renderFileTypeComponent(fileType, error))}
              </View>
              {error === 'vectorTiles' && (
                <Text style={styles.fileTypesDescription}>{i18n.t(this.i18nKeyFor('cannotContainVectorTiles'))}</Text>
              )}
            </React.Fragment>
          )}
          <ActionButton
            onPress={this.onPressChooseAnother}
            secondary
            noIcon
            text={i18n.t('contextualLayers.import.chooseAnother')}
          />
          <Text style={styles.actionText} onPress={this.onPressCancel}>
            {i18n.t('commonText.cancel')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
}
