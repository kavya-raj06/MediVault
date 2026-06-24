import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_USER_ID = 'default-user-id';

<<<<<<< HEAD
// Initialize Gemini API client if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
if (geminiApiKey) {
  genAI = new GoogleGenerativeAI(geminiApiKey);
  console.log('[MediVault Backend] Google Gemini AI Client initialized successfully for rebase build.');
} else {
  console.warn('[MediVault Backend] WARNING: GEMINI_API_KEY environment variable is not defined. Using mock fallback simulation.');
}

=======
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

interface ExtractedMedicalData {
  labHospital: string;
  referringDoctor: string;
  reportDate: string;
  reportType: string;
  bodyPart: string;
  detectedCondition: string;
  aiSummary: string;
  extractedValues: Array<{
    name: string;
    value: string;
    unit: string;
    status: 'normal' | 'warning' | 'critical';
    referenceRange: string;
  }>;
  vitals: {
    bpSystolic: number | null;
    bpDiastolic: number | null;
    bpPulse: number | null;
    bodyTemp: number | null;
    respiratoryRate: number | null;
    glucoseVal: number | null;
  };
  profileUpdates: {
    height: string | null;
    weight: string | null;
    allergies: string[];
    conditions: string[];
  };
}

const extractMedicalData = async (text: string, reportName: string): Promise<ExtractedMedicalData> => {
  const defaultData: ExtractedMedicalData = {
    labHospital: 'Unknown Lab',
    referringDoctor: 'Unknown Doctor',
    reportDate: '',
    reportType: 'Documents',
    bodyPart: 'General',
    detectedCondition: 'Unknown',
    aiSummary: 'No clinical notes were found to summarize.',
    extractedValues: [],
    vitals: {
      bpSystolic: null, bpDiastolic: null, bpPulse: null,
      bodyTemp: null, respiratoryRate: null, glucoseVal: null
    },
    profileUpdates: { height: null, weight: null, allergies: [], conditions: [] }
  };

  if (!text || !text.trim()) return defaultData;

  if (!genAI) {
    console.warn("Gemini API key is missing. Returning default structure.");
    return defaultData;
  }

  let rawContent = '';
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const prompt = `You are an expert medical data extractor. Extract clinical information from the provided report text and return a JSON object with strictly these keys:
- "labHospital": (string)
- "referringDoctor": (string)
- "reportDate": (string, format DD/MM/YYYY)
- "reportType": (string, e.g., "Lab Result", "Imaging & Scans", "Documents")
- "bodyPart": (string)
- "detectedCondition": (string)
- "aiSummary": (string, MUST ALWAYS be generated. Write a readable paragraph summarizing all the extracted test results and important numerical data found in the document. Do not make medical diagnoses or conclusions, just present the facts clearly. NEVER say 'no clinical notes found'.)
- "extractedValues": (array of objects with "name", "value" (string), "unit" (string), "status" ("normal", "warning", or "critical"), "referenceRange" (string))
- "vitals": (object with "bpSystolic" (number|null), "bpDiastolic" (number|null), "bpPulse" (number|null), "bodyTemp" (number|null), "respiratoryRate" (number|null), "glucoseVal" (number|null))
- "profileUpdates": (object with "height" (string|null), "weight" (string|null), "allergies" (array of strings), "conditions" (array of strings))

If a value is not found, use null or an empty array (except for aiSummary, which MUST ALWAYS be a generated text string of the data). Do NOT hallucinate data.

Report Name: ${reportName}

Report Text:
${text}`;

    const result = await model.generateContent(prompt);
    rawContent = result.response.text();
    if (!rawContent) return defaultData;

    // Strip markdown formatting if Gemini returns it
    const cleanContent = rawContent.replace(/```json/gi, '').replace(/```/gi, '').trim();

    const parsed = JSON.parse(cleanContent);
    return { ...defaultData, ...parsed };
  } catch (error) {
    console.error("Gemini extraction error:", error);
    if (rawContent) {
      // Fallback: if JSON parsing fails, just display the raw API response as the summary
      return { ...defaultData, aiSummary: rawContent.trim() };
    }
    return defaultData;
  }
};

>>>>>>> b5434b852af30dc42cf0aa8a4a09194fc7df4555
export const listRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await prisma.medicalRecord.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'desc' }
    });

    const formattedRecords = records.map((record) => ({
      ...record,
      tags: JSON.parse(record.tags),
      extractedValues: record.extractedValues ? JSON.parse(record.extractedValues) : []
    }));

    res.status(200).json(formattedRecords);
  } catch (error) {
    next(error);
  }
};

