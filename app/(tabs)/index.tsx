import { Image, View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#5aaadd]">
      {/* Questo caricherà il file fisico che hai messo in assets */}
      <Image 
        source={require('../../assets/icon.png')} 
        style={{ width: 250, height: 250 }}
        resizeMode="contain"
      />
      <Text className="text-white font-bold mt-4 text-xl">Altour Italy</Text>
    </View>
  );
}