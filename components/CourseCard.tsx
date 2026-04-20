// components/CourseCard.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Sparkles,
  BookOpen,
  Mountain,
  ArrowRight,
  Clock,
} from 'lucide-react-native';

// --- Tipi (invariati) ---
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

// --- Costanti (invariate) ---
const CATEGORIA_COLORS: Record<string, string> = {
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

function getCategoriaOpacity(color: string): string {
  const dark = ['#002f59', '#946a52', '#b8163c', '#358756', '#1e2855'];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

const IMG_FALLBACK = require('../assets/altour-logo.png');

// Utility per formattare la data
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  } catch {
    return null;
  }
};

type PricingOption = 'bundle' | 'teorico' | 'pratico';

export function CourseCard({ corso, onBookingClick, openDetails }: CourseCardProps) {
  const [selected, setSelected] = useState<PricingOption>('bundle');

  const hasModular = corso.prezzo_teorico != null || corso.prezzo_pratico != null;
  const sumParts = (Number(corso.prezzo_teorico) || 0) + (Number(corso.prezzo_pratico) || 0);
  const saveAmount =
    corso.prezzo_bundle != null && sumParts > 0 ? sumParts - Number(corso.prezzo_bundle) : 0;

  const color = CATEGORIA_COLORS[corso.categoria || 'Formazione'] || '#002f59';
  const bg = getCategoriaOpacity(color);

  const opts: { key: PricingOption; label: string; price: number | null; icon: React.ReactNode }[] = [
    ...(corso.prezzo_bundle != null
      ? [{ key: 'bundle' as PricingOption, label: 'Tutto', price: Number(corso.prezzo_bundle), icon: <Sparkles size={10} color="#5aaadd" /> }]
      : []),
    ...(corso.prezzo_teorico != null
      ? [{ key: 'teorico' as PricingOption, label: 'Teoria', price: Number(corso.prezzo_teorico), icon: <BookOpen size={10} color="#9f8270" /> }]
      : []),
    ...(corso.prezzo_pratico != null
      ? [{ key: 'pratico' as PricingOption, label: 'Pratica', price: Number(corso.prezzo_pratico), icon: <Mountain size={10} color="#9f8270" /> }]
      : []),
  ];

  const currentOpt = opts.find(o => o.key === selected) ?? opts[0];
  const bookLabel =
    selected === 'bundle'
      ? `${corso.titolo} — Pacchetto Completo`
      : selected === 'teorico'
      ? `${corso.titolo} — Modulo Teorico`
      : `${corso.titolo} — Uscita Didattica`;

  const formattedDate = formatDate(corso.data_inizio);

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col"
    >
      {/* Immagine */}
      <View className="aspect-[16/9] md:h-56 bg-stone-200 relative overflow-hidden">
        {corso.immagine_url ? (
          <Image
            source={{ uri: corso.immagine_url }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Image source={IMG_FALLBACK} className="absolute inset-0 w-full h-full" resizeMode="cover" />
        )}
        <View className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Badge Categoria */}
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
            {corso.categoria || 'Formazione'}
          </Text>
        </View>
      </View>

      {/* Corpo */}
      <View className="p-5 md:p-7 flex-1">
        {/* Iscrizioni aperte */}
        <View className="flex-row items-center gap-2.5 mb-2">
          <Text className="text-[9px] font-bold uppercase tracking-wide text-brand-sky">
            Iscrizioni aperte
          </Text>
          {formattedDate && (
            <>
              <View className="w-1 h-1 rounded-full bg-stone-300" />
              <Text className="text-[9px] font-bold uppercase tracking-wide text-stone-400">
                {formattedDate}
              </Text>
            </>
          )}
        </View>

        <Text className="text-lg md:text-xl font-black mb-3 text-brand-stone uppercase" numberOfLines={2}>
          {corso.titolo}
        </Text>

        {/* Descrizione semplificata (senza markdown) */}
        <Text className="text-stone-500 text-xs md:text-sm mb-5 font-medium flex-1" numberOfLines={3}>
          {corso.descrizione?.replace(/\*+/g, '') ?? ''}
        </Text>

        {/* Durata (opzionale) */}
        {corso.durata && (
          <View className="flex-row items-center gap-1.5 mb-4">
            <Clock size={12} color="#a8a29e" />
            <Text className="text-[9px] font-bold uppercase tracking-wide text-stone-400">
              {corso.durata}
            </Text>
          </View>
        )}

        {/* Sezione Prezzi */}
        <View className="mt-auto pt-5 border-t border-stone-100">
          {hasModular ? (
            <View className="space-y-3">
              {/* Toggle prezzi */}
              <View className="flex-row rounded-2xl p-1 gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                {opts.map(opt => {
                  const isActive = selected === opt.key;
                  const isBundle = opt.key === 'bundle';
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setSelected(opt.key)}
                      className="relative flex-1 flex-col items-center justify-center py-2.5 px-1 rounded-xl"
                      style={{
                        backgroundColor: isActive ? 'white' : 'transparent',
                        shadowColor: isActive ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: isActive ? 3 : 0,
                      }}
                    >
                      {isBundle && saveAmount > 0 && (
                        <View
                          className="absolute -top-2 px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: '#81ccb0' }}
                        >
                          <Text className="text-[7px] font-black uppercase text-white">−€{saveAmount}</Text>
                        </View>
                      )}
                      <View className="flex-row items-center gap-1 mb-0.5">
                        {opt.icon}
                        <Text
                          className="text-[8px] font-black uppercase tracking-widest"
                          style={{ color: isActive ? (isBundle ? '#5aaadd' : '#9f8270') : '#a8a29e' }}
                        >
                          {opt.label}
                        </Text>
                      </View>
                      <Text
                        className="text-sm font-black"
                        style={{ color: isActive ? '#44403c' : '#a8a29e' }}
                      >
                        €{opt.price}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* CTA Richiedi Info */}
              <TouchableOpacity
                onPress={() => onBookingClick(bookLabel, 'prenota')}
                className="w-full min-h-[48px] py-3 rounded-2xl flex-row items-center justify-center gap-2"
                style={{
                  backgroundColor: selected === 'bundle' ? '#5aaadd' : '#9f8270',
                  shadowColor: selected === 'bundle' ? '#5aaadd' : '#9f8270',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                {selected === 'bundle' ? (
                  <Sparkles size={11} color="white" />
                ) : selected === 'teorico' ? (
                  <BookOpen size={11} color="white" />
                ) : (
                  <Mountain size={11} color="white" />
                )}
                <Text className="font-black uppercase text-[9px] tracking-widest text-white">
                  Richiedi Info — €{currentOpt?.price || 0}
                </Text>
                <ArrowRight size={11} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => onBookingClick(corso.titolo, 'info')}
                className="flex-1 min-h-[48px] bg-white border-2 border-stone-900 py-3 rounded-2xl items-center justify-center"
              >
                <Text className="font-black uppercase text-[9px] tracking-widest text-stone-900">
                  Dettagli
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onBookingClick(corso.titolo, 'prenota')}
                className="flex-[1.5] min-h-[48px] py-3 rounded-2xl items-center justify-center flex-row gap-2 bg-brand-sky"
                style={{
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text className="font-black uppercase text-[9px] tracking-widest text-white">
                  Richiedi Info
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottone Vedi programma completo */}
          <TouchableOpacity
            onPress={() => openDetails(corso)}
            className="w-full mt-2.5 py-3 rounded-2xl border-2 border-stone-200 items-center"
          >
            <Text className="font-black uppercase text-[9px] tracking-widest text-stone-500">
              Vedi programma completo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}