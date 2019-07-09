import React, { Component } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Text
} from "react-native";
import { RNCamera } from "react-native-camera";
import cameraIcon from "../../assets/camera.png";
import ProgressBar from "react-native-progress/Bar";

const PROGRESS_FACTOR = 0.01;

class VideoRecorder extends Component {
  // static navigationOptions = {
  //   header: null
  // };
  constructor(props) {
    super(props);
    this.state = {
      //   hasCameraPermission: true,//to explore
      type: RNCamera.Constants.Type.front,
      progress: 0,
      processing: false
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
    navigation.addListener("willBlur", () => {
      this.setState({ focusedScreen: false });
      this.cleanUp();
    });
  }

  componentWillUnmount() {
    this.cleanUp();
  }

  cleanUp() {
    this.camera = null;
    clearInterval(this.progressInterval);
  }

  cameraView() {
    return (
      <View style={styles.container}>
        <ProgressBar
          width={null}
          color="#ff3b30"
          progress={this.state.progress}
          indeterminate={false}
          style={styles.progressBar}
        />
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={this.state.type}
          ratio="16:9"
          zoom={0}
          //autoFocusPointOfInterest={{ x: 0.5, y: 0.5 }}
          //videoStabilizationMode={RNCamera.Constants.VideoStabilization["auto"]}
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
                    flexDirection: "column",
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
        {this.state.processing && (
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              alignSelf: "center",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Text>Original video is uploading </Text>
            <ActivityIndicator size="large" color="#00ff00" />
          </View>
        )}
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

  getFormData(dataArray) {
    let formData = new FormData();

    for (let i = 0; i < dataArray.length; i++) {
      formData.append(dataArray[i]["key"], dataArray[i]["value"]);
    }

    return formData;
  }

  initProgressBar() {
    this.progressInterval = setInterval(() => {
      if (this.state.progress < 1) {
        this.setState({ progress: this.state.progress + PROGRESS_FACTOR });
      } else {
        this.stopRecording();
      }
    }, 300);
  }

  stopRecording = () => {
    this.isRecording = false;
    clearInterval(this.progressInterval);
    this.camera && this.camera.stopRecording();
  };

  navigateToViewRecording = data => {
    if (this.state.focusedScreen && data) {
      console.log(data.uri);
      console.log("I am hereee");
      this.props.navigation.navigate("ViewRecording", {
        uri: data.uri,
        inputUri: data.inputUri,
        uploadTimeWithoutCompression: data.uploadTimeWithoutCompression
      });
    }
  };

  recordVideoAsync = async () => {
    if (this.state.processing) {
      return;
    }
    if (!this.camera) return;
    if (!this.isRecording) {
      this.isRecording = true;
      const options = {
        quality: RNCamera.Constants.VideoQuality["1080p"],
        base64: true,
        maxDuration: 30
        //codec: RNCamera.Constants.VideoCodec["H264"],
        //orientation: "portrait"
      };
      this.initProgressBar();
      const data = await this.camera.recordAsync(options);

      this.uploadOriginalToS3(
        {
          uri: data.uri,
          type: "video/mp4",
          name: "video.mp4"
        },
        data
      );
    } else {
      this.stopRecording();
    }
  };

  uploadOriginalToS3(file) {
    const oThis = this;
    const xhr = new XMLHttpRequest();
    oThis.setState({ processing: true });
    let presignedurl = "https://s3.amazonaws.com/uassets.stagingpepo.com";

    xhr.open("POST", presignedurl);
    xhr.onreadystatechange = function() {
      console.log("I am her xhr.statuse", xhr.status, xhr.responseText);
      if (xhr.readyState === 4) {
        if (xhr.status === 204) {
          uploadCompletedOriginal = Date.now();
          console.log("Original Upload completed successfully");
          console.log(
            "Time taken for upload",
            uploadCompletedOriginal - uploadStartedOriginal
          );
          oThis.setState({ processing: false });
          alert("Original Video uploaded successfully to S3");

          oThis.navigateToViewRecording({
            uri:
              "http://uassets.stagingpepo.com.s3.amazonaws.com/d/ua/videos/1000-bd75608088ab537b568c92b1c84b5fcd-original.mp4",
            inputUri: file.uri,
            uploadTimeWithoutCompression:
              uploadCompletedOriginal - uploadStartedOriginal
          });
        } else {
          alert("Could not upload file.");
        }
      }
    };

    let formData = this.getFormData([
      {
        key: "key",
        value: "d/ua/videos/1000-bd75608088ab537b568c92b1c84b5fcd-original.mp4"
      },
      {
        key: "bucket",
        value: "uassets.stagingpepo.com"
      },
      {
        key: "X-Amz-Algorithm",
        value: "AWS4-HMAC-SHA256"
      },
      {
        key: "X-Amz-Credential",
        value: "AKIAT7WAUYD3XA7WRZV4/20190705/us-east-1/s3/aws4_request"
      },
      {
        key: "X-Amz-Date",
        value: "20190705T133054Z"
      },
      {
        key: "Policy",
        value:
          "eyJleHBpcmF0aW9uIjoiMjAxOS0wNy0xMFQxMzozMDo1NFoiLCJjb25kaXRpb25zIjpbeyJidWNrZXQiOiJ1YXNzZXRzLnN0YWdpbmdwZXBvLmNvbSJ9LHsiYWNsIjoicHVibGljLXJlYWQifSx7IkNvbnRlbnQtVHlwZSI6InZpZGVvL21wNCJ9LHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImlubGluZSJ9LHsia2V5IjoiZC91YS92aWRlb3MvMTAwMC1iZDc1NjA4MDg4YWI1MzdiNTY4YzkyYjFjODRiNWZjZC1vcmlnaW5hbC5tcDQifSx7IkNhY2hlLUNvbnRyb2wiOiJwdWJsaWMsIG1heC1hZ2U9MzE1MzYwMDAwIn0seyJ4LWFtei1hbGdvcml0aG0iOiJBV1M0LUhNQUMtU0hBMjU2In0sWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsMTAyNCw4Mzg4NjA4MF0seyJrZXkiOiJkL3VhL3ZpZGVvcy8xMDAwLWJkNzU2MDgwODhhYjUzN2I1NjhjOTJiMWM4NGI1ZmNkLW9yaWdpbmFsLm1wNCJ9LHsiYnVja2V0IjoidWFzc2V0cy5zdGFnaW5ncGVwby5jb20ifSx7IlgtQW16LUFsZ29yaXRobSI6IkFXUzQtSE1BQy1TSEEyNTYifSx7IlgtQW16LUNyZWRlbnRpYWwiOiJBS0lBVDdXQVVZRDNYQTdXUlpWNC8yMDE5MDcwNS91cy1lYXN0LTEvczMvYXdzNF9yZXF1ZXN0In0seyJYLUFtei1EYXRlIjoiMjAxOTA3MDVUMTMzMDU0WiJ9XX0="
      },
      {
        key: "X-Amz-Signature",
        value:
          "145de568ebfe0058da8a8d5491d5429b3f9f717ae0a50605efc1762e1afb97cb"
      },
      {
        key: "Content-Type",
        value: "video/mp4"
      },
      {
        key: "Cache-Control",
        value: "public, max-age=315360000"
      },
      {
        key: "acl",
        value: "public-read"
      },
      {
        key: "Content-disposition",
        value: "inline"
      },
      {
        key: "file",
        value: file
      }
    ]);

    xhr.setRequestHeader("X-Amz-ACL", "public-read");
    // for text file: text/plain, for binary file: application/octet-stream
    xhr.setRequestHeader("Content-Type", "multipart/form-data");
    uploadStartedOriginal = Date.now();
    console.log("Original Upload started at", uploadStartedOriginal);
    console.log("Original formdata", formData);
    r = xhr.send(formData);
  }
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
  },
  progressBar: {
    borderRadius: 3.5,
    borderColor: "#fff",
    borderWidth: 0.5,
    height: 7,
    marginLeft: 10,
    marginRight: 10
  }
});

//make this component available to the app
export default VideoRecorder;
