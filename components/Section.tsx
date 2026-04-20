// components/Section.tsx
import React from 'react';
import { View, Platform, Dimensions, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  fullHeight?: boolean;
  /** Mantenuto per compatibilità con il web, in RN viene ignorato o mappato a View */
  as?: React.ElementType;
}

export const isIOS = Platform.OS === 'ios';

export default function Section({
  children,
  className = '',
  animate = true,
  delay = 0,
  fullHeight = false,
  as: Tag, // accettiamo la prop ma non la usiamo per l'animazione
}: SectionProps) {
  const { height } = Dimensions.get('window');
  const fullHeightStyle: ViewStyle = fullHeight ? { height, minHeight: height } : {};

  // Se l'animazione è disabilitata, restituiamo un componente statico.
  // Se Tag è una stringa (es. "section") o non specificato, usiamo View.
  if (!animate) {
    const Component = typeof Tag === 'string' || !Tag ? View : Tag;
    return (
      <Component className={`relative w-full ${className}`} style={fullHeightStyle}>
        {children}
      </Component>
    );
  }

  // Per l'animazione, usiamo sempre Animated.View.
  // In React Native non esiste il tag <section>, e animare un componente
  // arbitrario richiederebbe createAnimatedComponent che non accetta stringhe.
  // View è sufficiente per tutti i casi d'uso.
  return (
    <Animated.View
      entering={FadeInUp.delay(delay * 1000)
        .duration(500)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 20 }] })}
      className={`relative w-full ${className}`}
      style={fullHeightStyle}
    >
      {children}
    </Animated.View>
  );
}