import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Colors, Typography, useColors } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/Card';
import { useRouter } from 'expo-router';

export default function TimelineScreen() {
  const { timeline } = useStore();
  const colors = useColors();
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Lab Result', 'Imaging & Scans', 'Condition'];

  const filteredTimeline = timeline.filter(event => 
    filter === 'All' || event.type === filter
  );

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'Lab Result': return colors.primary;
      case 'Imaging & Scans': return '#2196F3';
      case 'Medical History': return '#22A06B';
      case 'Documents': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const renderEvent = ({ item, index }: { item: any, index: number }) => (
    <View style={styles.eventRow}>
      {/* Timeline Line & Dot */}
      <View style={styles.timelineColumn}>
        <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
        {index !== filteredTimeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
      </View>

      {/* Event Card */}
      <Card style={styles.eventCard}>
        <TouchableOpacity 
          onPress={() => router.push(`/record/${item.recordId}`)}
          activeOpacity={0.7}
          style={styles.cardContent}
        >
          <View style={[styles.cardAccent, { backgroundColor: getAccentColor(item.type) }]} />
          <View style={styles.cardInner}>
            <Text style={[styles.eventDate, { color: colors.textSecondary }]}>{item.date}</Text>
            <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{item.reportName}</Text>
            <Text style={[styles.eventSnippet, { color: colors.textSecondary }]}>{item.snippet}</Text>
          </View>
        </TouchableOpacity>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryPale }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Health Timeline</Text>
        
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.filterPill, 
                { backgroundColor: colors.primaryMuted },
                filter === item && { backgroundColor: colors.primary }
              ]}
              onPress={() => setFilter(item)}
            >
              <Text style={[
                styles.filterText, 
                { color: filter === item ? colors.textOnPrimary : colors.primary }
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.filterList}
          contentContainerStyle={styles.filterContainer}
        />
      </View>

      <FlatList
        data={filteredTimeline}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryPale },
  header: { padding: 20, paddingTop: 40, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 16 },
  filterList: { maxHeight: 40 },
  filterContainer: { gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.primaryMuted },
  filterPillActive: { backgroundColor: Colors.primary },
  filterText: { ...Typography.small, color: Colors.primary, fontFamily: 'DMSans_500Medium' },
  filterTextActive: { color: Colors.surface },
  listContent: { padding: 20, paddingBottom: 100 },
  eventRow: { flexDirection: 'row', marginBottom: 20 },
  timelineColumn: { width: 30, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 12, zIndex: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, position: 'absolute', top: 24, bottom: -32, zIndex: 1 },
  eventCard: { flex: 1, padding: 0, overflow: 'hidden' },
  cardContent: { flexDirection: 'row' },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 16 },
  eventDate: { ...Typography.tiny, color: Colors.textSecondary, marginBottom: 4 },
  eventTitle: { ...Typography.body, fontFamily: 'DMSans_600SemiBold', color: Colors.textPrimary, marginBottom: 8 },
  eventSnippet: { ...Typography.small, color: Colors.textSecondary, lineHeight: 20 },
});
