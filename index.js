/**
 * @format
 */

import { AppRegistry } from "react-native";
import AppContainer from "./src/components/AppContainer";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => AppContainer);
