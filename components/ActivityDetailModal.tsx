// components/ActivityDetailModal.tsx
import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  Modal, Linking, StyleSheet, BackHandler, Dimensions,
} from 'react-native';
import {
  X, TrendingUp, Backpack, Ruler, Mountain,
  MapPin, ArrowUp, ExternalLink, Clock,
} from 'lucide-react-native';

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
  dislivello?: number | null;
  categoria?: string | null;
  attrezzatura?: string | null;
  attrezzatura_consigliata?: string | null;
  data?: string | null;
  _tipo?: 'escursione' | 'campo' | 'corso' | null;
  lat?: number | string | null;
  lng?: number | string | null;
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
const SKY = '#0ea5e9';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '');
}

const MiniMap = memo(({ lat, lng }: { lat: number; lng: number }) => {
  const nLat = Number(lat), nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng) || (nLat === 0 && nLng === 0)) return null;
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${nLat},${nLng}&zoom=14&size=600x300&maptype=mapnik&markers=${nLat},${nLng},lightblue`;
  const openMaps = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${nLat},${nLng}`);
  return (
    <View style={ms.mapWrapper}>
      <View style={ms.mapHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MapPin size={13} color={SKY} />
          <Text style={ms.mapTitle}>Punto di partenza</Text>
        </View>
        <TouchableOpacity onPress={openMaps} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={ms.mapLink}>Apri App</Text>
          <ExternalLink size={10} color={SKY} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={openMaps} style={ms.mapImageContainer}>
        <Image source={{ uri: staticMapUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      </TouchableOpacity>
    </View>
  );
});

const EquipmentList = memo(({ text }: { text: string }) => {
  const items = useMemo(
    () => text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean),
    [text]
  );
  return (
    <View style={{ gap: 4 }}>
      {items.map((item, idx) => (
        <Text key={idx} style={ms.equipmentItem}>• {item}</Text>
      ))}
    </View>
  );
});

