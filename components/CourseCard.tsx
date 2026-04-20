// components/CourseCard.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Sparkles, BookOpen, Mountain, ArrowRight, Clock } from 'lucide-react-native';

export interface Corso {
  id: string;
  titolo: string;
  descrizione: string | null;
  immagine_url: string | null;
  categoria?: string | null;
  data_inizio?: string | null;
  durata?: string | null;
  prezzo_bundle?: string | number | null;
  prezzo_teorico?: string | number | null;
  prezzo_pratico?: string | number | null;
  prezzo?: string | number | null;
  is_active?: boolean;
  posizione?: number;
}

interface CourseCardProps {
  corso: Corso;
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
  openDetails: (activity: any) => void;
}

const CATEGORIA_COLORS: Record<string, string> = {
  Avventura: '#e94544', Benessere: '#a5d9c9', 'Borghi più belli': '#946a52',
  Cammini: '#e3c45d', "Educazione all'aperto": '#01aa9f', Eventi: '#ffc0cb',
  Formazione: '#002f59', 'Immersi nel verde': '#358756', 'Luoghi dello spirito': '#c8a3c9',
  Novità: '#75c43c', Speciali: '#b8163c', 'Tra mare e cielo': '#7aaecd',
  'Trek urbano': '#f39452', 'Tracce sulla neve': '#a8cce0', 'Cielo stellato': '#1e2855',
};

function categoriaColor(color: string) {
  const dark = ['#002f59', '#946a52', '#b8163c', '#358756', '#1e2855'];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

const IMG_FALLBACK = require('../assets/altour-logo.png');

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  } catch { return null; }
};

type PricingOption = 'bundle' | 'teorico' | 'pratico';

