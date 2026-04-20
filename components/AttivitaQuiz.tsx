// components/AttivitaQuiz.tsx
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
} from 'react-native';
import { ArrowRight, RotateCcw, Sparkles, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import ActivityDetailModal from './ActivityDetailModal';

// Tipi (semplificati)
type Escursione = any; // Sostituire con tipo Supabase se disponibile

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
  base: {
    titolo: 'L\'Esploratore Curioso', sottotitolo: 'Pronto a iniziare',
    descrizione: 'Cerchi esperienze dolci e rigeneranti, perfette per muovere i primi passi in natura con curiosità.',
    icona: '🌱', colore: '#81ccb0',
  },
  intermedio: {
    titolo: 'Il Camminatore Consapevole', sottotitolo: 'Esperienza in crescita',
    descrizione: 'Hai già familiarità con l\'outdoor. Sei pronto per avventure più strutturate e percorsi con un po\' di sfida.',
    icona: '⛰️', colore: '#5aaadd',
  },
  avanzato: {
    titolo: 'L\'Avventuriero Esperto', sottotitolo: 'Pronto a osare',
    descrizione: 'Cerchi esperienze intense e immersive, percorsi impegnativi e atmosfere selvagge lontano dalla folla.',
    icona: '🏔️', colore: '#9f8270',
  },
} as const;

const { width } = Dimensions.get('window');

// Scoring (identico)
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
      if (tempo === 'Più giorni' && (cat === 'giornata' || cat === 'tour')) score += 4;
    }
    const luogo = signals.luogo;
    if (luogo) {
      if (luogo === 'Panoramico' && (t.includes('cima') || t.includes('vetta') || d.includes('panoram'))) score += 4;
      if (luogo === 'Bosco' && (d.includes('bosco') || d.includes('foresta'))) score += 4;
      if (luogo === 'Poco frequentato' && (d.includes('nascost') || d.includes('solitari') || d.includes('selvag'))) score += 4;
      if (luogo === 'Presenza di acqua' && (t.includes('lago') || t.includes('mare') || d.includes('acqua'))) score += 4;
    }
    const cerca = signals.cerca;
    if (cerca) {
      if (cerca === 'Pace e serenità' && d.includes('pace')) score += 3;
      if (cerca === 'Conoscere la meta' && (d.includes('storia') || d.includes('cultura') || d.includes('scopri'))) score += 3;
      if (cerca === 'Tempo di qualità' && (d.includes('esperienz') || d.includes('emozione'))) score += 3;
    }
  });
  return score;
}

function computeProfile(selectedItems: string[]): keyof typeof PROFILI {
  const weight = selectedItems.reduce((acc, id) => acc + (ITEM_WEIGHT[id] ?? 0), 0);
  if (weight >= 4) return 'avanzato';
  if (weight >= 2) return 'intermedio';
  return 'base';
}

// Componente Zaino
function BackpackSVG({ glowing, itemCount }: { glowing: boolean; itemCount: number }) {
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    if (glowing) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(scaleAnim, { toValue: 1.03, duration: 600, useNativeDriver: true }),
          RNAnimated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [glowing]);
  return (
    <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Image source={require('../assets/zaino.png')} style={styles.backpackImage} resizeMode="contain" />
    </RNAnimated.View>
  );
}

