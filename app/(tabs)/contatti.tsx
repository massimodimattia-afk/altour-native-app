// app/(tabs)/contatti.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Instagram,
  Mail,
  Phone,
  Heart,
  Facebook,
  MapPin,
  ChevronRight,
  TrendingUp,
  Send,
} from 'lucide-react-native';

// Palette coerente con il resto dell'app (index, attivita, corsi, tessera)
const COLORS = {
  bg: '#f5f2ed',
  white: '#ffffff',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone600: '#57534e',
  stone700: '#44403c',
  stone800: '#292524',
  stone900: '#1c1917',
  sky: '#0ea5e9',
  skyLight: '#e0f2fe',
  border: '#e7e5e4',
};

export default function ContattiPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn("Impossibile aprire l'URL: " + url);
      }
    } catch (error) {
      console.error("Errore nell'apertura del link", error);
    }
  };

  // Azione per la card tailor-made
  const handleTailorMade = () => {
    const message = encodeURIComponent(
      'Buongiorno, sono interessato a un\'esperienza su misura con Altour. Vorrei maggiori informazioni.'
    );
    openLink(`https://wa.me/393281613762?text=${message}`);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. HEADER CON LOGO E TAGLINE */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/')}
          style={styles.logoContainer}
        >
          <Image
            source={require('../../assets/altour-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.tagline}>Esperienze autentiche in natura</Text>
        <Text style={styles.subtagline}>
          Escursioni, corsi e formazione outdoor con guide certificate AIGAE
        </Text>
      </View>

      {/* 2. CONTATTI RAPIDI */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contatti</Text>
        <View style={styles.contactCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.contactRow}
            onPress={() => openLink('mailto:info.altouritaly@gmail.com')}
          >
            <View style={styles.iconBox}>
              <Mail size={18} color={COLORS.sky} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>info.altouritaly@gmail.com</Text>
            </View>
            <ChevronRight size={16} color={COLORS.sky} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.contactRow}
            onPress={() => openLink('tel:+393281613762')}
          >
            <View style={styles.iconBox}>
              <Phone size={18} color={COLORS.sky} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Telefono</Text>
              <Text style={styles.contactValue}>+39 328 161 3762</Text>
            </View>
            <ChevronRight size={16} color={COLORS.sky} />
          </TouchableOpacity>

          <View style={[styles.contactRow, styles.contactRowLast]}>
            <View style={styles.iconBox}>
              <MapPin size={18} color={COLORS.sky} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Sede</Text>
              <Text style={styles.contactValue}>Roma, Italia</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. CARD TAILOR-MADE (identica alla Home) – ORA PRIMA DEI SOCIAL */}
      <View style={styles.tailorSection}>
        <View style={styles.tailorCard}>
          <View style={styles.tailorImg}>
            <Image
              source={{
                uri: 'https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Box_avventura.webp',
              }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <View style={styles.tailorImgOverlay} />
            <View style={styles.tailorImgContent}>
              <View style={styles.tailorImgTagRow}>
                <TrendingUp size={14} color={COLORS.sky} />
                <Text style={styles.tailorImgTag}>Progetti Personalizzati</Text>
              </View>
              <Text style={styles.tailorImgTitle}>{'Su misura,\nper te.'}</Text>
            </View>
          </View>
          <View style={styles.tailorBody}>
            <Text style={[styles.tailorTag, { color: COLORS.sky, marginBottom: 8 }]}>
              Progetti Personalizzati
            </Text>
            <Text style={styles.tailorHeading}>
              Avventura <Text style={styles.tailorHeadingItalic}>su misura.</Text>
            </Text>
            <Text style={styles.tailorDesc}>
              Hai un'idea specifica? Progettiamo tour privati e team building tracciando la rotta
              insieme a te.
            </Text>
            <TouchableOpacity onPress={handleTailorMade} style={styles.tailorButton}>
              <Text style={styles.tailorButtonText}>Contattaci</Text>
              <Send size={14} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4. SOCIAL COMMUNITY – ORA DOPO TAILOR-MADE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community</Text>
        <View style={styles.socialGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.socialButton}
            onPress={() => openLink('https://www.instagram.com/altouritaly/')}
          >
            <Instagram size={20} color={COLORS.white} />
            <Text style={styles.socialButtonText}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.socialButton}
            onPress={() => openLink('https://www.facebook.com/AltourItaly')}
          >
            <Facebook size={20} color={COLORS.white} />
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. FOOTER LEGALE E CREDITS */}
      <View style={styles.footer}>
        <View style={styles.legalLinks}>
          <Text style={styles.legalLinkText}>Privacy Policy</Text>
          <View style={styles.dot} />
          <Text style={styles.legalLinkText}>Cookie Policy</Text>
          <View style={styles.dot} />
          <Text style={styles.legalLinkText}>Termini</Text>
        </View>

        <View style={styles.companyInfo}>
          <Text style={styles.copyrightText}>© {new Date().getFullYear()} Altour Italy</Text>
          <Text style={styles.pivaText}>P.IVA 04412340263</Text>
        </View>

        <View style={styles.creditsContainer}>
          <View style={styles.madeWithRow}>
            <Text style={styles.creditsText}>Made with</Text>
            <Heart size={12} color={COLORS.sky} fill={COLORS.sky} />
            <Text style={styles.creditsText}>by</Text>
          </View>
          <Text style={styles.glorionaText}>GLORIONA Prod. 2026</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  logo: {
    height: 120,
    width: 120,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.stone800,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtagline: {
    fontSize: 12,
    color: COLORS.stone500,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  // Sezioni
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: COLORS.sky,
    marginBottom: 16,
    paddingLeft: 4,
  },
  // Card contatti
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.stone100,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone100,
  },
  contactRowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.skyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.stone400,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.stone800,
  },

  // --- Tailor-made card (stili replicati dalla Home) ---
  tailorSection: {
    marginBottom: 36,
  },
  tailorCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f5f5f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  tailorImg: {
    height: 200,
    backgroundColor: '#d4d0cb',
  },
  tailorImgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,25,23,0.55)',
  },
  tailorImgContent: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
  },
  tailorImgTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tailorImgTag: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: 'white',
  },
  tailorImgTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  tailorBody: {
    padding: 24,
    backgroundColor: '#faf9f7',
  },
  tailorTag: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  tailorHeading: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.stone900,
    textTransform: 'uppercase',
    letterSpacing: -1,
    lineHeight: 36,
  },
  tailorHeadingItalic: {
    fontStyle: 'italic',
    fontWeight: '300',
    color: COLORS.sky,
  },
  tailorDesc: {
    fontSize: 14,
    color: '#78716c',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  tailorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.stone900,
  },
  tailorButtonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // Social
  socialGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.sky,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.sky,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  socialButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Footer
  footer: {
    marginTop: 24,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.stone200,
    alignItems: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  legalLinkText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: COLORS.stone500,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.stone300,
    marginHorizontal: 12,
  },
  companyInfo: {
    alignItems: 'center',
    marginBottom: 28,
  },
  copyrightText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: COLORS.stone700,
    marginBottom: 4,
  },
  pivaText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.stone400,
  },
  creditsContainer: {
    alignItems: 'center',
    gap: 10,
  },
  madeWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditsText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: COLORS.stone400,
    fontWeight: '700',
  },
  glorionaText: {
    fontSize: 12,
    color: COLORS.stone500,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
});