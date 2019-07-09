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
    } -pix_fmt ${this.state.pixelFormat} -vcodec h264 ${outputPath}`;

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
                    "http://uassets.stagingpepo.com.s3.amazonaws.com/d/ua/profile-images/120-7ac299b228c236b17dccd9d4ca8dd10d-original.mp4",
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
        value:
          "d/ua/profile-images/120-7ac299b228c236b17dccd9d4ca8dd10d-original.mp4"
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
        value: "AKIAT7WAUYD3XA7WRZV4/20190704/us-east-1/s3/aws4_request"
      },
      {
        key: "X-Amz-Date",
        value: "20190704T073344Z"
      },
      {
        key: "Policy",
        value:
          "eyJleHBpcmF0aW9uIjoiMjAxOS0wNy0wOVQwNzozMzo0NFoiLCJjb25kaXRpb25zIjpbeyJidWNrZXQiOiJ1YXNzZXRzLnN0YWdpbmdwZXBvLmNvbSJ9LHsiYWNsIjoicHVibGljLXJlYWQifSx7IkNvbnRlbnQtVHlwZSI6InZpZGVvL21wNCJ9LHsiQ29udGVudC1EaXNwb3NpdGlvbiI6ImlubGluZSJ9LHsia2V5IjoiZC91YS9wcm9maWxlLWltYWdlcy8xMjAtN2FjMjk5YjIyOGMyMzZiMTdkY2NkOWQ0Y2E4ZGQxMGQtb3JpZ2luYWwubXA0In0seyJDYWNoZS1Db250cm9sIjoicHVibGljLCBtYXgtYWdlPTMxNTM2MDAwMCJ9LHsieC1hbXotYWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDEwMjQsODM4ODYwODBdLHsia2V5IjoiZC91YS9wcm9maWxlLWltYWdlcy8xMjAtN2FjMjk5YjIyOGMyMzZiMTdkY2NkOWQ0Y2E4ZGQxMGQtb3JpZ2luYWwubXA0In0seyJidWNrZXQiOiJ1YXNzZXRzLnN0YWdpbmdwZXBvLmNvbSJ9LHsiWC1BbXotQWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LHsiWC1BbXotQ3JlZGVudGlhbCI6IkFLSUFUN1dBVVlEM1hBN1dSWlY0LzIwMTkwNzA0L3VzLWVhc3QtMS9zMy9hd3M0X3JlcXVlc3QifSx7IlgtQW16LURhdGUiOiIyMDE5MDcwNFQwNzMzNDRaIn1dfQ=="
      },
      {
        key: "X-Amz-Signature",
        value:
          "705e9161fb3278e0123a66281392ae5c0a94465a0dbf70b5a4c5b8ef49b72e6c"
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
            <TextInput
              onChangeText={screenSize => this.setState({ screenSize })}
              placeholder="Screen size"
              value={this.state.screenSize}
            />

            <TextInput
              onChangeText={pixelFormat => this.setState({ pixelFormat })}
              placeholder="Pixel Format"
              value={this.state.pixelFormat}
            />

            {/* <Picker
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
            </Picker> */}

            <TextInput
              onChangeText={preset => this.setState({ preset })}
              placeholder="Preset"
              value={this.state.preset}
            />
            <TextInput
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
    margin: 0
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
