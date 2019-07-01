import React from "react";
import { View, Text, Button } from "react-native";
import { createStackNavigator, createAppContainer } from "react-navigation";
import CameraScreen from "../CameraScreen";
import SquareImageCropper from "../SquareImageCropper";
//import ImagePicker from "react-native-image-crop-picker";

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
  }
  startCamera() {
    this.props.navigation.navigate("Camera", { type: "snap" });
  }

  startVideo() {
    this.props.navigation.navigate("Camera", { type: "video" });
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
        <Button title="Start Camera" onPress={() => this.startCamera()} />
        <Button title="Start Video" onPress={() => this.startVideo()} />
        <Button
          title="Crop Example"
          onPress={() => {
            this.props.navigation.navigate("ImageCropper");
          }}
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
  initialRouteName: "Home"
});

export default createAppContainer(AppNavigator);
