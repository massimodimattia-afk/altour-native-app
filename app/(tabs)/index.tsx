// app/(tabs)/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  Linking, useWindowDimensions, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock, TrendingUp, Gift, Star, Send,
  Shield, Users, ArrowRight,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { CourseCard, Corso } from '../../components/CourseCard';
import ActivityDetailModal, { Activity } from '../../components/ActivityDetailModal';
import BookingModal from '../../components/BookingModal';

interface Escursione {
  id: string; created_at: string; data: string | null; titolo: string;
  descrizione: string | null; descrizione_estesa?: string | null; prezzo: number;
  difficolta?: string | null; immagine_url: string | null; gallery_urls?: string[] | null;
  durata?: string | null; attrezzatura_consigliata?: string | null; attrezzatura?: string | null;
  categoria?: string | null; filosofia?: string | null; lunghezza?: number | null;
  dislivello?: number | null; lat?: number | null; lng?: number | null;
  is_active: boolean; _tipo: 'escursione';
}
interface Campo {
  id: string; titolo: string; descrizione: string | null; immagine_url: string | null;
  prezzo?: number | null; durata?: string | null; slug?: string | null; _tipo: 'campo';
}
type FeaturedActivity = Escursione | Campo;
interface HomeProps {
  onBookingClick?: (title: string, mode?: 'info' | 'prenota') => void;
}

const SKY = '#0ea5e9';
const STONE = '#1c1917';

const FILOSOFIA_COLORS: Record<string, string> = {
  Avventura: '#e94544', Benessere: '#a5d9c9', 'Borghi più belli': '#946a52',
  Cammini: '#e3c45d', "Educazione all'aperto": '#01aa9f', Eventi: '#ffc0cb',
  Formazione: '#002f59', 'Immersi nel verde': '#358756', 'Luoghi dello spirito': '#c8a3c9',
  Novità: '#75c43c', Speciali: '#b8163c', 'Tra mare e cielo': '#7aaecd',
  'Trek urbano': '#f39452', 'Tracce sulla neve': '#a8cce0', 'Cielo stellato': '#1e2855',
};

function getFilosofiaOpacity(color: string) {
  const dark = ['#002f59', '#946a52', '#b8163c', '#358756', '#1e2855'];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  return (
    <View style={[s.badge, { backgroundColor: getFilosofiaOpacity(color), shadowColor: color }]}>
      <Text style={s.badgeText}>{value}</Text>
    </View>
  );
}

function stripMarkdown(text: string | null): string {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1').replace(/_(.*?)_/g, '$1');
}

const PRESET_VOUCHERS = [
  { amount: 20, tag: null, highlight: false },
  { amount: 60, tag: 'Top', highlight: true },
  { amount: 100, tag: null, highlight: false },
];

const SkeletonCard = () => (
  <View style={s.skeletonCard}>
    <View style={{ height: 160, backgroundColor: '#e7e5e4' }} />
    <View style={{ padding: 16, gap: 10 }}>
      <View style={{ width: 80, height: 8, backgroundColor: '#f5f5f4', borderRadius: 4 }} />
      <View style={{ width: '75%', height: 16, backgroundColor: '#e7e5e4', borderRadius: 4 }} />
    </View>
  </View>
);

