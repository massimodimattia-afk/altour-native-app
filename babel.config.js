module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Se usi NativeWind, assicurati di avere il plugin qui
      // 'nativewind/babel',
      'react-native-reanimated/plugin', // <-- Deve essere 'react-native-reanimated/plugin', NON 'react-native-worklets/plugin'
    ],
  };
};