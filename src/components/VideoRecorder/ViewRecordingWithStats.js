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
  TextInput
} from "react-native";
import Video from "react-native-video";

import ProgressBar from "react-native-progress/Bar";

const PROGRESS_FACTOR = 0.01;

// create a component
class ViewRecordingWithStats extends PureComponent {
  // static navigationOptions = {
  //   header: null
  // };
  constructor(props) {
    super(props);
    this.state = {
      pauseVideo: false,
      progress: 0,
      showModal: false
    };
  }
  static navigationOptions = ({ navigation, navigationOptions }) => {
    return {
      headerTitle: "Compressed video from S3"
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

  statsModal() {
    this.setState({ showModal: true });
  }

  render() {
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
        <Button
          title="Show Stats"
          onPress={() => {
            this.statsModal();
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
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Text>
                Upload Time:{" "}
                {this.props.navigation.getParam("uploadTimeWithEncoding") /
                  1000}{" "}
                seconds
              </Text>

              <Text>
                Compression Time:{" "}
                {this.props.navigation.getParam("timeForCompression") / 1000}{" "}
                seconds
              </Text>

              <Text>
                Upload + Compression Time:{" "}
                {this.props.navigation.getParam("uploadAndCompressionTime") /
                  1000}{" "}
                seconds
              </Text>

              <Text>
                Upload time without compressing video:{" "}
                {this.props.navigation.getParam(
                  "uploadTimeWithoutCompression"
                ) / 1000}{" "}
                seconds
              </Text>
              <Text>
                Compressed file size (in KB):
                {this.props.navigation.getParam("outputFileSize")}
              </Text>

              <Text>
                Input file size (in KB):
                {this.props.navigation.getParam("inputFileSize")}
              </Text>
              <Button
                onPress={() => {
                  this.setState({ showModal: false });
                }}
                title="Go Back"
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
export default ViewRecordingWithStats;
