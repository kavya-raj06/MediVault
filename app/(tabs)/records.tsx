import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Colors, Typography, useColors } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { useRouter } from 'expo-router';
import { Search, FileText, ImageIcon, Activity, File } from 'lucide-react-native';
import { RecordType } from '../../types';

export default function RecordsScreen() {
  const { records } = useStore();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const router = useRouter();

  const categories = ['All', 'Lab Result', 'Imaging & Scans', 'Medical History', 'Documents'];

  const getRecordIcon = (type: RecordType) => {
    switch (type) {
      case 'Lab Result': return <Activity size={20} color={colors.primary} />;
      case 'Imaging & Scans': return <ImageIcon size={20} color={'#2196F3'} />;
      case 'Medical History': return <Activity size={20} color={'#22A06B'} />;
      case 'Documents': return <File size={20} color={'#F59E0B'} />;
      default: return <FileText size={20} color={colors.textSecondary} />;
    }
  };

  const getAccentColor = (type: RecordType) => {
    switch (type) {
      case 'Lab Result': return colors.primary;
      case 'Imaging & Scans': return '#2196F3';
      case 'Medical History': return '#22A06B';
      case 'Documents': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.reportName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || record.reportType === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const renderRecordCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/record/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.cardAccent, { backgroundColor: getAccentColor(item.reportType) }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryPale }]}>
            {getRecordIcon(item.reportType)}
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.reportName, { color: colors.textPrimary }]} numberOfLines={1}>{item.reportName}</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{item.scanDate}</Text>
          </View>
        </View>
        <View style={styles.tagsRow}>
          {item.aiProcessed && <Badge label="AI ANALYSED" variant="ai" style={styles.badge} />}
          {!item.aiProcessed && <Badge label="PENDING ANALYSIS" variant="pending" style={styles.badge} />}
          {item.tags.slice(0, 2).map((tag: string) => (
            <Badge key={tag} label={tag} variant="default" style={styles.badge} />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryPale }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Input 
          placeholder="Search records..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchContainer}
        />
        
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.categoryTab, activeCategory === item && { borderBottomColor: colors.primary }]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[
                styles.categoryText, 
                { color: activeCategory === item ? colors.textPrimary : colors.textSecondary },
                activeCategory === item && { fontFamily: 'DMSans_700Bold' }
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryContainer}
        />
      </View>

      <FlatList 
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderRecordCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No records yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tap the scan button to add your first report</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryPale },
  header: { backgroundColor: Colors.surface, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchContainer: { paddingHorizontal: 20, marginBottom: 0 },
  categoryList: { maxHeight: 50, marginTop: 12 },
  categoryContainer: { paddingHorizontal: 20, gap: 12, alignItems: 'center' },
  categoryTab: { paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  categoryTabActive: { borderBottomColor: Colors.primary },
  categoryText: { ...Typography.body, color: Colors.textSecondary },
  categoryTextActive: { color: Colors.textPrimary, fontFamily: 'DMSans_700Bold' },
  listContent: { padding: 20, gap: 16, paddingBottom: 100 },
  recordCard: { backgroundColor: Colors.surface, borderRadius: 16, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, elevation: 2, shadowColor: Colors.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryPale, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  reportName: { ...Typography.body, fontFamily: 'DMSans_600SemiBold', color: Colors.textPrimary, marginBottom: 2 },
  dateText: { ...Typography.small, color: Colors.textSecondary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { marginRight: 0 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
