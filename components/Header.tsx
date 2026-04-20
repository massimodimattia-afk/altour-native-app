// components/Header.tsx - VERSIONE STABILE (SENZA REANIMATED)
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Menu, X } from 'lucide-react-native';

// Mappa delle rotte per la navigazione
const navItems = [
  { id: 'home', label: 'Home', route: '/' },
  { id: 'corsi', label: 'Accademia', route: '/corsi' },
  { id: 'attivitapage', label: 'Attività Outdoor', route: '/attivita' },
  { id: 'tessera', label: 'La Mia Tessera', route: '/tessera' },
];

export default function Header() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determina la pagina corrente in base al pathname
  const getCurrentPageId = () => {
    if (pathname === '/') return 'home';
    if (pathname.includes('corsi')) return 'corsi';
    if (pathname.includes('attivita')) return 'attivitapage';
    if (pathname.includes('tessera')) return 'tessera';
    return 'home';
  };
  const currentPage = getCurrentPageId();

  const handleNavigate = (route: string) => {
    setIsMenuOpen(false);
    router.push(route as any);
  };

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  return (
    <View
      className="bg-[#2a2723] border-b border-white/5"
      style={{ paddingTop: insets.top }}
    >
      <View className="h-16 flex-row items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <TouchableOpacity
          className="flex-row items-center gap-3"
          onPress={() => handleNavigate('/')}
        >
          <Image
            source={require('../assets/altour-logo.png')}
            className="h-10 w-10 rounded-lg border border-white/10"
            resizeMode="contain"
          />
          {/* Testo visibile solo su tablet/desktop (md:) */}
          <View className="hidden md:flex flex-col">
            <Text className="text-white font-black tracking-tighter">
              Altour italy
            </Text>
            <Text className="text-white/80 font-light text-xs tracking-normal mt-0.5">
              Formazione ed Attività Outdoor
            </Text>
          </View>
        </TouchableOpacity>

        {/* Navigazione Desktop */}
        <View className="hidden md:flex-row items-center gap-8">
          {navItems.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavigate(item.route)}
              className="relative py-2"
            >
              <Text
                className={`text-[11px] uppercase font-bold tracking-[0.2em] ${
                  currentPage === item.id ? 'text-brand-sky' : 'text-stone-300'
                }`}
              >
                {item.label}
              </Text>
              {currentPage === item.id && (
                <View className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-sky" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Hamburger Menu */}
        <TouchableOpacity
          className="md:hidden p-2 rounded-lg bg-white/5"
          onPress={toggleMenu}
        >
          {isMenuOpen ? (
            <X size={26} color="white" />
          ) : (
            <Menu size={26} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Menu Mobile - senza animazioni Reanimated */}
      {isMenuOpen && (
        <View className="bg-[#2a2723] border-t border-white/5">
          <View className="p-6 gap-5">
            {navItems.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleNavigate(item.route)}
                className="py-2"
              >
                <Text
                  className={`text-sm uppercase font-black tracking-[0.2em] ${
                    currentPage === item.id ? 'text-brand-sky' : 'text-stone-300'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}