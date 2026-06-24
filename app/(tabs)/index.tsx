import { useNavigation } from 'expo-router';
import { Activity, Calendar, Check, ChevronDown, ChevronRight, ChevronUp, Clock, Droplets, Heart, Info, Lock, Moon, Phone, Plus, QrCode, Ruler, Scale, Share2, ShieldAlert, ShieldCheck, Sparkles, Sun, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors, Shadows, Typography, useColors } from '../../constants/theme';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';

export default function DashboardScreen() {
  const { profile, theme, toggleTheme } = useStore();
  const colors = useColors();
  console.log('[DashboardScreen] theme:', theme, 'colors.textPrimary:', colors.textPrimary, 'colors.textSecondary:', colors.textSecondary);
  const navigation = useNavigation();

  const dynamicStyles = {
    modalTitle: [styles.modalTitle, { color: colors.textPrimary }],
    inputLabel: [styles.inputLabel, { color: colors.textSecondary }],
    formInput: [styles.formInput, {
      backgroundColor: colors.primaryPale,
      borderColor: colors.border,
      color: colors.textPrimary
    }],
    disabledInput: [styles.disabledInput, {
      backgroundColor: theme === 'dark' ? '#161B2C' : '#ECEFF1',
      color: colors.textSecondary,
      borderColor: theme === 'dark' ? '#1E293B' : '#CFD8DC'
    }],
    tabSelector: [styles.tabSelector, { backgroundColor: colors.primaryPale }],
    tabButtonActive: [styles.tabButtonActive, { backgroundColor: colors.surface }],
    tabButtonText: [styles.tabButtonText, { color: colors.textSecondary }],
    tabButtonTextActive: [styles.tabButtonTextActive, { color: colors.primary }],
    contextPill: [styles.contextPill, {
      backgroundColor: colors.primaryPale,
      borderColor: colors.border
    }],
    contextPillActive: [styles.contextPillActive, {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    }],
    contextPillText: [styles.contextPillText, { color: colors.textSecondary }],
    contextPillTextActive: [styles.contextPillTextActive, { color: colors.surface }],
    closeBtnText: [styles.closeBtnText, { color: colors.textSecondary }],
    drawerHandle: [styles.drawerHandle, { backgroundColor: colors.primaryMuted }],
    modalFooter: [styles.modalFooter, { borderTopColor: colors.border }],
  };

  // Vitals state
  const [bloodPressureReadings, setBloodPressureReadings] = useState<any[]>([]);
  const [glucoseReadings, setGlucoseReadings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'BloodPressure' | 'Glucose'>('BloodPressure');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAllergiesModalVisible, setIsAllergiesModalVisible] = useState(false);
  const [bpHistoryExpanded, setBpHistoryExpanded] = useState(false);
  const [glucoseHistoryExpanded, setGlucoseHistoryExpanded] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Form states
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bpPulse, setBpPulse] = useState('');
  const [bpNotes, setBpNotes] = useState('');

  const [glucoseValue, setGlucoseValue] = useState('');
  const [glucoseContext, setGlucoseContext] = useState<'Fasting' | 'Post-meal' | 'Random' | 'Bedtime'>('Fasting');
  const [glucoseNotes, setGlucoseNotes] = useState('');

  // Welcome Board & Emergency Card & Share states
  const [isWelcomeBoardVisible, setIsWelcomeBoardVisible] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(1);
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);

  // Onboarding Form States
  const [obName, setObName] = useState('');
  const [obDob, setObDob] = useState('');
  const [obPhone, setObPhone] = useState('');
  const [obGender, setObGender] = useState('Male');
  const [obHeight, setObHeight] = useState('');
  const [obWeight, setObWeight] = useState('');
  const [obBloodType, setObBloodType] = useState('O+');

  // Allergies & Conditions input tags
  const [obAllergyInput, setObAllergyInput] = useState('');
  const [obAllergies, setObAllergies] = useState<string[]>([]);
  const [obConditionInput, setObConditionInput] = useState('');
  const [obConditions, setObConditions] = useState<string[]>([]);

  // Onboarding Emergency Contact Form States
  const [obEcName, setObEcName] = useState('');
  const [obEcAge, setObEcAge] = useState('');
  const [obEcPhone, setObEcPhone] = useState('');
  const [obEcRelation, setObEcRelation] = useState('Spouse');
  const [obEcNotes, setObEcNotes] = useState('');

  // Trigger onboarding automatically on complete fresh profiles
  useEffect(() => {
    if (profile && !profile.name) {
      setIsWelcomeBoardVisible(true);
    }
  }, [profile]);

  const handleAddAllergy = () => {
    if (obAllergyInput.trim()) {
      if (!obAllergies.includes(obAllergyInput.trim())) {
        setObAllergies([...obAllergies, obAllergyInput.trim()]);
      }
      setObAllergyInput('');
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    setObAllergies(obAllergies.filter(a => a !== allergy));
  };

  const handleAddCondition = () => {
    if (obConditionInput.trim()) {
      if (!obConditions.includes(obConditionInput.trim())) {
        setObConditions([...obConditions, obConditionInput.trim()]);
      }
      setObConditionInput('');
    }
  };

  const handleRemoveCondition = (cond: string) => {
    setObConditions(obConditions.filter(c => c !== cond));
  };

  // Complete onboarding profile save
  const handleCompleteOnboarding = async () => {
    if (!obName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }
    if (!obPhone.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number.');
      return;
    }
    if (!obEcName.trim() || !obEcPhone.trim()) {
      Alert.alert('Emergency Contact Required', 'Please enter emergency contact name and phone number.');
      return;
    }

    try {
      setIsSaving(true);
      const updates = {
        name: obName.trim(),
        dob: obDob.trim(),
        gender: obGender,
        height: obHeight.trim(),
        weight: obWeight.trim(),
        bloodType: obBloodType,
        allergies: obAllergies,
        conditions: obConditions,
        emergencyContact: {
          name: obEcName.trim(),
          phone: obEcPhone.trim(),
          age: obEcAge.trim(),
          relation: obEcRelation,
          notes: obEcNotes.trim()
        }
      };

      await useStore.getState().setProfile(updates);
      setIsWelcomeBoardVisible(false);
      Alert.alert('🔒 MediVault Secured', 'Welcome to MediVault! Your medical profile baseline is now fully secured.');
    } catch (error: any) {
      console.error('[Onboarding Error]:', error.message);
      Alert.alert('Setup Failed', 'Failed to complete profile setup. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatBloodType = (bt?: string | null) => {
    if (!bt) return undefined;
    if (bt.endsWith('+') || bt.endsWith('-')) {
      return `${bt}ve`;
    }
    return bt;
  };

  const handleNativeShare = async () => {
    try {
      const allergiesList = profile?.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None';
      const conditionsList = profile?.conditions && profile.conditions.length > 0 ? profile.conditions.join(', ') : 'None';
      const ecInfo = profile?.emergencyContact?.name
        ? `${profile.emergencyContact.name} (${profile.emergencyContact.relation || 'Emergency Contact'}): ${profile.emergencyContact.phone}`
        : 'None';

      const shareContent = `🔒 [MediVault Emergency Medical Card]
Patient: ${profile?.name || 'User Name'}
Blood Type: ${formatBloodType(profile?.bloodType) || '--'}
Height & Weight: ${profile?.height ? `${profile.height} cm` : '--'}, ${profile?.weight ? `${profile.weight} kg` : '--'}
Known Allergies: ${allergiesList}
Chronic Conditions: ${conditionsList}
Emergency Contact: ${ecInfo}

Decryption Handshake QR Code enabled inside app for authorized clinical paramedics.`;

      const result = await Share.share({
        message: shareContent,
        title: 'MediVault Encrypted Emergency Card',
      });

      if (result.action === Share.sharedAction) {
        setIsEmergencyModalVisible(false);
      }
    } catch (error: any) {
      Alert.alert('Sharing Failed', error.message);
    }
  };

  // Fetch vitals function
  const fetchVitals = async () => {
    try {
      setIsLoading(true);
      const bpTrends = await api.getVitalTrends('BloodPressure', '90d');
      const glucoseTrends = await api.getVitalTrends('Glucose', '90d');
      setBloodPressureReadings(bpTrends || []);
      setGlucoseReadings(glucoseTrends || []);
    } catch (error: any) {
      console.error('[Dashboard Vitals Fetch Error]:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to navigation focus events to reload data dynamically
  useEffect(() => {
    fetchVitals();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVitals();
    });
    return unsubscribe;
  }, [navigation]);

  // Open modal pre-selecting a specific vital
  const handleOpenLog = (type: 'BloodPressure' | 'Glucose') => {
    setActiveTab(type);
    setIsModalVisible(true);
  };

  // Reset all forms
  const resetForm = () => {
    setBpSystolic('');
    setBpDiastolic('');
    setBpPulse('');
    setBpNotes('');
    setGlucoseValue('');
    setGlucoseContext('Fasting');
    setGlucoseNotes('');
  };

  // Save vital handler
  const handleSaveVital = async () => {
    if (activeTab === 'BloodPressure') {
      const sysVal = parseInt(bpSystolic);
      const diaVal = parseInt(bpDiastolic);
      const pulseVal = bpPulse ? parseInt(bpPulse) : undefined;

      if (isNaN(sysVal) || sysVal <= 30 || sysVal >= 300) {
        Alert.alert('Invalid Systolic', 'Please enter a valid systolic pressure between 30 and 300 mmHg.');
        return;
      }
      if (isNaN(diaVal) || diaVal <= 20 || diaVal >= 200) {
        Alert.alert('Invalid Diastolic', 'Please enter a valid diastolic pressure between 20 and 200 mmHg.');
        return;
      }
      if (pulseVal !== undefined && (isNaN(pulseVal) || pulseVal <= 30 || pulseVal >= 250)) {
        Alert.alert('Invalid Pulse', 'Please enter a valid pulse rate between 30 and 250 bpm.');
        return;
      }

      try {
        setIsSaving(true);
        await api.logVital({
          type: 'BloodPressure',
          bpSystolic: sysVal,
          bpDiastolic: diaVal,
          bpPulse: pulseVal,
          notes: bpNotes || 'Logged manually'
        });
        setIsModalVisible(false);
        resetForm();
        await fetchVitals();
        Alert.alert('Success', 'Blood Pressure vital logged successfully.');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to save vital entry.');
      } finally {
        setIsSaving(false);
      }
    } else {
      const glucVal = parseFloat(glucoseValue);

      if (isNaN(glucVal) || glucVal <= 10 || glucVal >= 600) {
        Alert.alert('Invalid Glucose', 'Please enter a valid blood glucose level between 10 and 600 mg/dL.');
        return;
      }

      try {
        setIsSaving(true);
        await api.logVital({
          type: 'Glucose',
          glucoseValue: glucVal,
          glucoseContext: glucoseContext,
          notes: glucoseNotes || 'Logged manually'
        });
        setIsModalVisible(false);
        resetForm();
        await fetchVitals();
        Alert.alert('Success', 'Blood Glucose vital logged successfully.');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to save vital entry.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Status Badge Logic
  const getBPStatus = (sys: number, dia: number) => {
    if (sys < 90 || dia < 60) return { label: 'LOW (HYPO)', color: Colors.info, bg: '#E3F2FD' };
    if (sys >= 90 && sys < 120 && dia >= 60 && dia < 80) return { label: 'NORMAL', color: Colors.success, bg: '#EAF6F0' };
    if (sys >= 120 && sys < 130 && dia < 80) return { label: 'ELEVATED', color: Colors.warning, bg: '#FEF8EC' };
    if ((sys >= 130 && sys < 140) || (dia >= 80 && dia < 90)) return { label: 'STAGE 1 HTN', color: Colors.primarySoft, bg: '#FDF1F5' };
    return { label: 'STAGE 2 HTN', color: Colors.error, bg: '#FCECEC' };
  };

  const getGlucoseStatus = (value: number, context: string) => {
    const isFasting = context === 'Fasting';
    if (value < 70) return { label: 'CRITICAL LOW', color: Colors.error, bg: '#FCECEC' };
    if (isFasting) {
      if (value >= 70 && value < 100) return { label: 'NORMAL', color: Colors.success, bg: '#EAF6F0' };
      if (value >= 100 && value < 126) return { label: 'PRE-DIABETIC', color: Colors.warning, bg: '#FEF8EC' };
      return { label: 'DIABETIC', color: Colors.error, bg: '#FCECEC' };
    } else {
      if (value >= 70 && value < 140) return { label: 'NORMAL', color: Colors.success, bg: '#EAF6F0' };
      if (value >= 140 && value < 200) return { label: 'PRE-DIABETIC', color: Colors.warning, bg: '#FEF8EC' };
      return { label: 'DIABETIC', color: Colors.error, bg: '#FCECEC' };
    }
  };

  const getBPMeterPercentage = (sys: number, dia: number) => {
    if (sys < 90 || dia < 60) {
      const worstRatio = Math.min(sys / 90, dia / 60);
      return Math.max(10, worstRatio * 25);
    }
    if (sys >= 140 || dia >= 90) {
      const excess = Math.max((sys - 140) / 60, (dia - 90) / 40);
      return 85 + Math.min(15, excess * 15);
    }
    if ((sys >= 130 && sys < 140) || (dia >= 80 && dia < 90)) {
      const progress = Math.max((sys - 130) / 10, (dia - 80) / 10);
      return 70 + progress * 15;
    }
    if (sys >= 120 && sys < 130 && dia < 80) {
      const progress = (sys - 120) / 10;
      return 50 + progress * 20;
    }
    const sysProgress = (sys - 90) / 30;
    const diaProgress = (dia - 60) / 20;
    const progress = Math.max(sysProgress, diaProgress);
    return 25 + progress * 25;
  };

  const getGlucoseMeterPercentage = (value: number, context: string) => {
    const isFasting = context === 'Fasting';
    if (value < 70) {
      return Math.max(10, (value / 70) * 25);
    }
    if (isFasting) {
      if (value >= 70 && value < 100) {
        return 25 + ((value - 70) / 30) * 25;
      }
      if (value >= 100 && value < 126) {
        return 50 + ((value - 100) / 26) * 25;
      }
      return 75 + Math.min(25, ((value - 126) / 150) * 25);
    } else {
      if (value >= 70 && value < 140) {
        return 25 + ((value - 70) / 70) * 25;
      }
      if (value >= 140 && value < 200) {
        return 50 + ((value - 140) / 60) * 25;
      }
      return 75 + Math.min(25, ((value - 200) / 150) * 25);
    }
  };

  // Dynamic AI Trend Summaries
  const getBPAITrendSummary = (readings: any[]) => {
    if (readings.length === 0) return 'No blood pressure logs recorded yet. Tap + Log to start.';
    if (readings.length === 1) return '🫀 First BP log recorded. Future entries will track your cardiovascular trends.';

    const latest = readings[readings.length - 1];
    const prev = readings[readings.length - 2];

    const latestSys = latest.bpSystolic || 120;
    const prevSys = prev.bpSystolic || 120;
    const diff = latestSys - prevSys;

    if (diff > 5) {
      return '📈 Note: An upward trend in your systolic BP (+ ' + diff + ' mmHg) has been detected; monitor your rest.';
    } else if (diff < -5) {
      return '📉 Improving: Positive downward trend (- ' + Math.abs(diff) + ' mmHg) in blood pressure. Excellent control!';
    } else {
      return '🫀 Stable: Your cardiovascular metrics remain steady and well-maintained.';
    }
  };

  const getGlucoseAITrendSummary = (readings: any[]) => {
    if (readings.length === 0) return 'No glucose logs recorded yet. Tap + Log to start.';
    if (readings.length === 1) return '🍬 First glucose log recorded. Future entries will analyze glycemic trends.';

    const latest = readings[readings.length - 1];
    let prev = null;

    // Find the most recent reading of the same context
    for (let i = readings.length - 2; i >= 0; i--) {
      if (readings[i].glucoseContext === latest.glucoseContext) {
        prev = readings[i];
        break;
      }
    }

    if (!prev) {
      prev = readings[readings.length - 2];
    }

    const latestVal = latest.glucoseValue || 100;
    const prevVal = prev.glucoseValue || 100;
    const diff = latestVal - prevVal;

    if (diff > 10) {
      return `⚠️ Note: Upward trend in ${latest.glucoseContext.toLowerCase()} glucose (+${diff} mg/dL) detected.`;
    } else if (diff < -10) {
      return `🌱 Positive: encouraging glycemic drop (-${Math.abs(diff)} mg/dL) for ${latest.glucoseContext.toLowerCase()} state.`;
    } else {
      return `🍬 Stable: Your ${latest.glucoseContext.toLowerCase()} glucose remains stable and well-regulated.`;
    }
  };

  // Helper to format date
  const formatReadingDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return dateString;
    }
  };

  const currentHour = new Date().getHours();
  const greetingStr = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const latestBP = bloodPressureReadings[bloodPressureReadings.length - 1];
  const latestGlucose = glucoseReadings[glucoseReadings.length - 1];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.primaryPale }]}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: theme === 'light' ? colors.primaryMuted : colors.textPrimary }]}>{greetingStr}, {profile?.name?.split(' ')[0] || 'User'}</Text>
          <Text style={[styles.subtitle, { color: colors.primarySoft }]}>Here's your health summary</Text>
        </View>
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: colors.border
          }}
        >
          {theme === 'dark' ? (
            <Sun size={20} color={colors.primary} />
          ) : (
            <Moon size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.primaryPale }]} contentContainerStyle={styles.content}>

        {/* Emergency Banner */}
        <TouchableOpacity
          style={[styles.emergencyBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.border, borderWidth: 1 }]}
          activeOpacity={0.9}
          onPress={() => setIsEmergencyModalVisible(true)}
        >
          <View style={styles.emergencyLeft}>
            <Text style={[styles.emergencyTitle, { color: colors.textPrimary }]}>Emergency Medical Card</Text>
            <Text style={[styles.emergencySubtitle, { color: colors.textSecondary }]}>Tap to share instant profile secure QR code</Text>
          </View>
          <ChevronRight size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Health Summary Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll} contentContainerStyle={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
              <Droplets size={20} color={colors.primary} />
            </View>
            <Text style={[styles.summaryCardTitle, { color: colors.textSecondary }]}>Blood Type</Text>
            <Text style={[styles.summaryCardValue, { color: colors.textPrimary }]}>{profile?.bloodType || '--'}</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
              <Activity size={20} color={colors.primary} />
            </View>
            <Text style={[styles.summaryCardTitle, { color: colors.textSecondary }]}>Last BP</Text>
            <Text style={[styles.summaryCardValue, { fontSize: 18, color: colors.textPrimary }]} numberOfLines={1}>
              {latestBP ? `${latestBP.bpSystolic}/${latestBP.bpDiastolic}` : '--/--'}
            </Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
              <Sparkles size={20} color={colors.primary} />
            </View>
            <Text style={[styles.summaryCardTitle, { color: colors.textSecondary }]}>Last Glucose</Text>
            <Text style={[styles.summaryCardValue, { fontSize: 18, color: colors.textPrimary }]} numberOfLines={1}>
              {latestGlucose ? `${latestGlucose.glucoseValue} mg` : '--'}
            </Text>
          </Card>

          <TouchableOpacity activeOpacity={0.7} onPress={() => setIsAllergiesModalVisible(true)}>
            <Card style={styles.summaryCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
                <Heart size={20} color={colors.primary} />
              </View>
              <Text style={[styles.summaryCardTitle, { color: colors.textSecondary }]}>Allergies</Text>
              <Text style={[styles.summaryCardValue, { color: colors.textPrimary }]}>{profile?.allergies?.length || 0}</Text>
            </Card>
          </TouchableOpacity>
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trend Insights</Text>

        {/* 1. BLOOD PRESSURE CARD */}
        <Card style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <View style={styles.trendHeaderLeft}>
              <Text style={[styles.trendTitle, { color: colors.textPrimary }]}>Blood Pressure</Text>
              {latestBP && (
                <View style={[styles.statusBadge, { backgroundColor: getBPStatus(latestBP.bpSystolic, latestBP.bpDiastolic).bg }]}>
                  <Text style={[styles.statusBadgeText, { color: getBPStatus(latestBP.bpSystolic, latestBP.bpDiastolic).color }]}>
                    {getBPStatus(latestBP.bpSystolic, latestBP.bpDiastolic).label}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => handleOpenLog('BloodPressure')} style={[styles.logButton, { backgroundColor: colors.primaryMuted }]}>
              <Plus size={14} color={colors.primary} />
              <Text style={[styles.logText, { color: colors.primary }]}>Log</Text>
            </TouchableOpacity>
          </View>

          {/* Value Display */}
          {latestBP ? (
            <View style={styles.vitalValuesContainer}>
              <View style={styles.valueBlock}>
                <Text style={[styles.hugeValue, { color: colors.textPrimary }]}>{latestBP.bpSystolic}</Text>
                <Text style={[styles.valueUnit, { color: colors.textSecondary }]}>systolic mmHg</Text>
              </View>
              <View style={styles.valueSlash}><Text style={[styles.slashText, { color: colors.textSecondary }]}>/</Text></View>
              <View style={styles.valueBlock}>
                <Text style={[styles.hugeValue, { color: colors.textPrimary }]}>{latestBP.bpDiastolic}</Text>
                <Text style={[styles.valueUnit, { color: colors.textSecondary }]}>diastolic mmHg</Text>
              </View>
              {latestBP.bpPulse && (
                <View style={[styles.valueBlock, { marginLeft: 24, borderLeftWidth: 1.5, borderLeftColor: colors.border, paddingLeft: 24 }]}>
                  <Text style={[styles.hugeValue, { color: colors.primarySoft }]}>{latestBP.bpPulse}</Text>
                  <Text style={[styles.valueUnit, { color: colors.textSecondary }]}>pulse bpm</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.emptyVitalBlock, { backgroundColor: colors.primaryPale }]}>
              <Text style={[styles.emptyVitalText, { color: colors.textSecondary }]}>No Blood Pressure logged yet.</Text>
            </View>
          )}

          {/* Interactive Trend Bar Meter */}
          {latestBP && (
            <View style={styles.meterContainer}>
              <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>Cardiovascular Level Range Indicator:</Text>
              <View style={styles.meterBarBackground}>
                <View
                  style={[
                    styles.meterBarFill,
                    {
                      width: `${getBPMeterPercentage(latestBP.bpSystolic, latestBP.bpDiastolic)}%`,
                      backgroundColor: getBPStatus(latestBP.bpSystolic, latestBP.bpDiastolic).color
                    }
                  ]}
                />
              </View>
              <View style={styles.meterTicks}>
                <Text style={[styles.tickText, { color: colors.textSecondary }]}>Low</Text>
                <Text style={[styles.tickText, { color: colors.textSecondary }]}>Normal</Text>
                <Text style={[styles.tickText, { color: colors.textSecondary }]}>Elevated</Text>
                <Text style={[styles.tickText, { color: colors.textSecondary }]}>High</Text>
              </View>
            </View>
          )}

          {/* One-Line AI Trend Insight */}
          <View style={[styles.aiInsightRow, { backgroundColor: theme === 'dark' ? colors.primaryPale : '#FDF1F5' }]}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={[styles.aiInsightText, { color: colors.textPrimary }]}>{getBPAITrendSummary(bloodPressureReadings)}</Text>
          </View>

          {/* Chronological History Log */}
          {bloodPressureReadings.length > 0 && (
            <View style={[styles.historySection, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.historyToggle}
                onPress={() => setBpHistoryExpanded(!bpHistoryExpanded)}
                activeOpacity={0.7}
              >
                <Text style={[styles.historyToggleText, { color: colors.textSecondary }]}>
                  {bpHistoryExpanded ? 'Hide History Logs' : `Show History Logs (${bloodPressureReadings.length})`}
                </Text>
                {bpHistoryExpanded ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
              </TouchableOpacity>

              {bpHistoryExpanded && (
                <View style={styles.historyList}>
                  {bloodPressureReadings.slice().reverse().map((item) => {
                    const bpStatus = getBPStatus(item.bpSystolic, item.bpDiastolic);
                    const isExpanded = expandedItemId === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
                        onPress={() => setExpandedItemId(isExpanded ? null : item.id)}
                        style={[styles.historyItem, { flexDirection: 'column', alignItems: 'stretch', borderBottomColor: colors.border }]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <View style={styles.historyLeft}>
                            <Clock size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={[styles.historyDate, { color: colors.textPrimary }]}>{formatReadingDate(item.dateTime)}</Text>
                          </View>
                          <View style={styles.historyRight}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: bpStatus.color }} />
                              <Text style={[styles.historyValue, { color: colors.textPrimary }]}>
                                {item.bpSystolic}/{item.bpDiastolic} <Text style={{ fontSize: 10, color: colors.textSecondary }}>mmHg</Text>
                              </Text>
                            </View>
                            <Text style={[styles.historySource, { color: colors.textSecondary }]} numberOfLines={1}>
                              {item.notes && item.notes.includes('Auto-extracted') ? '🩺 Auto' : '👤 Manual'}
                            </Text>
                          </View>
                        </View>

                        {isExpanded && (
                          <View style={{
                            backgroundColor: colors.primaryMuted,
                            borderRadius: 10,
                            padding: 12,
                            marginTop: 10,
                            borderWidth: 1.5,
                            borderColor: colors.border,
                            width: '100%'
                          }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.textSecondary, width: '40%' }}>LEVEL INDICATOR</Text>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_700Bold', color: bpStatus.color, width: '55%', textAlign: 'right' }}>{bpStatus.label}</Text>
                            </View>
                            {item.bpPulse && (
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                                <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.textSecondary, width: '40%' }}>HEART RATE (PULSE)</Text>
                                <Text style={{ fontSize: 11, fontFamily: 'DMSans_700Bold', color: colors.textPrimary, width: '55%', textAlign: 'right' }}>{item.bpPulse} bpm</Text>
                              </View>
                            )}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.textSecondary, width: '40%' }}>CLINICAL NOTE</Text>
                              <Text style={{ fontSize: 12, color: colors.textPrimary, fontFamily: 'DMSans_400Regular', width: '55%', textAlign: 'right' }}>{item.notes || 'No notes added.'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.textSecondary, width: '40%' }}>TRIAGE ADVICE</Text>
                              <Text style={{ fontSize: 12, color: bpStatus.color, fontFamily: 'DMSans_500Medium', width: '55%', textAlign: 'right', lineHeight: 16 }}>
                                {bpStatus.label === 'NORMAL' ? 'Optimal limits. Maintain a balanced diet.' :
                                  bpStatus.label === 'ELEVATED' ? 'Warning: Pre-hypertension. Limit sodium & stress.' :
                                    bpStatus.label === 'STAGE 1 HTN' ? 'Stage 1 Hypertension. Focus on tracking & check with doctor.' :
                                      'CRITICAL HIGH! Rest immediately & seek emergency medical care.'}
                              </Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* 2. BLOOD GLUCOSE CARD */}
        <Card style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <View style={styles.trendHeaderLeft}>
              <Text style={[styles.trendTitle, { color: colors.textPrimary }]}>Blood Glucose</Text>
              {latestGlucose && (
                <View style={[styles.statusBadge, { backgroundColor: getGlucoseStatus(latestGlucose.glucoseValue, latestGlucose.glucoseContext).bg }]}>
                  <Text style={[styles.statusBadgeText, { color: getGlucoseStatus(latestGlucose.glucoseValue, latestGlucose.glucoseContext).color }]}>
                    {getGlucoseStatus(latestGlucose.glucoseValue, latestGlucose.glucoseContext).label}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => handleOpenLog('Glucose')} style={[styles.logButton, { backgroundColor: colors.primaryMuted }]}>
              <Plus size={14} color={colors.primary} />
              <Text style={[styles.logText, { color: colors.primary }]}>Log</Text>
            </TouchableOpacity>
          </View>

          {/* Value Display */}
          {latestGlucose ? (
            <View style={styles.glucoseValueRow}>
              <View style={styles.glucoseMainVal}>
                <Text style={[styles.hugeGlucose, { color: colors.textPrimary }]}>{latestGlucose.glucoseValue}</Text>
                <Text style={[styles.glucoseUnit, { color: colors.textSecondary }]}>mg/dL</Text>
              </View>
              <View style={[styles.glucoseContextTag, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.glucoseContextText, { color: colors.primary }]}>{latestGlucose.glucoseContext.toUpperCase()}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyVitalBlock, { backgroundColor: colors.primaryPale }]}>
              <Text style={[styles.emptyVitalText, { color: colors.textSecondary }]}>No Blood Glucose logged yet.</Text>
            </View>
          )}

          {/* Dynamic Glucose Meter */}
          {latestGlucose && (
            <View style={styles.meterContainer}>
              <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>Fasting / Post-Meal indicator:</Text>
              <View style={styles.meterBarBackground}>
                <View
                  style={[
                    styles.meterBarFill,
                    {
                      width: `${getGlucoseMeterPercentage(latestGlucose.glucoseValue, latestGlucose.glucoseContext)}%`,
                      backgroundColor: getGlucoseStatus(latestGlucose.glucoseValue, latestGlucose.glucoseContext).color
                    }
                  ]}
                />
              </View>
              <View style={styles.meterTicks}>
                <Text style={[styles.tickText, { color: colors.textSecondary }]}>Hypo</Text>
                <Text style={[styles.tickText, { color: colors.textSecondary }]}>Normal</Text>
                <Text style={[styles.tickText, { color: colors.textSecondary }]}>Pre-Diabetic</Text>
                <Text style={[styles.tickText, { color: colors.textSecondary }]}>Hyper</Text>
              </View>
            </View>
          )}

          {/* AI Glucose Insight */}
          <View style={[styles.aiInsightRow, { backgroundColor: theme === 'dark' ? colors.primaryPale : '#FDF1F5' }]}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={[styles.aiInsightText, { color: colors.textPrimary }]}>{getGlucoseAITrendSummary(glucoseReadings)}</Text>
          </View>

          {/* Glucose Chronological History */}
          {glucoseReadings.length > 0 && (
            <View style={[styles.historySection, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.historyToggle}
                onPress={() => setGlucoseHistoryExpanded(!glucoseHistoryExpanded)}
                activeOpacity={0.7}
              >
                <Text style={[styles.historyToggleText, { color: colors.textSecondary }]}>
                  {glucoseHistoryExpanded ? 'Hide History Logs' : `Show History Logs (${glucoseReadings.length})`}
                </Text>
                {glucoseHistoryExpanded ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
              </TouchableOpacity>

              {glucoseHistoryExpanded && (
                <View style={styles.historyList}>
                  {glucoseReadings.slice().reverse().map((item) => {
                    const sugarStatus = getGlucoseStatus(item.glucoseValue, item.glucoseContext);
                    const isExpanded = expandedItemId === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
                        onPress={() => setExpandedItemId(isExpanded ? null : item.id)}
                        style={[styles.historyItem, { flexDirection: 'column', alignItems: 'stretch', borderBottomColor: colors.border }]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <View style={styles.historyLeft}>
                            <Clock size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={[styles.historyDate, { color: colors.textPrimary }]}>{formatReadingDate(item.dateTime)}</Text>
                          </View>
                          <View style={styles.historyRight}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sugarStatus.color }} />
                              <Text style={[styles.historyValue, { color: colors.textPrimary }]}>
                                {item.glucoseValue} <Text style={{ fontSize: 10, color: colors.textSecondary }}>mg/dL</Text>
                                <Text style={{ fontSize: 10, fontFamily: 'DMSans_500Medium', color: colors.primary }}> ({item.glucoseContext})</Text>
                              </Text>
                            </View>
                            <Text style={[styles.historySource, { color: colors.textSecondary }]} numberOfLines={1}>
                              {item.notes && item.notes.includes('Auto-extracted') ? '🩺 Auto' : '👤 Manual'}
                            </Text>
                          </View>
                        </View>

                        {isExpanded && (
                          <View style={{
                            backgroundColor: colors.primaryMuted,
                            borderRadius: 10,
                            padding: 12,
                            marginTop: 10,
                            borderWidth: 1.5,
                            borderColor: colors.border,
                            width: '100%'
                          }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.textSecondary, width: '40%' }}>LEVEL INDICATOR</Text>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_700Bold', color: sugarStatus.color, width: '55%', textAlign: 'right' }}>{sugarStatus.label}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.textSecondary, width: '40%' }}>MEASUREMENT STATE</Text>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_700Bold', color: colors.textPrimary, width: '55%', textAlign: 'right' }}>{item.glucoseContext}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.textSecondary, width: '40%' }}>CLINICAL NOTE</Text>
                              <Text style={{ fontSize: 12, color: colors.textPrimary, fontFamily: 'DMSans_400Regular', width: '55%', textAlign: 'right' }}>{item.notes || 'No notes added.'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                              <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.textSecondary, width: '40%' }}>TRIAGE ADVICE</Text>
                              <Text style={{ fontSize: 12, color: sugarStatus.color, fontFamily: 'DMSans_500Medium', width: '55%', textAlign: 'right', lineHeight: 16 }}>
                                {sugarStatus.label === 'NORMAL' ? 'Glycemic metrics fully stable & well-regulated.' :
                                  sugarStatus.label === 'PRE-DIABETIC' ? 'Warning: Pre-diabetic levels. Reduce carbs & monitor.' :
                                    'CRITICAL SUGARS! Elevated range. Review meds & consult doctor.'}
                              </Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </Card>

      </ScrollView>

      {/* --- HIGH-FIDELITY GLASSMORPHISM BOTTOM MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
          />
          <View style={[styles.modalDrawer, { backgroundColor: theme === 'dark' ? colors.surface : '#FDF1F5' }]}>
            <View style={dynamicStyles.drawerHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Log Health Vital</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                <Text style={dynamicStyles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Segmented Control Selector */}
            <View style={dynamicStyles.tabSelector}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'BloodPressure' && dynamicStyles.tabButtonActive]}
                onPress={() => setActiveTab('BloodPressure')}
              >
                <Text style={[activeTab === 'BloodPressure' ? dynamicStyles.tabButtonTextActive : dynamicStyles.tabButtonText, { fontFamily: activeTab === 'BloodPressure' ? 'DMSans_600SemiBold' : 'DMSans_500Medium' }]}>
                  Blood Pressure
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'Glucose' && dynamicStyles.tabButtonActive]}
                onPress={() => setActiveTab('Glucose')}
              >
                <Text style={[activeTab === 'Glucose' ? dynamicStyles.tabButtonTextActive : dynamicStyles.tabButtonText, { fontFamily: activeTab === 'Glucose' ? 'DMSans_600SemiBold' : 'DMSans_500Medium' }]}>
                  Blood Glucose
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Panels */}
            {activeTab === 'BloodPressure' ? (
              <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.formRow}>
                  <View style={[styles.formCol, { marginRight: 12 }]}>
                    <Text style={dynamicStyles.inputLabel}>Systolic (upper) mmHg *</Text>
                    <TextInput
                      style={dynamicStyles.formInput}
                      keyboardType="numeric"
                      placeholder="e.g. 120"
                      placeholderTextColor={colors.textDisabled}
                      value={bpSystolic}
                      onChangeText={setBpSystolic}
                      maxLength={3}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={dynamicStyles.inputLabel}>Diastolic (lower) mmHg *</Text>
                    <TextInput
                      style={dynamicStyles.formInput}
                      keyboardType="numeric"
                      placeholder="e.g. 80"
                      placeholderTextColor={colors.textDisabled}
                      value={bpDiastolic}
                      onChangeText={setBpDiastolic}
                      maxLength={3}
                    />
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={dynamicStyles.inputLabel}>Pulse Rate (bpm) - optional</Text>
                  <TextInput
                    style={dynamicStyles.formInput}
                    keyboardType="numeric"
                    placeholder="e.g. 72"
                    placeholderTextColor={colors.textDisabled}
                    value={bpPulse}
                    onChangeText={setBpPulse}
                    maxLength={3}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={dynamicStyles.inputLabel}>Self Notes / Observation</Text>
                  <TextInput
                    style={[dynamicStyles.formInput, styles.multilineInput]}
                    placeholder="How do you feel? e.g. rested, after workout..."
                    placeholderTextColor={colors.textDisabled}
                    multiline={true}
                    numberOfLines={3}
                    value={bpNotes}
                    onChangeText={setBpNotes}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={dynamicStyles.inputLabel}>Recording Time</Text>
                  <TextInput
                    style={dynamicStyles.disabledInput}
                    editable={false}
                    value={`Now (${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`}
                  />
                </View>
              </ScrollView>
            ) : (
              <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.formCol}>
                  <Text style={dynamicStyles.inputLabel}>Blood Glucose Level (mg/dL) *</Text>
                  <TextInput
                    style={dynamicStyles.formInput}
                    keyboardType="numeric"
                    placeholder="e.g. 98"
                    placeholderTextColor={colors.textDisabled}
                    value={glucoseValue}
                    onChangeText={setGlucoseValue}
                    maxLength={3}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={dynamicStyles.inputLabel}>Testing Context / State *</Text>
                  <View style={styles.contextGrid}>
                    {(['Fasting', 'Post-meal', 'Random', 'Bedtime'] as const).map((ctx) => (
                      <TouchableOpacity
                        key={ctx}
                        style={[dynamicStyles.contextPill, glucoseContext === ctx && dynamicStyles.contextPillActive]}
                        onPress={() => setGlucoseContext(ctx)}
                      >
                        <Text style={[dynamicStyles.contextPillText, glucoseContext === ctx && dynamicStyles.contextPillTextActive]}>
                          {ctx}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={dynamicStyles.inputLabel}>Notes / Dietary intake</Text>
                  <TextInput
                    style={[dynamicStyles.formInput, styles.multilineInput]}
                    placeholder="e.g. 2 hours after heavy breakfast"
                    placeholderTextColor={colors.textDisabled}
                    multiline={true}
                    numberOfLines={3}
                    value={glucoseNotes}
                    onChangeText={setGlucoseNotes}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={dynamicStyles.inputLabel}>Recording Time</Text>
                  <TextInput
                    style={dynamicStyles.disabledInput}
                    editable={false}
                    value={`Now (${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`}
                  />
                </View>
              </ScrollView>
            )}

            {/* Action Save Button */}
            <View style={styles.modalFooter}>
              <Button
                title={isSaving ? 'Saving entry...' : 'Save Health Reading'}
                onPress={handleSaveVital}
                isLoading={isSaving}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* --- ALLERGIES VIEWER MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isAllergiesModalVisible}
        onRequestClose={() => setIsAllergiesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsAllergiesModalVisible(false)}
          />
          <View style={[styles.modalDrawer, { maxHeight: '65%', backgroundColor: theme === 'dark' ? colors.surface : '#FDF1F5' }]}>
            <View style={styles.drawerHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Heart size={22} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Registered Allergies</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAllergiesModalVisible(false)} style={styles.closeBtn}>
                <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.allergiesListContainer}>
              {profile?.allergies && profile.allergies.length > 0 ? (
                <View style={styles.allergiesGrid}>
                  {profile.allergies.map((allergy: string, idx: number) => (
                    <View key={idx} style={[styles.allergyCard, { backgroundColor: theme === 'dark' ? colors.primaryPale : '#FDF1F5', borderColor: colors.border }]}>
                      <View style={[styles.allergyBullet, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.allergyText, { color: colors.textPrimary }]}>{allergy}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyAllergiesState}>
                  <Heart size={40} color={colors.textDisabled} style={{ marginBottom: 12 }} />
                  <Text style={[styles.emptyAllergiesText, { color: colors.textPrimary }]}>No registered allergies found.</Text>
                  <Text style={[styles.emptyAllergiesSubText, { color: colors.textSecondary }]}>You can update allergies in your profile settings.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- PREMIUM WELCOME BOARD ONBOARDING MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isWelcomeBoardVisible}
        onRequestClose={() => { }} // Non-dismissible
      >
        <View style={styles.fullscreenOverlay}>
          <SafeAreaView style={styles.onboardingContainer}>
            <View style={styles.onboardingHeader}>
              <View style={styles.brandBadge}>
                <ShieldCheck size={20} color={Colors.primary} />
                <Text style={styles.brandBadgeText}>SECURE VAULT ENCRYPTION</Text>
              </View>
              <Text style={styles.onboardingTitle}>Welcome Board</Text>
              <Text style={styles.onboardingSubtitle}>Let's set up your clinical health baseline</Text>

              {/* Step indicator */}
              <View style={styles.stepIndicatorRow}>
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <View style={[
                      styles.stepCircle,
                      welcomeStep >= step && styles.stepCircleActive,
                      welcomeStep > step && styles.stepCircleCompleted
                    ]}>
                      {welcomeStep > step ? (
                        <Check size={14} color={Colors.surface} />
                      ) : (
                        <Text style={[styles.stepCircleText, welcomeStep >= step && styles.stepCircleTextActive]}>{step}</Text>
                      )}
                    </View>
                    {step < 3 && (
                      <View style={[
                        styles.stepLine,
                        welcomeStep > step && styles.stepLineActive
                      ]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            <ScrollView
              style={styles.onboardingScroll}
              contentContainerStyle={styles.onboardingScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* STEP 1: Personal Details */}
              {welcomeStep === 1 && (
                <View style={styles.onboardingStepContainer}>
                  <Text style={styles.stepTitle}>Step 1: Personal Profile</Text>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <View style={styles.obInputWrapper}>
                      <User size={18} color={Colors.textSecondary} style={styles.obInputIcon} />
                      <TextInput
                        style={styles.obFormInput}
                        placeholder="e.g. John Doe"
                        placeholderTextColor={Colors.textDisabled}
                        value={obName}
                        onChangeText={setObName}
                      />
                    </View>
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Date of Birth / Age *</Text>
                    <View style={styles.obInputWrapper}>
                      <Calendar size={18} color={Colors.textSecondary} style={styles.obInputIcon} />
                      <TextInput
                        style={styles.obFormInput}
                        placeholder="e.g. 12/04/1995 or 28"
                        placeholderTextColor={Colors.textDisabled}
                        value={obDob}
                        onChangeText={setObDob}
                      />
                    </View>
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Phone Number *</Text>
                    <View style={styles.obInputWrapper}>
                      <Phone size={18} color={Colors.textSecondary} style={styles.obInputIcon} />
                      <TextInput
                        style={styles.obFormInput}
                        placeholder="e.g. +91 98765 43210"
                        placeholderTextColor={Colors.textDisabled}
                        keyboardType="phone-pad"
                        value={obPhone}
                        onChangeText={setObPhone}
                      />
                    </View>
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Gender *</Text>
                    <View style={styles.genderRow}>
                      {['Male', 'Female', 'Other'].map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.genderPill, obGender === g && styles.genderPillActive]}
                          onPress={() => setObGender(g)}
                        >
                          <Text style={[styles.genderPillText, obGender === g && styles.genderPillTextActive]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formCol, { marginRight: 12 }]}>
                      <Text style={styles.inputLabel}>Height (cm) *</Text>
                      <View style={styles.obInputWrapper}>
                        <Ruler size={18} color={Colors.textSecondary} style={styles.obInputIcon} />
                        <TextInput
                          style={styles.obFormInput}
                          placeholder="e.g. 175"
                          placeholderTextColor={Colors.textDisabled}
                          keyboardType="numeric"
                          value={obHeight}
                          onChangeText={setObHeight}
                        />
                      </View>
                    </View>

                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Weight (kg) *</Text>
                      <View style={styles.obInputWrapper}>
                        <Scale size={18} color={Colors.textSecondary} style={styles.obInputIcon} />
                        <TextInput
                          style={styles.obFormInput}
                          placeholder="e.g. 70"
                          placeholderTextColor={Colors.textDisabled}
                          keyboardType="numeric"
                          value={obWeight}
                          onChangeText={setObWeight}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* STEP 2: Medical Baseline */}
              {welcomeStep === 2 && (
                <View style={styles.onboardingStepContainer}>
                  <Text style={styles.stepTitle}>Step 2: Clinical Baseline</Text>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Blood Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodTypeScroll} contentContainerStyle={styles.bloodTypeContainer}>
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bt) => (
                        <TouchableOpacity
                          key={bt}
                          style={[styles.bloodTypePill, obBloodType === bt && styles.bloodTypePillActive]}
                          onPress={() => setObBloodType(bt)}
                        >
                          <Text style={[styles.bloodTypePillText, obBloodType === bt && styles.bloodTypePillTextActive]}>{bt}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Tag Builders for Allergies */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Known Allergies (e.g. Penicillin, Peanuts)</Text>
                    <View style={styles.tagInputRow}>
                      <TextInput
                        style={styles.tagInput}
                        placeholder="Add allergy..."
                        placeholderTextColor={Colors.textDisabled}
                        value={obAllergyInput}
                        onChangeText={setObAllergyInput}
                        onSubmitEditing={handleAddAllergy}
                      />
                      <TouchableOpacity style={styles.tagAddBtn} onPress={handleAddAllergy}>
                        <Plus size={20} color={Colors.surface} />
                      </TouchableOpacity>
                    </View>

                    {obAllergies.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {obAllergies.map((allergy) => (
                          <View key={allergy} style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>{allergy}</Text>
                            <TouchableOpacity onPress={() => handleRemoveAllergy(allergy)} style={styles.tagRemoveBtn}>
                              <X size={12} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Tag Builders for Chronic Conditions */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Chronic Conditions (e.g. Asthma, Diabetes)</Text>
                    <View style={styles.tagInputRow}>
                      <TextInput
                        style={styles.tagInput}
                        placeholder="Add condition..."
                        placeholderTextColor={Colors.textDisabled}
                        value={obConditionInput}
                        onChangeText={setObConditionInput}
                        onSubmitEditing={handleAddCondition}
                      />
                      <TouchableOpacity style={styles.tagAddBtn} onPress={handleAddCondition}>
                        <Plus size={20} color={Colors.surface} />
                      </TouchableOpacity>
                    </View>

                    {obConditions.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {obConditions.map((cond) => (
                          <View key={cond} style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>{cond}</Text>
                            <TouchableOpacity onPress={() => handleRemoveCondition(cond)} style={styles.tagRemoveBtn}>
                              <X size={12} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* STEP 3: Emergency Contacts */}
              {welcomeStep === 3 && (
                <View style={styles.onboardingStepContainer}>
                  <Text style={styles.stepTitle}>Step 3: Paramedic & Emergency Contact</Text>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Contact Full Name *</Text>
                    <View style={styles.obInputWrapper}>
                      <User size={18} color={Colors.textSecondary} style={styles.obInputIcon} />
                      <TextInput
                        style={styles.obFormInput}
                        placeholder="e.g. Jane Doe"
                        placeholderTextColor={Colors.textDisabled}
                        value={obEcName}
                        onChangeText={setObEcName}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formCol, { marginRight: 12, flex: 1.5 }]}>
                      <Text style={styles.inputLabel}>Relation *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relationScroll} contentContainerStyle={styles.relationContainer}>
                        {['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Guardian', 'Doctor', 'Other'].map((rel) => (
                          <TouchableOpacity
                            key={rel}
                            style={[styles.relationPill, obEcRelation === rel && styles.relationPillActive]}
                            onPress={() => setObEcRelation(rel)}
                          >
                            <Text style={[styles.relationPillText, obEcRelation === rel && styles.relationPillTextActive]}>{rel}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={[styles.formCol, { flex: 0.8 }]}>
                      <Text style={styles.inputLabel}>Age</Text>
                      <View style={styles.obInputWrapper}>
                        <TextInput
                          style={styles.obFormInput}
                          placeholder="e.g. 45"
                          placeholderTextColor={Colors.textDisabled}
                          keyboardType="numeric"
                          value={obEcAge}
                          onChangeText={setObEcAge}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Contact Phone Number *</Text>
                    <View style={styles.obInputWrapper}>
                      <Phone size={18} color={Colors.textSecondary} style={styles.obInputIcon} />
                      <TextInput
                        style={styles.obFormInput}
                        placeholder="e.g. +91 98765 01234"
                        placeholderTextColor={Colors.textDisabled}
                        keyboardType="phone-pad"
                        value={obEcPhone}
                        onChangeText={setObEcPhone}
                      />
                    </View>
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Clinical / Dispatcher Notes</Text>
                    <View style={[styles.obInputWrapper, { height: 75, alignItems: 'flex-start', paddingTop: 8 }]}>
                      <Info size={18} color={Colors.textSecondary} style={[styles.obInputIcon, { marginTop: 4 }]} />
                      <TextInput
                        style={[styles.obFormInput, { height: 60, textAlignVertical: 'top' }]}
                        placeholder="e.g. Diabetic, allergic to penicillin. Keep insulin in fridge."
                        placeholderTextColor={Colors.textDisabled}
                        multiline={true}
                        numberOfLines={3}
                        value={obEcNotes}
                        onChangeText={setObEcNotes}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer Navigation */}
            <View style={styles.onboardingFooter}>
              {welcomeStep > 1 ? (
                <TouchableOpacity
                  style={styles.obBackBtn}
                  onPress={() => setWelcomeStep(welcomeStep - 1)}
                  disabled={isSaving}
                >
                  <Text style={styles.obBackBtnText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {welcomeStep < 3 ? (
                <TouchableOpacity
                  style={styles.obNextBtn}
                  onPress={() => {
                    if (welcomeStep === 1) {
                      if (!obName.trim()) {
                        Alert.alert('Name Required', 'Please enter your full name.');
                        return;
                      }
                      if (!obDob.trim()) {
                        Alert.alert('DOB Required', 'Please enter your date of birth or age.');
                        return;
                      }
                      if (!obPhone.trim()) {
                        Alert.alert('Phone Required', 'Please enter your phone number.');
                        return;
                      }
                      if (!obHeight.trim()) {
                        Alert.alert('Height Required', 'Please enter your height in cm.');
                        return;
                      }
                      if (!obWeight.trim()) {
                        Alert.alert('Weight Required', 'Please enter your weight in kg.');
                        return;
                      }
                    }
                    setWelcomeStep(welcomeStep + 1);
                  }}
                >
                  <Text style={styles.obNextBtnText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.obNextBtn, styles.obCompleteBtn]}
                  onPress={handleCompleteOnboarding}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <>
                      <Lock size={16} color={Colors.surface} style={{ marginRight: 6 }} />
                      <Text style={styles.obNextBtnText}>Verify & Lock</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* --- EMERGENCY MEDICAL CARD DRAWER --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEmergencyModalVisible}
        onRequestClose={() => setIsEmergencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsEmergencyModalVisible(false)}
          />
          <View style={[styles.modalDrawer, { maxHeight: '90%', backgroundColor: theme === 'dark' ? colors.surface : '#FDF1F5' }]}>
            <View style={styles.drawerHandle} />

            {/* Red Pulse Beacon Header */}
            <View style={styles.emergencyModalHeader}>
              <View style={styles.beaconRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.beaconText}>EMERGENCY PARAMEDIC DECRYPTION</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEmergencyModalVisible(false)} style={styles.closeRoundBtn}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.emergencyScrollContent} showsVerticalScrollIndicator={false}>
              {/* Premium Medical Card Vector Layout */}
              <View style={styles.premiumMedicalCard}>
                <View style={styles.medCardTop}>
                  <View>
                    <Text style={styles.medCardName}>{profile?.name?.toUpperCase()}</Text>
                    <Text style={styles.medCardDetail}>AGE/DOB: {profile?.dob || '--'} • {profile?.gender?.toUpperCase()}</Text>
                    <Text style={styles.medCardDetail}>EMAIL: {profile?.email || 'patient@medivault.com'}</Text>
                  </View>
                  <View style={styles.bloodShield}>
                    <Text style={styles.bloodShieldTitle}>BLOOD</Text>
                    <Text style={styles.bloodShieldVal}>{profile?.bloodType || '--'}</Text>
                  </View>
                </View>

                <View style={styles.medCardDivider} />

                <View style={styles.medCardMetricsRow}>
                  <View style={styles.medCardMetric}>
                    <Text style={styles.metricCardLabel}>HEIGHT</Text>
                    <Text style={styles.metricCardVal}>{profile?.height ? `${profile.height} cm` : '--'}</Text>
                  </View>
                  <View style={styles.medCardMetric}>
                    <Text style={styles.metricCardLabel}>WEIGHT</Text>
                    <Text style={styles.metricCardVal}>{profile?.weight ? `${profile.weight} kg` : '--'}</Text>
                  </View>
                </View>

                {profile?.allergies && profile.allergies.length > 0 && (
                  <View style={styles.medCardSection}>
                    <Text style={styles.medCardSecTitle}>ALLERGIES</Text>
                    <View style={styles.medCardPillContainer}>
                      {profile.allergies.map((allergy: string, idx: number) => (
                        <View key={idx} style={[styles.medCardPill, { backgroundColor: '#FCECEC', borderColor: '#F5B0B0' }]}>
                          <Text style={[styles.medCardPillText, { color: Colors.error }]}>{allergy}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {profile?.conditions && profile.conditions.length > 0 && (
                  <View style={styles.medCardSection}>
                    <Text style={styles.medCardSecTitle}>CHRONIC CONDITIONS</Text>
                    <View style={styles.medCardPillContainer}>
                      {profile.conditions.map((cond: string, idx: number) => (
                        <View key={idx} style={[styles.medCardPill, { backgroundColor: '#FFF2E0', borderColor: '#FFE0B2' }]}>
                          <Text style={[styles.medCardPillText, { color: Colors.warning }]}>{cond}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Paramedic Dispatcher Emergency Contact */}
                <View style={styles.emergencyContactCard}>
                  <View style={styles.ecHeader}>
                    <ShieldAlert size={18} color={Colors.primary} />
                    <Text style={styles.ecHeaderTitle}>PRIMARY EMERGENCY CONTACT</Text>
                  </View>

                  <View style={styles.ecBody}>
                    <Text style={styles.ecNameText}>{profile?.emergencyContact?.name || 'No Emergency Contact'}</Text>
                    <View style={styles.relationBadge}>
                      <Text style={styles.relationBadgeText}>{profile?.emergencyContact?.relation?.toUpperCase() || 'SPONSOR'}</Text>
                    </View>
                    <Text style={styles.ecPhoneText}>{profile?.emergencyContact?.phone || '--'}</Text>

                    {profile?.emergencyContact?.notes ? (
                      <View style={styles.ecNotesBlock}>
                        <Info size={14} color={Colors.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.ecNotesText}>{profile.emergencyContact.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* High-Fidelity Medical Access QR Code */}
              <View style={styles.qrSection}>
                <View style={styles.qrContainer}>
                  <QrCode size={150} color={Colors.dark} />
                  <View style={styles.qrInnerIcon}>
                    <Heart size={28} color={Colors.primary} fill={Colors.primary} />
                  </View>
                </View>
                <Text style={styles.qrTitle}>Secure Responder QR</Text>
                <Text style={styles.qrSubtitle}>Authorized paramedics can scan this to read offline encrypted clinical baselines instantly</Text>
              </View>

              <TouchableOpacity style={styles.emergencyShareBtn} onPress={handleNativeShare}>
                <Share2 size={18} color={Colors.surface} />
                <Text style={styles.emergencyShareBtnText}>Share Emergency PDF / QR</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryPale },
  header: { backgroundColor: Colors.dark, padding: 24, paddingTop: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  greeting: { ...Typography.h3, color: Colors.surface, marginBottom: 4 },
  subtitle: { ...Typography.small, color: Colors.primarySoft },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  emergencyBanner: {
    backgroundColor: Colors.dark,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  emergencyLeft: { gap: 4 },
  emergencyTitle: { ...Typography.body, fontFamily: 'DMSans_600SemiBold', color: Colors.surface },
  emergencySubtitle: { ...Typography.small, color: Colors.primarySoft, fontSize: 11 },
  summaryScroll: { marginBottom: 24, marginHorizontal: -20 },
  summaryContainer: { paddingHorizontal: 20, gap: 12 },
  summaryCard: { width: 135, padding: 14, alignItems: 'flex-start' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  summaryCardTitle: { ...Typography.small, color: Colors.textSecondary, marginBottom: 2, fontSize: 11 },
  summaryCardValue: { ...Typography.h2, color: Colors.textPrimary, fontSize: 20 },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 16 },
  trendCard: { marginBottom: 20, padding: 18 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  trendHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trendTitle: { ...Typography.body, fontFamily: 'DMSans_600SemiBold', color: Colors.textPrimary },
  logButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: Colors.primaryMuted },
  logText: { ...Typography.small, color: Colors.primary, fontFamily: 'DMSans_600SemiBold' },
  emptyVitalBlock: { height: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryPale, borderRadius: 10 },
  emptyVitalText: { ...Typography.small, color: Colors.textSecondary },
  vitalValuesContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  valueBlock: { alignItems: 'flex-start' },
  hugeValue: { ...Typography.h1, fontSize: 32, lineHeight: 36, color: Colors.textPrimary },
  valueUnit: { ...Typography.tiny, color: Colors.textSecondary, marginTop: 2 },
  valueSlash: { marginHorizontal: 12, marginBottom: 4 },
  slashText: { fontSize: 28, color: Colors.textDisabled, fontFamily: 'DMSans_500Medium' },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  statusBadgeText: { ...Typography.tiny, fontFamily: 'DMSans_700Bold' },
  meterContainer: { marginBottom: 16 },
  meterLabel: { ...Typography.tiny, color: Colors.textSecondary, marginBottom: 6 },
  meterBarBackground: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  meterBarFill: { height: '100%', borderRadius: 4 },
  meterTicks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tickText: { ...Typography.tiny, fontSize: 9, color: Colors.textSecondary },
  aiInsightRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FDF1F5', borderRadius: 12, padding: 12, gap: 8 },
  aiInsightText: { flex: 1, ...Typography.small, color: Colors.textPrimary, fontSize: 12, lineHeight: 18 },
  historySection: { marginTop: 16, borderTopWidth: 1.5, borderTopColor: Colors.border, paddingTop: 12 },
  historyToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyToggleText: { ...Typography.small, color: Colors.textSecondary, fontFamily: 'DMSans_500Medium' },
  historyList: { marginTop: 10, gap: 8 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.primaryPale },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyDate: { ...Typography.small, color: Colors.textPrimary, fontSize: 12 },
  historyRight: { alignItems: 'flex-end' },
  historyValue: { ...Typography.small, fontFamily: 'DMSans_600SemiBold', color: Colors.textPrimary, fontSize: 12 },
  historySource: { ...Typography.tiny, color: Colors.textSecondary, fontSize: 9, marginTop: 1 },
  glucoseValueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 },
  glucoseMainVal: { flexDirection: 'row', alignItems: 'flex-end' },
  hugeGlucose: { ...Typography.h1, fontSize: 36, lineHeight: 36, color: Colors.textPrimary },
  glucoseUnit: { ...Typography.small, color: Colors.textSecondary, marginLeft: 6, marginBottom: 2 },
  glucoseContextTag: { backgroundColor: Colors.primaryMuted, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
  glucoseContextText: { ...Typography.tiny, color: Colors.primary, fontFamily: 'DMSans_700Bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 17, 26, 0.6)' },
  modalDrawer: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  drawerHandle: { width: 40, height: 4, backgroundColor: Colors.primaryMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { ...Typography.h2, color: Colors.textPrimary },
  closeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  closeBtnText: { ...Typography.body, color: Colors.textSecondary },
  tabSelector: { flexDirection: 'row', backgroundColor: Colors.primaryPale, borderRadius: 12, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabButtonActive: { backgroundColor: Colors.surface, ...Shadows.card },
  tabButtonText: { ...Typography.body, color: Colors.textSecondary, fontFamily: 'DMSans_500Medium' },
  tabButtonTextActive: { color: Colors.primary, fontFamily: 'DMSans_600SemiBold' },
  formContainer: { gap: 16, marginBottom: 24 },
  formRow: { flexDirection: 'row' },
  formCol: { flex: 1, marginBottom: 14 },
  inputLabel: { ...Typography.small, color: Colors.textSecondary, marginBottom: 6, marginLeft: 2 },
  formInput: {
    ...Typography.body,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
  },
  disabledInput: { backgroundColor: '#ECEFF1', color: Colors.textSecondary, borderColor: '#CFD8DC' },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contextPill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: Colors.primaryPale, borderWidth: 1.5, borderColor: Colors.border },
  contextPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  contextPillText: { ...Typography.small, color: Colors.textSecondary },
  contextPillTextActive: { color: Colors.surface, fontFamily: 'DMSans_600SemiBold' },
  modalFooter: { borderTopWidth: 1.5, borderTopColor: Colors.border, paddingTop: 16 },
  allergiesListContainer: { paddingVertical: 10 },
  allergiesGrid: { gap: 10 },
  allergyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF1F5',
    borderWidth: 1,
    borderColor: '#F5D3DD',
    borderRadius: 12,
    padding: 14
  },
  allergyBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 12
  },
  allergyText: {
    ...Typography.body,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.textPrimary
  },
  emptyAllergiesState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30
  },
  emptyAllergiesText: {
    ...Typography.body,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4
  },
  emptyAllergiesSubText: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center'
  },

  // Fullscreen & Onboarding Styles
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  onboardingContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  onboardingHeader: {
    paddingTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryMuted,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  brandBadgeText: {
    ...Typography.tiny,
    color: Colors.primary,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1.5,
  },
  onboardingTitle: {
    ...Typography.h1,
    color: Colors.surface,
    marginBottom: 4,
  },
  onboardingSubtitle: {
    ...Typography.small,
    color: Colors.primarySoft,
    textAlign: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    width: '80%',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#374151',
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.dark,
  },
  stepCircleCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  stepCircleText: {
    ...Typography.small,
    color: '#9CA3AF',
    fontFamily: 'DMSans_700Bold',
  },
  stepCircleTextActive: {
    color: Colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#374151',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  onboardingScroll: {
    flex: 1,
    marginVertical: 16,
  },
  onboardingScrollContent: {
    paddingBottom: 40,
  },
  onboardingStepContainer: {
    gap: 16,
  },
  stepTitle: {
    ...Typography.h3,
    color: Colors.surface,
    marginBottom: 16,
    fontFamily: 'DMSans_700Bold',
  },
  obInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 56,
  },
  obInputIcon: {
    marginRight: 12,
  },
  obFormInput: {
    flex: 1,
    height: '100%',
    color: Colors.surface,
    ...Typography.body,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  genderPillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  genderPillText: {
    ...Typography.body,
    color: '#9CA3AF',
    fontFamily: 'DMSans_500Medium',
  },
  genderPillTextActive: {
    color: Colors.primary,
    fontFamily: 'DMSans_700Bold',
  },
  bloodTypeScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  bloodTypeContainer: {
    gap: 10,
    paddingRight: 40,
  },
  bloodTypePill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodTypePillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  bloodTypePillText: {
    ...Typography.body,
    color: '#9CA3AF',
    fontFamily: 'DMSans_700Bold',
  },
  bloodTypePillTextActive: {
    color: Colors.surface,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 56,
    color: Colors.surface,
    ...Typography.body,
  },
  tagAddBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F162A',
    borderWidth: 1,
    borderColor: '#E42278',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  tagBadgeText: {
    ...Typography.small,
    color: Colors.primary,
    fontFamily: 'DMSans_600SemiBold',
  },
  tagRemoveBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(228, 34, 120, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relationScroll: {
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  relationContainer: {
    gap: 8,
    paddingRight: 20,
  },
  relationPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relationPillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  relationPillText: {
    ...Typography.small,
    color: '#9CA3AF',
  },
  relationPillTextActive: {
    color: Colors.primary,
    fontFamily: 'DMSans_600SemiBold',
  },
  onboardingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 16,
    backgroundColor: Colors.dark,
  },
  obBackBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  obBackBtnText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  obNextBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  obCompleteBtn: {
    backgroundColor: Colors.success,
  },
  obNextBtnText: {
    ...Typography.body,
    fontFamily: 'DMSans_700Bold',
    color: Colors.surface,
  },

  // Emergency Card Styles
  emergencyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  beaconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
  },
  beaconText: {
    ...Typography.tiny,
    color: Colors.error,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1,
  },
  closeRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyScrollContent: {
    paddingBottom: 40,
  },
  premiumMedicalCard: {
    backgroundColor: Colors.dark,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#374151',
    marginBottom: 24,
  },
  medCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medCardName: {
    ...Typography.h2,
    color: Colors.surface,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 6,
  },
  medCardDetail: {
    ...Typography.small,
    color: Colors.primarySoft,
    marginBottom: 4,
  },
  bloodShield: {
    backgroundColor: Colors.error,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bloodShieldTitle: {
    ...Typography.tiny,
    color: Colors.surface,
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
  },
  bloodShieldVal: {
    ...Typography.h2,
    color: Colors.surface,
    lineHeight: 28,
  },
  medCardDivider: {
    height: 1.5,
    backgroundColor: '#374151',
    marginVertical: 16,
  },
  medCardMetricsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  medCardMetric: {
    flex: 1,
  },
  metricCardLabel: {
    ...Typography.tiny,
    color: Colors.primarySoft,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 4,
  },
  metricCardVal: {
    ...Typography.h3,
    color: Colors.surface,
  },
  medCardSection: {
    marginTop: 16,
  },
  medCardSecTitle: {
    ...Typography.tiny,
    color: Colors.primarySoft,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 8,
  },
  medCardPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  medCardPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  medCardPillText: {
    ...Typography.tiny,
    fontFamily: 'DMSans_600SemiBold',
  },
  emergencyContactCard: {
    marginTop: 24,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  ecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ecHeaderTitle: {
    ...Typography.tiny,
    color: Colors.primary,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },
  ecBody: {
    gap: 6,
  },
  ecNameText: {
    ...Typography.body,
    fontFamily: 'DMSans_700Bold',
    color: Colors.surface,
  },
  relationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  relationBadgeText: {
    ...Typography.tiny,
    color: Colors.primarySoft,
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
  },
  ecPhoneText: {
    ...Typography.body,
    color: Colors.primarySoft,
    fontFamily: 'DMSans_600SemiBold',
  },
  ecNotesBlock: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  ecNotesText: {
    flex: 1,
    ...Typography.small,
    color: Colors.primarySoft,
    lineHeight: 16,
  },
  qrSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  qrContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 20,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
    marginBottom: 16,
  },
  qrInnerIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    marginLeft: -22,
    marginTop: -22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrTitle: {
    ...Typography.body,
    fontFamily: 'DMSans_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  qrSubtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 16,
  },
  emergencyShareBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyShareBtnText: {
    ...Typography.body,
    fontFamily: 'DMSans_700Bold',
    color: Colors.surface,
  },

  // Share Overlay Styles
  shareOverlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  shareBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 17, 26, 0.7)',
  },
  shareDrawer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  shareLoadingBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  shareLoadingTitle: {
    ...Typography.body,
    fontFamily: 'DMSans_700Bold',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  shareLoadingSub: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  shareContentBlock: {
    alignItems: 'center',
  },
  shareSuccessHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shareSuccessTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  shareSuccessSub: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  shareTargetTitle: {
    ...Typography.tiny,
    color: Colors.primary,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  shareTargetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  shareTarget: {
    alignItems: 'center',
    gap: 8,
  },
  targetCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  targetLabel: {
    ...Typography.tiny,
    fontFamily: 'DMSans_500Medium',
    color: Colors.textPrimary,
  },
  closeShareBtn: {
    backgroundColor: Colors.primaryPale,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  closeShareText: {
    ...Typography.body,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.textSecondary,
  },
});
