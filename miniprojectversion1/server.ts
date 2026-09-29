import express from 'express';
import path from 'path';
import { randomInt } from 'crypto';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './server/db';
import { User, PatientProfile, HealthMetric, Appointment, Prescription, ChatMessage, MedicineReminder, BloodDonor, DoctorApplication } from './src/types';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

const app = express();
const PORT = 3000;
const otpStore = new Map<string, { code: string; expiresAt: number; payload: Record<string, any> }>();
const verifiedOtpEmails = new Map<string, string>();

app.use(express.json({ limit: '10mb' }));

// Lazy-initialize Gemini API to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('WARNING: GEMINI_API_KEY is not defined. AI features will fallback to rule-based mock answers.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function callOpenRouter(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const userPrompt = typeof params.contents === 'string'
    ? params.contents
    : JSON.stringify(params.contents, null, 2);

  const systemInstruction = params.config?.systemInstruction || 'You are a helpful AI assistant.';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'MedTech AI'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  return {
    text: typeof text === 'string' ? text : JSON.stringify(text ?? {}),
    raw: data
  };
}

function generateOtpCode(): string {
  return randomInt(100000, 1000000).toString();
}

async function sendOtpEmail(email: string, code: string) {
  const smtpUser = String(process.env.GMAIL_USER || 'saecproject2026@gmail.com').trim();
  const smtpPass = String(process.env.GMAIL_APP_PASSWORD || 'rlbkxfhldvqieyiy').replace(/\s+/g, '');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  await transporter.sendMail({
    from: `"MEDTECH 4" <${smtpUser}>`,
    to: email,
    subject: 'MEDTECH 4 - Your Email Verification Code',
    text: `Your MEDTECH 4 verification code is ${code}. Use it to complete sign-in or registration. This code is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #dfe7f5; border-radius: 16px; background: #f8fbff;">
        <h2 style="color: #0f172a; margin-bottom: 10px;">MEDTECH 4 Email Verification</h2>
        <p style="color: #475569; line-height: 1.6;">Use the following code to verify your email address and complete sign-in or registration:</p>
        <div style="padding: 18px 20px; background: #0f172a; color: #ffffff; border-radius: 12px; font-size: 28px; letter-spacing: 4px; font-weight: 700; text-align: center; margin: 20px 0;">${code}</div>
        <p style="color: #64748b; margin: 0;">This code will expire in 5 minutes.</p>
      </div>
    `
  });
}

// Wrapper for robust generation with auto-retries and fallback to gemini-3.1-flash-lite if gemini-3.5-flash is overloaded
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  if (OPENROUTER_API_KEY) {
    try {
      return await callOpenRouter(params);
    } catch (error) {
      console.warn('[OpenRouter] Request failed, falling back to Gemini.', error);
    }
  }

  const ai = getGeminiClient();
  const primaryModel = 'gemini-3.5-flash';
  const fallbackModel = 'gemini-3.1-flash-lite';
  
  const maxRetries = 2;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: primaryModel,
        contents: params.contents,
        config: params.config
      });
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`[Gemini API] Attempt ${attempt} failed with model ${primaryModel}:`, error?.message || error);
      if (attempt < maxRetries) {
        // Wait 1.5s before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }
  
  console.warn(`[Gemini API] Falling back to secondary model ${fallbackModel} due to primary model failures.`);
  try {
    const response = await ai.models.generateContent({
      model: fallbackModel,
      contents: params.contents,
      config: params.config
    });
    return response;
  } catch (error: any) {
    console.error(`[Gemini API] Secondary model ${fallbackModel} also failed:`, error?.message || error);
    throw lastError || error;
  }
}

// REST APIs

// 1. Auth & Profiles
app.post('/api/auth/login', (req, res) => {
  res.status(410).json({ error: 'Password-only sign-in is disabled. Request and verify the email OTP to sign in.' });
});