export default function Home({ onBookingClick }: HomeProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isTablet = width >= 768;

  // Hero height: 55% su mobile, 65% su tablet — sempre above the fold
  const HERO_HEIGHT = height * (isTablet ? 0.65 : 0.55);

  const [featuredActivities, setFeaturedActivities] = useState<FeaturedActivity[]>([]);
  const [courses, setCourses] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingMode, setBookingMode] = useState<'info' | 'prenota'>('info');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: allHikes }, { data: allCampi }, { data: crs }] = await Promise.all([
          supabase.from('escursioni').select('*').eq('is_active', true).order('data', { ascending: true }),
          supabase.from('campi').select('id, titolo, descrizione, immagine_url, prezzo, durata, slug'),
          supabase.from('corsi').select('*').order('posizione', { ascending: true }),
        ]);
        const hikes = ((allHikes ?? []) as any[]).map(e => ({
          ...e, lat: e.lat ? Number(e.lat) : null, lng: e.lng ? Number(e.lng) : null,
          _tipo: 'escursione' as const,
        }));
        const campi = ((allCampi ?? []) as any[]).map(c => ({ ...c, _tipo: 'campo' as const }));
        const mixed = [...hikes, ...campi].sort(() => Math.random() - 0.5);
        setFeaturedActivities(mixed.slice(0, isTablet ? 3 : 2));
        if (crs) setCourses(crs as unknown as Corso[]);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    loadData();
  }, [isTablet]);

  const openDetails = useCallback((activity: Activity) => {
    setSelectedActivity(activity); setIsDetailOpen(true);
  }, []);

  const handleBooking = (title: string, mode?: 'info' | 'prenota') => {
    setBookingTitle(title); setBookingMode(mode || 'info'); setBookingModalOpen(true);
  };

  const nav = (page: string) => {
    const routes: Record<string, string> = {
      attivita: '/attivita', corsi: '/corsi', tessera: '/tessera', contatti: '/contatti',
    };
    if (routes[page]) router.push(routes[page] as any);
  };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ height: HERO_HEIGHT, backgroundColor: '#d4d0cb' }} />
        <View style={{ padding: 16, gap: 16 }}>
          <SkeletonCard /><SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── HERO: 55% schermo, contenuto centrato ── */}
        <View style={[s.hero, { height: HERO_HEIGHT }]}>
          <Image
            source={{ uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/intro-mobile.webp' }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          {/* Overlay leggero in alto, più denso solo in basso per leggibilità testo */}
          <View style={s.heroOverlayTop} />
          <View style={s.heroOverlayBottom} />

          {/* Testo centrato (logo + Italy + tagline) */}
          <View style={[s.heroCentered, { paddingTop: insets.top }]}>
            <Text style={s.heroLogo}>Altour</Text>
            <Text style={s.heroLogoSub}>Italy</Text>
            <Text style={s.heroTagline}>Formazione ed attività outdoor</Text>
          </View>
        </View>

        {/* ── STATS CARD: fuori dall'hero, primo contenuto visibile ── */}
        <View style={s.statsCard}>
          {[
            { v: '10 anni', l: 'Esperienza', I: TrendingUp },
            { v: 'AIGAE', l: 'Guide Cert.', I: Shield },
            { v: '800+', l: 'Tesserati', I: Users },
          ].map((stat, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={s.statsDivider} />}
              <View style={s.statsItem}>
                <stat.I size={18} color={SKY} />
                <Text style={s.statsValue}>{stat.v}</Text>
                <Text style={s.statsLabel}>{stat.l}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── ATTIVITÀ IN EVIDENZA ── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <View>
              <View style={s.sectionTagRow}>
                <View style={s.accent} />
                <Text style={[s.tag, { color: SKY }]}>Attività Outdoor</Text>
              </View>
              <Text style={s.heading}>
                Prossime{'\n'}<Text style={s.headingItalic}>Avventure.</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => nav('attivita')} style={s.seeAllBtn}>
              <Text style={s.seeAllTxt}>Vedi tutte</Text>
              <View style={s.seeAllCircle}>
                <ArrowRight size={14} color={SKY} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 16 }}>
            {featuredActivities.map(activity => {
              const isEsc = activity._tipo === 'escursione';
              return (
                <View key={activity.id} style={s.actCard}>
                  <View style={s.actImg}>
                    {activity.immagine_url && (
                      <Image source={{ uri: activity.immagine_url }}
                        style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    )}
                    <View style={s.actImgOverlay} />
                    <FilosofiaBadge value={isEsc ? (activity as Escursione).filosofia : (activity as Campo).slug} />
                  </View>
                  <View style={s.actBody}>
                    <View style={s.actMeta}>
                      <Clock size={11} color={SKY} />
                      <Text style={s.actMetaTxt}>
                        {activity.durata || (isEsc ? 'Giornata intera' : 'Campo')}
                      </Text>
                    </View>
                    <Text style={s.actTitle} numberOfLines={2}>{activity.titolo}</Text>
                    <Text style={s.actDesc} numberOfLines={2}>{stripMarkdown(activity.descrizione)}</Text>
                    <View style={s.actBtnRow}>
                      <TouchableOpacity onPress={() => openDetails(activity as Activity)} style={s.outlineBtn}>
                        <Text style={s.outlineBtnTxt}>Dettagli</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleBooking(activity.titolo, 'info')} style={s.fillBtn}>
                        <Text style={s.fillBtnTxt}>Richiedi Info</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── ACCADEMIA ── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <View>
              <View style={s.sectionTagRow}>
                <View style={s.accent} />
                <Text style={[s.tag, { color: SKY }]}>Accademia Altour</Text>
              </View>
              <Text style={s.heading}>
                Formazione{'\n'}<Text style={s.headingItalic}>Professionale.</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => nav('corsi')} style={s.seeAllBtn}>
              <Text style={s.seeAllTxt}>Vedi tutto</Text>
              <View style={s.seeAllCircle}>
                <ArrowRight size={14} color={SKY} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 16 }}>
            {courses.slice(0, isTablet ? 3 : 1).map(corso => (
              <CourseCard key={corso.id} corso={corso}
                onBookingClick={handleBooking} openDetails={openDetails} />
            ))}
          </View>
        </View>

        {/* ── VOUCHER ── */}
        <View style={[s.section, { paddingTop: 0 }]}>
          <View style={s.voucherCard}>
            <View style={s.voucherImgContainer}>
              <Image
                source={{ uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20241231_144800.webp' }}
                style={StyleSheet.absoluteFillObject} resizeMode="cover"
              />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(28,25,23,0.5)' }]} />
              <View style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Star size={13} color={SKY} fill={SKY} />
                  <Text style={{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: 'white' }}>
                    Gift Experience
                  </Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: 'white', textTransform: 'uppercase', fontStyle: 'italic', lineHeight: 24 }}>
                  {"Regala un'\navventura."}
                </Text>
              </View>
            </View>
            <View style={s.voucherBody}>
              <Text style={s.voucherDesc}>
                Un'emozione da regalare — utilizzabile per ogni esperienza Altour.
              </Text>
              <Text style={[s.tag, { color: '#a8a29e', marginBottom: 10 }]}>Scegli l'importo</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {PRESET_VOUCHERS.map(({ amount, tag, highlight }) => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => handleBooking(`Voucher Regalo da ${amount}€`)}
                    style={[s.voucherBtn, highlight
                      ? { backgroundColor: SKY, borderColor: SKY }
                      : { backgroundColor: '#fff', borderColor: '#e7e5e4' }]}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '900', color: highlight ? 'white' : STONE }}>
                      {amount}€
                    </Text>
                    {tag && (
                      <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2, color: highlight ? 'rgba(255,255,255,0.75)' : '#a8a29e' }}>
                        {tag}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => handleBooking('Richiesta Gift Voucher Personalizzato')} style={s.voucherCTA}>
                <Gift size={13} color="white" />
                <Text style={s.voucherCTATxt}>Importo personalizzato</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onBookingClick={handleBooking}
        />
      )}

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title={bookingTitle}
        mode={bookingMode}
      />

      {!isDetailOpen && (
        <TouchableOpacity
          onPress={() => Linking.openURL('https://wa.me/393281613762')}
          style={[s.fab, { bottom: insets.bottom + 16 }]}
        >
          <Send size={22} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ed' },

  // ── Hero compact ──
  hero: { width: '100%', backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  // Overlay split: leggero in alto (non nasconde la foto), denso solo nel terzo inferiore
  heroOverlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  heroOverlayBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroCentered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  heroLogo: {
    fontSize: Platform.select({ ios: 62, android: 55, default: 72 }),
    fontWeight: '900', color: 'white', textTransform: 'uppercase',
    letterSpacing: -2, lineHeight: Platform.select({ ios: 54, android: 48, default: 62 }),
    textAlign: 'center',
  },
  heroLogoSub: {
    fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.75)',
    letterSpacing: 8, textTransform: 'uppercase', marginTop: 2, textAlign: 'center',
  },
  heroTagline: {
    fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 12,
    textAlign: 'center',
  },

  // ── Stats card — primo contenuto visibile ──
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -70, // sovrappone leggermente l'hero per continuità visiva
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  statsItem: { flex: 1, alignItems: 'center', gap: 4 },
  statsDivider: { width: 1, backgroundColor: '#f0eeec', marginVertical: 4 },
  statsValue: { fontSize: 17, fontWeight: '900', color: STONE },
  statsLabel: { fontSize: 9, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },

  // ── Sezioni ──
  section: { paddingHorizontal: 16, paddingTop: 32, paddingBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
  sectionTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  accent: { width: 24, height: 3, borderRadius: 2, backgroundColor: SKY },
  tag: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2.5 },
  heading: { fontSize: 30, fontWeight: '900', color: STONE, textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 32, flex: 1 },
  headingItalic: { fontStyle: 'italic', fontWeight: '300', color: SKY, letterSpacing: 0 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  seeAllTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#a8a29e' },
  seeAllCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', alignItems: 'center', justifyContent: 'center' },

  // ── Activity card ──
  actCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f5f5f4', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  actImg: { height: 180, backgroundColor: '#d4d0cb' },
  actImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  actBody: { padding: 16 },
  actMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  actMetaTxt: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: SKY },
  actTitle: { fontSize: 16, fontWeight: '900', color: STONE, textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 20, marginBottom: 8 },
  actDesc: { fontSize: 13, color: '#78716c', lineHeight: 19, marginBottom: 16 },
  actBtnRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 14 },
  outlineBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 2, borderColor: '#e7e5e4', alignItems: 'center' },
  outlineBtnTxt: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#57534e' },
  fillBtn: { flex: 1.5, paddingVertical: 11, borderRadius: 10, alignItems: 'center', backgroundColor: SKY },
  fillBtnTxt: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: 'white' },

  // ── Badge filosofia ──
  badge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  badgeText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.95)' },

  // ── Voucher card ──
  voucherCard: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f5f5f4', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 5 },
  voucherImgContainer: { height: 160, backgroundColor: '#d4d0cb' },
  voucherBody: { padding: 20, backgroundColor: '#faf9f7' },
  voucherDesc: { fontSize: 13, color: '#78716c', lineHeight: 20, marginBottom: 14 },
  voucherBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 2 },
  voucherCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10, backgroundColor: STONE },
  voucherCTATxt: { color: 'white', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },

  // ── Skeleton ──
  skeletonCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f5f5f4' },

  // ── FAB WhatsApp ──
  fab: { position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8 },
});