//import liraries
import React, { PureComponent } from "react";
import { View, Text, StyleSheet, Image, Button } from "react-native";
import Video from "react-native-video";

import ProgressBar from "react-native-progress/Bar";

const PROGRESS_FACTOR = 0.01;

// create a component
class ViewRecording extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      pauseVideo: false,
      progress: 0
    };
    this.durationInMsec = 300;
  }

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
        <View style={{ flex: 0.5 }}>
          <Text>Thumbnail</Text>
          <Image
            style={{ flex: 1 }}
            source={{ uri: this.props.navigation.getParam("thumbnail") }}
          />
        </View>
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
    flex: 0.5,
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