const cs = StyleSheet.create({
  card:         { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f5f5f4', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  imgContainer: { height: 180, backgroundColor: '#d4d0cb' },
  badge:        { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  badgeText:    { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.95)' },
  body:         { padding: 20 },
  openTag:      { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#0ea5e9' },
  dateTag:      { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#a8a29e' },
  title:        { fontSize: 17, fontWeight: '900', color: '#1c1917', textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 21, marginBottom: 8 },
  desc:         { fontSize: 13, color: '#78716c', lineHeight: 19, marginBottom: 12 },
  duration:     { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#a8a29e' },
  pricingTab:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12 },
  pricingLabel: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  pricingPrice: { fontSize: 14, fontWeight: '900' },
  saveBadge:    { position: 'absolute', top: -8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#81ccb0' },
  saveBadgeText:{ fontSize: 7, fontWeight: '900', textTransform: 'uppercase', color: 'white' },
  ctaBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 16, marginBottom: 8 },
  ctaBtnText:   { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: 'white' },
  outlineBtn:   { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: '#1c1917', alignItems: 'center', justifyContent: 'center' },
  outlineBtnText:{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#1c1917' },
  fillBtn:      { flex: 1.5, paddingVertical: 12, borderRadius: 14, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  fillBtnText:  { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: 'white' },
  programBtn:   { paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: '#e7e5e4', alignItems: 'center' },
  programBtnText:{ fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, color: '#78716c' },
});

export function CourseCard({ corso, onBookingClick, openDetails }: CourseCardProps) {
  const [selected, setSelected] = useState<PricingOption>('bundle');

  const hasModular = corso.prezzo_teorico != null || corso.prezzo_pratico != null;
  const sumParts = (Number(corso.prezzo_teorico) || 0) + (Number(corso.prezzo_pratico) || 0);
  const saveAmount = corso.prezzo_bundle != null && sumParts > 0
    ? sumParts - Number(corso.prezzo_bundle) : 0;

  const color = CATEGORIA_COLORS[corso.categoria || 'Formazione'] || '#002f59';
  const bg = categoriaColor(color);
  const formattedDate = formatDate(corso.data_inizio);

  const opts: { key: PricingOption; label: string; price: number | null; icon: React.ReactNode }[] = [
    ...(corso.prezzo_bundle != null ? [{ key: 'bundle' as PricingOption, label: 'Tutto', price: Number(corso.prezzo_bundle), icon: <Sparkles size={10} color="#5aaadd" /> }] : []),
    ...(corso.prezzo_teorico != null ? [{ key: 'teorico' as PricingOption, label: 'Teoria', price: Number(corso.prezzo_teorico), icon: <BookOpen size={10} color="#9f8270" /> }] : []),
    ...(corso.prezzo_pratico != null ? [{ key: 'pratico' as PricingOption, label: 'Pratica', price: Number(corso.prezzo_pratico), icon: <Mountain size={10} color="#9f8270" /> }] : []),
  ];

  const currentOpt = opts.find(o => o.key === selected) ?? opts[0];
  const bookLabel = selected === 'bundle' ? `${corso.titolo} — Pacchetto Completo`
    : selected === 'teorico' ? `${corso.titolo} — Modulo Teorico`
    : `${corso.titolo} — Uscita Didattica`;

  return (
    <View style={cs.card}>
      {/* Immagine */}
      <View style={cs.imgContainer}>
        <Image
          source={corso.immagine_url ? { uri: corso.immagine_url } : IMG_FALLBACK}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
        <View style={[cs.badge, { backgroundColor: bg, shadowColor: color }]}>
          <Text style={cs.badgeText}>{corso.categoria || 'Formazione'}</Text>
        </View>
      </View>

      {/* Corpo */}
      <View style={cs.body}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text style={cs.openTag}>Iscrizioni aperte</Text>
          {formattedDate && (
            <>
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: '#d4d0cb' }} />
              <Text style={cs.dateTag}>{formattedDate}</Text>
            </>
          )}
        </View>

        <Text style={cs.title} numberOfLines={2}>{corso.titolo}</Text>

        <Text style={cs.desc} numberOfLines={3}>
          {corso.descrizione?.replace(/\*+/g, '') ?? ''}
        </Text>

        {corso.durata && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Clock size={12} color="#a8a29e" />
            <Text style={cs.duration}>{corso.durata}</Text>
          </View>
        )}

        {/* Prezzi */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 16 }}>
          {hasModular ? (
            <>
              <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 16, padding: 4, gap: 4, marginBottom: 12 }}>
                {opts.map(opt => {
                  const isActive = selected === opt.key;
                  const isBundle = opt.key === 'bundle';
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setSelected(opt.key)}
                      style={[cs.pricingTab, isActive && { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }]}
                    >
                      {isBundle && saveAmount > 0 && (
                        <View style={cs.saveBadge}>
                          <Text style={cs.saveBadgeText}>−€{saveAmount}</Text>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        {opt.icon}
                        <Text style={[cs.pricingLabel, { color: isActive ? (isBundle ? '#5aaadd' : '#9f8270') : '#a8a29e' }]}>
                          {opt.label}
                        </Text>
                      </View>
                      <Text style={[cs.pricingPrice, { color: isActive ? '#44403c' : '#a8a29e' }]}>
                        €{opt.price}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={() => onBookingClick(bookLabel, 'prenota')}
                style={[cs.ctaBtn, { backgroundColor: selected === 'bundle' ? '#5aaadd' : '#9f8270' }]}
              >
                {selected === 'bundle' ? <Sparkles size={11} color="white" /> : selected === 'teorico' ? <BookOpen size={11} color="white" /> : <Mountain size={11} color="white" />}
                <Text style={cs.ctaBtnText}>Richiedi Info — €{currentOpt?.price || 0}</Text>
                <ArrowRight size={11} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              <TouchableOpacity onPress={() => onBookingClick(corso.titolo, 'info')} style={cs.outlineBtn}>
                <Text style={cs.outlineBtnText}>Dettagli</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onBookingClick(corso.titolo, 'prenota')} style={cs.fillBtn}>
                <Text style={cs.fillBtnText}>Richiedi Info</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={() => openDetails(corso)} style={cs.programBtn}>
            <Text style={cs.programBtnText}>Vedi programma completo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default CourseCard;
