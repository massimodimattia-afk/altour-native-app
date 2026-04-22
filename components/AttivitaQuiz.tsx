import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated as RNAnimated,
  SafeAreaView,
} from 'react-native';
import { ArrowRight, RotateCcw, Sparkles, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import ActivityDetailModal from './ActivityDetailModal';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- COSTANTI E TIPI ---
type Escursione = any;

interface Item {
  id: string;
  emoji: string;
  label: string;
  zone: 'left' | 'bottom' | 'right';
  zoneRow?: number;
  hint: string;
  hintTag: string;
}

const ITEMS: Item[] = [
  { id: 'map', emoji: '🗺️', label: 'Cartina', zone: 'left', zoneRow: 1, hint: 'Ami conoscere la meta prima di partire. Cerchi percorsi culturali o naturalistici con un obiettivo preciso.', hintTag: 'Scoperta del territorio' },
  { id: 'boots', emoji: '🥾', label: 'Scarponi', zone: 'left', zoneRow: 2, hint: 'Esci regolarmente e cerchi esperienze di qualità. Il giusto equilibrio tra impegno e soddisfazione.', hintTag: 'Escursionismo regolare' },
  { id: 'poles', emoji: '🥢', label: 'Bastoncini', zone: 'left', zoneRow: 3, hint: 'Preferisci percorsi impegnativi con dislivelli importanti. Esci spesso e ami le sfide fisiche.', hintTag: 'Alta difficoltà' },
  { id: 'compass', emoji: '🧭', label: 'Bussola', zone: 'bottom', hint: 'Ti piace esplorare da solo in luoghi poco battuti. Cerchi pace e orientamento autonomo.', hintTag: 'Luoghi remoti' },
  { id: 'water', emoji: '🧴', label: 'Borraccia', zone: 'bottom', hint: 'Preferisci uscite brevi e accessibili a tutti. Ideale per escursioni in famiglia o senza troppe pretese fisiche.', hintTag: 'Mezza giornata' },
  { id: 'medkit', emoji: '🩹', label: 'Kit soccorso', zone: 'bottom', hint: 'Sei prudente e previdente. Ti avvicini alla montagna con calma, magari per la prima volta o in coppia.', hintTag: 'Approccio cauto' },
  { id: 'jacket', emoji: '🧥', label: 'Giacca', zone: 'right', zoneRow: 1, hint: 'Punti in alto — vette, creste, paesaggi panoramici. Non ti spaventa la fatica né il freddo.', hintTag: 'Alta quota' },
  { id: 'torch', emoji: '🔦', label: 'Frontale', zone: 'right', zoneRow: 2, hint: 'Cerchi avventure lunghe, magari multi-giorno. Ti piace l\'isolamento e la tranquillità della notte.', hintTag: 'Avventura prolungata' },
  { id: 'gps', emoji: '📡', label: 'GPS', zone: 'right', zoneRow: 3, hint: 'Esplori zone selvagge con il gruppo o in autonomia. La tecnologia è la tua sicurezza fuori rotta.', hintTag: 'Fuori dai sentieri' },
];

const ITEM_SIGNALS: Record<string, Record<string, string>> = {
  map: { cerca: 'Conoscere la meta', luogo: 'Bosco', tempo: 'Intera giornata' },
  boots: { sforzo: 'Medio', frequenza: 'Ogni mese', cerca: 'Tempo di qualità' },
  poles: { sforzo: 'Intenso', frequenza: 'Ogni settimana', luogo: 'Panoramico' },
  compass: { compagnia: 'Solo', cerca: 'Pace e serenità', luogo: 'Poco frequentato' },
  water: { tempo: 'Mezza giornata', sforzo: 'Basso', compagnia: 'Famiglia' },
  medkit: { frequenza: '1/3 volte l\'anno', sforzo: 'Basso', compagnia: 'Coppia' },
  jacket: { luogo: 'Panoramico', sforzo: 'Intenso', cerca: 'Tempo di qualità' },
  torch: { tempo: 'Una settimana', luogo: 'Poco frequentato', cerca: 'Pace e serenità' },
  gps: { luogo: 'Poco frequentato', sforzo: 'Intenso', compagnia: 'Gruppo di amici' },
};

const ITEM_WEIGHT: Record<string, number> = {
  poles: 2, jacket: 2, gps: 2, torch: 2,
  boots: 1, compass: 1,
  map: 0, water: 0, medkit: 0,
};

const FILOSOFIA_QUIZ_MAP: Record<string, Record<string, string>> = {
  Avventura: { cerca: 'Tempo di qualità', sforzo: 'Intenso', frequenza: 'Ogni settimana' },
  Benessere: { cerca: 'Pace e serenità', sforzo: 'Basso', compagnia: 'Coppia' },
  'Borghi più belli': { luogo: 'Bosco', tempo: 'Intera giornata', cerca: 'Conoscere la meta' },
  Cammini: { luogo: 'Bosco', tempo: 'Più giorni', cerca: 'Pace e serenità' },
  'Educazione all\'aperto': { frequenza: 'Mai', compagnia: 'Famiglia' },
  Eventi: { compagnia: 'Gruppo di amici', tempo: 'Intera giornata' },
  Formazione: { frequenza: 'Mai', tempo: 'Più giorni', cerca: 'Conoscere la meta' },
  'Immersi nel verde': { luogo: 'Bosco', cerca: 'Pace e serenità' },
  'Luoghi dello spirito': { cerca: 'Pace e serenità', compagnia: 'Solo' },
  Novità: { cerca: 'Tempo di qualità', compagnia: 'Gruppo di amici', tempo: 'Intera giornata' },
  Speciali: { cerca: 'Tempo di qualità', compagnia: 'Gruppo di amici' },
  'Tra mare e cielo': { luogo: 'Presenza di acqua', cerca: 'Conoscere la meta' },
  'Trek urbano': { tempo: 'Mezza giornata', sforzo: 'Basso' },
  'Tracce sulla neve': { luogo: 'Panoramico', sforzo: 'Intenso', tempo: 'Intera giornata' },
  'Cielo stellato': { cerca: 'Pace e serenità', tempo: 'Una settimana', compagnia: 'Solo' },
};

const PROFILI = {
  base: { titolo: 'L\'Esploratore Curioso', sottotitolo: 'Pronto a iniziare', descrizione: 'Cerchi esperienze dolci e rigeneranti, perfette per muovere i primi passi in natura con curiosità.', icona: '🌱', colore: '#81ccb0' },
  intermedio: { titolo: 'Il Camminatore Consapevole', sottotitolo: 'Esperienza in crescita', descrizione: 'Hai già familiarità con l\'outdoor. Sei pronto per avventure più strutturate e percorsi con un po\' di sfida.', icona: '⛰️', colore: '#5aaadd' },
  avanzato: { titolo: 'L\'Avventuriero Esperto', sottotitolo: 'Pronto a osare', descrizione: 'Cerchi esperienze intense e immersive, percorsi impegnativi e atmosfere selvagge lontano dalla folla.', icona: '🏔️', colore: '#9f8270' },
} as const;

// --- SOTTO-COMPONENTI ---

function BackpackSVG({ glowing }: { glowing: boolean; itemCount: number }) {
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    if (glowing) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(scaleAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          RNAnimated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [glowing]);

  return (
    <RNAnimated.View style={[styles.backpackWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Image source={require('../assets/zaino.png')} style={styles.backpackImage} resizeMode="contain" />
    </RNAnimated.View>
  );
}

function ItemCard({ item, isIn, isDisabled, onAdd, onRemove }: any) {
  const [popupVisible, setPopupVisible] = useState(false);
  const handlePress = () => {
    if (isDisabled) return;
    if (isIn) onRemove();
    else setPopupVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.itemCard, isIn && styles.itemCardSelected, isDisabled && styles.itemCardDisabled]}
        onPress={handlePress}
        disabled={isDisabled}
      >
        <Text style={[styles.itemEmoji, isIn && styles.itemEmojiSelected]}>{item.emoji}</Text>
        {isIn && (
          <View style={styles.itemCheckmark}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Modal visible={popupVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupContainer}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupEmoji}>{item.emoji}</Text>
              <View style={[styles.popupTag, { backgroundColor: '#81ccb020' }]}>
                <Text style={[styles.popupTagText, { color: '#81ccb0' }]}>{item.hintTag}</Text>
              </View>
              <TouchableOpacity onPress={() => setPopupVisible(false)} style={styles.popupClose}>
                <X size={20} color="#a8a29e" />
              </TouchableOpacity>
            </View>
            <Text style={styles.popupHint}>{item.hint}</Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity style={styles.popupButtonCancel} onPress={() => setPopupVisible(false)}>
                <Text style={styles.popupButtonCancelText}>Chiudi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popupButtonAdd} onPress={() => { setPopupVisible(false); onAdd(); }}>
                <Text style={styles.popupButtonAddText}>Aggiungi ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// --- LOGICA DI SCORING ---
function scoreEscursione(esc: Escursione, selectedItems: string[]): number {
  let score = 0;
  const t = esc.titolo?.toLowerCase() || '';
  const d = esc.descrizione?.toLowerCase() || '';
  const diffDB = esc.difficolta ?? '';
  const cat = esc.categoria?.toLowerCase() || '';
  const fs = FILOSOFIA_QUIZ_MAP[esc.filosofia ?? ''] ?? {};

  selectedItems.forEach(itemId => {
    const signals = ITEM_SIGNALS[itemId];
    Object.entries(signals).forEach(([dim, val]) => { if (fs[dim] === val) score += 8; });
    const sforzo = signals.sforzo;
    if (sforzo && diffDB) {
      if (sforzo === 'Basso' && (diffDB === 'Facile' || diffDB === 'Facile-Media')) score += 4;
      if (sforzo === 'Medio' && diffDB === 'Media') score += 4;
      if (sforzo === 'Intenso' && (diffDB === 'Media-Impegnativa' || diffDB === 'Impegnativa')) score += 4;
    }
    const tempo = signals.tempo;
    if (tempo) {
      if (tempo === 'Mezza giornata' && cat.includes('mezza')) score += 8;
      if (tempo === 'Intera giornata' && (cat === 'giornata' || cat.includes('intera'))) score += 8;
      if (tempo === 'Una settimana' && cat === 'tour') score += 8;
    }
  });
  return score;
}

// --- COMPONENTE PRINCIPALE ---

interface AttivitaQuizProps {
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
}

export default function AttivitaQuiz({ onBookingClick }: AttivitaQuizProps) {
  const [step, setStep] = useState<'items' | 'result'>('items');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<Escursione | null>(null);
  const [profile, setProfile] = useState<keyof typeof PROFILI>('base');
  const [escursioniPool, setEscursioniPool] = useState<Escursione[]>([]);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    supabase.from('escursioni').select('*').eq('is_active', true)
      .then(({ data }) => { if (data) setEscursioniPool(data); });
  }, []);

  const isFull = selectedItems.length === 3;
  const addItem = (id: string) => { if (!isFull) setSelectedItems(p => [...p, id]); };
  const removeItem = (id: string) => setSelectedItems(p => p.filter(i => i !== id));

  const compute = () => {
    if (!isFull || escursioniPool.length === 0) return;
    setIsComputing(true);
    setTimeout(() => {
      let bestMatch = escursioniPool[0];
      let maxScore = -Infinity;
      escursioniPool.forEach(esc => {
        let s = scoreEscursione(esc, selectedItems);
        if (shownIds.includes(esc.id)) s -= 15;
        s += Math.random() * 2;
        if (s > maxScore) { maxScore = s; bestMatch = esc; }
      });
      setRecommended(bestMatch);
      setShownIds(prev => [...prev, bestMatch.id]);
      
      const weight = selectedItems.reduce((acc, id) => acc + (ITEM_WEIGHT[id] ?? 0), 0);
      setProfile(weight >= 4 ? 'avanzato' : weight >= 2 ? 'intermedio' : 'base');
      
      setIsComputing(false);
      setStep('result');
    }, 800);
  };

  const leftItems = ITEMS.filter(i => i.zone === 'left').sort((a, b) => (a.zoneRow || 0) - (b.zoneRow || 0));
  const rightItems = ITEMS.filter(i => i.zone === 'right').sort((a, b) => (a.zoneRow || 0) - (b.zoneRow || 0));
  const bottomItems = ITEMS.filter(i => i.zone === 'bottom');

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {step === 'items' ? (
          <View style={styles.stepWrapper}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Cosa metti{'\n'}<Text style={styles.titleItalic}>nel tuo zaino?</Text></Text>
              <Text style={styles.subtitle}>Scegli 3 oggetti — tocca per scoprire cosa rappresentano</Text>
            </View>

            <View style={styles.quizLayout}>
              {/* Colonna Sinistra */}
              <View style={styles.sideColumn}>
                {leftItems.map(item => (
                  <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
                ))}
              </View>

              {/* Centro: Zaino e Chip */}
              <View style={styles.centerSection}>
                <BackpackSVG glowing={isFull} itemCount={selectedItems.length} />
                
                <View style={styles.selectedRow}>
                  {selectedItems.map(id => (
                    <TouchableOpacity key={id} style={styles.chip} onPress={() => removeItem(id)}>
                      <Text style={styles.chipEmoji}>{ITEMS.find(i => i.id === id)?.emoji}</Text>
                      <View style={styles.chipRemove}><Text style={styles.chipRemoveText}>✕</Text></View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.dots}>
                  {[0, 1, 2].map(i => <View key={i} style={[styles.dot, i < selectedItems.length && styles.dotActive]} />)}
                </View>
              </View>

              {/* Colonna Destra */}
              <View style={styles.sideColumn}>
                {rightItems.map(item => (
                  <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
                ))}
              </View>
            </View>

            <View style={styles.bottomBox}>
              {bottomItems.map(item => (
                <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
              ))}
            </View>

            {isFull && (
              <TouchableOpacity style={styles.mainBtn} onPress={compute} disabled={isComputing}>
                {isComputing ? <ActivityIndicator color="white" /> : (
                  <>
                    <Sparkles size={16} color="white" />
                    <Text style={styles.mainBtnText}>Scopri l'escursione perfetta</Text>
                    <ArrowRight size={16} color="white" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.resultWrapper}>
            {recommended && (
              <>
                <View style={[styles.profileCard, { backgroundColor: PROFILI[profile].colore + '15', borderColor: PROFILI[profile].colore + '40' }]}>
                  <Text style={styles.profileIcon}>{PROFILI[profile].icona}</Text>
                  <Text style={[styles.profileTitle, { color: PROFILI[profile].colore }]}>{PROFILI[profile].titolo}</Text>
                  <Text style={styles.profileDesc}>{PROFILI[profile].descrizione}</Text>
                </View>

                <View style={styles.recCard}>
                  <Image source={{ uri: recommended.immagine_url || 'https://via.placeholder.com/400' }} style={styles.recImg} />
                  <View style={styles.recBody}>
                    <Text style={styles.recTitle}>{recommended.titolo}</Text>
                    <Text style={styles.recDesc} numberOfLines={2}>{recommended.descrizione}</Text>
                    <View style={styles.recFooter}>
                      <Text style={styles.recPrice}>{recommended.prezzo ? `€${recommended.prezzo}` : '—'}</Text>
                      <View style={styles.recActions}>
                        <TouchableOpacity style={styles.btnSec} onPress={() => { setSelectedActivity(recommended); setIsDetailOpen(true); }}>
                          <Text style={styles.btnSecText}>Dettagli</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnPri, { backgroundColor: PROFILI[profile].colore }]} onPress={() => onBookingClick(recommended.titolo, 'info')}>
                          <Text style={styles.btnPriText}>Richiedi Info</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.resButtons}>
                  <TouchableOpacity style={styles.resBtn} onPress={() => { setIsComputing(true); setTimeout(compute, 500); }}>
                    <RotateCcw size={16} color="#44403c" />
                    <Text style={styles.resBtnText}>Altra proposta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resBtn} onPress={() => { setStep('items'); setSelectedItems([]); }}>
                    <Sparkles size={16} color="#44403c" />
                    <Text style={styles.resBtnText}>Cambia zaino</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <ActivityDetailModal activity={selectedActivity} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} onBookingClick={onBookingClick} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f2ed', borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden' },
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  stepWrapper: { flex: 1, alignItems: 'center' },
  headerText: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#44403c', textTransform: 'uppercase', textAlign: 'center', lineHeight: 32 },
  titleItalic: { fontStyle: 'italic', fontWeight: '300', color: '#9f8270' },
  subtitle: { fontSize: 13, color: '#a8a29e', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  
  quizLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginVertical: 10 },
  sideColumn: { gap: 15 },
  centerSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backpackWrapper: { width: width * 0.45, height: width * 0.45, justifyContent: 'center', alignItems: 'center' },
  backpackImage: { width: '100%', height: '100%' },
  
  selectedRow: { flexDirection: 'row', gap: 10, marginTop: 15, height: 50 },
  chip: { width: 46, height: 46, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#81ccb0', shadowOpacity: 0.3, shadowRadius: 5, borderWidth: 2, borderColor: '#81ccb0' },
  chipEmoji: { fontSize: 24 },
  chipRemove: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chipRemoveText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  dots: { flexDirection: 'row', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d6d3d1' },
  dotActive: { backgroundColor: '#81ccb0', transform: [{ scale: 1.3 }] },
  
  bottomBox: { flexDirection: 'row', justifyContent: 'center', gap: 20, width: '100%', padding: 20, marginTop: 10, backgroundColor: 'rgba(90,170,221,0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(90,170,221,0.15)', borderStyle: 'dashed' },
  
  mainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#81ccb0', paddingVertical: 18, paddingHorizontal: 25, borderRadius: 20, marginTop: 30, width: '100%', elevation: 8, shadowColor: '#81ccb0', shadowOpacity: 0.4, shadowRadius: 10 },
  mainBtnText: { color: 'white', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },

  // --- Styles ItemCard ---
 // Trova la sezione "Styles ItemCard" e aggiungi la riga mancante:
  itemCard: { width: 58, height: 58, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: '#f5f5f4' },
  itemCardSelected: { borderWidth: 2, borderColor: '#81ccb0', shadowColor: '#81ccb0', shadowOpacity: 0.4 },
  itemCardDisabled: { opacity: 0.3, backgroundColor: '#f5f5f4' },
  itemEmoji: { fontSize: 28, opacity: 0.7 }, // Leggera opacità di base
  itemEmojiSelected: { opacity: 1 },         // <--- AGGIUNGI QUESTA RIGA
  itemCheckmark: { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#81ccb0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white' },

  // --- Risultati ---
  resultWrapper: { flex: 1, alignItems: 'center' },
  profileCard: { width: '100%', borderRadius: 25, padding: 20, alignItems: 'center', borderWidth: 1.5, marginBottom: 25 },
  profileIcon: { fontSize: 40, marginBottom: 10 },
  profileTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' },
  profileDesc: { fontSize: 14, color: '#78716c', textAlign: 'center', lineHeight: 20, marginTop: 10 },
  recCard: { width: '100%', backgroundColor: 'white', borderRadius: 25, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, marginBottom: 25 },
  recImg: { width: '100%', height: 180 },
  recBody: { padding: 20 },
  recTitle: { fontSize: 18, fontWeight: '900', color: '#44403c', textTransform: 'uppercase' },
  recDesc: { fontSize: 13, color: '#78716c', marginVertical: 12 },
  recFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recPrice: { fontSize: 26, fontWeight: '900', color: '#44403c' },
  recActions: { flexDirection: 'row', gap: 8 },
  btnSec: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e7e5e4' },
  btnSecText: { fontSize: 11, fontWeight: '900', color: '#57534e', textTransform: 'uppercase' },
  btnPri: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12 },
  btnPriText: { fontSize: 11, fontWeight: '900', color: 'white', textTransform: 'uppercase' },
  resButtons: { flexDirection: 'row', gap: 15, width: '100%' },
  resBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'white', paddingVertical: 15, borderRadius: 20, borderWidth: 1.5, borderColor: '#e7e5e4' },
  resBtnText: { fontSize: 11, fontWeight: '900', color: '#44403c', textTransform: 'uppercase' },

  // --- Popup Modals ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  popupContainer: { backgroundColor: 'white', borderRadius: 30, padding: 25, width: '100%', maxWidth: 340 },
  popupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  popupEmoji: { fontSize: 35, marginRight: 15 },
  popupTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  popupTagText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  popupClose: { marginLeft: 'auto' },
  popupHint: { fontSize: 15, color: '#57534e', lineHeight: 22, marginBottom: 25 },
  popupButtons: { flexDirection: 'row', gap: 12 },
  popupButtonCancel: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: '#e7e5e4' },
  popupButtonCancelText: { fontWeight: '900', color: '#a8a29e', fontSize: 12, textTransform: 'uppercase' },
  popupButtonAdd: { flex: 1.5, paddingVertical: 15, alignItems: 'center', borderRadius: 15, backgroundColor: '#81ccb0' },
  popupButtonAddText: { fontWeight: '900', color: 'white', fontSize: 12, textTransform: 'uppercase' },
});