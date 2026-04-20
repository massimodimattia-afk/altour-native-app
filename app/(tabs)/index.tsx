// app/(tabs)/index.tsx - VERSIONE CORRETTA (SENZA Section)
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  TrendingUp,
  Gift,
  Star,
  Send,
  Shield,
  Users,
  ArrowRight,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { CourseCard, Corso } from '../../components/CourseCard';
import ActivityDetailModal from '../../components/ActivityDetailModal';

// --- Tipi (invariati) ---
type Escursione = any;
interface Campo {
  id: string;
  titolo: string;
  descrizione: string | null;
  immagine_url: string | null;
  prezzo?: number | null;
  durata?: string | null;
  slug?: string | null;
  _tipo: 'campo';
}
type FeaturedActivity = Escursione | Campo;
interface HomeProps {
  onBookingClick?: (title: string, mode?: 'info' | 'prenota') => void;
}

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const SKY = '#0ea5e9';
const STONE = '#1c1917';

// --- Stili ---
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ed' },
  scrollContent: { paddingBottom: 40 },
  // Hero
  heroContainer: { height, backgroundColor: '#2a2a2a', justifyContent: 'flex-end' },
  heroImage: StyleSheet.absoluteFillObject,
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  heroContent: { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  heroTitle: { fontSize: 72, fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 72, textAlign: 'center' },
  heroSub: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 8, textTransform: 'uppercase', marginTop: 6 },
  heroTagline: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: 28, marginTop: 8 },
  heroBtnRow: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 360, marginBottom: 24 },
  heroBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)' },
  heroBtnTxt: { color: 'white', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 },
  statsBox: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 12, width: '100%', maxWidth: 400 },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: '900', color: 'white' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  // Sezioni
  section: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 20 },
  accent: { width: 28, height: 3, borderRadius: 2, backgroundColor: SKY },
  tag: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 },
  heading: { fontSize: 34, fontWeight: '900', color: STONE, textTransform: 'uppercase', letterSpacing: -1, lineHeight: 36, flex: 1 },
  headingItalic: { fontStyle: 'italic', fontWeight: '300', color: SKY, letterSpacing: 0 },
  seeAll: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#a8a29e' },
  seeAllCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#e7e5e4', alignItems: 'center', justifyContent: 'center' },
  // Card
  card: { backgroundColor: 'white', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: '#f5f5f4', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
  cardImg: { height: 200, backgroundColor: '#d4d0cb' },
  cardImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28,25,23,0.55)' },
  cardImgContent: { position: 'absolute', bottom: 20, left: 24, right: 24 },
  cardImgTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardImgTag: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: 'white' },
  cardImgTitle: { fontSize: 22, fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 26, fontStyle: 'italic' },
  cardBody: { padding: 24, backgroundColor: '#faf9f7' },
  cardDesc: { fontSize: 14, color: '#78716c', lineHeight: 22, marginBottom: 20 },
  voucherRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  voucherBtn: { flex: 1, minWidth: 80, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 2 },
  voucherBtnTxt: { fontSize: 16, fontWeight: '900' },
  voucherBtnTag: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, backgroundColor: STONE },
  primaryBtnTxt: { color: 'white', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  // Attività card
  actCard: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f5f5f4', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  actImg: { height: 200, backgroundColor: '#d4d0cb' },
  actImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  actBody: { padding: 20 },
  actMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  actMetaTxt: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: SKY },
  actTitle: { fontSize: 18, fontWeight: '900', color: STONE, textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 22, marginBottom: 10 },
  actDesc: { fontSize: 13, color: '#78716c', lineHeight: 20, marginBottom: 20 },
  actBtnRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 16 },
  outlineBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e7e5e4', alignItems: 'center' },
  outlineBtnTxt: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#57534e' },
  fillBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: SKY },
  fillBtnTxt: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: 'white' },
  // Badge
  badge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.95)' },
  // FAB
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  // Skeleton
  skeletonCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f5f5f4' },
});

// --- Utility functions ---
const FILOSOFIA_COLORS: Record<string, string> = {
  Avventura: '#e94544', Benessere: '#a5d9c9', 'Borghi più belli': '#946a52',
  Cammini: '#e3c45d', "Educazione all'aperto": '#01aa9f', Eventi: '#ffc0cb',
  Formazione: '#002f59', 'Immersi nel verde': '#358756', 'Luoghi dello spirito': '#c8a3c9',
  Novità: '#75c43c', Speciali: '#b8163c', 'Tra mare e cielo': '#7aaecd',
  'Trek urbano': '#f39452', 'Tracce sulla neve': '#a8cce0', 'Cielo stellato': '#1e2855',
};

