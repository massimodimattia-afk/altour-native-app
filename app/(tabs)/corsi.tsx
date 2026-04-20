import { View, Text } from 'react-native';
export default function Corsi() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f2ed' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1c1917' }}>Corsi</Text>
      <Text style={{ color: '#78716c', marginTop: 8 }}>Prossimamente</Text>
    </View>
  );
}