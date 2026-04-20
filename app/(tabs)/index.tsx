// app/(tabs)/index.tsx (o app/index.tsx a seconda della struttura)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
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
import Section, { isIOS } from '../../components/Section';
import { CourseCard, Corso } from '../../components/CourseCard';
import ActivityDetailModal from '../../components/ActivityDetailModal';

// --- Tipi (invariati) ---
type Escursione = any; // Sostituisci con il tipo corretto se hai generato i tipi Supabase
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
  // Le props originali non servono più: la navigazione è gestita da Expo Router
  // e onBookingClick può essere passata tramite contesto o gestita qui.
  onBookingClick?: (title: string, mode?: 'info' | 'prenota') => void;
}

// --- Costanti e utility (copiate dal web) ---
const IMG_FALLBACK = require('../../assets/altour-logo.png');
const { width } = Dimensions.get('window');

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
    <View
      className="absolute top-3 right-3 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: bg,
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <Text
        className="text-[9px] font-black uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.95)' }}
      >
        {value}
      </Text>
    </View>
  );
}

function formatMarkdown(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
}

const PRESET_VOUCHERS = [
  { amount: 10, tag: null, highlight: false },
  { amount: 20, tag: null, highlight: false },
  { amount: 60, tag: 'Top', highlight: true },
  { amount: 100, tag: null, highlight: false },
  { amount: 200, tag: 'Premium', highlight: false },
  { amount: 300, tag: null, highlight: false },
];