export default function ActivityDetailModal({
  activity, isOpen, onClose, onBookingClick,
}: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => { setCurrentImageIndex(0); }, [activity?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => sub.remove();
  }, [isOpen, onClose]);

  const images = useMemo(() => {
    if (!activity) return [];
    return [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[];
  }, [activity?.id, activity?.immagine_url, activity?.gallery_urls]);

  if (!activity) return null;

  const isTour = activity.categoria?.toLowerCase() === 'tour';
  const isCorso = activity._tipo === 'corso';
  const hasMap = Boolean(
    activity.lat && activity.lng &&
    Number(activity.lat) !== 0 && Number(activity.lng) !== 0
  );
  const descriptionText = stripMarkdown(
    activity.descrizione_estesa || activity.descrizione || ''
  );
  const equipmentText = activity.attrezzatura || activity.attrezzatura_consigliata || null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* ── FIX: backdrop separato dalla sheet ── */}
      <View style={ms.backdrop}>

        {/* ── FIX PRINCIPALE: sheet con flex:1 e flexDirection:'column' espliciti ── */}
        <View style={ms.sheet}>

          {/* Close button — absolute, non occupa spazio nel layout */}
          <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
            <X size={20} color="#292524" />
          </TouchableOpacity>

          {/* Immagine — altezza fissa */}
          <View style={ms.imgContainer}>
            <Image
              source={images[currentImageIndex] ? { uri: images[currentImageIndex] } : IMG_FALLBACK}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            {images.length > 1 && (
              <View style={ms.paginationDots}>
                {images.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setCurrentImageIndex(i)}
                    style={[ms.dot, {
                      width: i === currentImageIndex ? 16 : 6,
                      backgroundColor: i === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                    }]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Header — altezza automatica */}
          <View style={ms.header}>
            <Text style={ms.headerTitle}>{activity.titolo}</Text>
            <View style={ms.metaGrid}>
              {activity.difficolta && (
                <View style={ms.metaItem}>
                  <Mountain size={12} color={SKY} />
                  <Text style={ms.metaText}>{activity.difficolta}</Text>
                </View>
              )}
              {activity.durata && (
                <View style={ms.metaItem}>
                  <Clock size={12} color={SKY} />
                  <Text style={ms.metaText}>{activity.durata}</Text>
                </View>
              )}
              {!isTour && activity.lunghezza != null && (
                <View style={ms.metaItem}>
                  <Ruler size={12} color={SKY} />
                  <Text style={ms.metaText}>{activity.lunghezza} km</Text>
                </View>
              )}
              {!isTour && activity.dislivello != null && (
                <View style={ms.metaItem}>
                  <ArrowUp size={12} color={SKY} />
                  <Text style={ms.metaText}>{activity.dislivello}m</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── FIX: ScrollView occupa tutto lo spazio rimasto tra header e footer ── */}
          <ScrollView
            style={ms.scrollArea}
            contentContainerStyle={ms.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Descrizione */}
            {descriptionText.length > 0 ? (
              <Text style={ms.description}>{descriptionText}</Text>
            ) : (
              <Text style={ms.emptyField}>Nessuna descrizione disponibile</Text>
            )}

            {/* Attrezzatura */}
            {equipmentText ? (
              <View style={ms.equipmentCard}>
                <View style={ms.equipmentHeader}>
                  <Backpack size={14} color={SKY} />
                  <Text style={ms.sectionTitle}>
                    {isCorso ? 'Argomenti' : 'Equipaggiamento'}
                  </Text>
                </View>
                <EquipmentList text={equipmentText} />
              </View>
            ) : null}

            {/* Mappa */}
            {hasMap && (
              <MiniMap lat={Number(activity.lat)} lng={Number(activity.lng)} />
            )}
          </ScrollView>

          {/* Footer — altezza fissa, sempre visibile */}
          <View style={ms.footer}>
            <View>
              <Text style={ms.quotaLabel}>Quota</Text>
              <Text style={ms.priceText}>
                {activity.prezzo ? `€${activity.prezzo}` : '—'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onBookingClick(activity.titolo, 'prenota')}
              style={ms.bookBtn}
            >
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
  // ── FIX STRUTTURALE: backdrop + sheet con flex layout esplicito ──
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    // ── CHIAVE: flex:1 con maxHeight limita l'altezza
    // ma permette ai figli flex:1 di espandersi correttamente ──
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    // ── usa altezza massima in pixel, NON percentuale stringa ──
    maxHeight: SCREEN_HEIGHT * 0.93,
    // ── flexDirection esplicito è OBBLIGATORIO ──
    flexDirection: 'column',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 30,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  imgContainer: {
    height: 220,
    backgroundColor: '#d4d0cb',
    // ── flexShrink:0 impedisce all'immagine di comprimersi ──
    flexShrink: 0,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { height: 6, borderRadius: 3 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
    // ── flexShrink:0 impedisce all'header di comprimersi ──
    flexShrink: 0,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#292524',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#a8a29e',
    letterSpacing: 1,
  },
  // ── CHIAVE: flex:1 qui fa sì che la ScrollView occupi tutto lo spazio disponibile ──
  scrollArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#78716c',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyField: {
    fontSize: 13,
    color: '#a8a29e',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  equipmentCard: {
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5f5f4',
    marginBottom: 16,
  },
  equipmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#292524',
  },
  equipmentItem: { fontSize: 13, color: '#78716c', lineHeight: 19 },
  // ── footer con flexShrink:0 per non comprimersi mai ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    backgroundColor: '#fafafa',
    flexShrink: 0,
  },
  quotaLabel: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#a8a29e',
    letterSpacing: 1,
    marginBottom: 2,
  },
  priceText: { fontSize: 24, fontWeight: '900', color: '#292524' },
  bookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SKY,
    paddingVertical: 16,
    borderRadius: 14,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'white',
  },
  mapWrapper: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  mapTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#292524',
  },
  mapLink: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: SKY },
  mapImageContainer: { height: 180, backgroundColor: '#e7e5e4' },
});