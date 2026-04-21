// app/(tabs)/tessera.tsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator, Dimensions, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import {
  Loader2, ShieldCheck, LogOut, Plus, ChevronRight, ChevronLeft,
  Gift, User, Award, Trophy, X, Calendar, MapPin, CheckCircle2,
  Mountain, Footprints, Camera, TrendingUp, Star, Send, Users, ArrowRight,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

// --- Costanti ---
const SESSION_KEY = 'altour_session_v4';
const PIN_LENGTH = 6;
const SLOTS_PER_PAGE = 8;
const BADGE_THRESHOLD = 5;
const MAX_REDEEM_ATTEMPTS = 5;
const REDEEM_CODE_REGEX = /^[A-Z0-9]{4,12}$/;

const FILOSOFIA_COLORS: Record<string, string> = {
  Avventura: '#e94544', Benessere: '#a5d9c9', 'Borghi più belli': '#946a52',
  Cammini: '#e3c45d', "Educazione all'aperto": '#01aa9f', Eventi: '#ffc0cb',
  Formazione: '#002f59', 'Immersi nel verde': '#358756', 'Luoghi dello spirito': '#c8a3c9',
  Novità: '#75c43c', Speciali: '#b8163c', 'Tra mare e cielo': '#7aaecd',
  'Trek urbano': '#f39452', 'Tracce sulla neve': '#a8cce0', 'Cielo stellato': '#1e2855',
};

const BADGE_NAMES: Record<string, string> = {
  Avventura: 'Avventuriero', Benessere: 'Spirito Libero', 'Borghi più belli': 'Custode dei Borghi',
  Cammini: 'Pellegrino', "Educazione all'aperto": 'Maestro del Bosco', Eventi: 'Anima della Festa',
  Formazione: 'Sapiente', 'Immersi nel verde': 'Guardiano del Verde', 'Luoghi dello spirito': 'Cercatore di Luce',
  Novità: 'Esploratore', Speciali: 'Leggenda', 'Tra mare e cielo': 'Navigatore',
  'Trek urbano': 'Flaneur', 'Tracce sulla neve': 'Segugio della Neve', 'Cielo stellato': 'Astronomo',
};

const BADGE_EMOJI: Record<string, string> = {
  Avventura: '⛰', Benessere: '🌿', 'Borghi più belli': '🏘', Cammini: '👣',
  "Educazione all'aperto": '🌱', Eventi: '✨', Formazione: '📖', 'Immersi nel verde': '🌲',
  'Luoghi dello spirito': '🕊', Novità: '🔭', Speciali: '🌟', 'Tra mare e cielo': '🌊',
  'Trek urbano': '🏙', 'Tracce sulla neve': '❄️', 'Cielo stellato': '🌠',
};

const TESSERA_LEVELS = [
  "Amante di attività all'aperto", 'Elfo dei prati', 'Collezionista di muschio',
  'Principe della mappa', 'Guardiano delle nuvole', 'Mago della bussola',
  'Spirito dei boschi', 'Collezionista di scarponi', 'Asceta dei monti',
  "Re dell'altimetro", 'Saltatore di tronchi', 'Amico delle querce',
  'Menestrello dei bastoncini', 'Duca degli scalatori', 'Custode del verde',
  'Specialista dei sentieri', 'Gnomo delle pigne', 'Spiritello degli stagni',
  'Appassionato naturalista', 'Leggenda vivente',
];

type TabType = 'TESSERA' | 'BADGE' | 'TRAGUARDI';
type RedeemStep = 'INPUT' | 'SUCCESS';

interface EscursioneCompletata {
  titolo: string; colore: string; data: string; categoria?: string; difficolta?: string;
}
interface UserTessera {
  id: string; codice_tessera: string; nome_escursionista: string; cognome_escursionista: string;
  pin: string; avatar_url?: string; escursioni_completate: EscursioneCompletata[] | string;
  livello?: string; badges_filosofia?: string[] | string; km_totali?: number; dislivello_totali?: number;
}

// --- Utilities ---
const HEX_TO_FILOSOFIA: Record<string, string> = Object.fromEntries(
  Object.entries(FILOSOFIA_COLORS).map(([k, v]) => [v, k])
);
function getFilosofiaName(hex: string): string { return HEX_TO_FILOSOFIA[hex] ?? ''; }
function getFilosofiaColor(name: string | null): string {
  return name ? FILOSOFIA_COLORS[name] || '#5aaadd' : '#5aaadd';
}

function parseJsonArray<T>(data: T[] | string | null | undefined): T[] {
  if (typeof data === 'string') {
    try { return JSON.parse(data) as T[]; } catch { return []; }
  } else if (Array.isArray(data)) { return data; }
  return [];
}

function computeEarnedBadges(escursioni: EscursioneCompletata[]): string[] {
  const counts: Record<string, number> = {};
  for (const e of escursioni) {
    const filo = getFilosofiaName(e.colore);
    if (filo) counts[filo] = (counts[filo] || 0) + 1;
  }
  return Object.entries(counts).filter(([, n]) => n >= BADGE_THRESHOLD).map(([f]) => f);
}