export const getRecordDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const record = await prisma.medicalRecord.findUnique({
      where: { id }
    });

    if (!record) {
      res.status(404).json({ error: { message: 'Medical record not found' } });
      return;
    }

    res.status(200).json({
      ...record,
      tags: JSON.parse(record.tags),
      extractedValues: record.extractedValues ? JSON.parse(record.extractedValues) : []
    });
  } catch (error) {
    next(error);
  }
};

export const createRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      reportName,
      reportType,
      reportDate: customReportDate,
      bodyPart: customBodyPart,
      detectedCondition: customDetectedCondition,
      labHospital: customLabHospital,
      referringDoctor: customReferringDoctor,
      patientName: customPatientName,
      tags,
      doctorNotes,
      templateId,
      reportText,
      imageBase64,
      customFileUri,
      files
    } = req.body;

    if (!reportName) {
      res.status(400).json({ error: { message: 'Report name is required' } });
      return;
    }

    const rawReportText = reportText || doctorNotes || '';

    // Default dates
    const now = new Date();
    const formattedScanDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedScanTime = `${String(hours % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${ampm}`;

<<<<<<< HEAD
    const srcText = reportText || reportName;

    // We strictly use extracted values without predefined template fallbacks

    const userProfile = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
    const activeUserName = userProfile?.name || '';

    // AI Variables
    let patientName = customPatientName || '';
    let labHospital = customLabHospital || '';
    let referringDoctor = customReferringDoctor || '';
    let reportDate = customReportDate || '';
    let extractedType = reportType || '';
    let bodyPart = customBodyPart || '';
    let detectedCondition = customDetectedCondition || '';
    let aiSummary = '';
    let parsedExtractedValues: any[] = [];
    let pendingUpdates: any = { vitals: [], allergies: [], conditions: [] };

    let geminiUsed = false;

    // Call live Gemini AI if client is available
    if (genAI) {
      try {
        console.log('[MediVault Backend] Invoking Google Gemini AI Model with model fallback chain...');

        const systemPrompt = `You are a high-fidelity Medical Report AI Parser. 
Your task is to analyze the unstructured OCR transcribed text (or the photographed medical report image provided) and extract clinical insights into a structured JSON format matching the schema below.

If an image is attached, please perform high-fidelity visual OCR on the image to read and parse the text!

You MUST return a JSON object matching this TypeScript interface exactly. Do NOT wrap your response in markdown code blocks like \`\`\`json. Return the raw JSON string directly.

interface MedicalReportAnalysis {
  patientName: string; // The patient's full name extracted from the report. If not found, use "Unknown".
  labHospital: string; // Name of the laboratory, hospital, or clinic that issued the report.
  referringDoctor: string; // Name of the consulting or referring doctor (e.g. "Dr. John Smith"). If not found, use "Self".
  reportDate: string; // The date of the report in DD/MM/YYYY format. If not found, use current date.
  reportType: "Lab Result" | "Imaging & Scans" | "Documents"; // Categorize the report type.
  bodyPart: string; // The primary body part or clinical system targeted (e.g. "Blood / Haematology", "Cardiovascular", "Chest", etc.)
  detectedCondition: string; // Short summary of the diagnosed condition or purpose of the scan (e.g., "Anaemia Screening", "Routine Checkup", etc.)
  aiSummary: string; // A warm, patient-friendly, easy-to-understand explanation of the clinical results. Highlight any key flags or out-of-range values in simple English. Keep it clear and high-contrast readable.
  extractedValues: Array<{
    name: string; // e.g. "Haemoglobin", "Systolic BP", "Fasting Glucose"
    value: string; // e.g. "12.5", "130/85", "104"
    unit: string; // e.g. "g/dL", "mmHg", "mg/dL"
    status: "normal" | "warning" | "critical"; // Categorize based on clinical thresholds
    referenceRange: string; // e.g. "13.0 - 17.0", "< 120/80", "70 - 100"
  }>;
  syncUpdates: {
    vitals: Array<{
      type: "Glucose" | "BloodPressure";
      glucoseValue?: number; // e.g. 145 (only if type is Glucose)
      glucoseContext?: string; // e.g. "Fasting" (only if type is Glucose)
      bpSystolic?: number; // e.g. 135 (only if type is BloodPressure)
      bpDiastolic?: number; // e.g. 85 (only if type is BloodPressure)
      bpPulse?: number; // e.g. 74 (only if type is BloodPressure)
      notes?: string; // e.g. "Auto-extracted from scanned report"
    }>;
    height?: string; // e.g. "180" (if height is found in report)
    weight?: string; // e.g. "75" (if weight is found in report)
    allergies?: string[]; // e.g. ["Penicillin", "Peanuts"] (if allergies are mentioned)
    conditions?: string[]; // e.g. ["Hypertension", "Type 2 Diabetes"] (if chronic conditions are explicitly mentioned)
  };
}`;

        const modelsToTry = [
          'gemini-2.0-flash',
          'gemini-2.0-flash-exp',
          'gemini-1.5-flash',
          'gemini-1.5-flash-latest',
          'gemini-2.5-flash',
          'gemini-1.5-pro',
          'gemini-pro'
        ];

        let result: any = null;
        let lastError: any = null;

        let promptParts: any[] = [];
        if (files && files.length > 0) {
          const textPart = `${systemPrompt}\n\nPlease read and parse the clinical values directly from the attached medical report files.`;
          promptParts.push(textPart);
          for (const file of files) {
            promptParts.push({
              inlineData: {
                data: file.base64,
                mimeType: file.mimeType || 'application/octet-stream'
              }
            });
          }
        } else if (imageBase64) {
          const textPart = `${systemPrompt}\n\nPlease read and parse the clinical values directly from the attached medical report image.`;
          promptParts.push(textPart);
          promptParts.push({
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg'
            }
          });
        } else {
          promptParts.push(`${systemPrompt}\n\nMedical Report Text:\n"""\n${srcText}\n"""`);
        }

        for (const modelName of modelsToTry) {
          try {
            console.log(`[MediVault Backend] Attempting Gemini model: ${modelName} (Multimodal: ${files && files.length > 0 ? files.length + ' files' : !!imageBase64})`);
            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(promptParts);
            console.log(`[MediVault Backend] Successfully fetched response using model: ${modelName}`);
            break;
          } catch (err: any) {
            console.warn(`[MediVault Backend] Model ${modelName} failed/not-supported:`, err.message);
            lastError = err;
          }
        }

        if (!result) {
          throw lastError || new Error('All Gemini model fallbacks failed.');
        }

        const responseText = result.response.text().trim();

        // Strip markdown code blocks if Gemini returns them anyway
        const cleanJsonStr = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const analysis = JSON.parse(cleanJsonStr);

        patientName = customPatientName || analysis.patientName || 'Unknown';
        labHospital = customLabHospital || analysis.labHospital || 'General Medical Center';
        referringDoctor = customReferringDoctor || analysis.referringDoctor || 'Self';
        reportDate = customReportDate || analysis.reportDate || formattedScanDate;
        extractedType = reportType || analysis.reportType || 'Lab Result';
        bodyPart = customBodyPart || analysis.bodyPart || 'General Health';
        detectedCondition = customDetectedCondition || analysis.detectedCondition || 'Clinical Review';
        aiSummary = analysis.aiSummary || 'Medical report processed successfully.';
        parsedExtractedValues = analysis.extractedValues || [];
        pendingUpdates = analysis.syncUpdates || { vitals: [], allergies: [], conditions: [] };

        geminiUsed = true;
        console.log('[MediVault Backend] Successfully parsed medical report with live Gemini 1.5 Flash.');
      } catch (geminiError: any) {
        console.error('[MediVault Backend] Live Gemini extraction failed. Falling back to rule simulation.', geminiError.message);
      }
    }

    // If Gemini fails, we do not fallback to hardcoded mock values. We throw an error so the client knows extraction failed.
    if (!geminiUsed) {
      throw new Error('AI Extraction failed. Please ensure your API key is valid and the document is legible.');
    }

    // Name mismatch verification check
    let nameMismatch = false;
    if (activeUserName && patientName && patientName !== 'Unknown') {
      const activeParts = activeUserName.toLowerCase().split(/\s+/).filter((p: string) => p.length > 1);
      const patientParts = patientName.toLowerCase().split(/\s+/).filter((pp: string) => pp.length > 1);
      const hasOverlap = activeParts.some((ap: string) => patientParts.some((pp: string) => pp.includes(ap) || ap.includes(pp)));
      nameMismatch = !hasOverlap;
    }

    let fileUri = customFileUri || '';
