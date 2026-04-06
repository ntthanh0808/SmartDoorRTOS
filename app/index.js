// Load polyfills in correct order
import 'react-native-url-polyfill/auto';
import './src/utils/websocket-polyfill';

// Then load the app
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);
