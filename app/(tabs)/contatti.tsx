import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Linking, 
  Platform 
} from 'react-native';
import { 
  Instagram, 
  Mail, 
  Phone, 
  Heart, 
  Facebook, 
  MapPin 
} from 'lucide-react-native';

// Assicurati di aggiornare il colore SKY con quello effettivo del tuo brand
const COLORS = {
  bg: '#2a2723',
  white: '#ffffff',
  stone200: '#e5e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone600: '#57534e',
  stone700: '#44403c',
  sky: '#5aaad8', // Brand Sky
  border: 'rgba(255,255,255,0.05)',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHover: 'rgba(255,255,255,0.08)',
};

interface ContattiProps {
  onNavigate?: (page: string) => void;
}

export default function Contatti({ onNavigate }: ContattiProps) {
  
  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Non so come aprire l'URL: " + url);
      }
    } catch (error) {
      console.error("Errore nell'apertura del link", error);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. BRAND STORY */}
      <View style={styles.section}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => onNavigate && onNavigate('home')}
          style={styles.logoContainer}
        >
          {/* Sostituisci il require con il percorso corretto del tuo logo locale o URI remoto */}
          <Image 
            source={require('../assets/altour-logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </TouchableOpacity>
        <Text style={styles.brandText}>
          "Esperienze autentiche in natura. Escursioni, corsi e formazione
          outdoor con guide certificate AIGAE."
        </Text>
      </View>

      {/* 2. CONTATTI RAPIDI */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contatti</Text>
        <View style={styles.contactList}>
          
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.contactRow}
            onPress={() => openLink('mailto:info.altouritaly@gmail.com')}
          >
            <View style={styles.iconBox}>
              <Mail size={16} color={COLORS.stone300} />
            </View>
            <Text style={styles.contactText}>info.altouritaly@gmail.com</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.contactRow}
            onPress={() => openLink('tel:+393281613762')}
          >
            <View style={styles.iconBox}>
              <Phone size={16} color={COLORS.stone300} />
            </View>
            <Text style={styles.contactText}>+39 328 1613762</Text>
          </TouchableOpacity>

          <View style={[styles.contactRow, { opacity: 0.8 }]}>
            <View style={styles.iconBox}>
              <MapPin size={16} color={COLORS.stone400} />
            </View>
            <Text style={[styles.contactText, { color: COLORS.stone400 }]}>Roma, IT</Text>
          </View>
          
        </View>
      </View>

      {/* 3. SOCIAL COMMUNITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community</Text>
        <View style={styles.socialGrid}>
          
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.socialButton}
            onPress={() => openLink('https://www.instagram.com/altouritaly/')}
          >
            <Instagram size={18} color={COLORS.white} />
            <Text style={styles.socialButtonText}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.socialButton}
            onPress={() => openLink('https://www.facebook.com/AltourItaly')}
          >
            <Facebook size={18} color={COLORS.white} />
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* 4. FOOTER BOTTOM (Legal & Credits) */}
      <View style={styles.footerBottom}>
        
        {/* Link Legali */}
        <View style={styles.legalLinksRow}>
          {["Privacy Policy", "Cookie Policy", "Termini"].map((link) => (
            <TouchableOpacity 
              key={link} 
              activeOpacity={0.6}
              onPress={() => onNavigate && onNavigate(`legal-${link.toLowerCase().split(' ')[0]}`)}
            >
              <Text style={styles.legalLinkText}>{link}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Aziendali */}
        <View style={styles.companyInfo}>
          <Text style={styles.copyrightText}>
            &copy; {new Date().getFullYear()} Altour Italy
          </Text>
          <Text style={styles.pivaText}>
            P.IVA 04412340263
          </Text>
        </View>

        {/* Credits */}
        <View style={styles.creditsContainer}>
          <View style={styles.madeWithRow}>
            <Text style={styles.creditsText}>Made with</Text>
            <Heart size={10} color={COLORS.sky} fill={COLORS.sky} style={{ opacity: 0.8 }} />
            <Text style={styles.creditsText}>by</Text>
          </View>
          <Text style={styles.glorionaText}>
            GLORIONA Prod. 2026
          </Text>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  section: {
    alignItems: 'center',
    marginBottom: 48,
  },
  
  // Brand
  logoContainer: {
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  logo: {
    height: 64,
    width: 120, // Aggiusta in base alle proporzioni del tuo logo
  },
  brandText: {
    color: COLORS.stone400,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
  },

  // Typography
  sectionTitle: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
    opacity: 0.5,
    marginBottom: 24,
  },

  // Contact List
  contactList: {
    width: '100%',
    gap: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  iconBox: {
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  contactText: {
    color: COLORS.stone300,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Socials
  socialGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    borderRadius: 16,
  },
  socialButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Footer Bottom
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 32,
    marginTop: 16,
    alignItems: 'center',
  },
  legalLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 24,
    rowGap: 16,
    marginBottom: 32,
  },
  legalLinkText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: COLORS.stone600,
  },
  companyInfo: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 32,
  },
  copyrightText: {
    fontSize: 10,
    color: COLORS.stone500,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  pivaText: {
    fontSize: 9,
    color: COLORS.stone700,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  creditsContainer: {
    alignItems: 'center',
    gap: 12,
  },
  madeWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditsText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    color: COLORS.stone600,
    fontWeight: '700',
  },
  glorionaText: {
    fontSize: 11,
    color: COLORS.stone500,
    fontWeight: '900',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
});