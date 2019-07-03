/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Platform
} from "react-native";

import ImageEditor from "@react-native-community/image-editor";

const DEFAULT_IMAGE_HEIGHT = 1000;
const DEFAULT_IMAGE_WIDTH = 1000;

export default class SquareImageCropper extends React.Component {
  state;
  _isMounted;
  _transformData;

  /* $FlowFixMe(>=0.85.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.85 was deployed. To see the error, delete this comment
   * and run Flow. */
  constructor(props) {
    super(props);
    this._isMounted = true;
    this.state = {
      randomPhoto: null,
      measuredSize: null,
      croppedImageURI: null,
      cropError: null
    };
  }

  async _fetchRandomPhoto() {
    this.setState({
      randomPhoto: {
        uri: `https://dummyimage.com/1000x1000/000/fff`,
        height: DEFAULT_IMAGE_HEIGHT,
        width: DEFAULT_IMAGE_WIDTH
      }
    });
  }

  componentDidMount() {
    console.log("Hey i am here");
    this._fetchRandomPhoto();
  }

  render() {
    if (!this.state.measuredSize) {
      return (
        <View
          style={styles.container}
          onLayout={event => {
            const measuredWidth = event.nativeEvent.layout.width;
            if (!measuredWidth) {
              return;
            }
            this.setState({
              measuredSize: { width: measuredWidth, height: measuredWidth }
            });
          }}
        />
      );
    }

    if (!this.state.croppedImageURI) {
      return this._renderImageCropper();
    }
    return this._renderCroppedImage();
  }

  _renderImageCropper() {
    if (!this.state.randomPhoto) {
      return <View style={styles.container} />;
    }
    let error = null;
    if (this.state.cropError) {
      error = <Text>{this.state.cropError.message}</Text>;
    }
    return (
      <View style={styles.container}>
        <Text style={styles.text} testID={"headerText"}>
          Drag the image within the square to crop:
        </Text>
        <ImageCropper
          image={this.state.randomPhoto}
          size={this.state.measuredSize}
          style={[styles.imageCropper, this.state.measuredSize]}
          onTransformDataChange={data => (this._transformData = data)}
        />
        <TouchableHighlight
          style={styles.cropButtonTouchable}
          onPress={() => {
            this._crop();
          }}
        >
          <View style={styles.cropButton}>
            <Text style={styles.cropButtonLabel}>Crop</Text>
          </View>
        </TouchableHighlight>
        {error}
      </View>
    );
  }

  _renderCroppedImage() {
    console.log("Im here in _renderCroppedImage", this.state.croppedImageURI);
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Here is the cropped image :</Text>

        <Image
          source={{ uri: this.state.croppedImageURI }}
          style={[styles.imageCropper, this.state.measuredSize]}
        />
        {/* <TouchableHighlight
          style={styles.cropButtonTouchable}
          onPress={() => {
            this._reset();
          }}
        >
          <View style={styles.cropButton}>
            <Text style={styles.cropButtonLabel}>Try again</Text>
          </View>
        </TouchableHighlight> */}
      </View>
    );
  }

  async _crop() {
    try {
      const croppedImageURI = await ImageEditor.cropImage(
        this.state.randomPhoto.uri,
        this._transformData
      );
      console.log(
        "--------------------- cropperImageURI ------------------------------ "
      );
      if (croppedImageURI) {
        this.setState({ croppedImageURI });
      }
    } catch (cropError) {
      console.log("I am here", cropError);
      console.log("ImageEditor", ImageEditor);
      this.setState({ cropError });
    }
  }

  // _reset() {
  //   this.setState({
  //     randomPhoto: null,
  //     croppedImageURI: null,
  //     cropError: null
  //   });
  //   this._fetchRandomPhoto();
  // }
}

class ImageCropper extends React.Component {
  _contentOffset;
  _maximumZoomScale;
  _minimumZoomScale;
  _scaledImageSize;
  _horizontal;

