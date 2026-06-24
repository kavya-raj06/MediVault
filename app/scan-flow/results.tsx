import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography, useColors } from '../../constants/theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../store/useStore';
import { MedicalRecord, ExtractedValue } from '../../types';
import { AlertTriangle, CheckCircle, RefreshCw, Trash2, ShieldCheck } from 'lucide-react-native';
import { api } from '../../services/api';

export default function ResultsScreen() {
  const router = useRouter();
  const { recordJson } = useLocalSearchParams<{ recordJson: string }>();
  const colors = useColors();
  const theme = useStore((state) => state.theme);
  const profile = useStore((state) => state.profile);
  const [isSaving, setIsSaving] = useState(false);

  // Parse the real record generated in the SQLite database by the backend
  const record: MedicalRecord = React.useMemo(() => {
    try {
      return recordJson ? JSON.parse(recordJson) : null;
    } catch (e) {
      console.error('Failed to parse record JSON:', e);
      return null;
    }
  }, [recordJson]);

  const hasMismatch = record?.nameMismatch || false;

  const parsedUpdates = React.useMemo(() => {
    try {
      return record?.syncUpdates ? JSON.parse(record.syncUpdates) : null;
    } catch (e) {
      return null;
    }
  }, [record?.syncUpdates]);

  const handleConfirm = async () => {
    if (!record) return;
    try {
      setIsSaving(true);
      console.log('[ResultsScreen] Confirming report. Activating Smart-Sync...');
      await useStore.getState().confirmRecord(record.id);
      
      router.dismissAll();
      router.replace('/(tabs)');
    } catch (e) {
      console.error('[ResultsScreen] Failed to confirm record:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!record) return;
    try {
      setIsSaving(true);
      console.log('[ResultsScreen] Discarding report. Deleting temporary SQLite record...');
      await api.deleteRecord(record.id);
      
      // Clear/refresh data just in case
      await useStore.getState().loadInitialData();
      
      router.dismissAll();
      router.replace('/(tabs)');
    } catch (e) {
      console.error('[ResultsScreen] Failed to discard record:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!record) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryPale }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>No AI results found. Please scan again.</Text>
      </SafeAreaView>
    );
  }

  // Get status dot color
  const getStatusColor = (status: ExtractedValue['status']) => {
    switch (status) {
      case 'critical':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'normal':
      default:
        return colors.success;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryPale }]}>
      <View style={[styles.topBanner, { backgroundColor: colors.dark }]}>
        <Text style={[styles.bannerText, { color: colors.surface }]}>AI Analysis Complete</Text>
      </View>

      {/* Patient Name Mismatch Warning Banner */}
      {hasMismatch && (
        <View style={[styles.mismatchBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
          <AlertTriangle size={20} color={colors.warning} style={styles.bannerIcon} />
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.mismatchTitle, { color: colors.warning }]}>Patient Name Mismatch</Text>
            <Text style={[styles.mismatchDesc, { color: colors.textPrimary }]}>
              This report is issued to <Text style={{ fontFamily: 'DMSans_700Bold' }}>{record.patientName}</Text>, but your profile is named <Text style={{ fontFamily: 'DMSans_700Bold' }}>{profile?.name || 'Vish'}</Text>.
            </Text>
          </View>
        </View>
      )}
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {/* Record General Details */}
        <Card style={[styles.detailsCard, { backgroundColor: colors.surface }] as any}>
          <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>{record.reportName}</Text>
          <Text style={[styles.detailsSubtitle, { color: colors.textSecondary }]}>
            {record.reportType} • {record.bodyPart} • {record.labHospital}
          </Text>
        </Card>

        {/* Profile Smart-Sync updates (✨ Pop-up Alert details) */}
        {parsedUpdates && (
          <Card style={[styles.syncCard, { backgroundColor: theme === 'dark' ? colors.primaryMuted : '#FDF1F5', borderColor: colors.primarySoft }] as any}>
            <View style={styles.syncHeader}>
              <RefreshCw size={18} color={colors.primary} />
              <Text style={[styles.syncTitle, { color: colors.primary }]}>Profile Smart-Sync updates</Text>
            </View>
            <Text style={[styles.syncSubtitle, { color: colors.textSecondary }]}>
              The AI parsed new clinical information from this report. Upon saving, the following details will be automatically updated:
            </Text>
            
            <View style={styles.syncItems}>
              {parsedUpdates.vitals && parsedUpdates.vitals.length > 0 && parsedUpdates.vitals.map((v: any, idx: number) => (
                <View key={`v-${idx}`} style={styles.syncItemRow}>
                  <CheckCircle size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[styles.syncItemText, { color: colors.textPrimary }]}>
                    Log vital: <Text style={{ fontFamily: 'DMSans_700Bold' }}>{v.type === 'BloodPressure' ? `Blood Pressure ${v.bpSystolic}/${v.bpDiastolic} mmHg` : `Fasting Glucose ${v.glucoseValue} mg/dL`}</Text> on report date.
                  </Text>
                </View>
              ))}
              
              {parsedUpdates.allergies && parsedUpdates.allergies.length > 0 && parsedUpdates.allergies.map((a: any, idx: number) => (
                <View key={`a-${idx}`} style={styles.syncItemRow}>
                  <CheckCircle size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[styles.syncItemText, { color: colors.textPrimary }]}>
                    Add allergy: <Text style={{ fontFamily: 'DMSans_700Bold' }}>{a}</Text> to profile.
                  </Text>
                </View>
              ))}

              {parsedUpdates.conditions && parsedUpdates.conditions.length > 0 && parsedUpdates.conditions.map((c: any, idx: number) => (
                <View key={`c-${idx}`} style={styles.syncItemRow}>
                  <CheckCircle size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[styles.syncItemText, { color: colors.textPrimary }]}>
                    Add condition: <Text style={{ fontFamily: 'DMSans_700Bold' }}>{c}</Text> to chronic conditions.
                  </Text>
                </View>
              ))}

              {parsedUpdates.height && (
                <View style={styles.syncItemRow}>
                  <CheckCircle size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[styles.syncItemText, { color: colors.textPrimary }]}>
                    Update height: <Text style={{ fontFamily: 'DMSans_700Bold' }}>{parsedUpdates.height} cm</Text>.
                  </Text>
                </View>
              )}

              {parsedUpdates.weight && (
                <View style={styles.syncItemRow}>
                  <CheckCircle size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={[styles.syncItemText, { color: colors.textPrimary }]}>
                    Update weight: <Text style={{ fontFamily: 'DMSans_700Bold' }}>{parsedUpdates.weight} kg</Text>.
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Dynamic Extracted Lab Values */}
        {record.extractedValues && record.extractedValues.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Extracted Values</Text>
            {record.extractedValues.map((val, idx) => (
              <Card key={idx} style={[styles.valueCard, { backgroundColor: colors.surface }] as any}>
                <View style={styles.valueHeader}>
                  <View style={styles.nameRow}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(val.status) }]} />
                    <Text style={[styles.valueName, { color: colors.textPrimary }]}>{val.name}</Text>
                  </View>
                  <Text style={[styles.valueText, { color: colors.textPrimary }]}>
                    {val.value} {val.unit ? <Text style={[styles.unitText, { color: colors.textSecondary }]}>{val.unit}</Text> : null}
                  </Text>
                </View>
                {val.referenceRange ? (
                  <Text style={[styles.referenceText, { color: colors.textSecondary }]}>Ref: {val.referenceRange}</Text>
                ) : null}
                {val.historicalDelta ? (
                  <View style={[styles.historicalCard, { backgroundColor: colors.primaryMuted }]}>
                    <Text style={[styles.historicalText, { color: colors.primary }]}>{val.historicalDelta}</Text>
                  </View>
                ) : null}
              </Card>
            ))}
          </>
        )}

        {/* AI Summary Block (Locked 🔒) */}
        <View style={[styles.aiSummaryBlock, { backgroundColor: colors.dark }]}>
          <Text style={[styles.aiLabel, { color: colors.primary }]}>AI SUMMARY  🔒</Text>
          <Text style={[styles.aiBody, { color: '#FFFFFF' }]}>
            {record.aiSummary}
          </Text>
          <Text style={[styles.aiNotice, { color: 'rgba(255, 255, 255, 0.6)', borderTopColor: 'rgba(255, 255, 255, 0.15)' }]}>This summary is AI-generated and cannot be edited</Text>
        </View>

      </ScrollView>

      {/* Action Footer Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {hasMismatch ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.discardButton, { borderColor: colors.error }]} 
              onPress={handleDiscard}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Trash2 size={16} color={colors.error} />
                  <Text style={[styles.discardText, { color: colors.error }]}>View General Summary (Discard)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleConfirm}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={16} color="#FFFFFF" />
                  <Text style={styles.saveText}>Import Anyway</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Button 
            title="Review Metadata & Save" 
            onPress={handleConfirm} 
            isLoading={isSaving}
            style={{ width: '100%' }} 
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { ...Typography.body, textAlign: 'center', marginTop: 40 },
  topBanner: { padding: 16, alignItems: 'center' },
  bannerText: { ...Typography.body, fontFamily: 'DMSans_600SemiBold' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  detailsCard: { marginBottom: 20 },
  detailsTitle: { ...Typography.h3, marginBottom: 4 },
  detailsSubtitle: { ...Typography.small },
  sectionTitle: { ...Typography.h3, marginBottom: 16 },
  valueCard: { marginBottom: 12 },
  valueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  valueName: { ...Typography.body, fontFamily: 'DMSans_500Medium' },
  valueText: { ...Typography.h3 },
  unitText: { ...Typography.small },
  referenceText: { ...Typography.tiny, marginLeft: 18 },
  historicalCard: { padding: 8, borderRadius: 6, marginTop: 12, marginLeft: 18 },
  historicalText: { ...Typography.small },
  aiSummaryBlock: { borderRadius: 16, padding: 20, marginTop: 24 },
  aiLabel: { ...Typography.tiny, fontFamily: 'DMSans_600SemiBold', marginBottom: 12 },
  aiBody: { ...Typography.body, lineHeight: 24 },
  aiNotice: { ...Typography.tiny, marginTop: 16, borderTopWidth: 1, paddingTop: 12 },
  
  mismatchBanner: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    padding: 16, 
    borderWidth: 1.5, 
    borderRadius: 12, 
    marginHorizontal: 20, 
    marginTop: 16 
  },
  bannerIcon: { marginRight: 12, marginTop: 2 },
  bannerTextContainer: { flex: 1 },
  mismatchTitle: { ...Typography.h4, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  mismatchDesc: { ...Typography.small, lineHeight: 18 },

  syncCard: { 
    padding: 16, 
    borderWidth: 1.5, 
    borderRadius: 12, 
    marginBottom: 20 
  },
  syncHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  syncTitle: { ...Typography.h4, fontFamily: 'DMSans_700Bold' },
  syncSubtitle: { ...Typography.small, lineHeight: 18, marginBottom: 12 },
  syncItems: { gap: 10 },
  syncItemRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  syncItemText: { ...Typography.small, flex: 1, lineHeight: 18 },

  footer: { padding: 20, borderTopWidth: 1 },
  buttonContainer: { flexDirection: 'row', gap: 12, width: '100%' },
  discardButton: { 
    flex: 1.2, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 14, 
    borderWidth: 1.5, 
    borderRadius: 12 
  },
  saveButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 14, 
    borderRadius: 12 
  },
  discardText: { ...Typography.small, fontFamily: 'DMSans_600SemiBold', textAlign: 'center' },
  saveText: { ...Typography.small, fontFamily: 'DMSans_600SemiBold', color: '#FFFFFF' },
});