function getSeason(date: Date): string {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

const ACHIEVEMENT_BADGES = [
  { id: 'streak_tour', name: 'Lupo dei Cammini', emoji: '🐺', description: '3 tour completati', color: '#e94544', check: (e: EscursioneCompletata[]) => e.filter(x => x.categoria === 'tour').length >= 3, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(e.filter(x => x.categoria === 'tour').length, 3), total: 3 }) },
  { id: 'assiduo', name: 'Assiduo', emoji: '🎯', description: '8 giornate completate', color: '#01aa9f', check: (e: EscursioneCompletata[]) => e.filter(x => x.categoria === 'giornata').length >= 8, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(e.filter(x => x.categoria === 'giornata').length, 8), total: 8 }) },
  { id: 'collezionista', name: 'Collezionista', emoji: '💎', description: '5 filosofie diverse', color: '#946a52', check: (e: EscursioneCompletata[]) => new Set(e.map(x => getFilosofiaName(x.colore)).filter(Boolean)).size >= 5, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(new Set(e.map(x => getFilosofiaName(x.colore)).filter(Boolean)).size, 5), total: 5 }) },
  { id: 'stagionale', name: 'Anima delle Stagioni', emoji: '🍂', description: 'Tutte e 4 le stagioni', color: '#75c43c', check: (e: EscursioneCompletata[]) => new Set(e.map(x => getSeason(new Date(x.data)))).size >= 4, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(new Set(e.map(x => getSeason(new Date(x.data)))).size, 4), total: 4 }) },
  { id: 'esploratore_verticale', name: 'Esploratore Verticale', emoji: '⚡', description: 'Facile → Media → Impegnativa', color: '#002f59', check: (e: EscursioneCompletata[]) => { const d = e.map(x => x.difficolta || ''); return d.some(x => x === 'Facile') && d.some(x => x.includes('Media')) && d.some(x => x.includes('Impegnativa')); }, progress: (e: EscursioneCompletata[]) => { const d = e.map(x => x.difficolta || ''); let n = 0; if (d.some(x => x === 'Facile')) n++; if (d.some(x => x.includes('Media'))) n++; if (d.some(x => x.includes('Impegnativa'))) n++; return { current: n, total: 3 }; } },
];

const { width } = Dimensions.get('window');

