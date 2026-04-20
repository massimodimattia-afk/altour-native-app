// components/ActivityDetailModal.tsx
import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import {
  X,
  TrendingUp,
  Backpack,
  Ruler,
  Mountain,
  MapPin,
  ArrowUp,
  ExternalLink,
  Clock,
} from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';

// --- Tipi (invariati) ---
export interface Activity {
  id: string;
  titolo: string;
  descrizione: string | null;
  descrizione_estesa?: string | null;
  prezzo: number;
  immagine_url: string | null;
  gallery_urls?: string[] | null;
  difficolta?: string | null;
  durata?: string | null;
  lunghezza?: number | null;
  lunghezza_tour?: string | null;
  dislivello?: number | null;
  categoria?: string | null;
  filosofia?: string | null;
  attrezzatura_consigliata?: string | null;
  attrezzatura?: string | null;
  data?: string | null;
  _tipo?: 'escursione' | 'campo' | 'corso' | null;
  lat?: number | null;
  lng?: number | null;
  slug?: string | null;
  min_partecipanti?: number | null;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
}

const IMG_FALLBACK = require('../assets/altour-logo.png');
const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

// --- Utility per Markdown ---
const markdownStyles = {
  body: { color: '#57534e', fontSize: 14, lineHeight: 22 },
  heading1: { color: '#292524', fontWeight: '900' as const, marginVertical: 8 },
  heading2: { color: '#292524', fontWeight: '900' as const, marginVertical: 8 },
  strong: { fontWeight: '900' as const, color: '#44403c' },
  em: { fontStyle: 'italic' as const },
  list_item: { marginVertical: 2 },
};

// --- MiniMap Component (immagine statica + link a Google Maps) ---
const MiniMap = memo(({ lat, lng }: { lat: number; lng: number }) => {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng) || (nLat === 0 && nLng === 0)) return null;

  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${nLat},${nLng}&zoom=14&size=600x300&maptype=mapnik&markers=${nLat},${nLng},lightblue`;
  const googleMapsUrl = `https://www.google.com/maps?q=${nLat},${nLng}`;

  const openMaps = () => Linking.openURL(googleMapsUrl);

  return (
    <View className="mt-4 rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
      <View className="flex-row items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
        <View className="flex-row items-center gap-2">
          <MapPin size={13} color="#0ea5e9" />
          <Text className="text-[10px] font-black uppercase tracking-widest text-stone-800">
            Punto di partenza
          </Text>
        </View>
        <TouchableOpacity onPress={openMaps} className="flex-row items-center gap-1">
          <Text className="text-[9px] font-black uppercase text-sky-500">Apri App</Text>
          <ExternalLink size={10} color="#0ea5e9" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={openMaps} className="h-48 bg-stone-100">
        <Image source={{ uri: staticMapUrl }} className="w-full h-full" resizeMode="cover" />
      </TouchableOpacity>
    </View>
  );
});

