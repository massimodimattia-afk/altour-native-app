// app/(tabs)/corsi.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import ActivityDetailModal from '../../components/ActivityDetailModal';
import { CourseCard, Corso } from '../../components/CourseCard';

// --- Utility per normalizzare la categoria (invariata) ---
const FILOSOFIA_ALIAS: Record<string, string> = {
  'Outdoor Education': "Educazione all'aperto",
  'Luoghi dello Spirito': 'Luoghi dello spirito',
  'Tra Mare e Cielo': 'Tra mare e cielo',
  'Trek Urbano': 'Trek urbano',
  'Giornata da Guida': 'Novità',
};

function normalizeFilosofia(value?: string | null): string | null {
  if (!value) return value ?? null;
  const key = value.trim();
  return FILOSOFIA_ALIAS[key] ?? key;
}

// --- Skeleton Card per il caricamento ---
const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonBody}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonFooter} />
    </View>
  </View>
);

interface CorsiPageProps {
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
}

export default function CorsiPage({ onBookingClick }: CorsiPageProps) {
  const insets = useSafeAreaInsets();
  const [corsi, setCorsi] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchCorsi() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('corsi')
        .select('*')
        .order('posizione', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        setError('Impossibile caricare i corsi. Riprova più tardi.');
      } else {
        const normalized = (data ?? []).map((c: any) => ({
          ...c,
          categoria: normalizeFilosofia(c?.categoria),
        }));
        setCorsi(normalized as Corso[]);
      }
      setLoading(false);
    }
    fetchCorsi();
  }, []);

  const openDetails = (corso: Corso) => {
    setSelectedActivity({ ...corso, _tipo: 'corso' });
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedActivity(null), 300);
  };

  if (loading) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.loadingContainer}
      >
        <View style={styles.header}>
          <View style={styles.headerSkeleton} />
          <View style={styles.accentSkeleton} />
        </View>
        <View style={styles.grid}>
          {[1, 2, 3].map(n => (
            <SkeletonCard key={n} />
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Accademia{'\n'}
            <Text style={styles.titleItalic}>Altour.</Text>
          </Text>
          <View style={styles.accent} />
        </View>

        {/* Messaggio di errore */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Griglia corsi */}
        <View style={styles.grid}>
          {!error && corsi.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Nessun corso disponibile al momento.
              </Text>
            </View>
          ) : (
            corsi.map(corso => (
              <View key={corso.id} style={styles.cardWrapper}>
                <CourseCard
                  corso={corso}
                  onBookingClick={onBookingClick}
                  openDetails={openDetails}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modale dettaglio */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onBookingClick={onBookingClick}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f2ed',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1c1917',
    textTransform: 'uppercase',
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 12,
  },
  titleItalic: {
    fontStyle: 'italic',
    fontWeight: '300',
    color: '#0ea5e9',
  },
  accent: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0ea5e9',
  },
  headerSkeleton: {
    width: 200,
    height: 72,
    backgroundColor: '#e7e5e4',
    borderRadius: 16,
    marginBottom: 12,
  },
  accentSkeleton: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e7e5e4',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  grid: {
    gap: 24,
  },
  cardWrapper: {
    width: '100%',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#d4d0cb',
  },
  // Skeleton styles
  skeletonCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f5f5f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  skeletonImage: {
    height: 180,
    backgroundColor: '#e7e5e4',
  },
  skeletonBody: {
    padding: 20,
    gap: 8,
  },
  skeletonTitle: {
    width: '75%',
    height: 20,
    backgroundColor: '#e7e5e4',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonLine: {
    width: '100%',
    height: 12,
    backgroundColor: '#f5f5f4',
    borderRadius: 4,
  },
  skeletonLineShort: {
    width: '66%',
    height: 12,
    backgroundColor: '#f5f5f4',
    borderRadius: 4,
  },
  skeletonFooter: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    paddingTop: 16,
    gap: 8,
  },
});