// Icona scarpone (con immagine PNG)
function IconaScarpone({ size = 24, color = '#d6d3d1', isActive = false }: { size?: number; color?: string; isActive?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={require('../../assets/scarpone.png')}
        style={{
          width: size,
          height: size,
          tintColor: isActive ? color : '#d6d3d1',
          opacity: isActive ? 1 : 0.15,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

// --- BadgeChip ---
function BadgeChip({ filo, isUnlocked, count, onPress }: { filo: string; isUnlocked: boolean; count: number; onPress?: () => void }) {
  const color = FILOSOFIA_COLORS[filo] ?? '#44403c';
  const emoji = BADGE_EMOJI[filo] ?? '★';
  const name = BADGE_NAMES[filo] ?? filo;
  const pct = Math.min((count / BADGE_THRESHOLD) * 100, 100);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={s.badgeChipContainer}>
        <View style={s.badgeChipWrapper}>
          {isUnlocked && <View style={[s.badgeChipGlow, { backgroundColor: color, opacity: 0.3 }]} />}
          <View style={[s.badgeChipCard, isUnlocked ? { backgroundColor: color, shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 } : { backgroundColor: '#f7f6f4', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 }]}>
            <Text style={[s.badgeChipEmoji, { opacity: isUnlocked ? 1 : 0.22, fontSize: isUnlocked ? 26 : 22 }]}>{emoji}</Text>
            {!isUnlocked && (
              <View style={s.badgeChipProgressBar}>
                <View style={[s.badgeChipProgressFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
            )}
          </View>
          {isUnlocked && <View style={[s.badgeChipCheckmark, { borderColor: color }]}><CheckCircle2 size={10} color={color} /></View>}
          {!isUnlocked && count > 0 && (
            <View style={[s.badgeChipCounter, { borderColor: color + '40' }]}>
              <Text style={[s.badgeChipCounterText, { color }]}>{count}/{BADGE_THRESHOLD}</Text>
            </View>
          )}
        </View>
        <Text style={[s.badgeChipName, { color: isUnlocked ? color : '#c4c2c0' }]}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
}

// --- BadgeDetailPopup ---
function BadgeDetailPopup({ visible, filo, isUnlocked, count, onClose }: { visible: boolean; filo: string; isUnlocked: boolean; count: number; onClose: () => void }) {
  const color = FILOSOFIA_COLORS[filo] ?? '#44403c';
  const emoji = BADGE_EMOJI[filo] ?? '★';
  const name = BADGE_NAMES[filo] ?? filo;
  const pct = Math.min((count / BADGE_THRESHOLD) * 100, 100);
  const remaining = BADGE_THRESHOLD - count;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.popupContainer}>
          <TouchableOpacity onPress={onClose} style={s.popupCloseBtn}><X size={16} color="#78716c" /></TouchableOpacity>
          <View style={[s.popupHeader, { backgroundColor: isUnlocked ? color : '#f0eeec' }]}>
            <Text style={[s.popupEmoji, { opacity: isUnlocked ? 1 : 0.3 }]}>{emoji}</Text>
          </View>
          <View style={s.popupBody}>
            <Text style={[s.popupStatus, { color: isUnlocked ? color : '#c4c2c0' }]}>{isUnlocked ? 'Badge Sbloccato ✓' : 'Badge Bloccato'}</Text>
            <Text style={s.popupTitle}>{name}</Text>
            <Text style={s.popupSubtitle}>{filo}</Text>
            {isUnlocked ? (
              <View style={[s.popupBadgeInfo, { backgroundColor: color + '15' }]}>
                <Award size={12} color={color} />
                <Text style={[s.popupBadgeInfoText, { color }]}>{BADGE_THRESHOLD} escursioni completate</Text>
              </View>
            ) : (
              <View style={s.popupProgressContainer}>
                <View style={s.popupProgressHeader}>
                  <Text style={s.popupProgressLabel}>Avanzamento</Text>
                  <Text style={[s.popupProgressValue, { color }]}>{count}/{BADGE_THRESHOLD}</Text>
                </View>
                <View style={s.popupProgressBar}>
                  <View style={[s.popupProgressFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
                <Text style={s.popupRemaining}>Ancora {remaining} {remaining === 1 ? 'escursione' : 'escursioni'}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- PinInput ---
function PinInput({ value, onChange, onComplete, length = 6, disabled }: { value: string; onChange: (v: string) => void; onComplete?: () => void; length?: number; disabled?: boolean }) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const handleChange = (index: number, text: string) => {
    if (disabled) return;
    const digit = text.replace(/\D/g, '').slice(-1);
    if (digit) {
      const newPin = value.split(''); newPin[index] = digit; const newPinStr = newPin.join('');
      onChange(newPinStr);
      if (index + 1 < length) inputRefs.current[index + 1]?.focus();
      if (index === length - 1 && newPinStr.length === length) setTimeout(() => onComplete?.(), 100);
    }
  };
  const handleKeyPress = (index: number, key: string) => {
    if (disabled) return;
    if (key === 'Backspace') {
      if (value[index]) { const p = value.split(''); p[index] = ''; onChange(p.join('')); }
      else if (index > 0) { const p = value.split(''); p[index - 1] = ''; onChange(p.join('')); inputRefs.current[index - 1]?.focus(); }
    }
  };
  const firstRowCount = 3, secondRowCount = 3;
  return (
    <View style={s.pinContainer}>
      <View style={s.pinRow}>
        {Array.from({ length: firstRowCount }).map((_, i) => (
          <TextInput key={i} ref={el => { inputRefs.current[i] = el; }} style={[s.pinInput, focusedIndex === i && { borderColor: '#0ea5e9' }]} keyboardType="number-pad" maxLength={1} value={value[i] || ''} onChangeText={t => handleChange(i, t)} onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)} onFocus={() => setFocusedIndex(i)} onBlur={() => setFocusedIndex(null)} editable={!disabled} secureTextEntry />
        ))}
      </View>
      <View style={s.pinRow}>
        {Array.from({ length: secondRowCount }).map((_, i) => {
          const idx = firstRowCount + i;
          return (
            <TextInput key={idx} ref={el => { inputRefs.current[idx] = el; }} style={[s.pinInput, focusedIndex === idx && { borderColor: '#0ea5e9' }]} keyboardType="number-pad" maxLength={1} value={value[idx] || ''} onChangeText={t => handleChange(idx, t)} onKeyPress={({ nativeEvent }) => handleKeyPress(idx, nativeEvent.key)} onFocus={() => setFocusedIndex(idx)} onBlur={() => setFocusedIndex(null)} editable={!disabled} secureTextEntry />
          );
        })}
      </View>
    </View>
  );
}

// --- Componente principale ---
export default function Tessera() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userTessera, setUserTessera] = useState<UserTessera | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('TESSERA');
  const [currentPage, setCurrentPage] = useState(0);
  const [loginCode, setLoginCode] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginStep, setLoginStep] = useState<'code' | 'pin'>('code');
  const [loginError, setLoginError] = useState('');
  const [pendingTessera, setPendingTessera] = useState<UserTessera | null>(null);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<RedeemStep>('INPUT');
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [redeemAttempts, setRedeemAttempts] = useState(0);
  const [pendingActivity, setPendingActivity] = useState<{ titolo: string; filosofia?: string | null; categoria?: string; difficolta?: string } | null>(null);
  const [chosenColor, setChosenColor] = useState<string | null>(null);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<string | null>(null);
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<string | null>(null);
  const [selectedBoot, setSelectedBoot] = useState<EscursioneCompletata | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{ filo: string; isUnlocked: boolean; count: number } | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const escursioniCompletateParsed = useMemo(() => parseJsonArray<EscursioneCompletata>(userTessera?.escursioni_completate), [userTessera?.escursioni_completate]);
  const badgesFilosofiaParsed = useMemo(() => parseJsonArray<string>(userTessera?.badges_filosofia), [userTessera?.badges_filosofia]);

  const stats = useMemo(() => {
    if (!userTessera) return null;
    const count = escursioniCompletateParsed.length || 0;
    const levelIdx = Math.min(Math.floor((count - 1) / 8), TESSERA_LEVELS.length - 1);
    return { currentLevelLabel: count > 0 ? TESSERA_LEVELS[levelIdx] : TESSERA_LEVELS[0], totalPages: Math.max(1, Math.ceil(count / SLOTS_PER_PAGE)), vouchersCount: Math.floor(count / 8), kmTotali: userTessera.km_totali || 0, dislivelloTotali: userTessera.dislivello_totali || 0 };
  }, [userTessera, escursioniCompletateParsed]);

  const earnedBadges = useMemo(() => userTessera ? computeEarnedBadges(escursioniCompletateParsed) : [], [userTessera, escursioniCompletateParsed]);
  const badgeCounts = useMemo(() => { const counts: Record<string, number> = {}; escursioniCompletateParsed.forEach(e => { const f = getFilosofiaName(e.colore); if (f) counts[f] = (counts[f] || 0) + 1; }); return counts; }, [escursioniCompletateParsed]);

  useEffect(() => { const loadSession = async () => { const saved = await AsyncStorage.getItem(SESSION_KEY); if (saved) { const { code } = JSON.parse(saved); await fetchUser(code, true); } else setLoading(false); }; loadSession(); }, []);

  async function fetchUser(codice: string, isSession = false) {
    setLoading(true); setLoginError('');
    const { data, error } = await supabase.from('tessere').select('*, km_totali, dislivello_totali').eq('codice_tessera', codice.toUpperCase().trim()).single();
    if (error || !data) { if (!isSession) setLoginError('Codice tessera non trovato.'); setLoading(false); }
    else { if (isSession) { setUserTessera(data as UserTessera); setLoading(false); } else { setPendingTessera(data as UserTessera); setLoginStep('pin'); setLoading(false); } }
  }

  async function completeLogin(tessera: UserTessera) {
    const { data } = await supabase.from('tessere').select('*').eq('codice_tessera', tessera.codice_tessera).single();
    const clean = (data ?? tessera) as UserTessera; setUserTessera(clean);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ code: clean.codice_tessera, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  }

  async function handleVerifyPin() {
    if (!pendingTessera) return;
    const dbPin = pendingTessera.pin != null ? String(pendingTessera.pin).trim().replace(/\D/g, '') : '';
    const enteredPin = loginPin.trim().replace(/\D/g, '');
    if (enteredPin.length !== PIN_LENGTH) { setLoginError(`Inserisci ${PIN_LENGTH} cifre.`); return; }
    if (enteredPin === dbPin) await completeLogin(pendingTessera); else { setLoginError('PIN errato. Riprova.'); setLoginPin(''); }
  }

  const handleLogout = async () => { await AsyncStorage.removeItem(SESSION_KEY); setUserTessera(null); setLoginStep('code'); setLoginCode(''); setLoginPin(''); };

  const pickAndUploadAvatar = async () => {
    if (!userTessera) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permesso negato', 'Serve l\'accesso alla galleria per caricare un avatar.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setAvatarUploading(true);
      try {
        const manipResult = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 400, height: 400 } }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
        const response = await fetch(manipResult.uri); const blob = await response.blob();
        const reader = new FileReader();
        const base64 = await new Promise<string>(resolve => { reader.onloadend = () => resolve(reader.result as string); reader.readAsDataURL(blob); });
        const base64Data = base64.split(',')[1]; const arrayBuffer = decode(base64Data);
        const path = `avatars/${userTessera.id}.jpg`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, arrayBuffer, { upsert: true, contentType: 'image/jpeg' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        const freshUrl = `${pub.publicUrl}?t=${Date.now()}`;
        const { error: dbErr } = await supabase.from('tessere').update({ avatar_url: freshUrl } as any).eq('id', userTessera.id);
        if (dbErr) throw dbErr;
        setUserTessera(prev => prev ? { ...prev, avatar_url: freshUrl } : prev);
      } catch (err) { console.error('Errore upload avatar:', err); Alert.alert('Errore', 'Impossibile caricare l\'avatar'); }
      finally { setAvatarUploading(false); }
    }
  };

  const closeRedeem = useCallback(() => { if (isVerifying) return; setShowRedeem(false); setRedeemCode(''); setRedeemStep('INPUT'); setRedeemError(''); setPendingActivity(null); setChosenColor(null); setNewlyUnlockedBadge(null); setNewlyUnlockedAchievement(null); setRedeemAttempts(0); }, [isVerifying]);

  const verifyCode = async () => {
    if (!redeemCode.trim() || !userTessera) return;
    if (redeemAttempts >= MAX_REDEEM_ATTEMPTS) { setRedeemError('Troppi tentativi.'); return; }
    const normalized = redeemCode.toUpperCase().trim();
    if (!REDEEM_CODE_REGEX.test(normalized)) { setRedeemError('Formato non valido.'); return; }
    setIsVerifying(true); setRedeemError(''); setRedeemAttempts(n => n + 1);
    const { data, error } = await supabase.from('escursioni').select('id, titolo, filosofia, categoria, difficolta, codici_usati').contains('codici_riscatto', [normalized]).single();
    if (error || !data) { setRedeemError('Codice non valido.'); setIsVerifying(false); return; }
    const escursioneData = data as any;
    if ((escursioneData.codici_usati as string[] | null)?.includes(normalized)) { setRedeemError('Codice già usato.'); setIsVerifying(false); return; }
    if (escursioniCompletateParsed.some(e => e.titolo === escursioneData.titolo)) { setRedeemError('Già riscattato.'); setIsVerifying(false); return; }
    const color = getFilosofiaColor(escursioneData.filosofia);
    const newEntry: EscursioneCompletata = { titolo: escursioneData.titolo, colore: color, data: new Date().toISOString(), ...(escursioneData.categoria ? { categoria: escursioneData.categoria } : {}), ...(escursioneData.difficolta ? { difficolta: escursioneData.difficolta } : {}) };
    const updatedList = [...escursioniCompletateParsed, newEntry];
    const oldBadges = computeEarnedBadges(escursioniCompletateParsed); const newBadges = computeEarnedBadges(updatedList);
    const justUnlocked = newBadges.find(b => !oldBadges.includes(b)) ?? null;
    const oldAchievements = ACHIEVEMENT_BADGES.filter(ab => ab.check(escursioniCompletateParsed)).map(ab => ab.id);
    const newAchievements = ACHIEVEMENT_BADGES.filter(ab => ab.check(updatedList)).map(ab => ab.id);
    const justUnlockedAchievement = newAchievements.find(id => !oldAchievements.includes(id)) ?? null;
    const updatePayload: any = { escursioni_completate: updatedList };
    if (justUnlocked) updatePayload.badges_filosofia = [...badgesFilosofiaParsed, justUnlocked];
    const { data: saved, error: saveErr } = await supabase.from('tessere').update(updatePayload).eq('id', userTessera.id).select();
    if (saveErr || !saved) { setRedeemError('Errore salvataggio.'); setIsVerifying(false); return; }
    setUserTessera(saved[0] as UserTessera);
    setPendingActivity({ titolo: escursioneData.titolo, filosofia: escursioneData.filosofia ?? null, categoria: escursioneData.categoria ?? undefined, difficolta: escursioneData.difficolta ?? undefined });
    setChosenColor(color); setNewlyUnlockedBadge(justUnlocked); setNewlyUnlockedAchievement(justUnlockedAchievement);
    setRedeemStep('SUCCESS'); setIsVerifying(false);
  };

  if (loading) return <View style={s.loadingContainer}><ActivityIndicator size="large" color="#0ea5e9" /></View>;

  return (
    <View style={s.container}>
      {!userTessera ? (
        <View style={[s.loginContainer, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ChevronLeft size={14} color="#44403c" /><Text style={s.backBtnText}>Home</Text></TouchableOpacity>
          <View style={s.loginCard}>
            <Image source={require('../../assets/Accesso_tessera.png')} style={s.loginLogo} resizeMode="contain" />
            <Text style={s.loginTitle}>TESSERA ALTOUR</Text>
            {loginStep === 'code' ? (
              <>
                <TextInput placeholder="ALTXXX" value={loginCode} onChangeText={setLoginCode} autoCapitalize="characters" style={s.loginInput} />
                <TouchableOpacity onPress={() => fetchUser(loginCode)} style={s.loginBtn}><Text style={s.loginBtnText}>Avanti</Text></TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.pinLabel}>Inserisci il tuo PIN a {PIN_LENGTH} cifre</Text>
                <PinInput value={loginPin} onChange={setLoginPin} onComplete={handleVerifyPin} length={PIN_LENGTH} disabled={isVerifying} />
                <TouchableOpacity onPress={handleVerifyPin} disabled={isVerifying || loginPin.length !== PIN_LENGTH} style={[s.loginBtn, { marginTop: 24 }]}>
                  {isVerifying ? <ActivityIndicator color="white" /> : <Text style={s.loginBtnText}>Accedi</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setLoginStep('code'); setLoginPin(''); setLoginError(''); }} style={{ marginTop: 16 }}><Text style={s.backLink}>Indietro</Text></TouchableOpacity>
              </>
            )}
            {loginError ? <Text style={s.loginError}>{loginError}</Text> : null}
          </View>
        </View>
      ) : (
        <>
          <View style={s.heroContainer}>
            <Image source={{ uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Trentino_neve.webp' }} style={s.heroImage} />
            <View style={s.heroOverlay} />
            <TouchableOpacity onPress={handleLogout} style={[s.logoutBtn, { top: insets.top + 8 }]}><LogOut size={18} color="white" /></TouchableOpacity>
            <View style={[s.heroContent, { paddingBottom: insets.bottom + 48 }]}>
              <Text style={s.heroTitle}>Passaporto Altour</Text>
              <Text style={s.heroName}>{userTessera.nome_escursionista} {userTessera.cognome_escursionista}</Text>
              <Text style={s.heroCode}>Cod. {userTessera.codice_tessera}</Text>
              <View style={s.heroBadge}>
                <IconaScarpone size={50} color="#5aaadd" isActive />
                <View style={s.heroBadgeText}>
                  <Text style={s.heroBadgeLabel}>Profilo Escursionista</Text>
                  <Text style={s.heroBadgeLevel}>{userTessera.livello || stats?.currentLevelLabel}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={s.tabBar}>
            {(['TESSERA', 'BADGE', 'TRAGUARDI'] as TabType[]).map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.tab, activeTab === tab && s.tabActive]}>
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView contentContainerStyle={s.contentContainer}>
            {activeTab === 'TESSERA' && (
              <View style={s.tabContent}>
                <View style={s.profileCard}>
                  <View style={s.profileRow}>
                    <TouchableOpacity onPress={pickAndUploadAvatar} disabled={avatarUploading}>
                      <View style={s.avatarContainer}>
                        {userTessera.avatar_url ? <Image source={{ uri: userTessera.avatar_url }} style={s.avatar} /> : <View style={s.avatarPlaceholder}><User size={32} color="#a8a29e" /></View>}
                        {avatarUploading && <View style={s.avatarUploading}><ActivityIndicator color="white" /></View>}
                        <View style={s.avatarCameraIcon}><Camera size={13} color="#57534e" /></View>
                      </View>
                    </TouchableOpacity>
                    <View style={s.profileInfo}>
                      <View style={s.verifiedBadge}><ShieldCheck size={14} color="#0ea5e9" /><Text style={s.verifiedText}>Escursionista Verificato</Text></View>
                      <Text style={s.profileName}>{userTessera.nome_escursionista} {userTessera.cognome_escursionista}</Text>
                      <Text style={s.profileLevel}>{userTessera.livello || stats?.currentLevelLabel} · {escursioniCompletateParsed.length || 0} Scarponi</Text>
                    </View>
                  </View>
                  <View style={s.statsRow}>
                    <View style={[s.statBox, { backgroundColor: '#f0f9ff' }]}><Footprints size={32} color="#0ea5e9" /><Text style={s.statLabel}>Km Totali</Text><Text style={s.statValue}>{stats?.kmTotali} km</Text></View>
                    <View style={[s.statBox, { backgroundColor: '#ecfdf5' }]}><Mountain size={32} color="#10b981" /><Text style={s.statLabel}>Dislivello Totale</Text><Text style={s.statValue}>{stats?.dislivelloTotali} m</Text></View>
                  </View>
                  <View style={s.bootsGrid}>
                    {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => { const idx = currentPage * SLOTS_PER_PAGE + i; const esc = escursioniCompletateParsed?.[idx]; return <TouchableOpacity key={i} onPress={() => esc && setSelectedBoot(esc)} style={[s.bootSlot, esc ? s.bootSlotFilled : s.bootSlotEmpty]} disabled={!esc}><IconaScarpone size={width < 768 ? 48 : 64} color={esc?.colore} isActive={!!esc} /></TouchableOpacity>; })}
                  </View>
                  <View style={s.pagination}>
                    <TouchableOpacity disabled={currentPage === 0} onPress={() => setCurrentPage(p => p - 1)} style={[s.pageBtn, currentPage === 0 && s.pageBtnDisabled]}><ChevronLeft size={20} color={currentPage === 0 ? '#d6d3d1' : '#44403c'} /></TouchableOpacity>
                    <Text style={s.pageIndicator}>Pagina {currentPage + 1} di {stats?.totalPages}</Text>
                    <TouchableOpacity disabled={currentPage >= (stats?.totalPages || 1) - 1} onPress={() => setCurrentPage(p => p + 1)} style={[s.pageBtn, currentPage >= (stats?.totalPages || 1) - 1 && s.pageBtnDisabled]}><ChevronRight size={20} color={currentPage >= (stats?.totalPages || 1) - 1 ? '#d6d3d1' : '#44403c'} /></TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowRedeem(true)} style={s.redeemBtn}><Plus size={24} color="white" /><Text style={s.redeemBtnText}>Riscatta Scarpone</Text></TouchableOpacity>
                {stats && stats.vouchersCount > 0 && (
                  <View style={s.voucherBanner}><Gift size={26} color="#d97706" /><View style={s.voucherTextContainer}><Text style={s.voucherTitle}>VOUCHER SBLOCCATI 🎉</Text><Text style={s.voucherSubtitle}>{stats.vouchersCount} Voucher da 10 € maturati</Text></View></View>
                )}
              </View>
            )}
            {activeTab === 'BADGE' && (
              <View style={s.badgeGrid}>
                {Object.keys(BADGE_NAMES).map(filo => <BadgeChip key={filo} filo={filo} isUnlocked={earnedBadges.includes(filo)} count={badgeCounts[filo] || 0} onPress={() => setSelectedBadge({ filo, isUnlocked: earnedBadges.includes(filo), count: badgeCounts[filo] || 0 })} />)}
              </View>
            )}
            {activeTab === 'TRAGUARDI' && (
              <View style={s.achievementsContainer}>
                {ACHIEVEMENT_BADGES.map(badge => { const isUnlocked = badge.check(escursioniCompletateParsed); const prog = badge.progress(escursioniCompletateParsed); return <TouchableOpacity key={badge.id} onPress={() => setSelectedAchievement(badge)} style={[s.achievementCard, isUnlocked && s.achievementCardUnlocked]}><Text style={s.achievementEmoji}>{badge.emoji}</Text><View style={s.achievementInfo}><Text style={s.achievementName}>{badge.name}</Text><Text style={s.achievementDesc}>{badge.description}</Text></View><View style={s.achievementProgress}><Text style={s.achievementProgressText}>{prog.current}/{prog.total}</Text><View style={s.achievementProgressBar}><View style={[s.achievementProgressFill, { width: `${(prog.current / prog.total) * 100}%` }]} /></View></View></TouchableOpacity>; })}
              </View>
            )}
          </ScrollView>
          <Modal visible={showRedeem} transparent animationType="fade" onRequestClose={closeRedeem}>
            <View style={s.modalOverlay}>
              <View style={s.redeemModal}>
                <TouchableOpacity onPress={closeRedeem} style={s.modalCloseBtn}><X size={20} color="#44403c" /></TouchableOpacity>
                {redeemStep === 'INPUT' ? (
                  <>
                    <Text style={s.redeemTitle}>Codice Scarpone</Text>
                    <TextInput placeholder="****" value={redeemCode} onChangeText={setRedeemCode} style={s.redeemInput} autoCapitalize="characters" />
                    {redeemError ? <Text style={s.redeemError}>{redeemError}</Text> : null}
                    <TouchableOpacity onPress={verifyCode} disabled={isVerifying} style={s.redeemSubmitBtn}>{isVerifying ? <ActivityIndicator color="white" /> : <Text style={s.redeemSubmitText}>Verifica Codice</Text>}</TouchableOpacity>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={48} color="#10b981" />
                    <Text style={s.successTitle}>Codice riscattato!</Text>
                    <Text style={s.successActivity}>{pendingActivity?.titolo}</Text>
                    {newlyUnlockedBadge && <View style={[s.unlockedBadge, { backgroundColor: FILOSOFIA_COLORS[newlyUnlockedBadge] + '15' }]}><Text>{BADGE_EMOJI[newlyUnlockedBadge]}</Text><Text>Nuovo Badge: {BADGE_NAMES[newlyUnlockedBadge]}</Text></View>}
                    <TouchableOpacity onPress={closeRedeem} style={s.successBtn}><Text style={s.successBtnText}>Perfetto!</Text></TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
          <Modal visible={!!selectedBoot} transparent animationType="fade" onRequestClose={() => setSelectedBoot(null)}>
            <View style={s.modalOverlay}>
              <View style={s.bootModal}>
                <TouchableOpacity onPress={() => setSelectedBoot(null)} style={s.modalCloseBtn}><X size={20} color="#44403c" /></TouchableOpacity>
                {selectedBoot && <><IconaScarpone size={80} color={selectedBoot.colore} isActive /><Text style={s.bootModalTitle}>{selectedBoot.titolo}</Text><Text style={s.bootModalDate}>{new Date(selectedBoot.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</Text></>}
              </View>
            </View>
          </Modal>
          {selectedBadge && <BadgeDetailPopup visible={!!selectedBadge} {...selectedBadge} onClose={() => setSelectedBadge(null)} />}
          {selectedAchievement && (
            <Modal visible={!!selectedAchievement} transparent onRequestClose={() => setSelectedAchievement(null)}>
              <View style={s.modalOverlay}>
                <View style={s.achievementModal}>
                  <TouchableOpacity onPress={() => setSelectedAchievement(null)} style={s.modalCloseBtn}><X size={20} color="#44403c" /></TouchableOpacity>
                  <Text style={s.achievementModalEmoji}>{selectedAchievement.emoji}</Text>
                  <Text style={s.achievementModalName}>{selectedAchievement.name}</Text>
                  <Text style={s.achievementModalDesc}>{selectedAchievement.description}</Text>
                  {(() => { const prog = selectedAchievement.progress(escursioniCompletateParsed); return <View style={s.achievementModalProgress}><Text>{prog.current}/{prog.total}</Text><View style={s.achievementModalBar}><View style={{ width: `${(prog.current / prog.total) * 100}%`, height: 4, backgroundColor: '#0ea5e9', borderRadius: 2 }} /></View></View>; })()}
                </View>
              </View>
            </Modal>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ed' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f2ed' },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f5f2ed' },
  backBtn: { position: 'absolute', top: 48, left: 20, flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20 },
  backBtnText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginLeft: 4, color: '#44403c' },
  loginCard: { width: '100%', maxWidth: 400, backgroundColor: 'white', borderRadius: 40, padding: 32, alignItems: 'center' },
  loginLogo: { height: 128, width: 'auto', marginBottom: 24, borderRadius: 12 },
  loginTitle: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase', marginBottom: 24 },
  loginInput: { width: '100%', padding: 16, backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 16, textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginBottom: 16 },
  loginBtn: { width: '100%', padding: 16, backgroundColor: '#292524', borderRadius: 16 },
  loginBtnText: { color: 'white', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 2 },
  pinLabel: { fontSize: 12, fontWeight: 'bold', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 24 },
  backLink: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#d6d3d1' },
  loginError: { marginTop: 16, color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  heroContainer: { height: 250, justifyContent: 'flex-end' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  logoutBtn: { position: 'absolute', right: 16, padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, zIndex: 10 },
  heroContent: { paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: -1, textAlign: 'center' },
  heroName: { fontSize: 20, fontWeight: '900', color: 'white', textTransform: 'uppercase', marginTop: 4 },
  heroCode: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 4, textTransform: 'uppercase', marginTop: 8, marginBottom: 16 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroBadgeText: { alignItems: 'flex-start' },
  heroBadgeLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: 'rgba(255,255,255,0.6)' },
  heroBadgeLevel: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', color: 'white' },
  tabBar: { flexDirection: 'row', backgroundColor: '#f5f2ed', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  tabActive: { backgroundColor: '#5aaadd' },
  tabText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#a8a29e' },
  tabTextActive: { color: 'white' },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  tabContent: { paddingTop: 20 },
  profileCard: { backgroundColor: 'white', borderRadius: 32, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4, marginBottom: 24 },
  profileRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 28 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 28, backgroundColor: '#f5f5f4', justifyContent: 'center', alignItems: 'center' },
  avatarUploading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarCameraIcon: { position: 'absolute', bottom: -4, right: -4, backgroundColor: 'white', borderRadius: 15, padding: 4, borderWidth: 1, borderColor: '#e7e5e4' },
  profileInfo: { flex: 1, justifyContent: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  verifiedText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: '#0ea5e9' },
  profileName: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', color: '#1c1917' },
  profileLevel: { fontSize: 11, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 20 },
  statLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#a8a29e', marginTop: 8 },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  bootsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  bootSlot: { width: '22%', aspectRatio: 1, marginBottom: 12, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bootSlotFilled: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  bootSlotEmpty: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#e7e5e4', borderStyle: 'dashed', opacity: 0.6 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  pageBtn: { padding: 8, backgroundColor: '#f5f5f4', borderRadius: 20 },
  pageBtnDisabled: { opacity: 0.3 },
  pageIndicator: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#a8a29e' },
  redeemBtn: { backgroundColor: '#0ea5e9', borderRadius: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  redeemBtnText: { color: 'white', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 },
  voucherBanner: { marginTop: 20, backgroundColor: '#fef3c7', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  voucherTextContainer: { flex: 1 },
  voucherTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: '#92400e' },
  voucherSubtitle: { fontSize: 16, fontWeight: '900', color: '#78350f', marginTop: 4 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', paddingVertical: 20 },
  achievementsContainer: { gap: 12, paddingVertical: 8 },
  achievementCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f5f5f4' },
  achievementCardUnlocked: { backgroundColor: '#fafafa', borderColor: '#e7e5e4' },
  achievementEmoji: { fontSize: 36, marginRight: 12 },
  achievementInfo: { flex: 1 },
  achievementName: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
  achievementDesc: { fontSize: 10, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 1 },
  achievementProgress: { alignItems: 'flex-end' },
  achievementProgressText: { fontSize: 11, fontWeight: '900', color: '#a8a29e' },
  achievementProgressBar: { width: 48, height: 4, backgroundColor: '#e7e5e4', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  achievementProgressFill: { height: 4, backgroundColor: '#0ea5e9', borderRadius: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  redeemModal: { backgroundColor: 'white', borderRadius: 32, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  redeemTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', marginBottom: 20 },
  redeemInput: { backgroundColor: '#f5f5f4', borderRadius: 16, padding: 16, fontSize: 20, fontWeight: 'bold', textAlign: 'center', width: '100%', marginBottom: 16 },
  redeemError: { color: '#ef4444', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 12 },
  redeemSubmitBtn: { backgroundColor: '#1c1917', borderRadius: 16, paddingVertical: 16, width: '100%', alignItems: 'center' },
  redeemSubmitText: { color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  successTitle: { fontSize: 18, fontWeight: '900', marginTop: 12 },
  successActivity: { fontSize: 14, color: '#78716c', marginTop: 4, textAlign: 'center' },
  unlockedBadge: { marginTop: 16, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  successBtn: { backgroundColor: '#1c1917', borderRadius: 16, paddingVertical: 16, width: '100%', alignItems: 'center', marginTop: 24 },
  successBtnText: { color: 'white', fontWeight: '900', textTransform: 'uppercase' },
  bootModal: { backgroundColor: 'white', borderRadius: 32, padding: 32, width: '100%', maxWidth: 340, alignItems: 'center' },
  bootModalTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', marginTop: 16, textAlign: 'center' },
  bootModalDate: { fontSize: 12, color: '#a8a29e', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  achievementModal: { backgroundColor: 'white', borderRadius: 32, padding: 32, width: '100%', maxWidth: 340, alignItems: 'center' },
  achievementModalEmoji: { fontSize: 56, marginBottom: 12 },
  achievementModalName: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' },
  achievementModalDesc: { fontSize: 12, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, textAlign: 'center' },
  achievementModalProgress: { width: '100%', marginTop: 20, alignItems: 'center' },
  achievementModalBar: { width: '100%', height: 4, backgroundColor: '#e7e5e4', borderRadius: 2, marginTop: 8 },
  badgeChipContainer: { alignItems: 'center' },
  badgeChipWrapper: { position: 'relative', marginBottom: 4 },
  badgeChipGlow: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 22 },
  badgeChipCard: { width: 66, height: 70, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badgeChipEmoji: { lineHeight: 28 },
  badgeChipProgressBar: { width: 38, height: 3, borderRadius: 1.5, backgroundColor: '#e0ddd8', marginTop: 2 },
  badgeChipProgressFill: { height: 3, borderRadius: 1.5 },
  badgeChipCheckmark: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  badgeChipCounter: { position: 'absolute', bottom: -6, alignSelf: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: 'white', borderWidth: 1.5 },
  badgeChipCounterText: { fontSize: 8, fontWeight: '900' },
  badgeChipName: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', maxWidth: 70 },
  popupContainer: { width: '100%', maxWidth: 320, backgroundColor: 'white', borderRadius: 40, overflow: 'hidden' },
  popupCloseBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20 },
  popupHeader: { height: 140, alignItems: 'center', justifyContent: 'center' },
  popupEmoji: { fontSize: 56 },
  popupBody: { padding: 24, alignItems: 'center' },
  popupStatus: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  popupTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', color: '#292524', marginBottom: 2 },
  popupSubtitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#a8a29e', letterSpacing: 1 },
  popupBadgeInfo: { marginTop: 20, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  popupBadgeInfoText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  popupProgressContainer: { marginTop: 20, width: '100%' },
  popupProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  popupProgressLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#a8a29e' },
  popupProgressValue: { fontSize: 10, fontWeight: '900' },
  popupProgressBar: { height: 8, backgroundColor: '#e7e5e4', borderRadius: 4, overflow: 'hidden' },
  popupProgressFill: { height: 8, borderRadius: 4 },
  popupRemaining: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', color: '#a8a29e', marginTop: 8 },
  pinContainer: { alignItems: 'center', gap: 16 },
  pinRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  pinInput: { width: 48, height: 48, textAlign: 'center', fontSize: 24, fontWeight: '900', backgroundColor: '#f5f5f4', borderWidth: 2, borderColor: '#e7e5e4', borderRadius: 12, color: '#292524' },
});