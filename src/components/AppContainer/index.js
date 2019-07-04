import React from "react";
import { View, Text, Button } from "react-native";
import { createStackNavigator, createAppContainer } from "react-navigation";
import CameraScreen from "../CameraScreen";
import SquareImageCropper from "../SquareImageCropper";
import VideoRecorder from "../VideoRecorder";
import ViewRecording from "../VideoRecorder/ViewRecording";
import RNCameraExample from "../RNCameraExample";

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    // console.disableYellowBox = true;
  }
  startCamera() {
    this.props.navigation.navigate("Camera", { type: "snap" });
  }

  startVideo() {
    this.props.navigation.navigate("Camera", { type: "video" });
  }

  recordVideo() {
    this.props.navigation.navigate("VideoRecorder");
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "space-evenly",
          flexDirection: "row"
        }}
      >
        {/* <Button title="Start Camera" onPress={() => this.startCamera()} /> */}
        {/* <Button title="Start Video" onPress={() => this.startVideo()} /> */}
        <Button title="Record Video" onPress={() => this.recordVideo()} />
        {/* <Button
          title="Crop Example"
          onPress={() => {
            this.props.navigation.navigate("ImageCropper");
          }}
        /> */}
        <Button
          title="RNCamera Example"
          onPress={() => this.props.navigation.navigate("RNCameraExample")}
        />
      </View>
    );
  }
}

const AppNavigator = createStackNavigator({
  Home: {
    screen: HomeScreen
  },
  ImageCropper: {
    screen: SquareImageCropper
  },
  Camera: {
    screen: CameraScreen
  },
  VideoRecorder: {
    screen: VideoRecorder
  },
  ViewRecording: {
    screen: ViewRecording
  },
  RNCameraExample: {
    screen: RNCameraExample
  },
  initialRouteName: "Home"
});

export default createAppContainer(AppNavigator);
