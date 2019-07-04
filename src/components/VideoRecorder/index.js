import React, { Component } from "react";
import { StyleSheet, TouchableOpacity, View, Image } from "react-native";
import { RNCamera } from "react-native-camera";
import cameraIcon from "../../assets/camera.png";
import ProgressBar from "react-native-progress/Bar";
import RNThumbnail from "react-native-thumbnail";

const PROGRESS_FACTOR = 0.01;

class VideoRecorder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //   hasCameraPermission: true,//to explore
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
          color="#f2bff1"
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

  async uploadToS3(file) {
    // from http://blog.rudikovac.com/react-native-upload-any-file-to-s3-with-a-presigned-url/
    const xhr = new XMLHttpRequest();
    let formData = new FormData();
    console.log("I am in uploadToS3");

    let presignedurl = "https://s3.amazonaws.com/uassets.stagingpepo.com";

    xhr.open("POST", presignedurl);
    xhr.onreadystatechange = function() {
      console.log("I am her xhr.statuse", xhr.status, xhr.responseText);
      if (xhr.readyState === 4) {
        if (xhr.status === 204) {
          alert("Video uploaded successfully to S3");
        } else {
          alert("Could not upload file.");
        }
      }
    };
    // formData.append(
    //   "key",
    //   "d/ua/profile-images/df8c2b9e8b95b537249d47dcfaf6c73f-original.jpg"
    // );
    // formData.append("bucket", "uassets.stagingpepo.com");
    // formData.append("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    // formData.append(
    //   "X-Amz-Credential",
    //   "AKIAT7WAUYD3XA7WRZV4/20190702/us-east-1/s3/aws4_request"
    // );
    // formData.append("X-Amz-Date", "20190702T105856Z");

    // formData.append(
    //   "Policy",
    //   "eyJleHBpcmF0aW9uIjoiMjAxOS0wNy0wNFQxMjo1ODo1NloiLCJjb25kaXRpb25zIjpbeyJidWNrZXQiOiJ1YXNzZXRzLnN0YWdpbmdwZXBvLmNvbSJ9LHsiYWNsIjoicHVibGljLXJlYWQifSx7IkNvbnRlbnQtVHlwZSI6ImltYWdlL2pwZWcifSx7IkNvbnRlbnQtRGlzcG9zaXRpb24iOiJpbmxpbmUifSx7ImtleSI6ImQvdWEvcHJvZmlsZS1pbWFnZXMvZGY4YzJiOWU4Yjk1YjUzNzI0OWQ0N2RjZmFmNmM3M2Ytb3JpZ2luYWwuanBnIn0seyJDYWNoZS1Db250cm9sIjoicHVibGljLCBtYXgtYWdlPTMxNTM2MDAwMCJ9LHsieC1hbXotYWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDEwMjQsMTA0ODU3NjBdLHsia2V5IjoiZC91YS9wcm9maWxlLWltYWdlcy9kZjhjMmI5ZThiOTViNTM3MjQ5ZDQ3ZGNmYWY2YzczZi1vcmlnaW5hbC5qcGcifSx7ImJ1Y2tldCI6InVhc3NldHMuc3RhZ2luZ3BlcG8uY29tIn0seyJYLUFtei1BbGdvcml0aG0iOiJBV1M0LUhNQUMtU0hBMjU2In0seyJYLUFtei1DcmVkZW50aWFsIjoiQUtJQVQ3V0FVWUQzWEE3V1JaVjQvMjAxOTA3MDIvdXMtZWFzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LHsiWC1BbXotRGF0ZSI6IjIwMTkwNzAyVDEwNTg1NloifV19"
    // );

    // formData.append(
    //   "X-Amz-Signature",
    //   "1eacc4cd844b79076ed608759c9972a07739b4ea150b638e7f065a39c0ada289"
    // );
    // formData.append("Content-Type", "image/jpeg");
    // formData.append("Cache-Control", "public, max-age=315360000");

    // formData.append("acl", "public-read");
    // formData.append("Content-disposition", "inline");
    // formData.append("file", file);

    formData.append(
      "key",
      "d/ua/profile-images/120-7ac299b228c236b17dccd9d4ca8dd10d-original.mp4"
    );
    formData.append("bucket", "uassets.stagingpepo.com");
    formData.append("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    formData.append(
      "X-Amz-Credential",
      "AKIAT7WAUYD3XA7WRZV4/20190704/us-east-1/s3/aws4_request"
    );
    formData.append("X-Amz-Date", "20190704T073344Z");

    formData.append(
      "Policy",
      "eyJleHBpcmF0aW9uIjoiMjAxOS0wNy0wOVQwNzozMzo0NFoiLCJjb25kaXRpb25zIjpbeyJidWNrZXQiOiJ1YXNzZXRzLnN0YWdpbmdwZXBvLmNvbSJ9LHsiYWNsIjoicHVibGljLXJlYWQifSx7IkNvbnRlbnQtVHlwZSI6InZpZGVvL21wNCJ9LHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImlubGluZSJ9LHsia2V5IjoiZC91YS9wcm9maWxlLWltYWdlcy8xMjAtN2FjMjk5YjIyOGMyMzZiMTdkY2NkOWQ0Y2E4ZGQxMGQtb3JpZ2luYWwubXA0In0seyJDYWNoZS1Db250cm9sIjoicHVibGljLCBtYXgtYWdlPTMxNTM2MDAwMCJ9LHsieC1hbXotYWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDEwMjQsODM4ODYwODBdLHsia2V5IjoiZC91YS9wcm9maWxlLWltYWdlcy8xMjAtN2FjMjk5YjIyOGMyMzZiMTdkY2NkOWQ0Y2E4ZGQxMGQtb3JpZ2luYWwubXA0In0seyJidWNrZXQiOiJ1YXNzZXRzLnN0YWdpbmdwZXBvLmNvbSJ9LHsiWC1BbXotQWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LHsiWC1BbXotQ3JlZGVudGlhbCI6IkFLSUFUN1dBVVlEM1hBN1dSWlY0LzIwMTkwNzA0L3VzLWVhc3QtMS9zMy9hd3M0X3JlcXVlc3QifSx7IlgtQW16LURhdGUiOiIyMDE5MDcwNFQwNzMzNDRaIn1dfQ=="
    );

    formData.append(
      "X-Amz-Signature",
      "705e9161fb3278e0123a66281392ae5c0a94465a0dbf70b5a4c5b8ef49b72e6c"
    );
    formData.append("Content-Type", "video/mp4");
    formData.append("Cache-Control", "public, max-age=315360000");

    formData.append("acl", "public-read");
    formData.append("Content-disposition", "inline");
    formData.append("file", file);

    xhr.setRequestHeader("X-Amz-ACL", "public-read");
    // for text file: text/plain, for binary file: application/octet-stream
    xhr.setRequestHeader("Content-Type", "multipart/form-data");

    r = xhr.send(formData);
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
      RNThumbnail.get(data.uri).then(result => {
        console.log(result.path); // thumbnail path
        this.props.navigation.navigate("ViewRecording", {
          uri: data.uri,
          thumbnail: result.path
        });
      });
    }
  };

  recordVideoAsync = async () => {
    if (!this.camera) return;
    if (!this.isRecording) {
      this.isRecording = true;
      const options = {
        quality: RNCamera.Constants.VideoQuality["288p"],
        base64: true,
        maxDuration: 30
      };
      this.initProgressBar();
      const data = await this.camera.recordAsync(options);
      this.uploadToS3({
        uri: data.uri,
        type: "video/mp4",
        name: "video.mp4"
      });
      //this.navigateToViewRecording(data);
    } else {
      this.stopRecording();
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
  },
  progressBar: {
    borderRadius: 0,
    borderColor: "#fff",
    borderWidth: 0.5,
    height: 3
  }
});

//make this component available to the app
export default VideoRecorder;
