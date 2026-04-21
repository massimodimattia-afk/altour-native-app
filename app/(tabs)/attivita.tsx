// app/(tabs)/attivita.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, StyleSheet, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Clock, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import ActivityDetailModal from '../../components/ActivityDetailModal';
import BookingModal from '../../components/BookingModal';

// --- Tipi (con tutti i campi necessari) ---
interface Escursione {
  id: string;
  created_at: string;
  data: string | null;
  titolo: string;
  descrizione: string | null;
  descrizione_estesa?: string | null;
  prezzo: number;
  difficolta?: string | null;
  immagine_url: string | null;
  gallery_urls?: string[] | null;
  durata?: string | null;
  attrezzatura?: string | null;
  attrezzatura_consigliata?: string | null;
  categoria?: string | null;
  filosofia?: string | null;
  lunghezza?: number | null;
  dislivello?: number | null;
  lat?: number | null;
  lng?: number | null;
  is_active: boolean;
  _tipo: 'escursione';
}

interface Campo {
  id: string;
  created_at: string;
  titolo: string;
  descrizione: string | null;
  descrizione_estesa?: string | null;
  immagine_url: string | null;
  servizi: string[] | null;
  slug: string;
  prezzo?: number | null;
  durata?: string | null;
  difficolta?: string | null;
  lunghezza?: number | null;
  filosofia?: string | null;
  lat?: number | null;
  lng?: number | null;
  _tipo: 'campo';
}

type Activity = Escursione | Campo;
type FilterKey = 'mezza_giornata' | 'intera_giornata' | 'tour' | 'campi';

interface AttivitaPageProps {
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
}

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const ITEMS_PER_LOAD = isTablet ? 6 : 4;
const SKY = '#0ea5e9';
const STONE = '#1c1917';
const IMG_FALLBACK = require('../../assets/altour-logo.png');

// --- Utility (copiate da web) ---
function formatMarkdown(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
}

function safeParseArray(v: any): string[] | null {
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : null;
    } catch {
      return null;
    }
  }
  return Array.isArray(v) ? v : null;
}

const FILOSOFIA_COLORS: Record<string, string> = {
  Avventura: '#e94544',
  Benessere: '#a5d9c9',
  'Borghi più belli': '#946a52',
  Cammini: '#e3c45d',
  "Educazione all'aperto": '#01aa9f',
  Eventi: '#ffc0cb',
  Formazione: '#002f59',
  'Immersi nel verde': '#358756',
  'Luoghi dello spirito': '#c8a3c9',
  Novità: '#75c43c',
  Speciali: '#b8163c',
  'Tra mare e cielo': '#7aaecd',
  'Trek urbano': '#f39452',
  'Tracce sulla neve': '#a8cce0',
  'Cielo stellato': '#1e2855',
};

function getFilosofiaOpacity(color: string): string {
  const dark = ['#002f59', '#946a52', '#b8163c', '#358756', '#1e2855'];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  const bg = getFilosofiaOpacity(color);
  return (
    <View style={[styles.badge, { backgroundColor: bg, shadowColor: color }]}>
      <Text style={styles.badgeText}>{value}</Text>
    </View>
  );
}

function campoToDetail(campo: Campo) {
  return {
    id: campo.id,
    titolo: campo.titolo,
    descrizione: campo.descrizione,
    descrizione_estesa: campo.descrizione_estesa ?? null,
    prezzo: campo.prezzo ?? (null as unknown as number),
    immagine_url: campo.immagine_url,
    gallery_urls: null,
    difficolta: campo.difficolta ?? null,
    durata: campo.durata ?? null,
    lunghezza: campo.lunghezza ?? null,
    attrezzatura: campo.servizi?.join(', ') ?? null,
    filosofia: campo.filosofia ?? null,
    lat: campo.lat ?? null,
    lng: campo.lng ?? null,
    _tipo: 'campo' as const,
  };
}