=======
    const aiData = await extractMedicalData(rawReportText, reportName);

    const labHospital = customLabHospital || aiData.labHospital || 'Unknown Lab';
    const referringDoctor = customReferringDoctor || aiData.referringDoctor || 'Unknown Doctor';
    let finalReportDate = customReportDate || aiData.reportDate;
    if (!finalReportDate) finalReportDate = formattedScanDate;
    const type = reportType || aiData.reportType || 'Documents';
    const finalBodyPart = customBodyPart || aiData.bodyPart || 'General';
    const finalCondition = customDetectedCondition || aiData.detectedCondition || 'Unknown';
>>>>>>> b5434b852af30dc42cf0aa8a4a09194fc7df4555

    // Save record to DB
    const record = await prisma.medicalRecord.create({
      data: {
        userId: DEFAULT_USER_ID,
        reportName,
        scanDate: formattedScanDate,
        scanTime: formattedScanTime,
<<<<<<< HEAD
        reportDate,
        reportType: extractedType,
        bodyPart,
        detectedCondition,
=======
        reportDate: finalReportDate,
        reportType: type,
        bodyPart: finalBodyPart,
        detectedCondition: finalCondition,
>>>>>>> b5434b852af30dc42cf0aa8a4a09194fc7df4555
        labHospital,
        referringDoctor,
        patientName,
        tags: JSON.stringify(Array.isArray(tags) ? tags : [extractedType]),
        aiProcessed: true,
        cloudSynced: true,
<<<<<<< HEAD
        aiSummary,
        doctorNotes: doctorNotes || reportText || '',
        extractedValues: JSON.stringify(parsedExtractedValues),
        fileUri,
        syncUpdates: JSON.stringify(pendingUpdates)
=======
        aiSummary: aiData.aiSummary,
        doctorNotes: rawReportText,
        extractedValues: JSON.stringify(aiData.extractedValues || [])
>>>>>>> b5434b852af30dc42cf0aa8a4a09194fc7df4555
      }
    });

    const snippet = aiData.aiSummary ? (aiData.aiSummary.slice(0, 80) + '...') : 'New record added.';
    await prisma.timelineEvent.create({
      data: {
        userId: DEFAULT_USER_ID,
        recordId: record.id,
        date: record.reportDate,
        type: record.reportType,
        reportName: record.reportName,
        snippet,
        conditionCluster: record.detectedCondition
      }
    });

