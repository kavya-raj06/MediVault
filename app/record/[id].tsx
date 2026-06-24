import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, useColors } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Edit2, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';

const DOCUMENT_IMAGES: Record<string, any> = {
  evergreen: require('../../assets/images/evergreen_report.png'),
  general: require('../../assets/images/general_report.png'),
  cbc: require('../../assets/images/cbc_report.png'),
  sugar: require('../../assets/images/sugar_report.png'),
  bp: require('../../assets/images/bp_report.png'),
  thyroid: require('../../assets/images/thyroid_report.png'),
  lipid: require('../../assets/images/lipid_report.png'),
  xray: require('../../assets/images/xray_report.png'),
};

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const theme = useStore((state) => state.theme);
  const { records, updateRecord } = useStore();
  
  const record = records.find(r => r.id === id);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(record?.reportName || '');
  const [notesVal, setNotesVal] = useState(record?.doctorNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isDocExpanded, setIsDocExpanded] = useState(true); // Open by default for awesome instant feedback!

  if (!record) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryPale }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Record not found</Text>
      </SafeAreaView>
    );
  }

  const handleNameSave = () => {
    updateRecord(record.id, { reportName: nameVal });
    setIsEditingName(false);
  };

  const handleNotesSave = () => {
    updateRecord(record.id, { doctorNotes: notesVal });
    setIsEditingNotes(false);
  };

  const renderMetadataRow = (label: string, value: string | undefined, isAlt = false) => (
    <View style={[
      styles.metaRow, 
      { borderTopColor: colors.border },
      isAlt && { backgroundColor: theme === 'dark' ? colors.primaryPale : colors.primaryPale }
    ]}>
      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{value || '--'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryPale }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        {isEditingName ? (
          <TextInput 
            style={[styles.nameInput, { color: colors.textPrimary, borderBottomColor: colors.primary }]} 
            value={nameVal} 
            onChangeText={setNameVal} 
            onBlur={handleNameSave}
            autoFocus
          />
        ) : (
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{record.reportName}</Text>
            <TouchableOpacity onPress={() => setIsEditingName(true)}>
              <Edit2 size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {/* Metadata Table */}
        <View style={[styles.tableContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.tableHeader, { backgroundColor: colors.dark }]}>
            <Text style={[styles.tableHeaderText, { color: colors.surface }]}>Report Details</Text>
          </View>
          {renderMetadataRow('Report Date', record.reportDate)}
          {renderMetadataRow('Report Type', record.reportType, true)}
          {renderMetadataRow('Body Part', record.bodyPart)}
          {renderMetadataRow('Condition', record.detectedCondition, true)}
          {renderMetadataRow('Hospital/Lab', record.labHospital)}
          {renderMetadataRow('Referring Dr', record.referringDoctor, true)}
        </View>

        {/* Collapsible Scanned Document Card */}
        {record.fileUri && (DOCUMENT_IMAGES[record.fileUri] || record.fileUri.startsWith('file://') || record.fileUri.startsWith('content://') || record.fileUri.includes('/')) && (
          <View style={[styles.documentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.documentHeader}
              onPress={() => setIsDocExpanded(!isDocExpanded)}
              activeOpacity={0.8}
            >
              <View style={styles.documentTitleRow}>
                <FileText size={20} color={colors.primary} />
                <Text style={[styles.documentTitle, { color: colors.textPrimary }]}>Original Scanned Document</Text>
              </View>
              {isDocExpanded ? (
                <ChevronUp size={20} color={colors.primary} />
              ) : (
                <ChevronDown size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
            
            {isDocExpanded && (
              <View style={[styles.documentImageContainer, { borderTopColor: colors.border }]}>
                <Image 
                  source={
                    DOCUMENT_IMAGES[record.fileUri] 
                      ? DOCUMENT_IMAGES[record.fileUri] 
                      : { uri: record.fileUri }
                  } 
                  style={styles.scannedImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        )}

        {/* AI Summary Block */}
        {record.aiProcessed && (
          <View style={[styles.aiSummaryBlock, { backgroundColor: colors.dark }]}>
            <Text style={[styles.aiLabel, { color: colors.primary }]}>AI SUMMARY  🔒</Text>
            <Text style={[styles.aiBody, { color: '#FFFFFF' }]}>{record.aiSummary}</Text>
            <Text style={[styles.aiNotice, { color: 'rgba(255, 255, 255, 0.6)', borderTopColor: 'rgba(255, 255, 255, 0.15)' }]}>This summary is AI-generated and cannot be edited</Text>
          </View>
        )}

        {/* Doctor Notes Block */}
        <View style={[
          styles.notesBlock, 
          { backgroundColor: colors.surface, borderColor: colors.border },
          isEditingNotes && { borderColor: colors.primary, borderStyle: 'solid' }
        ]}>
          <View style={styles.notesHeader}>
            <Text style={[styles.notesLabel, { color: colors.primary }]}>YOUR NOTES <Edit2 size={12} color={colors.primary} /></Text>
          </View>
          <TextInput
            style={[styles.notesInput, { color: colors.textPrimary }]}
            value={notesVal}
            onChangeText={setNotesVal}
            onFocus={() => setIsEditingNotes(true)}
            onBlur={handleNotesSave}
            multiline
            placeholder="Add personal context or doctor advice here..."
            placeholderTextColor={colors.textDisabled}
          />
        </View>

        <Text style={[styles.scanTimestamp, { color: colors.textSecondary }]}>
          Scanned on {record.scanDate} at {record.scanTime}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { ...Typography.body, textAlign: 'center', marginTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1 },
  backButton: { marginRight: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  title: { ...Typography.h2, flexShrink: 1 },
  nameInput: { ...Typography.h2, flex: 1, borderBottomWidth: 1, padding: 0 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  tableContainer: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, marginBottom: 24 },
  tableHeader: { padding: 12 },
  tableHeaderText: { ...Typography.small, fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1 },
  metaLabel: { ...Typography.small, fontFamily: 'DMSans_500Medium', flex: 1 },
  metaValue: { ...Typography.small, flex: 1.5 },
  
  documentCard: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, marginBottom: 24 },
  documentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  documentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  documentTitle: { ...Typography.body, fontFamily: 'DMSans_600SemiBold' },
  documentImageContainer: { borderTopWidth: 1, padding: 12, alignItems: 'center', justifyContent: 'center' },
  scannedImage: { width: '100%', height: 450, borderRadius: 8 },

  aiSummaryBlock: { borderRadius: 16, padding: 20, marginBottom: 24 },
  aiLabel: { ...Typography.tiny, fontFamily: 'DMSans_600SemiBold', marginBottom: 12 },
  aiBody: { ...Typography.body, lineHeight: 24 },
  aiNotice: { ...Typography.tiny, marginTop: 16, borderTopWidth: 1, paddingTop: 12 },
  notesBlock: { borderRadius: 16, padding: 20, borderWidth: 1.5, borderStyle: 'dashed' },
  notesHeader: { marginBottom: 12 },
  notesLabel: { ...Typography.tiny, fontFamily: 'DMSans_600SemiBold' },
  notesInput: { ...Typography.body, minHeight: 100, textAlignVertical: 'top' },
  scanTimestamp: { ...Typography.tiny, textAlign: 'right', marginTop: 24, opacity: 0.6, fontStyle: 'italic' },
});
