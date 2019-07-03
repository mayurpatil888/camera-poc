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
import { RNS3 } from "react-native-aws3";

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
      //   <View style={styles.container}>
      //     <TouchableOpacity
      //       onPress={() => this.takePicture()}
      //       style={styles.capture}
      //     >
      //       <Text style={{ fontSize: 14 }}>S3 Upload</Text>
      //     </TouchableOpacity>
      //   </View>
      // );

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
    console.log("00----------============-----------");
    if (true || this.camera) {
      const options = {
        quality: 0.5,
        base64: true
      };

      const data =
        this.type == "snap"
          ? await this.camera.takePictureAsync(options)
          : await this.camera.recordAsync(options);

      let obj =
        this.type == "snap"
          ? {
              uri: data.uri,
              type: "image/jpeg",
              name: "image.jpg"
            }
          : {
              uri: data.uri,
              type: "video/mp4",
              name: "video.mp4"
            };
      console.log(obj, "00----------============-----------");
      this.uploadToS3(obj);
      this.setState({ uri: obj.uri });
    }
  };

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
          alert("xhr.responseText", xhr.responseText);
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
      "d/ua/profile-images/cbdf5846838b3de831b39d61f8742052-original.mp4"
    );
    formData.append("bucket", "uassets.stagingpepo.com");
    formData.append("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    formData.append(
      "X-Amz-Credential",
      "AKIAT7WAUYD3XA7WRZV4/20190703/us-east-1/s3/aws4_request"
    );
    formData.append("X-Amz-Date", "20190703T072653Z");

    formData.append(
      "Policy",
      "eyJleHBpcmF0aW9uIjoiMjAxOS0wNy0wNFQwNzoyNjo1M1oiLCJjb25kaXRpb25zIjpbeyJidWNrZXQiOiJ1YXNzZXRzLnN0YWdpbmdwZXBvLmNvbSJ9LHsiYWNsIjoicHVibGljLXJlYWQifSx7IkNvbnRlbnQtVHlwZSI6InZpZGVvL21wNCJ9LHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImlubGluZSJ9LHsia2V5IjoiZC91YS9wcm9maWxlLWltYWdlcy9jYmRmNTg0NjgzOGIzZGU4MzFiMzlkNjFmODc0MjA1Mi1vcmlnaW5hbC5tcDQifSx7IkNhY2hlLUNvbnRyb2wiOiJwdWJsaWMsIG1heC1hZ2U9MzE1MzYwMDAwIn0seyJ4LWFtei1hbGdvcml0aG0iOiJBV1M0LUhNQUMtU0hBMjU2In0sWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsMTAyNCw4Mzg4NjA4MF0seyJrZXkiOiJkL3VhL3Byb2ZpbGUtaW1hZ2VzL2NiZGY1ODQ2ODM4YjNkZTgzMWIzOWQ2MWY4NzQyMDUyLW9yaWdpbmFsLm1wNCJ9LHsiYnVja2V0IjoidWFzc2V0cy5zdGFnaW5ncGVwby5jb20ifSx7IlgtQW16LUFsZ29yaXRobSI6IkFXUzQtSE1BQy1TSEEyNTYifSx7IlgtQW16LUNyZWRlbnRpYWwiOiJBS0lBVDdXQVVZRDNYQTdXUlpWNC8yMDE5MDcwMy91cy1lYXN0LTEvczMvYXdzNF9yZXF1ZXN0In0seyJYLUFtei1EYXRlIjoiMjAxOTA3MDNUMDcyNjUzWiJ9XX0="
    );

    formData.append(
      "X-Amz-Signature",
      "a60d4af7b085523f952cefa47ec11e78f1bdfc6bda7ee4ee9cca677bcb37f4dc"
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
}