<<<<<<< HEAD
=======
    try {
      let logDate = new Date();
      if (finalReportDate) {
        const parts = finalReportDate.split('/');
        if (parts.length === 3) {
          logDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }

      const v = aiData.vitals;
      if (v?.bpSystolic) {
        await prisma.vitalReading.create({
          data: {
            userId: DEFAULT_USER_ID,
            type: 'BloodPressure',
            bpSystolic: v.bpSystolic,
            bpDiastolic: v.bpDiastolic || 80,
            bpPulse: v.bpPulse || 72,
            dateTime: logDate,
            notes: `Auto-extracted from report: "${reportName}"`
          }
        });
      }
      if (v?.glucoseVal) {
        await prisma.vitalReading.create({
          data: {
            userId: DEFAULT_USER_ID,
            type: 'Glucose',
            glucoseValue: v.glucoseVal,
            glucoseContext: 'Fasting',
            dateTime: logDate,
            notes: `Auto-extracted from report: "${reportName}"`
          }
        });
      }

      const userProfile = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
      if (userProfile) {
        const profileUpdates: any = {};

        let existingAllergies: string[] = [];
        try { existingAllergies = JSON.parse(userProfile.allergies || '[]'); } catch (e) { }

        let existingConditions: string[] = [];
        try { existingConditions = JSON.parse(userProfile.conditions || '[]'); } catch (e) { }

        if (aiData.profileUpdates?.height) profileUpdates.height = aiData.profileUpdates.height;
        if (aiData.profileUpdates?.weight) profileUpdates.weight = aiData.profileUpdates.weight;

        if (aiData.profileUpdates?.allergies?.length) {
          for (const a of aiData.profileUpdates.allergies) {
            if (!existingAllergies.includes(a)) existingAllergies.push(a);
          }
          profileUpdates.allergies = JSON.stringify(existingAllergies);
        }

        if (aiData.profileUpdates?.conditions?.length) {
          for (const c of aiData.profileUpdates.conditions) {
            if (!existingConditions.includes(c)) existingConditions.push(c);
          }
          profileUpdates.conditions = JSON.stringify(existingConditions);
        }

        if (Object.keys(profileUpdates).length > 0) {
          await prisma.user.update({
            where: { id: DEFAULT_USER_ID },
            data: profileUpdates
          });
        }
      }
    } catch (vitalsErr: any) {
      console.error('[MediVault Auto-Logger & Profile Updater Error] Failed:', vitalsErr.message);
    }

>>>>>>> b5434b852af30dc42cf0aa8a4a09194fc7df4555
    res.status(201).json({
      ...record,
      nameMismatch,
      tags: JSON.parse(record.tags),
      extractedValues: JSON.parse(record.extractedValues || '[]')
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reportName, doctorNotes } = req.body;

    const dataToUpdate: any = {};
    if (reportName !== undefined) dataToUpdate.reportName = reportName;
    if (doctorNotes !== undefined) dataToUpdate.doctorNotes = doctorNotes;

    const record = await prisma.medicalRecord.update({
      where: { id },
      data: dataToUpdate
    });

    if (reportName !== undefined) {
      await prisma.timelineEvent.updateMany({
        where: { recordId: id },
        data: { reportName }
      });
    }

    res.status(200).json({
      ...record,
      tags: JSON.parse(record.tags),
      extractedValues: record.extractedValues ? JSON.parse(record.extractedValues) : []
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    await prisma.medicalRecord.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const confirmRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const record = await prisma.medicalRecord.findUnique({
      where: { id }
    });

    if (!record) {
      res.status(404).json({ error: { message: 'Medical record not found' } });
      return;
    }

    // Apply the pending updates
    if (record.syncUpdates) {
      try {
        const updates = JSON.parse(record.syncUpdates);
        
        // 1. Log all vitals
        if (updates.vitals && Array.isArray(updates.vitals)) {
          let logDate = new Date();
          if (record.reportDate) {
            const parts = record.reportDate.split('/');
            if (parts.length === 3) {
              logDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
          }

          for (const vital of updates.vitals) {
            await prisma.vitalReading.create({
              data: {
                userId: DEFAULT_USER_ID,
                type: vital.type,
                glucoseValue: vital.glucoseValue !== undefined ? parseFloat(vital.glucoseValue) : null,
                glucoseContext: vital.glucoseContext || null,
                bpSystolic: vital.bpSystolic !== undefined ? parseFloat(vital.bpSystolic) : null,
                bpDiastolic: vital.bpDiastolic !== undefined ? parseFloat(vital.bpDiastolic) : null,
                bpPulse: vital.bpPulse !== undefined ? parseFloat(vital.bpPulse) : null,
                dateTime: logDate,
                notes: vital.notes || ''
              }
            });
          }
          console.log(`[MediVault Confirm] Logged ${updates.vitals.length} vital readings for record ${id}.`);
        }

        // 2. Update user profile details
        const userProfile = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
        if (userProfile) {
          const profileUpdates: any = {};
          
          let existingAllergies: string[] = [];
          try { existingAllergies = JSON.parse(userProfile.allergies || '[]'); } catch (e) {}
          
          let existingConditions: string[] = [];
          try { existingConditions = JSON.parse(userProfile.conditions || '[]'); } catch (e) {}

          // Height & Weight
          if (updates.height) profileUpdates.height = updates.height;
          if (updates.weight) profileUpdates.weight = updates.weight;

          // Allergies
          if (updates.allergies && Array.isArray(updates.allergies)) {
            let updated = false;
            for (const allergy of updates.allergies) {
              if (!existingAllergies.includes(allergy)) {
                existingAllergies.push(allergy);
                updated = true;
              }
            }
            if (updated) profileUpdates.allergies = JSON.stringify(existingAllergies);
          }

          // Conditions
          if (updates.conditions && Array.isArray(updates.conditions)) {
            let updated = false;
            for (const cond of updates.conditions) {
              if (!existingConditions.includes(cond)) {
                existingConditions.push(cond);
                updated = true;
              }
            }
            if (updated) profileUpdates.conditions = JSON.stringify(existingConditions);
          }

          if (Object.keys(profileUpdates).length > 0) {
            await prisma.user.update({
              where: { id: DEFAULT_USER_ID },
              data: profileUpdates
            });
            console.log(`[MediVault Confirm] Updated profile fields:`, profileUpdates);
          }
        }
      } catch (parseErr: any) {
        console.error('[MediVault Confirm] Failed to process syncUpdates:', parseErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Medical record confirmed and profile synchronized successfully'
    });
  } catch (error) {
    next(error);
  }
};