function getFilosofiaOpacity(color: string): string {
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
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1');
}

const PRESET_VOUCHERS = [
  { amount: 10, tag: null, highlight: false }, { amount: 20, tag: null, highlight: false },
  { amount: 60, tag: 'Top', highlight: true }, { amount: 100, tag: null, highlight: false },
  { amount: 200, tag: 'Premium', highlight: false }, { amount: 300, tag: null, highlight: false },
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

// --- Componente Principale ---
export default function Home({ onBookingClick }: HomeProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [featuredActivities, setFeaturedActivities] = useState<FeaturedActivity[]>([]);
  const [courses, setCourses] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: allHikes }, { data: allCampi }, { data: crs }] = await Promise.all([
          supabase.from('escursioni').select('*').eq('is_active', true).order('data', { ascending: true }),
          supabase.from('campi').select('id, titolo, descrizione, immagine_url, prezzo, durata, slug'),
          supabase.from('corsi').select('*').order('posizione', { ascending: true }),
        ]);
        const hikes = ((allHikes ?? []) as any[]).map(e => ({ ...e, _tipo: 'escursione' as const }));
        const campi = ((allCampi ?? []) as any[]).map(c => ({ ...c, _tipo: 'campo' as const }));
        const mixed = [...hikes, ...campi].sort(() => Math.random() - 0.5);
        setFeaturedActivities(mixed.slice(0, isTablet ? 3 : 2));
        if (crs) setCourses(crs as unknown as Corso[]);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const openDetails = useCallback((activity: any) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  }, []);

  const handleBooking = (title: string, mode?: 'info' | 'prenota') => {
    if (onBookingClick) onBookingClick(title, mode);
    else Linking.openURL(`https://wa.me/393281613762?text=Info su ${title}`);
  };

  const nav = (page: string) => {
    if (page === 'attivita') router.push('/attivita');
    else if (page === 'corsi') router.push('/corsi');
  };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={{ height: height * 0.5, backgroundColor: '#d4d0cb' }} />
        <View style={{ padding: 16, gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* HERO */}
        <View style={s.heroContainer}>
          <Image
            source={{ uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458.webp' }}
            style={s.heroImage}
            resizeMode="cover"
          />
          <View style={s.heroOverlay} />
          <View style={[s.heroContent, { paddingBottom: insets.bottom + 48 }]}>
            <Text style={s.heroTitle}>Altour</Text>
            <Text style={s.heroSub}>Italy</Text>
            <Text style={s.heroTagline}>Formazione ed attività outdoor</Text>
            <View style={s.heroBtnRow}>
              <TouchableOpacity onPress={() => nav('attivita')} style={s.heroBtn}>
                <Text style={s.heroBtnTxt}>Esplora Attività</Text>
                <ArrowRight size={12} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nav('corsi')} style={s.heroBtn}>
                <Text style={s.heroBtnTxt}>Vai all'Accademia</Text>
                <ArrowRight size={12} color="white" />
              </TouchableOpacity>
            </View>
            <View style={s.statsBox}>
              {[
                { v: '10 anni', l: 'Esperienza', I: TrendingUp },
                { v: 'AIGAE', l: 'Guide', I: Shield },
                { v: '800+', l: 'Tesserati', I: Users },
              ].map((stat, i) => (
                <View key={i} style={s.statItem}>
                  <stat.I size={14} color={SKY} />
                  <Text style={s.statValue}>{stat.v}</Text>
                  <Text style={s.statLabel}>{stat.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ACCADEMIA */}
        <View style={s.section}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={s.accent} />
                <Text style={[s.tag, { color: SKY }]}>Accademia Altour</Text>
              </View>
              <Text style={s.heading}>
                Formazione{'\n'}
                <Text style={s.headingItalic}>Professionale.</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => nav('corsi')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 }}>
              <Text style={s.seeAll}>Vedi tutto</Text>
              <View style={s.seeAllCircle}>
                <ArrowRight size={16} color={SKY} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 20 }}>
            {courses.slice(0, isTablet ? 3 : 1).map(corso => (
              <View key={corso.id} style={!isTablet ? { width: '100%' } : { width: '31%' }}>
                <CourseCard corso={corso} onBookingClick={handleBooking} openDetails={openDetails} />
              </View>
            ))}
          </View>
        </View>

        {/* VOUCHER */}
        <View style={[s.section, { paddingTop: 0 }]}>
          <View style={s.card}>
            <View style={s.cardImg}>
              <Image
                source={{ uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20241231_144800.webp' }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              <View style={s.cardImgOverlay} />
              <View style={s.cardImgContent}>
                <View style={s.cardImgTagRow}>
                  <Star size={14} color={SKY} fill={SKY} />
                  <Text style={s.cardImgTag}>Gift Experience</Text>
                </View>
                <Text style={s.cardImgTitle}>{"Regala un'\navventura."}</Text>
              </View>
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardDesc}>
                Un'emozione da regalare a chi ami — utilizzabile per ogni tipo di esperienza Altour.
              </Text>
              <Text style={[s.tag, { color: '#a8a29e', marginBottom: 12 }]}>Scegli l'importo</Text>
              <View style={s.voucherRow}>
                {PRESET_VOUCHERS.map(({ amount, tag, highlight }) => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => handleBooking(`Voucher Regalo da ${amount}€`)}
                    style={[
                      s.voucherBtn,
                      highlight ? { backgroundColor: SKY, borderColor: SKY } : { backgroundColor: '#fff', borderColor: '#e7e5e4' },
                    ]}
                  >
                    <Text style={[s.voucherBtnTxt, { color: highlight ? 'white' : STONE }]}>{amount}€</Text>
                    {tag && (
                      <Text style={[s.voucherBtnTag, { color: highlight ? 'rgba(255,255,255,0.75)' : '#a8a29e' }]}>{tag}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e7e5e4' }} />
                <Text style={{ fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#d4d0cb' }}>oppure</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e7e5e4' }} />
              </View>
              <TouchableOpacity onPress={() => handleBooking('Richiesta Gift Voucher Personalizzato')} style={s.primaryBtn}>
                <Gift size={13} color="white" />
                <Text style={s.primaryBtnTxt}>Importo personalizzato</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ATTIVITÀ IN EVIDENZA */}
        <View style={s.section}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={s.accent} />
                <Text style={[s.tag, { color: SKY }]}>Attività Outdoor</Text>
              </View>
              <Text style={s.heading}>
                Prossime{'\n'}
                <Text style={s.headingItalic}>Avventure.</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => nav('attivita')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 }}>
              <Text style={s.seeAll}>Vedi tutte le attività</Text>
              <View style={s.seeAllCircle}>
                <ArrowRight size={16} color={SKY} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 20 }}>
            {featuredActivities.map(activity => {
              const isEsc = activity._tipo === 'escursione';
              return (
                <View key={activity.id} style={s.actCard}>
                  <View style={s.actImg}>
                    {activity.immagine_url && (
                      <Image source={{ uri: activity.immagine_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    )}
                    <View style={s.actImgOverlay} />
                    <FilosofiaBadge value={isEsc ? activity.filosofia : activity.slug} />
                  </View>
                  <View style={s.actBody}>
                    <View style={s.actMeta}>
                      <Clock size={12} color={SKY} />
                      <Text style={s.actMetaTxt}>{activity.durata || (isEsc ? 'Giornata intera' : 'Campo')}</Text>
                    </View>
                    <Text style={s.actTitle} numberOfLines={2}>{activity.titolo}</Text>
                    <Text style={s.actDesc} numberOfLines={3}>{stripMarkdown(activity.descrizione)}</Text>
                    <View style={s.actBtnRow}>
                      <TouchableOpacity onPress={() => openDetails(activity)} style={s.outlineBtn}>
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

        {/* TAILOR-MADE */}
        <View style={[s.section, { paddingTop: 0, paddingBottom: 48 }]}>
          <View style={s.card}>
            <View style={s.cardImg}>
              <Image
                source={{ uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Box_avventura.webp' }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              <View style={s.cardImgOverlay} />
              <View style={s.cardImgContent}>
                <View style={s.cardImgTagRow}>
                  <TrendingUp size={14} color={SKY} />
                  <Text style={s.cardImgTag}>Progetti Personalizzati</Text>
                </View>
                <Text style={s.cardImgTitle}>{'Su misura,\nper te.'}</Text>
              </View>
            </View>
            <View style={s.cardBody}>
              <Text style={[s.tag, { color: SKY, marginBottom: 8 }]}>Progetti Personalizzati</Text>
              <Text style={s.heading}>
                Avventura <Text style={s.headingItalic}>su misura.</Text>
              </Text>
              <Text style={[s.cardDesc, { marginTop: 8, marginBottom: 24 }]}>
                Hai un'idea specifica? Progettiamo tour privati e team building tracciando la rotta insieme a te.
              </Text>
              <TouchableOpacity onPress={() => handleBooking('Esperienza su Misura', 'info')} style={s.primaryBtn}>
                <Text style={s.primaryBtnTxt}>Contattaci</Text>
                <Send size={14} color="white" />
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