  UNSAFE_componentWillMount() {
    // Scale an image to the minimum size that is large enough to completely
    // fill the crop box.
    const widthRatio = this.props.image.width / this.props.size.width;
    const heightRatio = this.props.image.height / this.props.size.height;
    this._horizontal = widthRatio > heightRatio;
    if (this._horizontal) {
      this._scaledImageSize = {
        width: this.props.image.width / heightRatio,
        height: this.props.size.height
      };
    } else {
      this._scaledImageSize = {
        width: this.props.size.width,
        height: this.props.image.height / widthRatio
      };
      if (Platform.OS === "android") {
        // hack to work around Android ScrollView a) not supporting zoom, and
        // b) not supporting vertical scrolling when nested inside another
        // vertical ScrollView (which it is, when displayed inside UIExplorer)
        this._scaledImageSize.width *= 2;
        this._scaledImageSize.height *= 2;
        this._horizontal = true;
      }
    }
    this._contentOffset = {
      x: (this._scaledImageSize.width - this.props.size.width) / 2,
      y: (this._scaledImageSize.height - this.props.size.height) / 2
    };
    this._maximumZoomScale = Math.min(
      this.props.image.width / this._scaledImageSize.width,
      this.props.image.height / this._scaledImageSize.height
    );
    this._minimumZoomScale = Math.max(
      this.props.size.width / this._scaledImageSize.width,
      this.props.size.height / this._scaledImageSize.height
    );
    this._updateTransformData(
      this._contentOffset,
      this._scaledImageSize,
      this.props.size
    );
  }

  _onScroll(event) {
    this._updateTransformData(
      event.nativeEvent.contentOffset,
      event.nativeEvent.contentSize,
      event.nativeEvent.layoutMeasurement
    );
  }

  _updateTransformData(offset, scaledImageSize, croppedImageSize) {
    const offsetRatioX = offset.x / scaledImageSize.width;
    const offsetRatioY = offset.y / scaledImageSize.height;
    const sizeRatioX = croppedImageSize.width / scaledImageSize.width;
    const sizeRatioY = croppedImageSize.height / scaledImageSize.height;

    const cropData = {
      offset: {
        x: this.props.image.width * offsetRatioX,
        y: this.props.image.height * offsetRatioY
      },
      size: {
        width: this.props.image.width * sizeRatioX,
        height: this.props.image.height * sizeRatioY
      }
    };
    this.props.onTransformDataChange &&
      this.props.onTransformDataChange(cropData);
  }

  render() {
    console.log("Image in scrollview ", this.props.image);
    return (
      <ScrollView nestedScrollEnabled={true}>
        <ScrollView
          nestedScrollEnabled={true}
          alwaysBounceVertical={true}
          automaticallyAdjustContentInsets={false}
          contentOffset={this._contentOffset}
          decelerationRate="fast"
          horizontal={this._horizontal}
          maximumZoomScale={this._maximumZoomScale}
          minimumZoomScale={this._minimumZoomScale}
          directionalLockEnabled={false}
          //onMomentumScrollEnd={this._onScroll.bind(this)}
          //onScrollEndDrag={this._onScroll.bind(this)}
          onScroll={event => {
            this._onScroll(event);
          }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={this.props.style}
          scrollEventThrottle={16}
        >
          <Image
            testID={"testImage"}
            source={{ uri: this.props.image.uri }}
            style={this._scaledImageSize}
          />
        </ScrollView>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: "stretch",
    marginTop: 60
  },
  imageCropper: {
    alignSelf: "center",
    marginTop: 12
  },
  cropButtonTouchable: {
    alignSelf: "center",
    marginTop: 12
  },
  cropButton: {
    padding: 12,
    backgroundColor: "blue",
    borderRadius: 4
  },
  cropButtonLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "500"
  },
  text: {
    color: "black"
  }
});