// --- EquipmentList ---
const EquipmentList = memo(({ text }: { text: string }) => {
  const items = useMemo(
    () =>
      text
        .split(/[,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [text]
  );

  if (items.length > 1) {
    return (
      <View className="space-y-1">
        {items.map((item, idx) => (
          <Text key={idx} className="text-xs text-stone-600">• {item}</Text>
        ))}
      </View>
    );
  }
  return <Text className="text-xs text-stone-600">{text}</Text>;
});

// --- Componente Principale ---
export default function ActivityDetailModal({
  activity,
  isOpen,
  onClose,
  onBookingClick,
}: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when activity changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activity?.id]);

  // Chiudi modale con il tasto Back (Android)
  useEffect(() => {
    if (!isOpen) return;
    const backHandler = () => {
      onClose();
      return true;
    };
    // In Expo Router, potremmo usare useFocusEffect o simili,
    // ma per semplicità usiamo il listener di BackHandler
    const { BackHandler } = require('react-native');
    const subscription = BackHandler.addEventListener('hardwareBackPress', backHandler);
    return () => subscription.remove();
  }, [isOpen, onClose]);

  if (!activity) return null;

  const images = useMemo(
    () => [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[],
    [activity.immagine_url, activity.gallery_urls]
  );

  const hasMap = Boolean(activity.lat && activity.lng);
  const isTour = activity.categoria?.toLowerCase() === 'tour';
  const isCorso = activity._tipo === 'corso';

  const handleBooking = () => {
    onBookingClick(activity.titolo, 'prenota');
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="flex-1 bg-stone-900/60 justify-end md:justify-center"
      >
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown.springify().damping(20)}
          className="bg-white w-full max-w-5xl max-h-[93%] md:max-h-[90%] rounded-t-[2rem] md:rounded-[2.5rem] overflow-hidden flex-col md:flex-row"
        >
          {/* Bottone chiudi */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 z-30 p-2 bg-white/90 rounded-full shadow-lg"
          >
            <X size={20} color="#292524" />
          </TouchableOpacity>

          {/* Gallery */}
          <View className="md:w-1/2 relative bg-stone-100 h-56 md:h-auto">
            <Image
              source={images[currentImageIndex] ? { uri: images[currentImageIndex] } : IMG_FALLBACK}
              defaultSource={IMG_FALLBACK}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
              style={{ backgroundColor: '#e5e5e5' }}
            />
            {images.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                {images.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setCurrentImageIndex(i)}
                    className={`h-1.5 rounded-full ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Contenuto */}
          <View className="md:w-1/2 flex-1 bg-white">
            {/* Header */}
            <View className="px-6 pt-6 pb-4 border-b border-stone-50">
              <Text className="text-xl md:text-2xl font-black text-stone-800 uppercase leading-tight mb-2">
                {activity.titolo}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {activity.difficolta && (
                  <View className="flex-row items-center gap-1">
                    <Mountain size={12} color="#0ea5e9" />
                    <Text className="text-[10px] font-black uppercase text-stone-400">
                      {activity.difficolta}
                    </Text>
                  </View>
                )}
                {activity.durata && (
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#0ea5e9" />
                    <Text className="text-[10px] font-black uppercase text-stone-400">
                      {activity.durata}
                    </Text>
                  </View>
                )}
                {!isTour && activity.lunghezza != null && (
                  <View className="flex-row items-center gap-1">
                    <Ruler size={12} color="#0ea5e9" />
                    <Text className="text-[10px] font-black uppercase text-stone-400">
                      {activity.lunghezza} km
                    </Text>
                  </View>
                )}
                {!isTour && activity.dislivello != null && (
                  <View className="flex-row items-center gap-1">
                    <ArrowUp size={12} color="#0ea5e9" />
                    <Text className="text-[10px] font-black uppercase text-stone-400">
                      {activity.dislivello}m
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Body scrollabile */}
            <ScrollView
              className="flex-1 px-6 py-6"
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Descrizione Markdown */}
              <View className="mb-6">
                <Markdown style={markdownStyles}>
                  {activity.descrizione_estesa || activity.descrizione || ''}
                </Markdown>
              </View>

              {/* Attrezzatura */}
              {activity.attrezzatura && (
                <View className="p-4 bg-stone-50 rounded-xl border border-stone-100 mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Backpack size={14} color="#0ea5e9" />
                    <Text className="text-[10px] font-black uppercase text-stone-800">
                      {isCorso ? 'Argomenti' : 'Equipaggiamento'}
                    </Text>
                  </View>
                  <EquipmentList text={activity.attrezzatura} />
                </View>
              )}

              {/* Mappa */}
              {hasMap && <MiniMap lat={activity.lat!} lng={activity.lng!} />}
            </ScrollView>

            {/* Footer */}
            <View className="px-4 py-4 md:px-6 md:py-6 border-t border-stone-100 flex-row items-center gap-4 bg-stone-50/50">
              <View className="shrink-0">
                <Text className="text-[8px] font-black uppercase text-stone-400 leading-none mb-1">
                  Quota
                </Text>
                <Text className="text-2xl font-black text-stone-800 leading-none">
                  {activity.prezzo ? `€${activity.prezzo}` : '—'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleBooking}
                className="flex-1 bg-sky-500 py-4 rounded-xl shadow-lg shadow-sky-500/20 flex-row items-center justify-center gap-2"
              >
                <Text className="text-white font-black uppercase text-xs tracking-widest">
                  Prenota Ora
                </Text>
                <TrendingUp size={15} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}