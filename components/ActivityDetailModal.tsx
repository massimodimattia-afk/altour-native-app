// components/ActivityDetailModal.tsx
import React, { useState, useEffect, useMemo, memo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Modal, Linking, StyleSheet, BackHandler } from 'react-native';
import { X, TrendingUp, Backpack, Ruler, Mountain, MapPin, ArrowUp, ExternalLink, Clock } from 'lucide-react-native';

export interface Activity {
  id: string; titolo: string; descrizione: string | null; descrizione_estesa?: string | null;
  prezzo: number; immagine_url: string | null; gallery_urls?: string[] | null;
  difficolta?: string | null; durata?: string | null; lunghezza?: number | null;
  dislivello?: number | null; categoria?: string | null; attrezzatura?: string | null;
  data?: string | null; _tipo?: 'escursione' | 'campo' | 'corso' | null;
  lat?: number | null; lng?: number | null; slug?: string | null; min_partecipanti?: number | null;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
}

const IMG_FALLBACK = require('../assets/altour-logo.png');
const SKY = '#0ea5e9';

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1').replace(/_(.*?)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<[^>]*>/g, '');
}

const MiniMap = memo(({ lat, lng }: { lat: number; lng: number }) => {
  const nLat = Number(lat), nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng) || (nLat === 0 && nLng === 0)) return null;
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${nLat},${nLng}&zoom=14&size=600x300&maptype=mapnik&markers=${nLat},${nLng},lightblue`;
  const openMaps = () => Linking.openURL(`https://www.google.com/maps?q=${nLat},${nLng}`);
  return (
    <View style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f5f5f4' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#f5f5f4' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MapPin size={13} color={SKY} />
          <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#292524' }}>Punto di partenza</Text>
        </View>
        <TouchableOpacity onPress={openMaps} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: SKY }}>Apri App</Text>
          <ExternalLink size={10} color={SKY} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={openMaps} style={{ height: 180, backgroundColor: '#e7e5e4' }}>
        <Image source={{ uri: staticMapUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      </TouchableOpacity>
    </View>
  );
});

const EquipmentList = memo(({ text }: { text: string }) => {
  const items = useMemo(() => text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean), [text]);
  return (
    <View style={{ gap: 4 }}>
      {items.map((item, idx) => (
        <Text key={idx} style={{ fontSize: 13, color: '#78716c', lineHeight: 19 }}>• {item}</Text>
      ))}
    </View>
  );
});

export default function ActivityDetailModal({ activity, isOpen, onClose, onBookingClick }: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => { setCurrentImageIndex(0); }, [activity?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => sub.remove();
  }, [isOpen, onClose]);

  if (!activity) return null;

  const images = useMemo(
    () => [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[],
    [activity.immagine_url, activity.gallery_urls]
  );

  const isTour = activity.categoria?.toLowerCase() === 'tour';
  const isCorso = activity._tipo === 'corso';
  const hasMap = Boolean(activity.lat && activity.lng);

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={ms.backdrop}>
        <View style={ms.sheet}>

          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <X size={20} color="#292524" />
          </TouchableOpacity>

          {/* Immagine */}
          <View style={ms.imgContainer}>
            <Image
              source={images[currentImageIndex] ? { uri: images[currentImageIndex] } : IMG_FALLBACK}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            {images.length > 1 && (
              <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                {images.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setCurrentImageIndex(i)}
                    style={{ height: 6, width: i === currentImageIndex ? 16 : 6, borderRadius: 3, backgroundColor: i === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </View>
            )}
          </View>

          {/* Header */}
          <View style={ms.header}>
            <Text style={ms.headerTitle}>{activity.titolo}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
              {activity.difficolta && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Mountain size={12} color={SKY} />
                  <Text style={ms.metaText}>{activity.difficolta}</Text>
                </View>
              )}
              {activity.durata && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color={SKY} />
                  <Text style={ms.metaText}>{activity.durata}</Text>
                </View>
              )}
              {!isTour && activity.lunghezza != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ruler size={12} color={SKY} />
                  <Text style={ms.metaText}>{activity.lunghezza} km</Text>
                </View>
              )}
              {!isTour && activity.dislivello != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArrowUp size={12} color={SKY} />
                  <Text style={ms.metaText}>{activity.dislivello}m</Text>
                </View>
              )}
            </View>
          </View>

          {/* Corpo scrollabile */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 14, color: '#78716c', lineHeight: 22, marginBottom: 20 }}>
              {stripMarkdown(activity.descrizione_estesa || activity.descrizione || '')}
            </Text>

            {activity.attrezzatura && (
              <View style={{ padding: 16, backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: '#f5f5f4', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Backpack size={14} color={SKY} />
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#292524' }}>
                    {isCorso ? 'Argomenti' : 'Equipaggiamento'}
                  </Text>
                </View>
                <EquipmentList text={activity.attrezzatura} />
              </View>
            )}

            {hasMap && <MiniMap lat={activity.lat!} lng={activity.lng!} />}
          </ScrollView>

          {/* Footer */}
          <View style={ms.footer}>
            <View>
              <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', color: '#a8a29e', letterSpacing: 1, marginBottom: 2 }}>Quota</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#292524' }}>
                {activity.prezzo ? `€${activity.prezzo}` : '—'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onBookingClick(activity.titolo, 'prenota')} style={ms.bookBtn}>
              <Text style={ms.bookBtnText}>Prenota Ora</Text>
              <TrendingUp size={15} color="white" />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(28,25,23,0.6)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '93%', overflow: 'hidden' },
  closeBtn:    { position: 'absolute', top: 12, right: 12, zIndex: 30, padding: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20 },
  imgContainer:{ height: 220, backgroundColor: '#d4d0cb' },
  header:      { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#292524', textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 24 },
  metaText:    { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#a8a29e', letterSpacing: 1 },
  footer:      { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#f5f5f4', backgroundColor: '#fafafa' },
  bookBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0ea5e9', paddingVertical: 16, borderRadius: 14 },
  bookBtnText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: 'white' },
});