import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db';

const DEFAULT_USER_ID = 'default-user-id';

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
      patientName,
      tags,
      doctorNotes,
      templateId,
      reportText
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

    const aiData = await extractMedicalData(rawReportText, reportName);

    const labHospital = customLabHospital || aiData.labHospital || 'Unknown Lab';
    const referringDoctor = customReferringDoctor || aiData.referringDoctor || 'Unknown Doctor';
    let finalReportDate = customReportDate || aiData.reportDate;
    if (!finalReportDate) finalReportDate = formattedScanDate;
    const type = reportType || aiData.reportType || 'Documents';
    const finalBodyPart = customBodyPart || aiData.bodyPart || 'General';
    const finalCondition = customDetectedCondition || aiData.detectedCondition || 'Unknown';

    const record = await prisma.medicalRecord.create({
      data: {
        userId: DEFAULT_USER_ID,
        reportName,
        scanDate: formattedScanDate,
        scanTime: formattedScanTime,
        reportDate: finalReportDate,
        reportType: type,
        bodyPart: finalBodyPart,
        detectedCondition: finalCondition,
        labHospital,
        referringDoctor,
        patientName: patientName || 'John Doe',
        tags: JSON.stringify(Array.isArray(tags) ? tags : [type]),
        aiProcessed: true,
        cloudSynced: true,
        aiSummary: aiData.aiSummary,
        doctorNotes: rawReportText,
        extractedValues: JSON.stringify(aiData.extractedValues || [])
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

    res.status(201).json({
      ...record,
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
