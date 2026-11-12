import { AppRegistry } from 'react-native';
import * as AppModule from './src/App';
import { name as appName } from './app.json';

const App = AppModule.default;
AppRegistry.registerComponent(appName, () => App);