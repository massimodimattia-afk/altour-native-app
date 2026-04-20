import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
// NOTA: Assicurati di aver installato lucide-react-native, non lucide-react!
import { X, Send, CheckCircle2 } from "lucide-react-native";
import { supabase } from "../lib/supabase";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialMessage?: string;
  mode?: "info" | "prenota";
}

export default function BookingModal({
  isOpen,
  onClose,
  title,
  initialMessage = "",
  mode = "info",
}: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    messaggio: "",
  });

  // Reset form quando si apre
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        messaggio: initialMessage || "",
      }));
    }
  }, [isOpen, initialMessage]);

  // Reset stato quando si chiude
  useEffect(() => {
    if (isOpen) {
      setSent(false);
      setFormError(null);
    } else {
      const t = setTimeout(() => {
        setFormData({ nome: "", email: "", messaggio: "" });
        setFormError(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const validateForm = (): string | null => {
    if (!formData.nome.trim()) return "Il nome è obbligatorio";
    if (!formData.email.trim()) return "L'email è obbligatoria";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return "Inserisci un indirizzo email valido";
    return null;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss(); // Chiude la tastiera all'invio
    
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    
    const payload = {
      nome: (formData.nome || "").trim(),
      email: (formData.email || "").trim(),
      messaggio: (formData.messaggio || "").trim() || null,
      attivita: `[${mode === "prenota" ? "PRENOTA" : "INFO"}] ${(title || "Prenotazione").trim()}`,
    };

    try {
      const { error } = await supabase.from("contatti").insert([payload]);
      if (error) throw error;
      
      setSent(true);
      setFormData({ nome: "", email: "", messaggio: "" });
      
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 3500);
    } catch (error: any) {
      setFormError(`Si è verificato un errore: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      // onRequestClose intercetta il tasto back di Android
      onRequestClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Sfondo scuro semitrasparente. Il Touchable intercetta i tap fuori dal modal per chiuderlo */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (!isSubmitting) onClose();
          }}
          className="flex-1 bg-stone-900/60 justify-center items-center p-4"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20">
              
              {/* Header Modal */}
              <View className="bg-[#f5f2ed] p-8 pb-6 border-b border-stone-100 relative">
                <TouchableOpacity
                  onPress={onClose}
                  disabled={isSubmitting}
                  className="absolute top-6 right-6 p-2 bg-stone-200/50 rounded-full z-10"
                >
                  <X color="#a8a29e" size={24} />
                </TouchableOpacity>

                <View className="flex-row items-center gap-2 mb-3 mt-2">
                  <View className="h-[2px] w-6 bg-sky-500" />
                  <Text className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500">
                    {mode === "prenota" ? "Prenotazione Attività" : "Richiesta Informazioni"}
                  </Text>
                </View>
                
                <Text className="text-2xl font-black uppercase tracking-tighter text-stone-800">
                  {title}
                </Text>
              </View>

              {/* Body Modal */}
              <ScrollView 
                className="bg-white"
                contentContainerStyle={{ padding: 32 }}
                keyboardShouldPersistTaps="handled"
              >
                {!sent ? (
                  <View className="space-y-5">
                    {/* Input Nome */}
                    <View className="space-y-1.5 mb-4">
                      <Text className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-1">
                        Nome Completo
                      </Text>
                      <TextInput
                        value={formData.nome}
                        onChangeText={(text) => {
                          setFormData((prev) => ({ ...prev, nome: text }));
                          if (formError) setFormError(null);
                        }}
                        placeholder="es. Mario Rossi"
                        placeholderTextColor="#a8a29e"
                        className="w-full p-5 bg-stone-50 rounded-2xl font-bold text-xs text-stone-800 border-2 border-transparent focus:border-sky-500/20 focus:bg-white"
                      />
                    </View>

                    {/* Input Email */}
                    <View className="space-y-1.5 mb-4">
                      <Text className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-1">
                        Email di Contatto
                      </Text>
                      <TextInput
                        value={formData.email}
                        onChangeText={(text) => {
                          setFormData((prev) => ({ ...prev, email: text }));
                          if (formError) setFormError(null);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="mario@esempio.it"
                        placeholderTextColor="#a8a29e"
                        className="w-full p-5 bg-stone-50 rounded-2xl font-bold text-xs text-stone-800 border-2 border-transparent focus:border-sky-500/20 focus:bg-white"
                      />
                    </View>

                    {/* Input Messaggio */}
                    <View className="space-y-1.5 mb-6">
                      <Text className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-1">
                        Note / Importo Voucher
                      </Text>
                      <TextInput
                        value={formData.messaggio}
                        onChangeText={(text) => {
                          setFormData((prev) => ({ ...prev, messaggio: text }));
                          if (formError) setFormError(null);
                        }}
                        placeholder="Scrivi qui..."
                        placeholderTextColor="#a8a29e"
                        multiline={true}
                        numberOfLines={4}
                        maxLength={500}
                        textAlignVertical="top"
                        className="w-full p-5 min-h-[100px] bg-stone-50 rounded-2xl font-bold text-xs text-stone-800 border-2 border-transparent focus:border-sky-500/20 focus:bg-white"
                      />
                      <Text className="text-right text-[10px] font-bold text-stone-300 mt-1 mr-1">
                        {formData.messaggio.length} / 500
                      </Text>
                    </View>

                    {/* Messaggio Errore */}
                    {formError && (
                      <View className="bg-red-50 py-3 rounded-xl mb-4">
                        <Text className="text-red-500 text-[10px] font-black uppercase text-center">
                          {formError}
                        </Text>
                      </View>
                    )}

                    {/* Bottone Invio */}
                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                      activeOpacity={0.8}
                      className={`w-full py-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg ${
                        isSubmitting ? "bg-stone-300" : "bg-sky-500"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <ActivityIndicator color="white" size="small" />
                          <Text className="text-white font-black uppercase tracking-[0.2em] text-[11px]">
                            Invio in corso...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text className="text-white font-black uppercase tracking-[0.2em] text-[11px]">
                            Invia Richiesta
                          </Text>
                          <Send color="white" size={16} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Stato di Successo */
                  <View className="py-8 items-center justify-center">
                    <View className="bg-emerald-50 w-20 h-20 rounded-full items-center justify-center mb-6">
                      <CheckCircle2 color="#10b981" size={40} />
                    </View>
                    <Text className="text-2xl font-black text-stone-800 mb-2 uppercase tracking-tighter text-center">
                      Richiesta Inviata
                    </Text>
                    <Text className="text-stone-500 font-medium text-sm text-center">
                      Grazie. Ti risponderemo entro 24 ore.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}