// Skeleton Card per il caricamento
const SkeletonCard = () => (
  <View className="bg-white rounded-2xl overflow-hidden border border-stone-100">
    <View className="aspect-[3/2] bg-stone-100" />
    <View className="p-4 gap-2.5">
      <View className="h-2 w-20 bg-stone-100 rounded" />
      <View className="h-4 w-3/4 bg-stone-200 rounded" />
      <View className="h-3 w-full bg-stone-50 rounded" />
      <View className="flex-row gap-2 mt-1">
        <View className="h-10 flex-1 bg-stone-100 rounded-xl" />
        <View className="h-10 flex-[1.5] bg-stone-100 rounded-xl" />
      </View>
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
  const [bgAnimDone, setBgAnimDone] = useState(false);

  // Determina se il dispositivo è un tablet (larghezza >= 768)
  const isTablet = width >= 768;
  const isMobile = !isTablet;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: allHikes }, { data: allCampi }, { data: crs }] = await Promise.all([
          supabase
            .from('escursioni')
            .select('*')
            .eq('is_active', true)
            .order('data', { ascending: true }),
          supabase
            .from('campi')
            .select('id, titolo, descrizione, immagine_url, prezzo, durata, slug'),
          supabase.from('corsi').select('*').order('posizione', { ascending: true }),
        ]);

        const hikes = ((allHikes ?? []) as any[]).map(e => ({
          ...e,
          _tipo: 'escursione' as const,
        }));
        const campi = ((allCampi ?? []) as any[]).map(c => ({
          ...c,
          _tipo: 'campo' as const,
        }));
        const mixed = [...hikes, ...campi].sort(() => Math.random() - 0.5);
        setFeaturedActivities(mixed.slice(0, isMobile ? 2 : 3));
        if (crs) setCourses(crs as unknown as Corso[]);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, [isMobile]);

  const openDetails = useCallback((activity: any) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  }, []);

  const handleBooking = (title: string, mode?: 'info' | 'prenota') => {
    if (onBookingClick) {
      onBookingClick(title, mode);
    } else {
      // Fallback: apri WhatsApp con messaggio precompilato
      Linking.openURL(`https://wa.me/393281613762?text=Info su ${title}`);
    }
  };

  const navigateTo = (page: string) => {
    switch (page) {
      case 'attivitapage':
        router.push('/attivita');
        break;
      case 'corsi':
        router.push('/corsi');
        break;
      default:
        router.push('/');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#f5f2ed]">
        <View className="h-[80vh] md:h-screen bg-stone-200" />
        <View className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <View className="flex-row flex-wrap gap-6 md:gap-8">
            {[1, 2, 3].map(n => (
              <View key={n} className="w-full md:w-1/2 lg:w-1/3">
                <SkeletonCard />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f5f2ed]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- HERO --- */}
        <Section animate={false} fullHeight as={View} className="items-center justify-center">
          {/* Sfondo animato */}
          <Animated.View
            className="absolute inset-0"
            entering={FadeIn.duration(1800).withInitialValues({ transform: [{ scale: 1.08 }] })}
            onLayout={() => setBgAnimDone(true)}
          >
            <Image
              source={{
                uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458.webp',
              }}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
            />
          </Animated.View>

          <View className="absolute inset-0 bg-black/30" />
          <View className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f5f2ed]" />

          <View className="relative z-10 px-4 items-center">
            <Animated.View entering={FadeInDown.delay(500).duration(650)} className="mb-3">
              <Text className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none text-center">
                Altour
              </Text>
              <Text className="text-sm md:text-xl font-bold uppercase tracking-[0.4em] text-white/75 mt-2 text-center">
                Italy
              </Text>
            </Animated.View>

            <Animated.Text
              entering={FadeInUp.delay(700).duration(600)}
              className="text-white/65 text-sm md:text-base font-medium text-center mb-8"
            >
              Formazione ed attività outdoor
            </Animated.Text>

            <Animated.View
              entering={FadeInUp.delay(900).duration(600)}
              className="flex-col sm:flex-row gap-3 w-full max-w-sm mb-10 md:mb-12"
            >
              <TouchableOpacity
                onPress={() => navigateTo('attivitapage')}
                className="flex-1 flex-row items-center justify-center gap-2 bg-white/12 py-4 px-5 rounded-2xl border border-white/25"
              >
                <Text className="text-white font-black uppercase text-[10px] tracking-widest">
                  Esplora Attività
                </Text>
                <ArrowRight size={12} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateTo('corsi')}
                className="flex-1 flex-row items-center justify-center gap-2 bg-white/12 py-4 px-5 rounded-2xl border border-white/25"
              >
                <Text className="text-white font-black uppercase text-[10px] tracking-widest">
                  Vai all'Accademia
                </Text>
                <ArrowRight size={12} color="white" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(1100).duration(600)}
              className="bg-white/15 py-4 px-4 md:px-8 rounded-[1.5rem] md:rounded-full border border-white/20 w-full max-w-md"
            >
              <View className="flex-row justify-around">
                {[
                  { value: '10 anni', label: 'Esperienza', icon: <TrendingUp size={13} color="#0ea5e9" /> },
                  { value: 'AIGAE', label: 'Guide', icon: <Shield size={13} color="#0ea5e9" /> },
                  { value: '800+', label: 'Tesserati', icon: <Users size={13} color="#0ea5e9" /> },
                ].map((stat, i) => (
                  <View key={i} className="items-center">
                    <View className="md:hidden mb-1">{stat.icon}</View>
                    <Text className="text-sm md:text-xl font-black text-white">{stat.value}</Text>
                    <Text className="text-[9px] uppercase tracking-wider text-white/50 font-bold mt-1">
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        </Section>

        {/* --- ACCADEMIA --- */}
        <Section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <View className="flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <View>
              <View className="flex-row items-center gap-3 mb-4">
                <View className="h-1 w-8 bg-brand-sky rounded-full" />
                <Text className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">
                  Accademia Altour
                </Text>
              </View>
              <Text className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
                Formazione{'\n'}
                <Text className="text-brand-sky italic font-light tracking-normal">
                  Professionale.
                </Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigateTo('corsi')}
              className="flex-row items-center gap-3"
            >
              <Text className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                Vedi tutto
              </Text>
              <View className="w-10 h-10 rounded-full border border-stone-200 items-center justify-center">
                <ArrowRight size={16} color="#0ea5e9" />
              </View>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-8">
            {courses.slice(0, 3).map((corso, index) => (
              <View
                key={corso.id}
                className={`${index > 0 ? 'hidden md:block' : 'block'} w-full md:w-1/2 lg:w-1/3`}
              >
                <CourseCard
                  corso={corso}
                  onBookingClick={handleBooking}
                  openDetails={openDetails}
                />
              </View>
            ))}
          </View>
        </Section>

        {/* --- VOUCHER --- */}
        <Section className="max-w-4xl mx-auto px-4 py-12 md:py-20" delay={0.05}>
          <View className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50 shadow-2xl">
            <View className="flex-col md:flex-row min-h-[360px]">
              <View className="w-full md:w-2/5 h-48 md:h-auto relative">
                <Image
                  source={{
                    uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20241231_144800.webp',
                  }}
                  className="absolute inset-0 w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
                <View className="absolute bottom-6 left-8 z-10">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Star size={14} color="#0ea5e9" fill="#0ea5e9" />
                    <Text className="text-[9px] font-black uppercase tracking-[0.3em] text-white">
                      Gift Experience
                    </Text>
                  </View>
                  <Text className="text-2xl font-black uppercase leading-none tracking-tighter italic text-white">
                    Regala un'{'\n'}avventura.
                  </Text>
                </View>
              </View>
              <View className="w-full md:w-3/5 p-8 md:p-14 justify-center bg-[#faf9f7]">
                <Text className="text-stone-500 text-sm font-medium leading-relaxed mb-6">
                  Un'emozione da regalare a chi ami — utilizzabile per ogni tipo di esperienza
                  Altour.
                </Text>
                <Text className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">
                  Scegli l'importo
                </Text>
                <View className="flex-row flex-wrap gap-2.5 mb-5">
                  {PRESET_VOUCHERS.map(({ amount, tag, highlight }) => (
                    <TouchableOpacity
                      key={amount}
                      onPress={() => handleBooking(`Voucher Regalo da ${amount}€`)}
                      className={`flex-1 min-w-[90px] items-center justify-center py-4 rounded-xl border-2 ${
                        highlight
                          ? 'border-brand-sky bg-brand-sky'
                          : 'border-stone-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-base font-black ${
                          highlight ? 'text-white' : 'text-brand-stone'
                        }`}
                      >
                        {amount}€
                      </Text>
                      {tag && (
                        <Text
                          className={`text-[7px] font-black uppercase tracking-wider mt-1 ${
                            highlight ? 'text-white/75' : 'text-stone-400'
                          }`}
                        >
                          {tag}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row items-center gap-3 mb-4">
                  <View className="flex-1 h-px bg-stone-200" />
                  <Text className="text-[8px] font-black uppercase tracking-widest text-stone-300">
                    oppure
                  </Text>
                  <View className="flex-1 h-px bg-stone-200" />
                </View>
                <TouchableOpacity
                  onPress={() => handleBooking('Richiesta Gift Voucher Personalizzato')}
                  className="w-full bg-brand-stone py-4 rounded-xl flex-row items-center justify-center gap-2"
                >
                  <Gift size={12} color="white" />
                  <Text className="text-white font-black uppercase text-[9px] tracking-widest">
                    Importo personalizzato
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Section>

        {/* --- ATTIVITÀ IN EVIDENZA --- */}
        <Section className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <View className="flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <View>
              <View className="flex-row items-center gap-3 mb-4">
                <View className="h-1 w-8 bg-brand-sky rounded-full" />
                <Text className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">
                  Attività Outdoor
                </Text>
              </View>
              <Text className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
                Prossime{'\n'}
                <Text className="text-brand-sky italic font-light tracking-normal">
                  Avventure.
                </Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigateTo('attivitapage')}
              className="flex-row items-center gap-3"
            >
              <Text className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                Vedi tutte le attività
              </Text>
              <View className="w-10 h-10 rounded-full border border-stone-200 items-center justify-center">
                <ArrowRight size={16} color="#0ea5e9" />
              </View>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-8">
            {featuredActivities.map(activity => {
              const isEscursione = activity._tipo === 'escursione';
              return (
                <View key={activity.id} className="w-full md:w-1/2 lg:w-1/3">
                  <View className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex-1">
                    <View className="aspect-[16/9] md:h-56 bg-stone-200 relative">
                      {activity.immagine_url && (
                        <Image
                          source={{ uri: activity.immagine_url }}
                          className="absolute inset-0 w-full h-full"
                          resizeMode="cover"
                        />
                      )}
                      <View className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      {isEscursione && (
                        <FilosofiaBadge value={(activity as Escursione).filosofia} />
                      )}
                      {!isEscursione && (activity as Campo).slug && (
                        <FilosofiaBadge value={(activity as Campo).slug} />
                      )}
                    </View>
                    <View className="p-5 md:p-7 flex-1">
                      <View className="flex-row items-center gap-3 mb-3">
                        {isEscursione ? (
                          <>
                            <View className="w-1 h-1 rounded-full bg-stone-200" />
                            <View className="flex-row items-center gap-1.5">
                              <Clock size={12} color="#0ea5e9" />
                              <Text className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                                {activity.durata || 'Giornata intera'}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <View className="flex-row items-center gap-1.5">
                            <Clock size={12} color="#0ea5e9" />
                            <Text className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                              {activity.durata || 'Campo'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-lg md:text-xl font-black text-brand-stone uppercase leading-tight mb-3">
                        {activity.titolo}
                      </Text>
                      <Text className="text-stone-500 text-xs md:text-sm mb-6 flex-1" numberOfLines={3}>
                        {formatMarkdown(activity.descrizione).replace(/<[^>]*>/g, '')}
                      </Text>
                      <View className="flex-row gap-3 pt-5 border-t border-stone-100">
                        <TouchableOpacity
                          onPress={() => openDetails(activity)}
                          className="flex-1 py-3 rounded-xl border-2 border-stone-200 items-center"
                        >
                          <Text className="font-black uppercase text-[9px] tracking-widest text-stone-600">
                            Dettagli
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleBooking(activity.titolo, 'info')}
                          className="flex-[1.5] py-3 rounded-xl bg-brand-sky items-center"
                        >
                          <Text className="font-black uppercase text-[9px] tracking-widest text-white">
                            Richiedi Info
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Section>

        {/* --- TAILOR-MADE --- */}
        <Section className="max-w-4xl mx-auto px-4 py-8" delay={0.05}>
          <View className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50 shadow-2xl">
            <View className="flex-col md:flex-row min-h-[280px]">
              <View className="w-full md:w-2/5 h-48 md:h-auto relative">
                <Image
                  source={{
                    uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Box_avventura.webp',
                  }}
                  className="absolute inset-0 w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
                <View className="absolute bottom-6 left-8 z-10">
                  <View className="flex-row items-center gap-2 mb-2">
                    <TrendingUp size={14} color="#0ea5e9" />
                    <Text className="text-[9px] font-black uppercase tracking-[0.3em] text-white">
                      Progetti Personalizzati
                    </Text>
                  </View>
                  <Text className="text-2xl font-black uppercase leading-none tracking-tighter italic text-white">
                    Su misura,{'\n'}per te.
                  </Text>
                </View>
              </View>
              <View className="w-full md:w-3/5 p-10 md:p-14 justify-center bg-[#faf9f7]">
                <Text className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-3">
                  Progetti Personalizzati
                </Text>
                <Text className="text-2xl md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-3">
                  Avventura{' '}
                  <Text className="text-brand-sky italic font-light tracking-normal">
                    su misura.
                  </Text>
                </Text>
                <Text className="text-stone-500 text-sm font-medium leading-relaxed mb-8">
                  Hai un'idea specifica? Progettiamo tour privati e team building tracciando la
                  rotta insieme a te.
                </Text>
                <TouchableOpacity
                  onPress={() => handleBooking('Esperienza su Misura', 'info')}
                  className="w-full md:w-auto bg-brand-stone px-8 py-4 rounded-xl flex-row items-center justify-center gap-3"
                >
                  <Text className="text-white font-black uppercase text-[10px] tracking-widest">
                    Contattaci
                  </Text>
                  <Send size={14} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Section>
      </ScrollView>

      {/* --- Modale Dettaglio --- */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onBookingClick={handleBooking}
        />
      )}

     {/* --- WhatsApp FAB --- */}
<Animated.View
  entering={FadeIn.delay(600).springify()}
  className={`absolute bottom-6 right-6 z-50 ${isDetailOpen ? 'opacity-0' : 'opacity-100'}`}
>
  <TouchableOpacity
    onPress={() => Linking.openURL('https://wa.me/393281613762')}
    className="w-14 h-14 rounded-full items-center justify-center overflow-hidden"
    style={{
      backgroundColor: '#25D366',
      shadowColor: '#25D366',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    }}
  >
    <Image
      source={require('../../assets/whatsapp-icon.webp')}
      className="w-8 h-8"
      resizeMode="contain"
    />
  </TouchableOpacity>
</Animated.View>
    </View>
  );
}