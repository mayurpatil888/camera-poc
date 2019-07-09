//import liraries
import React, { PureComponent } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Button,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Picker
} from "react-native";
import Video from "react-native-video";
import { RNFFmpeg } from "react-native-ffmpeg";
import ProgressBar from "react-native-progress/Bar";
import { TextInput } from "react-native-gesture-handler";
import ViewRecordingWithStats from "./ViewRecordingWithStats";
var RNFetchBlob = require("rn-fetch-blob").default;

import { SafeAreaView } from "react-navigation";

const PROGRESS_FACTOR = 0.01;

// create a component
class ViewRecording extends PureComponent {
  // static navigationOptions = {
  //   header: null
  // };
  constructor(props) {
    super(props);
    this.state = {
      pauseVideo: false,
      progress: 0,
      showModal: false,
      processing: false,
      pixelFormat: "yuv420p",
      crf: "24",
      screenSize: "720X1280",
      preset: "medium"
    };
    this.durationInMsec = 300;
  }

  static navigationOptions = ({ navigation, navigationOptions }) => {
    return {
      headerTitle: "Original video from S3"
    };
  };

  onVideoLoad = data => {
    this.durationInMsec = (data.duration * 1000) / 100;
    this.progressInterval = setInterval(() => {
      if (this.state.progress < 1) {
        this.setState({ progress: this.state.progress + PROGRESS_FACTOR });
      } else {
        clearInterval(this.progressInterval);
      }
    }, this.durationInMsec);
  };

  startCompression() {
    this.setState({ showModal: false, processing: true });

    console.log(
      this.props.navigation.getParam("inputUri"),
      'this.props.navigation.getParam("inputUri")'
    );

    compreessionStarted = Date.now();

    let inputUri = this.props.navigation.getParam("inputUri"),
      inputUriArr = inputUri.split("/");

    outputPath = inputUriArr.slice(0, inputUriArr.length - 1);
    outputPath.push(`output_${compreessionStarted}.mp4`);
    outputPath = outputPath.join("/");

    // let executeStr = `-i ${this.props.navigation.getParam("inputUri")} -s ${
    //   this.state.screenSize
    // } -pix_fmt ${this.state.pixelFormat} -vcodec h264 -crf ${
    //   this.state.crf
    // } ${outputPath}`;

    let executeStr = `-i ${this.props.navigation.getParam("inputUri")} -s ${
      this.state.screenSize
    } -crf ${this.state.crf} -preset ${this.state.preset} -pix_fmt ${
      this.state.pixelFormat
    } -vcodec h264 ${outputPath}`;

    console.log(executeStr, "executeStrexecuteStrexecuteStr");

    console.log("Compression has started at", compreessionStarted);
    RNFFmpeg.execute(executeStr)
      .then(result => {
        comressionFinishedAt = Date.now();
        console.log(result, "result");

        console.log("Compression finished  at", comressionFinishedAt);
        console.log(
          "Time (in milliseconds) taken by compression",
          comressionFinishedAt - compreessionStarted
        );
        uploadStartedAt = Date.now();

        this.uploadToS3({
          uri: outputPath,
          type: "video/mp4",
          name: "video.mp4"
        });
      })
      .catch(err => {
        console.log("I n error", err);
      });
  }

  navigateToViewRecording = data => {
    this.props.navigation.navigate("ViewRecordingWithStats", {
      uri: data.uri
    });
  };