// Popup per ItemCard
function ItemPopup({ item, visible, onClose, onAdd }: { item: Item; visible: boolean; onClose: () => void; onAdd: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.popupContainer}>
          <View style={styles.popupHeader}>
            <Text style={styles.popupEmoji}>{item.emoji}</Text>
            <View style={[styles.popupTag, { backgroundColor: '#81ccb0' + '20' }]}>
              <Text style={[styles.popupTagText, { color: '#81ccb0' }]}>{item.hintTag}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.popupClose}>
              <X size={18} color="#a8a29e" />
            </TouchableOpacity>
          </View>
          <Text style={styles.popupHint}>{item.hint}</Text>
          <View style={styles.popupButtons}>
            <TouchableOpacity style={styles.popupButtonCancel} onPress={onClose}>
              <Text style={styles.popupButtonCancelText}>Chiudi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupButtonAdd} onPress={() => { onClose(); onAdd(); }}>
              <Text style={styles.popupButtonAddText}>Aggiungi ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ItemCard semplificata
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
            <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
      <ItemPopup
        item={item}
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        onAdd={() => { setPopupVisible(false); onAdd(); }}
      />
    </>
  );
}

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
    supabase.from('escursioni').select('*').eq('is_active', true).order('data', { ascending: true })
      .then(({ data }) => { if (data) setEscursioniPool(data as any[]); });
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
        if (shownIds.includes(esc.id)) s -= 14;
        s += Math.random() * 2;
        if (s > maxScore) { maxScore = s; bestMatch = esc; }
      });
      setRecommended(bestMatch);
      setShownIds(prev => [...prev, bestMatch.id]);
      setProfile(computeProfile(selectedItems));
      setIsComputing(false);
      setStep('result');
    }, 600);
  };

  const reset = () => { setStep('items'); setSelectedItems([]); setRecommended(null); };

  const leftItems = ITEMS.filter(i => i.zone === 'left').sort((a, b) => (a.zoneRow || 0) - (b.zoneRow || 0));
  const rightItems = ITEMS.filter(i => i.zone === 'right').sort((a, b) => (a.zoneRow || 0) - (b.zoneRow || 0));
  const bottomItems = ITEMS.filter(i => i.zone === 'bottom');
  const currentProfile = PROFILI[profile];

  return (
    <View style={styles.container}>
      {step === 'items' ? (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Cosa metti{'\n'}<Text style={styles.titleItalic}>nel tuo zaino?</Text></Text>
          <Text style={styles.subtitle}>Scegli 3 oggetti — tocca per scoprire cosa rappresentano</Text>
          <View style={styles.itemsRow}>
            <View style={styles.column}>
              {leftItems.map(item => (
                <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
              ))}
            </View>
            <View style={styles.backpackContainer}>
              <BackpackSVG glowing={isFull} itemCount={selectedItems.length} />
              <View style={styles.selectedItemsRow}>
                {selectedItems.map(id => {
                  const it = ITEMS.find(i => i.id === id);
                  return (
                    <TouchableOpacity key={id} style={styles.selectedItemChip} onPress={() => removeItem(id)}>
                      <Text style={styles.selectedItemEmoji}>{it?.emoji}</Text>
                      <Text style={styles.selectedItemRemove}>✕</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.dotsContainer}>
                {[0, 1, 2].map(i => <View key={i} style={[styles.dot, i < selectedItems.length && styles.dotActive]} />)}
              </View>
            </View>
            <View style={styles.column}>
              {rightItems.map(item => (
                <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
              ))}
            </View>
          </View>
          <View style={styles.bottomRow}>
            {bottomItems.map(item => (
              <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
            ))}
          </View>
          {isFull && (
            <TouchableOpacity style={styles.computeButton} onPress={compute} disabled={isComputing}>
              {isComputing ? <ActivityIndicator color="white" /> : (
                <>
                  <Sparkles size={14} color="white" />
                  <Text style={styles.computeButtonText}>Scopri l'escursione perfetta</Text>
                  <ArrowRight size={14} color="white" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {recommended && (
            <>
              <View style={styles.selectedSummary}>
                {selectedItems.map(id => {
                  const it = ITEMS.find(i => i.id === id);
                  return (
                    <View key={id} style={styles.selectedSummaryItem}>
                      <Text style={styles.selectedSummaryEmoji}>{it?.emoji}</Text>
                      <Text style={styles.selectedSummaryLabel}>{it?.label}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={[styles.profileCard, { backgroundColor: currentProfile.colore + '15', borderColor: currentProfile.colore + '40' }]}>
                <Text style={styles.profileIcon}>{currentProfile.icona}</Text>
                <Text style={[styles.profileTitle, { color: currentProfile.colore }]}>{currentProfile.titolo}</Text>
                <Text style={styles.profileSubtitle}>{currentProfile.sottotitolo}</Text>
                <Text style={styles.profileDesc}>{currentProfile.descrizione}</Text>
              </View>
              <View style={styles.recommendedCard}>
                <Image source={{ uri: recommended.immagine_url || 'https://via.placeholder.com/400' }} style={styles.recommendedImage} />
                <View style={styles.recommendedContent}>
                  <Text style={styles.recommendedTitle}>{recommended.titolo}</Text>
                  <Text style={styles.recommendedDesc} numberOfLines={2}>{recommended.descrizione}</Text>
                  <View style={styles.recommendedFooter}>
                    <Text style={styles.recommendedPrice}>{recommended.prezzo ? `€${recommended.prezzo}` : '—'}</Text>
                    <View style={styles.recommendedActions}>
                      <TouchableOpacity style={styles.outlineButton} onPress={() => { setSelectedActivity(recommended); setIsDetailOpen(true); }}>
                        <Text style={styles.outlineButtonText}>Dettagli</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.fillButton, { backgroundColor: currentProfile.colore }]} onPress={() => onBookingClick(recommended.titolo, 'info')}>
                        <Text style={styles.fillButtonText}>Richiedi Info</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => {
                  setIsComputing(true);
                  setTimeout(() => {
                    let bestMatch = escursioniPool[0]; let maxScore = -Infinity;
                    escursioniPool.forEach(esc => {
                      let s = scoreEscursione(esc, selectedItems);
                      if (shownIds.includes(esc.id)) s -= 14;
                      s += Math.random() * 2;
                      if (s > maxScore) { maxScore = s; bestMatch = esc; }
                    });
                    setRecommended(bestMatch); setShownIds(prev => [...prev, bestMatch.id]); setIsComputing(false);
                  }, 400);
                }}>
                  <RotateCcw size={14} color="#44403c" />
                  <Text style={styles.secondaryButtonText}>Altra proposta</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={reset}>
                  <Sparkles size={14} color="#44403c" />
                  <Text style={styles.secondaryButtonText}>Cambia zaino</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBookingClick={onBookingClick}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ed', borderRadius: 40, padding: 20 },
  stepContainer: { alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900', color: '#44403c', textTransform: 'uppercase', letterSpacing: -1, lineHeight: 36, marginBottom: 8 },
  titleItalic: { fontStyle: 'italic', fontWeight: '300', color: '#9f8270' },
  subtitle: { fontSize: 12, color: '#a8a29e', marginBottom: 24 },
  itemsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  column: { gap: 16 },
  backpackContainer: { alignItems: 'center', flex: 1 },
  backpackImage: { width: width * 0.5, height: width * 0.4 },
  selectedItemsRow: { flexDirection: 'row', gap: 8, marginTop: 8, minHeight: 44 },
  selectedItemChip: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#81ccb0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3, borderWidth: 2, borderColor: '#81ccb0' },
  selectedItemEmoji: { fontSize: 24 },
  selectedItemRemove: { position: 'absolute', top: -4, right: -4, backgroundColor: '#a8a29e', width: 16, height: 16, borderRadius: 8, textAlign: 'center', lineHeight: 16, fontSize: 10, color: 'white', fontWeight: 'bold' },
  dotsContainer: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d6d3d1' },
  dotActive: { backgroundColor: '#81ccb0', transform: [{ scale: 1.3 }] },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 24, paddingVertical: 16, backgroundColor: 'rgba(90,170,221,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(90,170,221,0.2)', borderStyle: 'dashed' },
  computeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#81ccb0', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, marginTop: 24, width: '100%', shadowColor: '#81ccb0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 },
  computeButtonText: { color: 'white', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  resultContainer: { alignItems: 'center' },
  selectedSummary: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 },
  selectedSummaryItem: { alignItems: 'center' },
  selectedSummaryEmoji: { fontSize: 32 },
  selectedSummaryLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', color: '#a8a29e', marginTop: 4 },
  profileCard: { borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1.5, marginBottom: 20, width: '100%' },
  profileIcon: { fontSize: 36, marginBottom: 8 },
  profileTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },
  profileSubtitle: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: '#a8a29e', marginBottom: 8 },
  profileDesc: { fontSize: 12, color: '#78716c', textAlign: 'center', lineHeight: 18 },
  recommendedCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', width: '100%', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  recommendedImage: { width: '100%', height: 160 },
  recommendedContent: { padding: 16 },
  recommendedTitle: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', color: '#44403c', marginBottom: 8 },
  recommendedDesc: { fontSize: 12, color: '#78716c', lineHeight: 18, marginBottom: 16 },
  recommendedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recommendedPrice: { fontSize: 24, fontWeight: '900', color: '#44403c' },
  recommendedActions: { flexDirection: 'row', gap: 8 },
  outlineButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: '#e7e5e4' },
  outlineButtonText: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: '#57534e' },
  fillButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  fillButtonText: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: 'white' },
  resultActions: { flexDirection: 'row', gap: 12, width: '100%' },
  secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#e7e5e4' },
  secondaryButtonText: { fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#44403c' },
  // ItemCard
  itemCard: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f5f5f4' },
  itemCardSelected: { borderWidth: 2, borderColor: '#81ccb0', shadowColor: '#81ccb0', shadowOpacity: 0.4 },
  itemCardDisabled: { opacity: 0.4, backgroundColor: '#f5f5f4' },
  itemEmoji: { fontSize: 28, opacity: 0.8 },
  itemEmojiSelected: { opacity: 1 },
  itemCheckmark: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#81ccb0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white' },
  // Popup
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  popupContainer: { backgroundColor: 'white', borderRadius: 32, padding: 24, width: '100%', maxWidth: 320, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10 },
  popupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  popupEmoji: { fontSize: 32, marginRight: 12 },
  popupTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  popupTagText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  popupClose: { marginLeft: 'auto', padding: 4 },
  popupHint: { fontSize: 14, color: '#78716c', lineHeight: 22, marginBottom: 24 },
  popupButtons: { flexDirection: 'row', gap: 12 },
  popupButtonCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e7e5e4', alignItems: 'center' },
  popupButtonCancelText: { fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#a8a29e' },
  popupButtonAdd: { flex: 1.8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#81ccb0', alignItems: 'center', shadowColor: '#81ccb0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  popupButtonAddText: { fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: 'white' },
});