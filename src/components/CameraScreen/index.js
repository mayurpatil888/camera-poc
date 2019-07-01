import React, { Component } from "react";
import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { RNCamera } from "react-native-camera";
import Video from "react-native-video";
import styles from "./styles";

export default class Camera extends Component {
  constructor(props) {
    super(props);
    this.state = {
      base64: null,
      uri: null
    };
    const { navigation } = this.props;
    this.type = navigation.getParam("type", "snap");
  }
  render() {
    return (
      <View style={styles.container}>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.front}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: "Permission to use camera",
            message: "We need your permission to use your camera",
            buttonPositive: "Ok",
            buttonNegative: "Cancel"
          }}
          androidRecordAudioPermissionOptions={{
            title: "Permission to use audio recording",
            message: "We need your permission to use your audio",
            buttonPositive: "Ok",
            buttonNegative: "Cancel"
          }}
          onGoogleVisionBarcodesDetected={({ barcodes }) => {
            console.log(barcodes);
          }}
        />
        {this.state.uri && (
          <View
            style={{
              flex: 0.5,
              flexDirection: "row",
              justifyContent: "center"
            }}
          >
            {this.type == "snap" ? (
              <Image
                style={{ height: "100%", width: "100%" }}
                source={{ uri: this.state.uri }}
              />
            ) : (
              <Video
                source={{ uri: this.state.uri }} // Can be a URL or a local file.
                ref={ref => {
                  this.player = ref;
                }} // Store reference
                onBuffer={this.onBuffer} // Callback when remote video is buffering
                onError={this.videoError} // Callback when video cannot be loaded
                style={styles.backgroundVideo}
              />
            )}
          </View>
        )}

        <View
          style={{ flex: 0, flexDirection: "row", justifyContent: "center" }}
        >
          <TouchableOpacity
            onPress={() => this.takePicture()}
            style={styles.capture}
          >
            <Text style={{ fontSize: 14 }}>
              {this.type == "snap" ? "Start Camera" : "Start Video"}
            </Text>
          </TouchableOpacity>
          {this.type == "video" && (
            <TouchableOpacity
              onPress={() => this.camera.stopRecording()}
              style={styles.capture}
            >
              <Text style={{ fontSize: 14 }}> Stop Video </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  takePicture = async () => {
    if (this.camera) {
      const options = {
        quality: 0.5,
        base64: true
      };

      const data =
        this.type == "snap"
          ? await this.camera.takePictureAsync(options)
          : await this.camera.recordAsync(options);
      console.log(data, "Datatatatatatatatta");
      console.log(data.uri);
      this.setState({ uri: data.uri });
    }
  };
}