  async uploadToS3(file) {
    const oThis = this;
    const xhr = new XMLHttpRequest();
    let presignedurl = "https://s3.amazonaws.com/uassets.stagingpepo.com";
    console.log(file, "file-----------------");
    xhr.open("POST", presignedurl);
    xhr.onreadystatechange = function() {
      console.log("I am her xhr.statuse", xhr.status, xhr.responseText);
      if (xhr.readyState === 4) {
        if (xhr.status === 204) {
          uploadCompletedAt = Date.now();
          console.log("Upload completed successfully");
          console.log(
            "Time taken for upload",
            uploadCompletedAt - uploadStartedAt
          );
          console.log(
            "Time taken for encoding + upload",
            uploadCompletedAt - compreessionStarted
          );
          alert("Video uploaded successfully to S3");

          //

          RNFetchBlob.fs
            .stat(oThis.props.navigation.getParam("inputUri").substr(7))
            .then(statsInput => {
              RNFetchBlob.fs.stat(outputPath.substr(7)).then(statsOutput => {
                console.log(
                  "Raw input file size(KBytes) :",
                  statsInput.size / 1024
                );
                console.log(
                  "Raw output file size(KBytes) :",
                  statsOutput.size / 1024
                );

                oThis.setState({ processing: false });

                oThis.props.navigation.navigate("ViewRecordingWithStats", {
                  uri:
                    "http://s3.amazonaws.com/uassets.stagingpepo.com/d/ua/videos/1000-72ad32076230543b150194a3414ba7f9-original.mp4",
                  uploadTimeWithEncoding: uploadCompletedAt - uploadStartedAt,
                  timeForCompression:
                    comressionFinishedAt - compreessionStarted,
                  uploadAndCompressionTime:
                    uploadCompletedAt - compreessionStarted,
                  uploadTimeWithoutCompression: oThis.props.navigation.getParam(
                    "uploadTimeWithoutCompression"
                  ),
                  outputFileSize: statsOutput.size / 1024,
                  inputFileSize: statsInput.size / 1024
                });
              });
            })
            .catch(err => {
              console.log("Raw Get file details error", err);
            });
        } else {
          alert("Could not upload file.");
        }
      }
    };

    let formData = this.getFormData([
      {
        key: "key",
        value: "d/ua/videos/1000-72ad32076230543b150194a3414ba7f9-original.mp4"
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
        value: "AKIAT7WAUYD3XA7WRZV4/20190709/us-east-1/s3/aws4_request"
      },
      {
        key: "X-Amz-Date",
        value: "20190709T074646Z"
      },
      {
        key: "Policy",
        value:
          "eyJleHBpcmF0aW9uIjoiMjAxOS0wNy0xOVQwNzo0Njo0NloiLCJjb25kaXRpb25zIjpbeyJidWNrZXQiOiJ1YXNzZXRzLnN0YWdpbmdwZXBvLmNvbSJ9LHsiYWNsIjoicHVibGljLXJlYWQifSx7IkNvbnRlbnQtVHlwZSI6InZpZGVvL21wNCJ9LHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImlubGluZSJ9LHsia2V5IjoiZC91YS92aWRlb3MvMTAwMC03MmFkMzIwNzYyMzA1NDNiMTUwMTk0YTM0MTRiYTdmOS1vcmlnaW5hbC5tcDQifSx7IkNhY2hlLUNvbnRyb2wiOiJwdWJsaWMsIG1heC1hZ2U9MzE1MzYwMDAwIn0seyJ4LWFtei1hbGdvcml0aG0iOiJBV1M0LUhNQUMtU0hBMjU2In0sWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsMTAyNCw4Mzg4NjA4MF0seyJrZXkiOiJkL3VhL3ZpZGVvcy8xMDAwLTcyYWQzMjA3NjIzMDU0M2IxNTAxOTRhMzQxNGJhN2Y5LW9yaWdpbmFsLm1wNCJ9LHsiYnVja2V0IjoidWFzc2V0cy5zdGFnaW5ncGVwby5jb20ifSx7IlgtQW16LUFsZ29yaXRobSI6IkFXUzQtSE1BQy1TSEEyNTYifSx7IlgtQW16LUNyZWRlbnRpYWwiOiJBS0lBVDdXQVVZRDNYQTdXUlpWNC8yMDE5MDcwOS91cy1lYXN0LTEvczMvYXdzNF9yZXF1ZXN0In0seyJYLUFtei1EYXRlIjoiMjAxOTA3MDlUMDc0NjQ2WiJ9XX0="
      },
      {
        key: "X-Amz-Signature",
        value:
          "c9a42a70732fd5deb130f54df9f51547772b4d7e7a815c47b3e4310b0b9714dd"
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
    console.log("Upload started at", uploadStartedAt);
    console.log("formdata", formData);
    r = xhr.send(formData);
  }

  getFormData(dataArray) {
    let formData = new FormData();

    for (let i = 0; i < dataArray.length; i++) {
      formData.append(dataArray[i]["key"], dataArray[i]["value"]);
    }

    return formData;
  }
  render() {
    console.log(
      "------------------------------------ I am in recording ------------------------------------"
    );
    return (
      <View style={styles.container}>
        {/* <Button
          title="Play/Pause"
          onPress={() => this.setState({ pauseVideo: !this.state.pauseVideo })}
        /> */}
        <ProgressBar
          width={null}
          color="#ff3b30"
          progress={this.state.progress}
          indeterminate={false}
          style={styles.progressBar}
        />
        <Video
          source={{ uri: this.props.navigation.getParam("uri") }} // Can be a URL or a local file.
          ref={ref => {
            this.player = ref;
          }} // Store reference
          // onBuffer={this.onBuffer} // Callback when remote video is buffering
          // onError={this.videoError} // Callback when video cannot be loaded
          style={styles.backgroundVideo}
          paused={this.state.pauseVideo}
          onLoad={this.onVideoLoad}
        />
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
            <Text>Video compression in progress</Text>
            <ActivityIndicator size="large" color="#00ff00" />
          </View>
        )}
        <Button
          style={{ marginBottom: 40, position: "absolute" }}
          title="Compress"
          onPress={() => {
            if (this.state.processing) return;
            this.setState({ showModal: true });
            console.log("I am here in Button onPress");
          }}
        />

        {this.state.showModal && (
          <Modal
            onRequestClose={() => {
              this.setState({ showModal: false });
            }}
          >
            <View
              style={{
                flex: 1,
                alignContent: "center",
                justifyContent: "center"
              }}
            >
              <TextInput
                style={{ margin: 20 }}
                onChangeText={screenSize => this.setState({ screenSize })}
                placeholder="Screen size"
                value={this.state.screenSize}
              />

              <TextInput
                style={{ margin: 20 }}
                onChangeText={pixelFormat => this.setState({ pixelFormat })}
                placeholder="Pixel Format"
                value={this.state.pixelFormat}
              />

              <Picker
                selectedValue={this.state.preset}
                style={{ height: 50, width: 100 }}
                onValueChange={(itemValue, itemIndex) =>
                  this.setState({ preset: itemValue })
                }
              >
                <Picker.Item label="Ultrafast" value="ultrafast" />
                <Picker.Item label="Superfast" value="superfast" />
                <Picker.Item label="veryfast" value="veryfast" />
                <Picker.Item label="faster" value="faster" />
                <Picker.Item label="fast" value="fast" />
                <Picker.Item label="medium" value="medium" />
                <Picker.Item label="slow" value="slow" />
                <Picker.Item label="slower" value="slower" />
                <Picker.Item label="Superfast" value="superfast" />
              </Picker>

              <TextInput
                style={{ margin: 20 }}
                onChangeText={preset => this.setState({ preset })}
                placeholder="Preset"
                value={this.state.preset}
              />
              <TextInput
                style={{ margin: 20 }}
                placeholder="crf"
                value={this.state.crf}
                onChangeText={crf => this.setState({ crf })}
              />
              <Button
                title="Start compression"
                onPress={() => {
                  this.startCompression();
                }}
              />
            </View>
          </Modal>
        )}

        {/* <View style={{ flex: 0.5 }}>
          <Text>Thumbnail</Text>
          <Image
            style={{ flex: 1 }}
            source={{ uri: this.props.navigation.getParam("thumbnail") }}
          />
        </View> */}
      </View>
    );
  }
}

// define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c3e50",
    padding: 0,
    margin: 0,
    alignContent: "center",
    justifyContent: "center"
  },
  backgroundVideo: {
    flex: 1,
    left: 0,
    right: 0,
    padding: 0,
    margin: 0
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
export default ViewRecording;
