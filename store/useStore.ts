import { create } from 'zustand';
import { AppState, MedicalRecord, UserProfile, TimelineEvent } from '../types';
import { api } from '../services/api';

export const useStore = create<AppState>((set, get) => ({
  isOffline: false,
  isAuthenticated: false,
  profile: null,
  records: [],
  timeline: [],
  theme: 'light',

  // Set offline status
  setOffline: (status) => set({ isOffline: status }),

  // Set authenticated status
  setAuthenticated: (status) => {
    if (!status) {
      set({
        isAuthenticated: false,
        profile: null,
        records: [],
        timeline: [],
      });
    } else {
      set({ isAuthenticated: true });
    }
  },

  // Load all initial data from local SQLite database at startup
  loadInitialData: async () => {
    try {
      console.log('[MediVault Store] Fetching initial data from backend SQLite database...');
      
      // 1. Fetch user profile
      const profileData = await api.getProfile();
      const mappedProfile: UserProfile = {
        name: profileData.name || null,
        email: profileData.email || null,
        dob: profileData.dob || null,
        gender: profileData.gender || null,
        height: profileData.height || null,
        weight: profileData.weight || null,
        bloodType: profileData.bloodType || null,
        allergies: profileData.allergies || [],
        conditions: profileData.conditions || [],
        emergencyContact: {
          name: profileData.emergencyContactDetails?.name || profileData.emergencyContactName || '',
          phone: profileData.emergencyContactDetails?.phone || profileData.emergencyContactPhone || '',
          age: profileData.emergencyContactDetails?.age || '',
          relation: profileData.emergencyContactDetails?.relation || '',
          notes: profileData.emergencyContactDetails?.notes || '',
        },
      };

      // 2. Fetch medical records
      const recordsData = await api.listRecords();
      const mappedRecords: MedicalRecord[] = recordsData.map((rec: any) => ({
        id: rec.id,
        reportName: rec.reportName,
        scanDate: rec.scanDate,
        scanTime: rec.scanTime,
        reportDate: rec.reportDate,
        reportType: rec.reportType as any,
        bodyPart: rec.bodyPart,
        detectedCondition: rec.detectedCondition,
        labHospital: rec.labHospital,
        referringDoctor: rec.referringDoctor,
        patientName: rec.patientName,
        tags: rec.tags || [],
        aiProcessed: rec.aiProcessed,
        cloudSynced: rec.cloudSynced,
        aiSummary: rec.aiSummary,
        doctorNotes: rec.doctorNotes,
        extractedValues: rec.extractedValues || [],
        fileUri: rec.fileUri || null,
        syncUpdates: rec.syncUpdates || null,
        nameMismatch: rec.nameMismatch || false,
      }));

      // 3. Fetch chronological timeline
      const timelineData = await api.getTimeline();
      const mappedTimeline: TimelineEvent[] = timelineData.map((evt: any) => ({
        id: evt.id,
        date: evt.date,
        recordId: evt.recordId,
        type: evt.type as any,
        reportName: evt.reportName,
        snippet: evt.snippet,
        conditionCluster: evt.conditionCluster || undefined,
      }));

      set({
        profile: mappedProfile,
        records: mappedRecords,
        timeline: mappedTimeline,
      });

      console.log(`[MediVault Store] Successfully loaded profile, ${mappedRecords.length} records, and ${mappedTimeline.length} timeline events.`);
    } catch (error) {
      console.error('[MediVault Store] Failed to load initial data:', error);
    }
  },

  // Save profile updates to the local database
  setProfile: async (updates) => {
    try {
      const currentProfile = get().profile;
      if (!currentProfile) return;

      const mergedProfile = { ...currentProfile, ...updates };

      // Map back to backend structure
      const backendUpdates = {
        name: mergedProfile.name,
        email: mergedProfile.email,
        dob: mergedProfile.dob,
        gender: mergedProfile.gender,
        height: mergedProfile.height,
        weight: mergedProfile.weight,
        bloodType: mergedProfile.bloodType,
        allergies: mergedProfile.allergies,
        conditions: mergedProfile.conditions,
        emergencyContactName: mergedProfile.emergencyContact?.name,
        emergencyContactPhone: mergedProfile.emergencyContact?.phone,
        emergencyContactDetails: {
          name: mergedProfile.emergencyContact?.name,
          phone: mergedProfile.emergencyContact?.phone,
          age: mergedProfile.emergencyContact?.age,
          relation: mergedProfile.emergencyContact?.relation,
          notes: mergedProfile.emergencyContact?.notes,
        }
      };

      const updatedUser = await api.updateProfile(backendUpdates);
      
      const mappedProfile: UserProfile = {
        name: updatedUser.name || null,
        email: updatedUser.email || null,
        dob: updatedUser.dob || null,
        gender: updatedUser.gender || null,
        height: updatedUser.height || null,
        weight: updatedUser.weight || null,
        bloodType: updatedUser.bloodType || null,
        allergies: updatedUser.allergies || [],
        conditions: updatedUser.conditions || [],
        emergencyContact: {
          name: updatedUser.emergencyContactDetails?.name || updatedUser.emergencyContactName || '',
          phone: updatedUser.emergencyContactDetails?.phone || updatedUser.emergencyContactPhone || '',
          age: updatedUser.emergencyContactDetails?.age || '',
          relation: updatedUser.emergencyContactDetails?.relation || '',
          notes: updatedUser.emergencyContactDetails?.notes || '',
        },
      };

      set({ profile: mappedProfile });
      console.log('[MediVault Store] Profile successfully updated in database.');
    } catch (error) {
      console.error('[MediVault Store] Failed to update profile:', error);
    }
  },

  // Adds a record locally (typically after creation on the backend during processing)
  addRecord: (record) => set((state) => ({
    records: [record, ...state.records],
  })),

  // Sync edits to reportName or doctorNotes to SQLite
  updateRecord: async (id, updates) => {
    try {
      // Map update fields to backend
      const backendUpdates: any = {};
      if (updates.reportName !== undefined) backendUpdates.reportName = updates.reportName;
      if (updates.doctorNotes !== undefined) backendUpdates.doctorNotes = updates.doctorNotes;

      const updatedRec = await api.updateRecord(id, backendUpdates);
      
      const mappedRecord: MedicalRecord = {
        id: updatedRec.id,
        reportName: updatedRec.reportName,
        scanDate: updatedRec.scanDate,
        scanTime: updatedRec.scanTime,
        reportDate: updatedRec.reportDate,
        reportType: updatedRec.reportType as any,
        bodyPart: updatedRec.bodyPart,
        detectedCondition: updatedRec.detectedCondition,
        labHospital: updatedRec.labHospital,
        referringDoctor: updatedRec.referringDoctor,
        patientName: updatedRec.patientName,
        tags: updatedRec.tags || [],
        aiProcessed: updatedRec.aiProcessed,
        cloudSynced: updatedRec.cloudSynced,
        aiSummary: updatedRec.aiSummary,
        doctorNotes: updatedRec.doctorNotes,
        extractedValues: updatedRec.extractedValues || [],
        fileUri: updatedRec.fileUri || null,
        syncUpdates: updatedRec.syncUpdates || null,
        nameMismatch: updatedRec.nameMismatch || false,
      };

      set((state) => {
        // Also update matching timeline events if reportName changed
        let updatedTimeline = state.timeline;
        if (updates.reportName !== undefined) {
          updatedTimeline = state.timeline.map((evt) =>
            evt.recordId === id ? { ...evt, reportName: updates.reportName! } : evt
          );
        }

        return {
          records: state.records.map((r) => (r.id === id ? mappedRecord : r)),
          timeline: updatedTimeline,
        };
      });

      console.log(`[MediVault Store] Record ${id} successfully updated in database.`);
    } catch (error) {
      console.error(`[MediVault Store] Failed to update record ${id}:`, error);
    }
  },

  confirmRecord: async (id) => {
    try {
      console.log(`[MediVault Store] Confirming and synchronizing record ${id}...`);
      await api.confirmRecord(id);
      
      // Reload initial data to fetch the updated profile parameters and logged vitals
      await get().loadInitialData();
      console.log(`[MediVault Store] Record ${id} fully confirmed and store reloaded.`);
    } catch (error) {
      console.error(`[MediVault Store] Failed to confirm record ${id}:`, error);
      throw error;
    }
  },

  // Adds a timeline event locally
  addTimelineEvent: (event) => set((state) => ({
    timeline: [event, ...state.timeline],
  })),

  // Toggle dynamic theme state
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  })),
}));
