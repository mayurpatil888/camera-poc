//import liraries
import React, { Component } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Video from "react-native-video";

// create a component
const ViewRecording = props => {
  return (
    <View style={styles.container}>
      <Video
        source={{ uri: props.navigation.getParam("uri") }} // Can be a URL or a local file.
        ref={ref => {
          this.player = ref;
        }} // Store reference
        // onBuffer={this.onBuffer} // Callback when remote video is buffering
        // onError={this.videoError} // Callback when video cannot be loaded
        style={styles.backgroundVideo}
      />
      <View style={{ flex: 0.5 }}>
        <Text>Thumbnail</Text>
        <Image
          style={{ flex: 1 }}
          source={{ uri: props.navigation.getParam("thumbnail") }}
        />
      </View>
    </View>
  );
};

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
  }
});

//make this component available to the app
export default ViewRecording;
