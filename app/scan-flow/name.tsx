import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Colors, Typography, useColors } from '../../constants/theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../store/useStore';
import { Eye } from 'lucide-react-native';

export default function NameReportScreen() {
  const { template, capturedImageUri, capturedImageBase64, capturedFilesJson } = useLocalSearchParams<{ 
    template: string;
    capturedImageUri?: string;
    capturedImageBase64?: string;
    capturedFilesJson?: string;
  }>();

  const capturedFiles = capturedFilesJson ? JSON.parse(capturedFilesJson) : [];
  const router = useRouter();
  const colors = useColors();
  const theme = useStore((state) => state.theme);

  const getSuggestion = () => {
    switch (template) {
      case 'general':
        return 'General Medical Check-up Report';
      case 'sugar':
        return 'Blood Sugar Report';
      case 'thyroid':
        return 'Thyroid Profile';
      case 'lipid':
        return 'Lipid Profile';
      case 'xray':
        return 'X-Ray Report';
      case 'cbc':
      default:
        return 'CBC Blood Report';
    }
  };

  const suggestion = getSuggestion();
  const [name, setName] = useState('');

  const handleNext = () => {
    // Navigate to process screen, passing the name, template, and the image/files
    router.push({
      pathname: '/scan-flow/process',
      params: { 
        name: name || suggestion, 
        template, 
        capturedImageBase64: capturedImageBase64 || '',
        capturedImageUri: capturedImageUri || '',
        capturedFilesJson: capturedFilesJson || ''
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryPale }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Review Document</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Review your selected documents and provide a name before continuing.
            </Text>
          </View>

          {/* Captured Photo Preview Card */}
          {capturedFiles.length > 0 ? (
            <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.previewHeader}>
                <Eye size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>Uploaded Documents ({capturedFiles.length})</Text>
              </View>
              
              <View style={styles.previewBody}>
                {capturedFiles.map((f: any, idx: number) => (
                  <View key={idx} style={[styles.imagePreviewContainer, { marginBottom: idx === capturedFiles.length - 1 ? 0 : 8 }]}>
                    {f.mimeType?.startsWith('image/') ? (
                      <Image source={{ uri: f.uri }} style={styles.imageThumbnail} resizeMode="cover" />
                    ) : (
                      <View style={[styles.imageThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>PDF</Text>
                      </View>
                    )}
                    <View style={styles.imageDetails}>
                      <Text style={[styles.imageName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {f.name || `Document_${idx+1}`}
                      </Text>
                      <Text style={{ ...Typography.tiny, color: colors.textSecondary }}>{f.mimeType}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : capturedImageUri ? (
            <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.previewHeader}>
                <Eye size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>Captured Document Preview</Text>
              </View>
              
              <View style={styles.previewBody}>
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: capturedImageUri }} style={styles.imageThumbnail} resizeMode="cover" />
                  <View style={styles.imageDetails}>
                    <Text style={[styles.imageName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {name || suggestion || 'captured_report.jpg'}
                    </Text>
                    <Text style={{ ...Typography.tiny, color: colors.textSecondary }}>Live Camera Photo</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={[styles.fieldLabel, { color: colors.primary }]}>REPORT FILENAME</Text>
            <Input 
              placeholder={`e.g., ${suggestion}`} 
              value={name}
              onChangeText={setName}
            />
            <View style={[styles.suggestionBox, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>Suggested: {suggestion} </Text>
              <TouchableOpacity onPress={() => setName(suggestion)}>
                <Text style={[styles.useText, { color: colors.primary }]}>Use</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Button 
              title="Continue to AI Extraction" 
              onPress={handleNext} 
              style={{ width: '100%' }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  header: { marginTop: 20 },
  title: { ...Typography.h2, marginBottom: 8 },
  subtitle: { ...Typography.body },
  form: { marginTop: 24 },
  fieldLabel: { ...Typography.tiny, fontFamily: 'DMSans_700Bold', marginBottom: 8, letterSpacing: 1 },
  suggestionBox: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  suggestionText: { ...Typography.small },
  useText: { ...Typography.small, fontFamily: 'DMSans_600SemiBold' },
  footer: { marginTop: 32 },

  // Multimodal Preview Styles
  previewCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    ...Typography.small,
    fontFamily: 'DMSans_700Bold',
  },
  previewBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  imageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  imageDetails: {
    marginLeft: 16,
    flex: 1,
  },
  imageName: {
    ...Typography.body,
    fontFamily: 'DMSans_700Bold',
  },
});