app.post('/api/auth/send-otp', async (req, res) => {
  const { email, role } = req.body;

  if (!email || !String(email).trim()) {
    res.status(400).json({ error: 'Email is required to send OTP.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const allowedRoles = ['patient', 'doctor', 'admin'];
  if (!allowedRoles.includes(role)) {
    res.status(400).json({ error: 'Select a valid account role.' });
    return;
  }

  if (db.getUsers().some(user => user.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: 'This email is already registered. Sign in to request a login code.' });
    return;
  }

  const code = generateOtpCode();
  otpStore.set(normalizedEmail, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    payload: { email: normalizedEmail, role, purpose: 'signup' }
  });
  verifiedOtpEmails.delete(normalizedEmail);

  try {
    await sendOtpEmail(normalizedEmail, code);
    res.json({ success: true, message: 'OTP sent successfully to your email address.' });
  } catch (error: any) {
    console.error('Failed to send OTP email:', error);
    otpStore.delete(normalizedEmail);
    verifiedOtpEmails.delete(normalizedEmail);
    res.status(500).json({
      error: 'Unable to send OTP email. Check the Gmail app password and account settings, then try again.',
      details: error?.message || 'SMTP delivery failed.'
    });
  }
});

app.post('/api/auth/login/request-otp', async (req, res) => {
  const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
  const { password, role } = req.body || {};
  if (!normalizedEmail || typeof password !== 'string' || !['patient', 'doctor', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Email, password, and a valid role are required.' });
    return;
  }

  const user = db.getUsers().find(candidate =>
    candidate.email.toLowerCase() === normalizedEmail && candidate.role === role
  );
  if (!user || !db.verifyUserPassword(user.id, password)) {
    res.status(401).json({ error: 'Invalid email, password, or role.' });
    return;
  }
  if (role === 'doctor' && user.doctorVerificationStatus !== 'approved') {
    res.status(403).json({
      error: user.doctorVerificationStatus === 'rejected'
        ? 'Your degree verification was not approved. Contact the administrator.'
        : 'Your degree file is awaiting administrator verification.'
    });
    return;
  }

  const code = generateOtpCode();
  otpStore.set(normalizedEmail, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    payload: { email: normalizedEmail, role, purpose: 'login', userId: user.id }
  });
  verifiedOtpEmails.delete(normalizedEmail);

  try {
    await sendOtpEmail(normalizedEmail, code);
    res.json({ success: true, message: 'Login code sent to your registered email address.' });
  } catch (error: any) {
    console.error('Failed to send login OTP email:', error);
    otpStore.delete(normalizedEmail);
    res.status(500).json({
      error: 'Unable to send a login code to this email address. Check email delivery settings and try again.',
      details: error?.message || 'SMTP delivery failed.'
    });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const stored = otpStore.get(normalizedEmail);

  if (!stored) {
    res.status(400).json({ error: 'No OTP request found for this email address.' });
    return;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalizedEmail);
    verifiedOtpEmails.delete(normalizedEmail);
    res.status(400).json({ error: 'OTP expired. Please request a fresh code.' });
    return;
  }

  if (String(stored.code) !== String(otp)) {
    res.status(400).json({ error: 'Invalid OTP. Please check the code and try again.' });
    return;
  }

  otpStore.delete(normalizedEmail);

  if (stored.payload.purpose === 'login') {
    const user = db.getUsers().find(candidate =>
      candidate.id === stored.payload.userId && candidate.role === stored.payload.role && candidate.email.toLowerCase() === normalizedEmail
    );
    if (!user) {
      res.status(401).json({ error: 'Account is no longer available. Please try signing in again.' });
      return;
    }
    res.json({
      success: true,
      purpose: 'login',
      message: 'Email verified successfully.',
      token: `mock-jwt-token-${user.id}`,
      user
    });
    return;
  }

  verifiedOtpEmails.set(normalizedEmail, String(stored.payload.role || 'patient'));
  res.json({ success: true, purpose: 'signup', message: 'OTP verified successfully.', userData: stored.payload });
});

app.post('/api/auth/register', async (req, res) => {
  const { 
    name, email, phoneNumber, dateOfBirth, age, gender, role, otp, password,
    bloodGroup, majorHealthIssue, emergencyContact, height, weight,
    specialty, licenseNumber, experienceYears, hospitalAffiliation, degreeFile,
    staffId, department
  } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  if (!['patient', 'doctor', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Select a valid account role.' });
    return;
  }

  const supportedDegreeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (role === 'doctor') {
    const validDegreeFile = degreeFile &&
      typeof degreeFile.name === 'string' && degreeFile.name.trim() &&
      typeof degreeFile.type === 'string' && supportedDegreeTypes.includes(degreeFile.type) &&
      typeof degreeFile.data === 'string' &&
      degreeFile.data.startsWith(`data:${degreeFile.type};base64,`) &&
      degreeFile.data.length <= 7 * 1024 * 1024;
    if (!validDegreeFile) {
      res.status(400).json({ error: 'Doctors must upload a valid PDF, JPG, or PNG degree file up to 5 MB.' });
      return;
    }
  }

  const storedOtp = otpStore.get(normalizedEmail);
  const isVerified = verifiedOtpEmails.get(normalizedEmail) === role;

  if (!storedOtp && !isVerified) {
    res.status(400).json({ error: 'Please request and verify an OTP before registering.' });
    return;
  }

  if (storedOtp && String(storedOtp.code) !== String(otp)) {
    res.status(400).json({ error: 'Incorrect OTP. Please verify your email again.' });
    return;
  }

  if (storedOtp && otp !== undefined && otp !== null && String(otp).trim() !== '') {
    otpStore.delete(normalizedEmail);
  }
  verifiedOtpEmails.delete(normalizedEmail);

  const users = db.getUsers();
  
  if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
    otpStore.delete(normalizedEmail);
    res.status(400).json({ error: 'This email address is already registered in the system.' });
    return;
  }

  if (phoneNumber && users.find(u => u.phoneNumber && u.phoneNumber.replace(/\D/g, '') === phoneNumber.replace(/\D/g, ''))) {
    otpStore.delete(normalizedEmail);
    res.status(400).json({ error: 'This phone number is already registered in the system.' });
    return;
  }

  const prefix = role === 'patient' ? 'pat' : role === 'doctor' ? 'doc' : 'admin';
  const id = `${prefix}_${Date.now()}`;
  
  const newUser: User = { 
    id, 
    name: name.trim(), 
    email: normalizedEmail, 
    phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
    dateOfBirth: dateOfBirth || undefined,
    age: parseInt(age) || undefined,
    gender: gender || 'Other',
    role,
    // Role specific fields
    specialty: role === 'doctor' ? specialty : undefined,
    licenseNumber: role === 'doctor' ? licenseNumber : undefined,
    experienceYears: role === 'doctor' ? (parseInt(experienceYears) || 5) : undefined,
    hospitalAffiliation: role === 'doctor' ? hospitalAffiliation : undefined,
    staffId: role === 'admin' ? staffId : undefined,
    department: role === 'admin' ? department : undefined,
    bloodGroup: role === 'patient' ? bloodGroup : undefined,
    majorHealthIssue: role === 'patient' ? (majorHealthIssue || undefined) : undefined,
    emergencyContact: role === 'patient' ? emergencyContact : undefined,
    doctorVerificationStatus: role === 'doctor' ? 'pending' : undefined,
  };

  const doctorApplication: DoctorApplication | undefined = role === 'doctor' ? {
    userId: id,
    name: newUser.name,
    email: newUser.email,
    degreeFileName: path.basename(degreeFile.name),
    degreeFileMimeType: degreeFile.type,
    degreeFileData: degreeFile.data,
    status: 'pending',
    submittedAt: new Date().toISOString()
  } : undefined;

  try {
    await db.addUser(newUser, password, doctorApplication);

    if (role === 'patient') {
      await db.savePatientProfile(id, {
        userId: id,
        age: parseInt(age) || 30,
        dateOfBirth: dateOfBirth || '1996-01-01',
        gender: gender || 'Other',
        bloodGroup: bloodGroup || 'O+',
        phoneNumber: phoneNumber || undefined,
        majorHealthIssue: majorHealthIssue || undefined,
        emergencyContact: emergencyContact || undefined,
        height: parseInt(height) || 170,
        weight: parseInt(weight) || 65,
        medicalHistory: majorHealthIssue ? [majorHealthIssue] : [],
        allergies: [],
        currentMedicines: [],
        vaccinationHistory: [],
        labReports: []
      });
    }

    otpStore.delete(normalizedEmail);
    res.status(201).json({
      user: newUser,
      pendingApproval: role === 'doctor',
      token: role === 'doctor' ? undefined : `mock-jwt-token-${id}`
    });
  } catch (error: any) {
    console.error('[Register] Failed to save user record.', error);
    res.status(500).json({ error: 'Registration saved locally but database write failed. Please check MongoDB connection.' });
  }
});

// 2. Health Records & Profile management
app.patch('/api/users/:id/profile', async (req, res) => {
  const updates: Partial<User> = {};
  const editableTextFields: Array<keyof User> = [
    'name', 'phoneNumber', 'dateOfBirth', 'gender', 'bloodGroup',
    'emergencyContact', 'majorHealthIssue', 'specialty', 'licenseNumber',
    'hospitalAffiliation', 'department'
  ];

  for (const field of editableTextFields) {
    const value = req.body?.[field];
    if (typeof value === 'string') {
      (updates as Record<string, unknown>)[field] = value.trim();
    }
  }

  if (typeof req.body?.age === 'number' && req.body.age >= 0) updates.age = req.body.age;
  if (typeof req.body?.experienceYears === 'number' && req.body.experienceYears >= 0) {
    updates.experienceYears = req.body.experienceYears;
  }

  if (updates.name !== undefined && !updates.name) {
    res.status(400).json({ error: 'Name cannot be empty.' });
    return;
  }

  const updatedUser = await db.updateUserProfile(req.params.id, updates);
  if (!updatedUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json(updatedUser);
});

app.get('/api/patient/:id/profile', (req, res) => {
  const profile = db.getPatientProfile(req.params.id);
  if (profile) {
    res.json(profile);
  } else {
    res.status(404).json({ error: 'Profile not found' });
  }
});

app.post('/api/patient/:id/profile', (req, res) => {
  const profile = db.savePatientProfile(req.params.id, req.body);
  res.json(profile);
});

app.get('/api/patient/:id/metrics', (req, res) => {
  res.json(db.getHealthMetrics(req.params.id));
});

app.post('/api/patient/:id/metrics', (req, res) => {
  const metric = db.addHealthMetric(req.params.id, req.body);
  res.json(metric);
});

// 3. Appointments Module
app.get('/api/appointments', (req, res) => {
  const { patientId, doctorId } = req.query;
  let list = db.getAppointments();
  if (patientId) {
    list = list.filter(a => a.patientId === patientId);
  }
  if (doctorId) {
    list = list.filter(a => a.doctorId === doctorId);
  }
  res.json(list);
});

app.post('/api/appointments', (req, res) => {
  const apt: Appointment = {
    id: `apt_${Date.now()}`,
    ...req.body,
    status: req.body.isEmergency ? 'approved' : 'pending' // Emergency auto-approved or pending doctor approval
  };
  db.addAppointment(apt);
  res.status(201).json(apt);
});

app.patch('/api/appointments/:id', (req, res) => {
  const { status } = req.body;
  const updated = db.updateAppointmentStatus(req.params.id, status);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

// 4. Prescriptions Module
app.get('/api/prescriptions', (req, res) => {
  const { patientId, doctorId } = req.query;
  let list = db.getPrescriptions();
  if (patientId) {
    list = list.filter(p => p.patientId === patientId);
  }
  if (doctorId) {
    list = list.filter(p => p.doctorId === doctorId);
  }
  res.json(list);
});

app.post('/api/prescriptions', (req, res) => {
  const prescription: Prescription = {
    id: `rx_${Date.now()}`,
    ...req.body,
    date: new Date().toISOString().split('T')[0]
  };
  db.addPrescription(prescription);
  res.status(201).json(prescription);
});

// 5. Patient/Doctor Chat messages
app.get('/api/chats', (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    res.status(400).json({ error: 'Both user1 and user2 query parameters are required' });
    return;
  }
  res.json(db.getChatMessages(user1 as string, user2 as string));
});

app.post('/api/chats', (req, res) => {
  const msg: ChatMessage = {
    id: `msg_${Date.now()}`,
    ...req.body,
    timestamp: new Date().toISOString()
  };
  db.addChatMessage(msg);
  res.status(201).json(msg);
});

app.post('/api/runtime/logs', async (req, res) => {
  const payload = req.body || {};
  const saved = await db.insertRuntimeLog(payload);
  res.status(201).json(saved);
});

app.get('/api/runtime/logs', async (req, res) => {
  const limit = Number(req.query.limit || 20);
  const logs = await db.getRuntimeLogs(Number.isFinite(limit) && limit > 0 ? limit : 20);
  res.json(logs);
});

// 6. Medicine Reminders
app.get('/api/reminders/:patientId', (req, res) => {
  res.json(db.getReminders(req.params.patientId));
});

app.post('/api/reminders', (req, res) => {
  const reminder: MedicineReminder = {
    id: `rem_${Date.now()}`,
    ...req.body,
    isActive: true
  };
  db.addReminder(reminder);
  res.status(201).json(reminder);
});

app.patch('/api/reminders/:id/toggle', (req, res) => {
  const updated = db.toggleReminder(req.params.id);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

app.delete('/api/reminders/:id', (req, res) => {
  db.deleteReminder(req.params.id);
  res.json({ success: true });
});

// 7. Blood Donor Finder
app.get('/api/donors', (req, res) => {
  const { bloodGroup, city } = req.query;
  let list = db.getBloodDonors();
  if (bloodGroup) {
    list = list.filter(d => d.bloodGroup === bloodGroup);
  }
  if (city) {
    list = list.filter(d => d.city.toLowerCase().includes((city as string).toLowerCase()));
  }
  res.json(list);
});

app.post('/api/donors', (req, res) => {
  const donor: BloodDonor = {
    id: `don_${Date.now()}`,
    ...req.body,
    available: true
  };
  db.addBloodDonor(donor);
  res.status(201).json(donor);
});

// 8. Nearby Hospitals Finder
app.get('/api/hospitals', (req, res) => {
  res.json(db.getHospitals());
});

// 9. Admin Operations
app.get('/api/admin/users', (req, res) => {
  res.json(db.getUsers());
});

app.get('/api/doctors', (req, res) => {
  const doctors = db.getUsers()
    .filter(user => user.role === 'doctor' && user.doctorVerificationStatus === 'approved')
    .map(({ id, name, specialty }) => ({ id, name, specialty: specialty || 'Doctor' }));
  res.json(doctors);
});

app.get('/api/admin/doctor-applications', (req, res) => {
  res.json(db.getDoctorApplications());
});

app.post('/api/admin/doctor-applications/:userId/verify', async (req, res) => {
  const application = await db.approveDoctorApplication(req.params.userId);
  if (!application) {
    res.status(404).json({ error: 'Doctor application not found.' });
    return;
  }
  res.json({ success: true, application });
});

app.get('/api/admin/analytics', (req, res) => {
  const appointments = db.getAppointments();
  const totalUsers = db.getUsers().length;
  const totalDoctors = db.getUsers().filter(u => u.role === 'doctor').length;
  const totalPatients = db.getUsers().filter(u => u.role === 'patient').length;
  const emergencyCount = appointments.filter(a => a.isEmergency).length;
  
  // Doctor distribution
  const appointmentsPerDoctor: Record<string, number> = {};
  appointments.forEach(a => {
    appointmentsPerDoctor[a.doctorName] = (appointmentsPerDoctor[a.doctorName] || 0) + 1;
  });

  res.json({
    totalUsers,
    totalDoctors,
    totalPatients,
    emergencyCount,
    appointmentStats: {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      approved: appointments.filter(a => a.status === 'approved').length,
      completed: appointments.filter(a => a.status === 'completed').length
    },
    doctorDistribution: Object.entries(appointmentsPerDoctor).map(([name, count]) => ({ name, count })),
    hospitalsCount: db.getHospitals().length,
    donorsCount: db.getBloodDonors().length
  });
});

app.delete('/api/admin/doctors/:id', (req, res) => {
  db.deleteDoctor(req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/patients/:id', (req, res) => {
  db.deletePatient(req.params.id);
  res.json({ success: true });
});

// ==========================================
// AI / GEMINI FEATURES
// ==========================================

// 1. AI Chatbot Medical Assistant
app.post('/api/ai/chatbot', async (req, res) => {
  const { message, history } = req.body;
  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  const msgLower = (message || '').toLowerCase();
  
  // Helper for generating appropriate over-the-counter / supportive medicine recommendations for fallback
  const getFallbackMedicines = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('fever') || t.includes('headache') || t.includes('pain') || t.includes('body ache')) {
      return [
        { name: 'Paracetamol 500mg', dosage: '1-0-1', duration: '3 days', instructions: 'Take with water after meals when fever/pain occurs' },
        { name: 'Vitamin C 500mg + Zinc', dosage: '1-0-0', duration: '7 days', instructions: 'Chewable tablet after breakfast' },
        { name: 'Oral Electrolyte Hydration', dosage: 'As needed', duration: '3 days', instructions: 'Dissolve in 1L clean drinking water' }
      ];
    } else if (t.includes('cold') || t.includes('cough') || t.includes('throat') || t.includes('flu')) {
      return [
        { name: 'Cetirizine 10mg', dosage: '0-0-1', duration: '5 days', instructions: 'Take 1 tablet at bedtime for allergy/sneezing' },
        { name: 'Dextromethorphan / Herbal Cough Syrup', dosage: '2 tsp Twice Daily', duration: '5 days', instructions: 'Take after warm water' },
        { name: 'Warm Saline Gargle / Lozenges', dosage: '3-4 times daily', duration: '5 days', instructions: 'Soothe irritated throat' }
      ];
    } else if (t.includes('stomach') || t.includes('acid') || t.includes('gastric') || t.includes('digest') || t.includes('nausea')) {
      return [
        { name: 'Pantoprazole 40mg', dosage: '1-0-0', duration: '5 days', instructions: 'Take 30 minutes before breakfast' },
        { name: 'Oral Rehydration Salts (ORS)', dosage: '1-2 liters daily', duration: '3 days', instructions: 'Sip throughout the day' },
        { name: 'Probiotics Capsule', dosage: '0-1-0', duration: '7 days', instructions: 'Take with lunch to restore gut flora' }
      ];
    } else if (t.includes('allergy') || t.includes('rash') || t.includes('itch')) {
      return [
        { name: 'Levocetirizine 5mg', dosage: '0-0-1', duration: '5 days', instructions: 'Take at night' },
        { name: 'Calamine Cooling Lotion', dosage: 'Apply twice daily', duration: '5 days', instructions: 'Topical application over affected areas' }
      ];
    } else if (t.includes('vitamin') || t.includes('diet') || t.includes('energy') || t.includes('weak') || t.includes('health')) {
      return [
        { name: 'Multivitamin & Mineral Complex', dosage: '1-0-0', duration: '30 days', instructions: 'Take with breakfast' },
        { name: 'Vitamin D3 2000 IU', dosage: '1-0-0', duration: '30 days', instructions: 'Take with meals' },
        { name: 'Omega-3 Fish Oil 1000mg', dosage: '0-1-0', duration: '30 days', instructions: 'Take after lunch' }
      ];
    }
    return undefined;
  };

  if (!hasApiKey) {
    let replyText = `I am your MedTech AI Assistant. (Running in offline demo mode. Set GEMINI_API_KEY in Secrets for live AI responses.)\n\nBased on your query "${message}":\n• Maintain good hydration and restful recovery.\n• For mild discomfort, follow standard supportive care and dosage.\n• Please consult a certified doctor for personalized diagnosis.`;
    
    if (msgLower.includes('fever') || msgLower.includes('cold') || msgLower.includes('cough')) {
      replyText = `For fever, headache, or cold symptoms:\n• Rest adequately and drink at least 2.5-3L of warm fluids.\n• Monitor body temperature twice daily.\n• You can download the recommended supportive medicine PDF schedule below or add reminders directly to your dashboard.`;
    } else if (msgLower.includes('stomach') || msgLower.includes('acid') || msgLower.includes('gas')) {
      replyText = `For digestive or acidity discomfort:\n• Avoid spicy, greasy, or deep-fried foods.\n• Eat smaller, frequent bland meals (oats, bananas, rice).\n• Review the supportive medications table below and export your Care PDF.`;
    }

    const meds = getFallbackMedicines(message);

    res.json({
      reply: replyText,
      medicines: meds,
      suggestedDiagnosis: meds ? 'Symptomatic Relief & General Care' : undefined
    });
    return;
  }

  try {
    const ai = getGeminiClient();
    
    const systemInstruction = `You are an expert, empathetic AI Medical Assistant named "MedTech AI". 
You answer healthcare questions, explain diseases simply, suggest supportive over-the-counter first-aid / medicine regimens, and provide clean advice.
CRITICAL MANDATES:
1. Always state that this guidance does not replace an in-person clinical doctor evaluation.
2. If severe emergency symptoms are described (chest pain, shortness of breath, severe trauma), advise immediate emergency clinic contact.
3. If the user asks about symptoms, ailments, or medicines, provide clear empathetic text in the 'reply' field AND also provide structured 'medicines' array if safe over-the-counter or supportive remedies are applicable (with name, dosage like 1-0-1, duration, and instructions).
4. Return a valid JSON object matching:
{
  "reply": "Conversational message text with key bullet points...",
  "suggestedDiagnosis": "Optional suspected condition or health topic",
  "medicines": [
    { "name": "Medicine / Remedy Name & Strength", "dosage": "1-0-1", "duration": "3-5 days", "instructions": "After meals with water" }
  ]
}`;

    const chatHistory = history?.map((h: any) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    })) || [];

    const response = await generateContentWithFallback({
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      res.json({
        reply: parsed.reply || response.text,
        medicines: parsed.medicines && parsed.medicines.length > 0 ? parsed.medicines : getFallbackMedicines(message),
        suggestedDiagnosis: parsed.suggestedDiagnosis
      });
    } catch {
      res.json({ 
        reply: response.text,
        medicines: getFallbackMedicines(message)
      });
    }
  } catch (error: any) {
    console.error('Gemini chatbot error (falling back to clinical assistant):', error);
    const meds = getFallbackMedicines(message);
    let responseText = `Hello! I am your MedTech AI Assistant. For minor symptoms: stay hydrated, rest well, and follow the structured medication schedule provided below. You can download the complete prescription PDF using the button attached.`;
    res.json({ 
      reply: `[Clinical Care Backup] ${responseText}`,
      medicines: meds,
      suggestedDiagnosis: 'Supportive Symptomatic Care'
    });
  }
});

// 2. AI Disease Predictor (Risk Percentage based on symptoms)
app.post('/api/ai/predict-disease', async (req, res) => {
  const { symptoms, gender, age } = req.body;
  
  const getFallbackPrediction = () => {
    const symLower = (symptoms || '').toLowerCase();
    let risk = 15;
    let disease = 'Common Cold / Physical Fatigue';
    let specialist = 'General Physician';
    let measures = ['Ensure 8 hours of deep sleep.', 'Stay hydrated (2-3L water).', 'Take vitamin C and monitor core body temperature.'];
    let medicines = [
      { name: 'Paracetamol 500mg', dosage: '1-0-1', duration: '3 days', instructions: 'Take after meals for fever/headache' },
      { name: 'Vitamin C 500mg Chewable', dosage: '1-0-0', duration: '7 days', instructions: 'After breakfast' }
    ];

    if (symLower.includes('chest') || symLower.includes('heart') || symLower.includes('breath')) {
      risk = 45;
      disease = 'Potential Cardiovascular Strain';
      specialist = 'Cardiologist';
      measures = ['Avoid vigorous exercise immediately.', 'Track blood pressure and heart rate.', 'Seek prompt medical diagnostic tests like an ECG.'];
      medicines = [
        { name: 'Aspirin 75mg (Consult Doctor First)', dosage: '0-1-0', duration: 'As directed', instructions: 'Take after food if prescribed by physician' },
        { name: 'Coenzyme Q10 100mg', dosage: '1-0-0', duration: '30 days', instructions: 'Cardiovascular supportive antioxidant' }
      ];
    } else if (symLower.includes('sugar') || symLower.includes('thirst') || symLower.includes('urine')) {
      risk = 35;
      disease = 'Impaired Glucose Tolerance (Pre-diabetes)';
      specialist = 'Endocrinologist';
      measures = ['Significantly reduce refined sugar intake.', 'Integrate 30 mins daily walking.', 'Schedule a fasting blood glucose and HbA1c lab test.'];
      medicines = [
        { name: 'Chromium Picolinate / Alpha Lipoic Acid', dosage: '1-0-0', duration: '30 days', instructions: 'Supportive glucose metabolic supplement' },
        { name: 'Cinnamon Bark Extract 500mg', dosage: '0-1-0', duration: '30 days', instructions: 'Take with lunch' }
      ];
    } else if (symLower.includes('skin') || symLower.includes('itch') || symLower.includes('rash')) {
      risk = 25;
      disease = 'Allergic Dermatitis / Eczema';
      specialist = 'Dermatologist';
      measures = ['Avoid using heavily scented skin soaps.', 'Apply a cooling hypoallergenic moisturizer.', 'Note down triggering foods or environmental allergens.'];
      medicines = [
        { name: 'Cetirizine 10mg', dosage: '0-0-1', duration: '5 days', instructions: 'Night time for anti-itch relief' },
        { name: 'Hydrocortisone 1% Cream (Topical)', dosage: 'Apply 2x daily', duration: '5 days', instructions: 'Apply thin layer to affected skin' }
      ];
    }

    return {
      possibleDisease: disease,
      riskPercentage: risk,
      preventiveMeasures: measures,
      recommendedMedicines: medicines,
      recommendedDoctor: specialist,
      isMock: true
    };
  };

  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  if (!hasApiKey) {
    res.json(getFallbackPrediction());
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Perform a comprehensive risk assessment for symptoms: "${symptoms}". Gender: ${gender}, Age: ${age}.
Include recommended supportive medications / OTC remedies where safe.
Respond with a valid JSON object matching this schema exactly:
{
  "possibleDisease": "Name of primary suspect disease",
  "riskPercentage": 45, // integer percentage
  "preventiveMeasures": ["measure 1", "measure 2", "measure 3"],
  "recommendedMedicines": [
    { "name": "Medicine Name & Strength", "dosage": "1-0-1", "duration": "5 days", "instructions": "After food with water" }
  ],
  "recommendedDoctor": "Cardiologist / Endocrinologist / etc."
}`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleDisease: { type: Type.STRING },
            riskPercentage: { type: Type.INTEGER },
            preventiveMeasures: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedMedicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  instructions: { type: Type.STRING }
                },
                required: ['name', 'dosage', 'duration', 'instructions']
              }
            },
            recommendedDoctor: { type: Type.STRING }
          },
          required: ['possibleDisease', 'riskPercentage', 'preventiveMeasures', 'recommendedMedicines', 'recommendedDoctor']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini prediction error (falling back to clinical rules):', error);
    res.json(getFallbackPrediction());
  }
});

// 3. AI Diet and Exercise plan recommendations
app.post('/api/ai/diet-plan', async (req, res) => {
  const { age, gender, medicalHistory, goals } = req.body;
  
  // Smart personalized fallback generator
  const getFallbackPlan = () => {
    const historyStr = JSON.stringify(medicalHistory || []).toLowerCase();
    const goalsStr = (goals || '').toLowerCase();

    let breakfast = 'Oatmeal with chia seeds, banana, walnuts, and almond milk';
    let lunch = 'Grilled chicken breast quinoa bowl with avocados, cherry tomatoes, and fresh spinach';
    let dinner = 'Steamed salmon filet with roasted broccoli florets and wild sweet potato';
    let fruits = 'Fresh organic blueberries, sweet raspberries, and raw unsalted almonds';
    let waterIntake = '2.5 to 3.0 Liters of pure water daily';
    let exercisePlan = '30 minutes of cardiovascular walking daily and 2 light yoga/stretching sessions weekly.';

    if (historyStr.includes('hypertension') || historyStr.includes('heart') || historyStr.includes('bp') || historyStr.includes('pressure') || goalsStr.includes('hypertension') || goalsStr.includes('heart') || goalsStr.includes('pressure')) {
      breakfast = 'Sodium-free steel-cut oats with blueberries, flaxseeds, and unsalted walnuts';
      lunch = 'Low-sodium grilled skinless chicken salad with baby spinach, raw cucumber, and extra virgin olive oil';
      dinner = 'Baked wild-caught trout with steamed lemon asparagus and boiled sweet potato (no added table salt)';
      fruits = 'Fresh red apples, potassium-rich bananas, and sliced oranges';
      waterIntake = '2.5 Liters of water daily (strict restriction of caffeine and energy drinks)';
      exercisePlan = '30-40 minutes of moderate-intensity aerobic exercise (steady brisk walking or cycling) 4 times a week.';
    } else if (historyStr.includes('diabetes') || historyStr.includes('sugar') || historyStr.includes('diabetic') || goalsStr.includes('diabetes') || goalsStr.includes('sugar') || goalsStr.includes('glycemic')) {
      breakfast = 'Scrambled organic eggs (2) with sautéed spinach, mushrooms, sliced avocado, and organic green tea';
      lunch = 'Wild-caught tuna over dark mixed leafy greens with cucumber, pumpkin seeds, and avocado oil dressing';
      dinner = 'Baked garlic cod with seasoned steamed broccoli, cauliflower rice, and thin green beans';
      fruits = 'Low-glycemic strawberries, blackberries, and fresh walnuts';
      waterIntake = '3.0 Liters of water daily to maintain metabolic hydration and support insulin sensitivity';
      exercisePlan = '30 minutes of aerobic walking daily, combined with light bodyweight exercises 3 times a week.';
    } else if (goalsStr.includes('muscle') || goalsStr.includes('stamina') || goalsStr.includes('build') || goalsStr.includes('strength') || goalsStr.includes('fat') || goalsStr.includes('lose') || goalsStr.includes('weight')) {
      breakfast = 'High-protein oatmeal made with whey protein, chia seeds, banana, and natural peanut butter';
      lunch = 'Lean turkey breast strip bowl with roasted sweet potato, broccoli, and steamed brown jasmine rice';
      dinner = 'Grilled lean beef sirloin or high-protein organic tofu with grilled asparagus, carrots, and quinoa';
      fruits = 'Bananas, kiwi, oranges, and mixed pumpkin/sunflower seed mix';
      waterIntake = '3.5 Liters of water daily to optimize muscle hydration and protein synthesis';
      exercisePlan = '45-60 minutes of progressive resistance training (weightlifting or calisthenics) 3-4 times a week.';
    }

    return { breakfast, lunch, dinner, fruits, waterIntake, exercisePlan, isFallback: true };
  };

  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  if (!hasApiKey) {
    res.json(getFallbackPlan());
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Create a healthy daily meal diet plan and simple exercise routine for a person of Age: ${age}, Gender: ${gender}, Medical conditions: ${JSON.stringify(medicalHistory || [])}, Fitness focus: "${goals || 'General fitness'}".
Respond with a valid JSON matching this schema exactly:
{
  "breakfast": "Oatmeal with almonds...",
  "lunch": "Salad with baked salmon...",
  "dinner": "Vegetable stir-fry...",
  "fruits": "Berries and citrus fruits...",
  "waterIntake": "3 Liters daily...",
  "exercisePlan": "30 mins walking daily..."
}`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakfast: { type: Type.STRING },
            lunch: { type: Type.STRING },
            dinner: { type: Type.STRING },
            fruits: { type: Type.STRING },
            waterIntake: { type: Type.STRING },
            exercisePlan: { type: Type.STRING }
          },
          required: ['breakfast', 'lunch', 'dinner', 'fruits', 'waterIntake', 'exercisePlan']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini diet planner error (falling back to customized plan):', error);
    res.json(getFallbackPlan());
  }
});

// 4. AI-assisted diagnosis suggestions (for Doctor Dashboard)
app.post('/api/ai/doctor-diagnosis', async (req, res) => {
  const { symptoms, history, patientAge, patientGender } = req.body;
  
  const getFallbackSuggestions = () => {
    return {
      suggestions: [
        'Perform basic blood chemistry panel & CBC check to rule out underlying infections.',
        'Consider ordering a targeted non-invasive screening (e.g. ECG, Abdominal Ultrasound).',
        'Review current active prescription lists to rule out potential medication interaction symptoms.'
      ]
    };
  };

  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  if (!hasApiKey) {
    res.json(getFallbackSuggestions());
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are a clinical assistant supporting a licensed physician. 
Review Patient details: Age: ${patientAge}, Gender: ${patientGender}, Symptoms: "${symptoms}", History: ${JSON.stringify(history || [])}.
Provide 3 structured clinical diagnosis checks or next diagnostic steps. Return as a JSON object:
{ "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"] }`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['suggestions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini doctor diagnosis suggestion error (falling back):', error);
    res.json(getFallbackSuggestions());
  }
});

// 5. OCR Simulator & AI Lab Report Summarizer
app.post('/api/ai/summarize-report', async (req, res) => {
  const { reportTitle, fileContentBase64 } = req.body;
  
  const getFallbackSummary = () => {
    return {
      summary: `Clinical Summary (MOCK DEMO):
This report ("${reportTitle || 'Complete Blood Panel'}") displays solid metabolic indicators. Electrolytes, kidney enzymes, and liver function assays fall within normal clinical reference limits. Mild iron stores (ferritin) fluctuation is identified.

Recommendations:
1. Increase dietary intake of iron-rich foods such as spinach, lean poultry, and green leafy vegetables.
2. Maintain proper daily hydration and consult with your physician if any symptoms persist.`
    };
  };

  const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  if (!hasApiKey) {
    res.json(getFallbackSummary());
    return;
  }

  try {
    const ai = getGeminiClient();
    let contents: any = `Analyze this lab report titled: "${reportTitle}". Summarize key clinical findings clearly for the patient. Indicate positive points and critical items requiring attention. Highlight recommendations.`;
    
    // If the user actually uploaded a file base64, send to model as multimodal content
    if (fileContentBase64) {
      const isImg = fileContentBase64.startsWith('data:image');
      const mime = isImg ? fileContentBase64.split(';')[0].split(':')[1] : 'application/pdf';
      const actualBase64 = fileContentBase64.split(',')[1] || fileContentBase64;
      
      const filePart = {
        inlineData: {
          mimeType: mime,
          data: actualBase64
        }
      };
      
      contents = {
        parts: [
          filePart,
          { text: `This is a lab report titled "${reportTitle}". Extract the medical findings from this image/document and write an easy-to-understand executive summary for the patient. Mention normal vs abnormal parameters, and advice.` }
        ]
      };
    }

    const response = await generateContentWithFallback({
      contents
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error('Report summarizer error (falling back to mock summary):', error);
    res.json(getFallbackSummary());
  }
});

// Vite Middleware integration for SPA serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