// --- Componenti interni ---
const ActivityCard: React.FC<{
  activity: Activity;
  onDetails: () => void;
  onBook: (mode?: 'info' | 'prenota') => void;
}> = ({ activity, onDetails, onBook }) => {
  const isEsc = activity._tipo === 'escursione';
  const esc = isEsc ? (activity as Escursione) : null;
  const formattedDate = esc?.data
    ? new Date(esc.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardImgContainer}>
        <Image
          source={{ uri: activity.immagine_url || undefined }}
          defaultSource={IMG_FALLBACK}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={styles.cardImgOverlay} />
        {isEsc
          ? esc?.filosofia && <FilosofiaBadge value={esc.filosofia} />
          : ((activity as Campo).filosofia || (activity as Campo).slug) && (
              <FilosofiaBadge value={(activity as Campo).filosofia || (activity as Campo).slug} />
            )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardMeta}>
          {formattedDate && (
            <View style={styles.metaItem}>
              <Calendar size={12} color={SKY} />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
          )}
          {activity.durata && (
            <View style={styles.metaItem}>
              <Clock size={12} color={SKY} />
              <Text style={styles.metaText}>{activity.durata}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{activity.titolo}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {formatMarkdown(activity.descrizione).replace(/<[^>]*>/g, '')}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.outlineBtn} onPress={onDetails}>
            <Text style={styles.outlineBtnText}>Dettagli</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => onBook('info')}>
            <Text style={styles.primaryBtnText}>Richiedi Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const SkeletonCard = () => (
  <View style={[styles.card, { opacity: 0.7 }]}>
    <View style={[styles.cardImgContainer, { backgroundColor: '#e7e5e4' }]} />
    <View style={styles.cardBody}>
      <View style={[styles.metaItem, { marginBottom: 8 }]}>
        <View style={{ width: 60, height: 8, backgroundColor: '#e7e5e4', borderRadius: 4 }} />
      </View>
      <View style={{ width: '80%', height: 16, backgroundColor: '#e7e5e4', borderRadius: 4, marginBottom: 8 }} />
      <View style={{ width: '100%', height: 12, backgroundColor: '#f5f5f4', borderRadius: 4, marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, height: 36, backgroundColor: '#e7e5e4', borderRadius: 12 }} />
        <View style={{ flex: 1.5, height: 36, backgroundColor: '#e7e5e4', borderRadius: 12 }} />
      </View>
    </View>
  </View>
);

// --- Componente Principale ---
export default function AttivitaPage({ onBookingClick }: AttivitaPageProps) {
  const insets = useSafeAreaInsets();
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [campi, setCampi] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingMode, setBookingMode] = useState<'info' | 'prenota'>('info');

  const closeDrawer = () => {
    setDrawerClosing(true);
    setDrawerOpen(false);
    setTimeout(() => setDrawerClosing(false), 400);
  };

  // Caricamento dati ROBUSTO
  useEffect(() => {
    async function load() {
      try {
        const [{ data: escData, error: escError }, { data: campiData, error: campiError }] = await Promise.all([
          supabase
            .from('escursioni')
            .select(`
              id, created_at, data, titolo, descrizione, descrizione_estesa,
              prezzo, difficolta, immagine_url, gallery_urls, durata,
              attrezzatura, categoria, filosofia,
              lunghezza, dislivello, lat, lng, is_active
            `)
            .eq('is_active', true)
            .order('data', { ascending: true }),
          supabase
            .from('campi')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

        if (escError) console.error('❌ Errore escursioni:', escError);
        if (campiError) console.error('❌ Errore campi:', campiError);

        if (escData) {
          console.log('📦 Escursioni ricevute:', escData.length);
          setEscursioni(
            (escData as any[]).map(e => ({
              ...e,
              lat: e.lat ? Number(e.lat) : null,
              lng: e.lng ? Number(e.lng) : null,
              attrezzatura: e.attrezzatura || null,
              _tipo: 'escursione' as const,
            }))
          );
        }

        if (campiData) {
          console.log('🏕️ Campi ricevuti:', campiData.length);
          setCampi(
            (campiData as any[]).map(row => ({
              id: row.id,
              created_at: row.created_at,
              titolo: row.titolo,
              descrizione: row.descrizione ?? null,
              descrizione_estesa: row.descrizione_estesa ?? null,
              immagine_url: row.immagine_url ?? null,
              servizi: safeParseArray(row.servizi),
              slug: row.slug,
              prezzo: row.prezzo ?? null,
              durata: row.durata ?? null,
              difficolta: row.difficolta ?? null,
              lunghezza: row.lunghezza ?? null,
              filosofia: row.filosofia ?? null,
              lat: row.lat ? Number(row.lat) : null,
              lng: row.lng ? Number(row.lng) : null,
              _tipo: 'campo' as const,
            }))
          );
        }
      } catch (error) {
        console.error('💥 Errore generale load:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const allActivities: Activity[] = useMemo(() => {
    return [...escursioni, ...campi].sort((a, b) => {
      const da = (a as any).data ? new Date((a as any).data).getTime() : Infinity;
      const db = (b as any).data ? new Date((b as any).data).getTime() : Infinity;
      return da - db;
    });
  }, [escursioni, campi]);

  const filtered: Activity[] = useMemo(() => {
    if (!activeFilter) return allActivities;
    switch (activeFilter) {
      case 'mezza_giornata':
        return escursioni.filter(e => e.categoria?.toLowerCase().includes('mezza'));
      case 'intera_giornata':
        return escursioni.filter(e => e.categoria?.toLowerCase() === 'giornata' || e.categoria?.toLowerCase().includes('intera'));
      case 'tour':
        return escursioni.filter(e => e.categoria?.toLowerCase() === 'tour');
      case 'campi':
        return campi;
      default:
        return allActivities;
    }
  }, [activeFilter, allActivities, escursioni, campi]);

  const visible = filtered.slice(0, visibleCount);

  const FILTERS: { key: FilterKey; label: string; emoji: string; count: number; color: string; textColor?: string }[] = [
    { key: 'mezza_giornata', label: 'Mezza giornata', emoji: '🌤', count: escursioni.filter(e => e.categoria?.toLowerCase().includes('mezza')).length, color: '#5aaadd' },
    { key: 'intera_giornata', label: 'Intera giornata', emoji: '☀️', count: escursioni.filter(e => e.categoria?.toLowerCase() === 'giornata' || e.categoria?.toLowerCase().includes('intera')).length, color: '#81ccb0' },
    { key: 'tour', label: 'Tour', emoji: '🏔', count: escursioni.filter(e => e.categoria?.toLowerCase() === 'tour').length, color: '#f4d98c', textColor: '#7a5e00' },
    { key: 'campi', label: 'Campi Estivi', emoji: '⛺️', count: campi.length, color: '#9f8270' },
  ];

  const openDetails = (a: Activity) => {
    const detailActivity = a._tipo === 'campo' ? campoToDetail(a as Campo) : a;
    console.log('🎯 Apertura dettaglio:', { descrizione_estesa: detailActivity.descrizione_estesa, attrezzatura: detailActivity.attrezzatura, lat: detailActivity.lat });
    setSelectedActivity(detailActivity);
    setIsDetailOpen(true);
  };

  const toggleFilter = (key: FilterKey) => {
    setActiveFilter(prev => (prev === key ? null : key));
    setVisibleCount(ITEMS_PER_LOAD);
  };

  const handleBooking = (title: string, mode: 'info' | 'prenota' = 'info') => {
    setBookingTitle(title);
    setBookingMode(mode);
    setBookingModalOpen(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ width: 200, height: 32, backgroundColor: '#e7e5e4', borderRadius: 16, marginBottom: 8 }} />
          <View style={{ width: 120, height: 16, backgroundColor: '#f5f5f4', borderRadius: 8, marginBottom: 24 }} />
          <View style={{ height: 80, backgroundColor: '#f5f5f4', borderRadius: 32, marginBottom: 24 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {[1, 2, 3, 4].map(n => (
              <View key={n} style={{ width: 100, height: 56, backgroundColor: '#f5f5f4', borderRadius: 16, marginRight: 8 }} />
            ))}
          </ScrollView>
          <View style={{ gap: 16 }}>
            {[1, 2, 3].map(n => (<SkeletonCard key={n} />))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTag}>Esplora</Text>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Attività <Text style={styles.pageTitleItalic}>Outdoor.</Text></Text>
            <Text style={styles.countBadge}>{filtered.length} attività</Text>
          </View>
          <View style={styles.accentBar} />

          {/* Banner Quiz Zaino */}
          <View style={styles.quizBanner}>
            <View style={styles.quizBannerContent}>
              <View style={styles.quizIconContainer}><Text style={styles.quizEmoji}>🎒</Text></View>
              <View style={styles.quizTextContainer}>
                <Text style={styles.quizTag}>Non sai da dove iniziare?</Text>
                <Text style={styles.quizTitle}>Costruisci il tuo zaino ideale</Text>
                {isTablet && <Text style={styles.quizSubtitle}>Scegli 3 oggetti e scopri l'escursione perfetta per te</Text>}
              </View>
              <TouchableOpacity style={styles.quizButton} onPress={() => setDrawerOpen(true)}>
                <Text style={styles.quizButtonText}>Inizia</Text>
                <ArrowRight size={12} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.quizBannerDivider} />
          </View>

          {/* Filtri mobile */}
          {!isTablet && (
            <View style={styles.mobileFilterSection}>
              <View style={styles.mobileFilterHeader}>
                <Text style={styles.mobileFilterLabel}>Tipo di Esperienza</Text>
                {activeFilter && (
                  <TouchableOpacity onPress={() => { setActiveFilter(null); setVisibleCount(ITEMS_PER_LOAD); }}>
                    <Text style={styles.clearFilterText}>Tutte</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.mobileFilterPills}>
                {FILTERS.map(f => {
                  const isActive = activeFilter === f.key;
                  return (
                    <TouchableOpacity key={f.key} style={[styles.mobileFilterPill, isActive && { backgroundColor: 'white', borderColor: '#e7e5e4' }]} onPress={() => toggleFilter(f.key)}>
                      <View style={[styles.filterColorDot, { backgroundColor: f.color }]} />
                      <Text style={[styles.mobileFilterPillText, isActive && { color: STONE }]}>{f.label}</Text>
                      {f.count > 0 && <Text style={styles.filterCount}>{f.count}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Filtri desktop sticky */}
        {isTablet && (
          <View style={styles.desktopFilterBar}>
            <TouchableOpacity style={[styles.resetFilterBtn, activeFilter ? styles.resetFilterBtnInactive : styles.resetFilterBtnActive]} onPress={() => { setActiveFilter(null); setVisibleCount(ITEMS_PER_LOAD); }}>
              <SlidersHorizontal size={12} color={activeFilter ? '#a8a29e' : 'white'} />
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {FILTERS.map(f => {
                const isActive = activeFilter === f.key;
                return (
                  <TouchableOpacity key={f.key} style={[styles.desktopFilterPill, isActive ? { backgroundColor: f.color, shadowColor: f.color } : { backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e7e5e4' }]} onPress={() => toggleFilter(f.key)}>
                    <Text style={{ marginRight: 4 }}>{f.emoji}</Text>
                    <Text style={[styles.desktopFilterPillText, { color: isActive ? (f.textColor ?? 'white') : '#a8a29e' }]}>{f.label}</Text>
                    {f.count > 0 && <Text style={[styles.filterCount, isActive && { color: 'white' }]}>{f.count}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Contenuto principale */}
        <View style={styles.mainContent}>
          {visible.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏔️</Text>
              <Text style={styles.emptyTitle}>Nessuna attività disponibile</Text>
              <Text style={styles.emptySubtitle}>Non ci sono risultati per questo filtro al momento.</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => { setActiveFilter(null); setVisibleCount(ITEMS_PER_LOAD); }}>
                <Text style={styles.emptyButtonText}>Vedi tutte le attività</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.cardGrid}>
                {visible.map(activity => (
                  <View key={activity.id} style={styles.cardWrapper}>
                    <ActivityCard activity={activity} onDetails={() => openDetails(activity)} onBook={mode => handleBooking(activity.titolo, mode)} />
                  </View>
                ))}
              </View>
              {visibleCount < filtered.length && (
                <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setVisibleCount(v => v + ITEMS_PER_LOAD)}>
                  <Text style={styles.loadMoreText}>Altre {Math.min(ITEMS_PER_LOAD, filtered.length - visibleCount)} attività</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Drawer Mobile per Quiz */}
      <Modal visible={drawerOpen} transparent animationType="slide" onRequestClose={closeDrawer}>
        <Pressable style={styles.drawerBackdrop} onPress={closeDrawer} />
        <View style={styles.drawerContainer}>
          <View style={styles.drawerHandle} />
          <View style={styles.drawerHeader}>
            <View>
              <Text style={styles.drawerTag}>Trova la tua escursione</Text>
              <Text style={styles.drawerTitle}>Cosa metti <Text style={styles.drawerTitleItalic}>nel tuo zaino?</Text></Text>
            </View>
            <TouchableOpacity onPress={closeDrawer} style={styles.drawerCloseBtn}><Text style={{ fontSize: 20, color: '#78716c' }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.drawerContent}>
            <Text style={{ color: '#a8a29e', textAlign: 'center', marginTop: 40 }}>Quiz in arrivo...</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* FAB mobile */}
      {!drawerOpen && !drawerClosing && (
        <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 16 }]} onPress={() => setDrawerOpen(true)}>
          <Sparkles size={14} color="white" />
          <Text style={styles.fabText}>Trova la tua escursione</Text>
        </TouchableOpacity>
      )}

      {/* Modali */}
      <ActivityDetailModal activity={selectedActivity} isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setTimeout(() => setSelectedActivity(null), 300); }} onBookingClick={handleBooking} />
      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} title={bookingTitle} mode={bookingMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ed' },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  pageTag: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: SKY, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  pageTitle: { fontSize: 34, fontWeight: '900', color: STONE, textTransform: 'uppercase', letterSpacing: -1, lineHeight: 36 },
  pageTitleItalic: { fontStyle: 'italic', fontWeight: '300', color: SKY },
  countBadge: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#a8a29e' },
  accentBar: { width: 28, height: 3, borderRadius: 2, backgroundColor: SKY, marginTop: 12, marginBottom: 20 },
  quizBanner: { borderRadius: 32, overflow: 'hidden', marginBottom: 24 },
  quizBannerContent: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'rgba(129,204,176,0.1)' },
  quizIconContainer: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(129,204,176,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  quizEmoji: { fontSize: 28 },
  quizTextContainer: { flex: 1 },
  quizTag: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: '#81ccb0', marginBottom: 4 },
  quizTitle: { fontSize: 16, fontWeight: '900', color: '#44403c', textTransform: 'uppercase', letterSpacing: -0.5 },
  quizSubtitle: { fontSize: 10, color: '#a8a29e', marginTop: 4 },
  quizButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: '#5aaadd', marginLeft: 12 },
  quizButtonText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: 'white' },
  quizBannerDivider: { height: 2, backgroundColor: '#81ccb0' },
  mobileFilterSection: { marginBottom: 24 },
  mobileFilterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mobileFilterLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: '#a8a29e' },
  clearFilterText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: SKY },
  mobileFilterPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mobileFilterPill: { flex: 1, minWidth: 140, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#e7e5e4', borderWidth: 1, borderColor: 'transparent' },
  filterColorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  mobileFilterPillText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#78716c', flex: 1 },
  filterCount: { fontSize: 8, fontWeight: 'bold', opacity: 0.4, marginLeft: 4 },
  desktopFilterBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e7e5e4', backgroundColor: '#f5f2ed' },
  resetFilterBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  resetFilterBtnInactive: { backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e7e5e4' },
  resetFilterBtnActive: { backgroundColor: '#44403c', shadowColor: '#44403c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  desktopFilterPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  desktopFilterPillText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  mainContent: { paddingHorizontal: 16, paddingTop: 20 },
  cardGrid: { gap: 16 },
  cardWrapper: { width: '100%' },
  card: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4, marginBottom: 16 },
  cardImgContainer: { aspectRatio: 1.5, backgroundColor: '#d4d0cb', position: 'relative' },
  cardImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  badge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.95)' },
  cardBody: { padding: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: SKY },
  cardTitle: { fontSize: 18, fontWeight: '900', color: STONE, textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 22, marginBottom: 8 },
  cardDesc: { fontSize: 13, color: '#78716c', lineHeight: 20, marginBottom: 20 },
  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 16 },
  outlineBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e7e5e4', alignItems: 'center' },
  outlineBtnText: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#57534e' },
  primaryBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: SKY },
  primaryBtnText: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: 'white' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: STONE, marginBottom: 8 },
  emptySubtitle: { fontSize: 12, color: '#a8a29e', marginBottom: 24, textAlign: 'center' },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: SKY, borderRadius: 16 },
  emptyButtonText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: 'white' },
  loadMoreBtn: { alignSelf: 'center', marginTop: 24, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4' },
  loadMoreText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#78716c' },
  desktopQuizSection: { marginTop: 60, alignItems: 'center' },
  quizDivider: { width: 1, height: 40, backgroundColor: '#e7e5e4', marginBottom: 16 },
  quizSectionTag: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: SKY, marginBottom: 8 },
  quizSectionTitle: { fontSize: 34, fontWeight: '900', color: STONE, textTransform: 'uppercase', letterSpacing: -1, lineHeight: 36, textAlign: 'center' },
  quizSectionTitleItalic: { fontStyle: 'italic', fontWeight: '300', color: '#9f8270' },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawerContainer: { backgroundColor: '#f5f2ed', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 12, paddingBottom: 20, maxHeight: '92%' },
  drawerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#d4d0cb', alignSelf: 'center', marginBottom: 16 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16 },
  drawerTag: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: SKY, marginBottom: 4 },
  drawerTitle: { fontSize: 18, fontWeight: '900', color: '#44403c', textTransform: 'uppercase', letterSpacing: -0.5 },
  drawerTitleItalic: { fontStyle: 'italic', fontWeight: '300', color: '#9f8270' },
  drawerCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  drawerContent: { flex: 1, paddingHorizontal: 16 },
  fab: { position: 'absolute', left: '50%', transform: [{ translateX: -100 }], flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 30, backgroundColor: '#5aaadd', shadowColor: '#5aaadd', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  fabText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: 'white' },
});