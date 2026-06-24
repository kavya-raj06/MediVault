import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
<<<<<<< HEAD
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
=======
import React, { useEffect, useRef } from 'react';
import { Alert, Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
>>>>>>> b5434b852af30dc42cf0aa8a4a09194fc7df4555
import { api } from '../../services/api';

export default function ProcessScreen() {
  const router = useRouter();
  const { name, template, reportText, capturedImageBase64, capturedImageUri, capturedFilesJson } = useLocalSearchParams<{ 
    name: string; 
    template: string; 
    reportText: string;
    capturedImageBase64?: string;
    capturedImageUri?: string;
    capturedFilesJson?: string;
  }>();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Make the real backend API call to process scanning & AI extraction
    const getMockReportText = (template?: string, name?: string) => {
      switch (template) {
        case 'sugar':
          return `Doctor's Diagnosis: Patient shows fasting glucose 110 mg/dL and HbA1c 5.8%. Recommend dietary changes and repeat testing in 3 months.\nReport: ${name}`;
        case 'thyroid':
          return `Clinical Notes: TSH 2.3 uIU/mL, Free T4 normal. No overt hypothyroidism.\nReport: ${name}`;
        case 'lipid':
          return `Impression: Total cholesterol 210 mg/dL, LDL borderline high at 135 mg/dL. Lifestyle modification advised.\nReport: ${name}`;
        case 'xray':
          return `Impression: Chest X-Ray shows clear lung fields with no consolidation or effusion. Cardiomediastinal silhouette within normal limits.\nReport: ${name}`;
        case 'bp':
          return `Observation: Blood Pressure recorded as 145/92 mmHg. Recommend antihypertensive evaluation.\nReport: ${name}`;
        case 'cbc':
        default:
          return `Doctor's Diagnosis: Haemoglobin 13.8 g/dL, WBC 6800 /cmm, Platelets 230000 /cmm. No significant abnormalities noted.\nReport: ${name}`;
      }
    };

    const processScannedReport = async () => {
      try {
        let filesData: { base64: string; mimeType: string; }[] | undefined;
        
        if (capturedFilesJson) {
          const files = JSON.parse(capturedFilesJson);
          if (files && files.length > 0) {
            filesData = [];
            for (const file of files) {
              const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
              filesData.push({
                base64,
                mimeType: file.mimeType
              });
            }
          }
        }

        console.log(`[ProcessScreen] Sending report "${name}" with captured image base64 data to backend AI engine...`);
        
        const mockText = getMockReportText(template as string, name as string);

        const newRecord = await api.createRecord({
          reportName: name || 'Scanned Medical Report',
          templateId: template || 'cbc',
<<<<<<< HEAD
          reportText: reportText || '',
          imageBase64: capturedImageBase64 || '',
          customFileUri: capturedImageUri || '',
          files: filesData,
=======
          reportText: mockText,
>>>>>>> b5434b852af30dc42cf0aa8a4a09194fc7df4555
        });

        console.log('[ProcessScreen] AI processing complete. Navigating to results page.');
        
        // Pass the created record object to results screen
        router.replace({
          pathname: '/scan-flow/results',
          params: { recordJson: JSON.stringify(newRecord) }
        });
      } catch (error: any) {
        console.error('[ProcessScreen] AI processing failed:', error);
        Alert.alert(
          '⚠️ AI Analysis Offline',
          error.message || 'Could not connect to the medical AI server. The report could not be created.',
          [
            {
              text: 'Go Back',
              onPress: () => router.back()
            }
          ]
        );
      }
    };

    // Trigger after a tiny delay so the gorgeous animation is visible
    const timer = setTimeout(() => {
      processScannedReport();
    }, 1200);

    return () => clearTimeout(timer);
  }, [name]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
        <FileText size={48} color={Colors.surface} />
      </Animated.View>
      <Text style={styles.statusText}>Reading your report...</Text>
      <Text style={styles.subText}>AI is analyzing the contents</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark, justifyContent: 'center', alignItems: 'center' },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 40,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10,
  },
  statusText: { ...Typography.h3, color: Colors.surface, marginBottom: 8 },
  subText: { ...Typography.small, color: Colors.primarySoft },
});
