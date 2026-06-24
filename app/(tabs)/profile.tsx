import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, Share, TextInput } from 'react-native';
import { Colors, Typography, Shadows, useColors } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { ChevronRight, Shield, Cloud, LogOut, QrCode, ShieldCheck, Plus, X, Heart, ShieldAlert, Info, Share2, Scale, Ruler, Sun, Moon } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { profile, setAuthenticated, theme, toggleTheme } = useStore();
  const colors = useColors();
  const router = useRouter();

  // Modals state
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);
  const [isAllergiesModalVisible, setIsAllergiesModalVisible] = useState(false);
  const [isConditionsModalVisible, setIsConditionsModalVisible] = useState(false);

  // Input states for editing allergies & chronic conditions
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [newConditionInput, setNewConditionInput] = useState('');

  const handleLogout = () => {
    setAuthenticated(false);
    router.replace('/(auth)');
  };

  const handleAddAllergy = async () => {
    if (!newAllergyInput.trim() || !profile) return;
    const cleanAllergy = newAllergyInput.trim();
    const currentAllergies = profile.allergies || [];
    if (!currentAllergies.includes(cleanAllergy)) {
      const updatedAllergies = [...currentAllergies, cleanAllergy];
      await useStore.getState().setProfile({ allergies: updatedAllergies });
    }
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = async (allergyToRemove: string) => {
    if (!profile) return;
    const currentAllergies = profile.allergies || [];
    const updatedAllergies = currentAllergies.filter(a => a !== allergyToRemove);
    await useStore.getState().setProfile({ allergies: updatedAllergies });
  };

  const handleAddCondition = async () => {
    if (!newConditionInput.trim() || !profile) return;
    const cleanCondition = newConditionInput.trim();
    const currentConditions = profile.conditions || [];
    if (!currentConditions.includes(cleanCondition)) {
      const updatedConditions = [...currentConditions, cleanCondition];
      await useStore.getState().setProfile({ conditions: updatedConditions });
    }
    setNewConditionInput('');
  };

  const handleRemoveCondition = async (conditionToRemove: string) => {
    if (!profile) return;
    const currentConditions = profile.conditions || [];
    const updatedConditions = currentConditions.filter(c => c !== conditionToRemove);
    await useStore.getState().setProfile({ conditions: updatedConditions });
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

  const renderSettingRow = (label: string, value?: string, isDestructive = false, onPress?: () => void) => (
    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={onPress} disabled={!onPress}>
      <Text style={[styles.settingLabel, { color: isDestructive ? colors.error : colors.textPrimary }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>}
        {onPress && <ChevronRight size={20} color={isDestructive ? colors.error : colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  const formatBloodType = (bt?: string | null) => {
    if (!bt) return undefined;
    if (bt.endsWith('+') || bt.endsWith('-')) {
      return `${bt}ve`;
    }
    return bt;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primaryPale }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {/* Top Section */}
        <View style={styles.topSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>{profile?.name?.[0] || 'U'}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{profile?.name || 'User Name'}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{profile?.email || 'secured@medivault.com'}</Text>
        </View>
        
        {/* Emergency Access Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>EMERGENCY ACCESS</Text>
          <View style={[styles.emergencyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setIsEmergencyModalVisible(true)}
              style={styles.emergencyPressableHeader}
            >
              <View style={styles.emergencyHeader}>
                <View>
                  <Text style={[styles.emergencyTitle, { color: colors.textPrimary }]}>Emergency Card</Text>
                  <Text style={[styles.emergencySubtitle, { color: colors.textSecondary }]}>
                    {formatBloodType(profile?.bloodType) || '--'} • {profile?.allergies?.length || 0} Allergies
                  </Text>
                </View>
                <QrCode size={32} color={colors.primary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareQRButton, { borderTopColor: colors.border }]} onPress={handleNativeShare} activeOpacity={0.7}>
              <Text style={[styles.shareQRText, { color: Colors.primary }]}>Share QR / PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Medical Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>MEDICAL INFO</Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderSettingRow('Blood Type', formatBloodType(profile?.bloodType))}
            {renderSettingRow('Height & Weight', profile?.height || profile?.weight ? `${profile?.height || '--'} cm, ${profile?.weight || '--'} kg` : undefined)}
            {renderSettingRow('Known Allergies', profile?.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : undefined, false, () => setIsAllergiesModalVisible(true))}
            {renderSettingRow('Chronic Conditions', profile?.conditions && profile.conditions.length > 0 ? profile.conditions.join(', ') : undefined, false, () => setIsConditionsModalVisible(true))}
            {renderSettingRow('Emergency Contact', profile?.emergencyContact?.name || undefined, false, () => setIsEmergencyModalVisible(true))}
          </View>
        </View>

        {/* Cloud & Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>CLOUD & SECURITY</Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={toggleTheme} activeOpacity={0.7}>
              <View style={styles.settingRowLeft}>
                {theme === 'dark' ? (
                  <Moon size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                ) : (
                  <Sun size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                )}
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{theme === 'dark' ? 'On' : 'Off'}</Text>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingRowLeft}>
                <Cloud size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Cloud Backup</Text>
              </View>
              <View style={styles.settingRight}>
                <View style={styles.syncDot} />
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Synced Just now</Text>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <Shield size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Change 6-digit PIN</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.border }]} onPress={handleLogout}>
            <LogOut size={20} color={colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

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
                <Heart size={22} color={Colors.primary} />
                <Text style={styles.modalTitle}>Registered Allergies</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAllergiesModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Interactive Allergy Input Builder */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Add new allergy (e.g. Peanuts)"
                placeholderTextColor={Colors.textSecondary}
                value={newAllergyInput}
                onChangeText={setNewAllergyInput}
                onSubmitEditing={handleAddAllergy}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddAllergy} activeOpacity={0.7}>
                <Plus size={20} color={Colors.surface} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.allergiesListContainer} showsVerticalScrollIndicator={false}>
              {profile?.allergies && profile.allergies.length > 0 ? (
                <View style={styles.allergiesGrid}>
                  {profile.allergies.map((allergy: string, idx: number) => (
                    <View key={idx} style={styles.allergyCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <View style={styles.allergyBullet} />
                        <Text style={styles.allergyText}>{allergy}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleRemoveAllergy(allergy)}
                        style={styles.deleteTagButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.6}
                      >
                        <X size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyAllergiesState}>
                  <Heart size={40} color={Colors.textDisabled} style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyAllergiesText}>No registered allergies found.</Text>
                  <Text style={styles.emptyAllergiesSubText}>Type a new allergy above and press + to add it.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- CHRONIC CONDITIONS VIEWER MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isConditionsModalVisible}
        onRequestClose={() => setIsConditionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setIsConditionsModalVisible(false)} 
          />
          <View style={[styles.modalDrawer, { maxHeight: '65%', backgroundColor: theme === 'dark' ? colors.surface : '#FDF1F5' }]}>
            <View style={styles.drawerHandle} />
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={22} color={Colors.warning} />
                <Text style={styles.modalTitle}>Chronic Conditions</Text>
              </View>
              <TouchableOpacity onPress={() => setIsConditionsModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Interactive Chronic Condition Input Builder */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Add new condition (e.g. Asthma)"
                placeholderTextColor={Colors.textSecondary}
                value={newConditionInput}
                onChangeText={setNewConditionInput}
                onSubmitEditing={handleAddCondition}
                returnKeyType="done"
              />
              <TouchableOpacity style={[styles.addButton, { backgroundColor: Colors.warning, shadowColor: Colors.warning }]} onPress={handleAddCondition} activeOpacity={0.7}>
                <Plus size={20} color={Colors.surface} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.allergiesListContainer} showsVerticalScrollIndicator={false}>
              {profile?.conditions && profile.conditions.length > 0 ? (
                <View style={styles.allergiesGrid}>
                  {profile.conditions.map((cond: string, idx: number) => (
                    <View key={idx} style={[styles.allergyCard, { backgroundColor: '#FFF2E0', borderColor: '#FFE0B2' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <View style={[styles.allergyBullet, { backgroundColor: Colors.warning }]} />
                        <Text style={styles.allergyText}>{cond}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleRemoveCondition(cond)}
                        style={styles.deleteTagButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.6}
                      >
                        <X size={16} color={Colors.warning} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyAllergiesState}>
                  <ShieldAlert size={40} color={Colors.textDisabled} style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyAllergiesText}>No registered conditions found.</Text>
                  <Text style={styles.emptyAllergiesSubText}>Type a new condition above and press + to add it.</Text>
                </View>
              )}
            </ScrollView>
          </View>
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
  container: { flex: 1, backgroundColor: Colors.primaryPale },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },
  topSection: { backgroundColor: Colors.dark, padding: 32, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { ...Typography.h1, color: Colors.surface },
  userName: { ...Typography.h2, color: Colors.surface, marginBottom: 4 },
  userEmail: { ...Typography.small, color: Colors.primarySoft },
  section: { marginTop: 32, paddingHorizontal: 20 },
  sectionHeader: { ...Typography.tiny, fontFamily: 'DMSans_600SemiBold', color: Colors.primary, letterSpacing: 1, marginBottom: 12 },
  emergencyCard: { backgroundColor: Colors.dark, borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  emergencyPressableHeader: { width: '100%' },
  emergencyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  emergencyTitle: { ...Typography.h3, color: Colors.surface, marginBottom: 4 },
  emergencySubtitle: { ...Typography.small, color: Colors.primarySoft },
  shareQRButton: { backgroundColor: Colors.primaryMuted, padding: 12, borderRadius: 8, alignItems: 'center' },
  shareQRText: { ...Typography.small, color: Colors.primary, fontFamily: 'DMSans_600SemiBold' },
  settingsGroup: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.primaryPale },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { ...Typography.body, color: Colors.textPrimary },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { ...Typography.small, color: Colors.textSecondary },
  destructiveText: { color: Colors.error },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  logoutText: { ...Typography.body, fontFamily: 'DMSans_600SemiBold', color: Colors.error },

  // Shared Modals base
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 17, 26, 0.6)' },
  modalDrawer: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  drawerHandle: { width: 40, height: 4, backgroundColor: Colors.primaryMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { ...Typography.h2, color: Colors.textPrimary },
  closeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  closeBtnText: { ...Typography.body, color: Colors.textSecondary },

  // Allergies List Viewer Styles
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

  // Paramedic Emergency Card Styles
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteTagButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
