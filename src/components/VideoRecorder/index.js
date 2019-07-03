"use strict";
import React, { PureComponent } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ProgressBarAndroid
} from "react-native";
import { RNCamera } from "react-native-camera";
import cameraIcon from "../../assets/camera.png";
import ProgressBar from "react-native-progress/Bar";
import RNThumbnail from "react-native-thumbnail";

const PROGRESS_FACTOR = 0.1;

// create a component
class VideoRecorder extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hasCameraPermission: null,
      type: RNCamera.Constants.Type.front,
      progress: 0
    };
    this.camera = null;
    this.isRecording = false;
  }

  toggleFacing = () => {
    if (this.isRecording) return;
    this.setState({
      type:
        this.state.type === RNCamera.Constants.Type.back
          ? RNCamera.Constants.Type.front
          : RNCamera.Constants.Type.back
    });
  };

  componentDidMount() {
    const { navigation } = this.props;
    navigation.addListener("willFocus", () =>
      this.setState({ focusedScreen: true, progress: 0 })
    );
    navigation.addListener("willBlur", () =>
      this.setState({ focusedScreen: false })
    );
  }

  componentWillUnmount() {}

  cameraView() {
    return (
      <View style={styles.container}>
        <ProgressBar
          width={null}
          color="#f2bff1"
          progress={this.state.progress}
          indeterminate={false}
          style={{
            borderRadius: 0,
            border: 1,
            borderColor: "#fff",
            borderWidth: 0.5
          }}
        />
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={this.state.type}
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
        >
          {({ camera, status, recordAudioPermissionStatus }) => {
            if (status !== "READY") return <View />;
            return (
              <View
                style={{
                  flex: 0,
                  flexDirection: "row",
                  justifyContent: "center"
                }}
              >
                <View>
                  <TouchableOpacity
                    onPress={this.recordVideoAsync}
                    style={styles.capture}
                  />
                </View>
                <View
                  style={{
                    flex: 0,
                    flexDirection: "row",
                    justifyContent: "center"
                  }}
                >
                  <TouchableOpacity
                    style={styles.flipButton}
                    onPress={this.toggleFacing}
                  >
                    <Image style={styles.cameraType} source={cameraIcon} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        </RNCamera>
      </View>
    );
  }

  render() {
    const { focusedScreen } = this.state;
    if (focusedScreen) {
      return this.cameraView();
    } else {
      return <View />;
    }
  }

  recordVideoAsync = async () => {
    if (this.camera && !this.isRecording) {
      this.isRecording = true;
      const options = { quality: 0.5, base64: true };
      this.progressInterval = setInterval(() => {
        if (this.state.progress < 1) {
          this.setState({ progress: this.state.progress + PROGRESS_FACTOR });
        } else {
          this.isRecording = false;
          clearInterval(this.progressInterval);
          this.camera.stopRecording();
        }
      }, 3000);
      const data = await this.camera.recordAsync(options);
      console.log(data.uri);
      RNThumbnail.get(data.uri).then(result => {
        console.log(result.path); // thumbnail path
        this.props.navigation.navigate("ViewRecording", {
          uri: data.uri,
          thumbnail: result.path
        });
      });
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "black"
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  capture: {
    flex: 0,
    backgroundColor: "#ff3b30",
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: "center",
    margin: 20,
    borderWidth: 3,
    borderColor: "#fff"
  },
  cameraType: {
    width: 40,
    height: 40,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: "center",
    margin: 20
  }
});

//make this component available to the app
export default VideoRecorder;
