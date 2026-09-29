import fs from 'fs';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { MongoClient, type Collection, type Document } from 'mongodb';
import { 
  User, PatientProfile, HealthMetric, Appointment, 
  Prescription, ChatMessage, MedicineReminder, BloodDonor, Hospital, DoctorApplication
} from '../src/types';

const DB_FILE = path.join(process.cwd(), 'medtech_db.json');

export function getMongoDbName(): string {
  return (process.env.MONGO_DB_NAME || 'MEDTECH3').trim();
}

export function getMongoCollectionName(): string {
  return (process.env.MONGO_COLLECTION || 'medtech3').trim();
}

export function buildRuntimeLogEntry(payload: Record<string, any> = {}): Record<string, any> {
  return {
    ...payload,
    timestamp: new Date().toISOString(),
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsage: process.memoryUsage(),
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    }
  };
}

// Interface for DB Structure
interface DatabaseState {
  users: User[];
  passwordHashes: Record<string, string>;
  accountImportVersion?: number;
  doctorApplications: Record<string, DoctorApplication>;
  patientProfiles: Record<string, PatientProfile>; // keyed by patient userId
  healthMetrics: Record<string, HealthMetric[]>; // keyed by patient userId
  appointments: Appointment[];
  prescriptions: Prescription[];
  chatMessages: ChatMessage[];
  reminders: MedicineReminder[];
  bloodDonors: BloodDonor[];
  hospitals: Hospital[];
  runtimeLogs: Record<string, any>[];
}

function createPasswordHash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password: string, storedHash: string | undefined): boolean {
  if (!storedHash) return false;
  const [salt, expectedHash] = storedHash.split(':');
  if (!salt || !expectedHash) return false;

  const actualHash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return actualHash.length === expected.length && timingSafeEqual(actualHash, expected);
}

const importedAccounts: Array<{ user: User; password: string }> = [
  { user: { id: 'doc_2425002', role: 'doctor', name: 'Amarnath JS', email: '2425002@saec.ac.in' }, password: 'Amarnath' },
  { user: { id: 'doc_2425042', role: 'doctor', name: 'Sashank J', email: '2425042@saec.ac.in' }, password: 'Sashank' },
  { user: { id: 'pat_2425013', role: 'patient', name: 'Harish K', email: '2425013@saec.ac.in' }, password: 'Harish' },
  { user: { id: 'pat_2425025', role: 'patient', name: 'Madeshwar R', email: '2425025@saec.ac.in' }, password: 'Madeshwar' },
  { user: { id: 'pat_2425006', role: 'patient', name: 'Charukesh R', email: '2425006@saec.ac.in' }, password: 'Charukesh' },
  { user: { id: 'admin_2425001', role: 'admin', name: 'Abishek R', email: '2425001@saec.ac.in' }, password: 'Abishek' }
];

// Initial seed data
const initialDbState: DatabaseState = {
  runtimeLogs: [],
  passwordHashes: {},
  doctorApplications: {},
  users: [
    { 
      id: 'pat_1', 
      role: 'patient', 
      name: 'John Doe', 
      email: 'john@example.com',
      phoneNumber: '+91 98765 40001',
      dateOfBirth: '1992-04-18',
      age: 34,
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: '+91 98765 41001'
    },
    { 
      id: 'pat_2', 
      role: 'patient', 
      name: 'Jane Smith', 
      email: 'jane@example.com',
      phoneNumber: '+91 98765 40002',
      dateOfBirth: '1997-08-22',
      age: 29,
      gender: 'Female',
      bloodGroup: 'A-',
      emergencyContact: '+91 98765 41002'
    },
    { 
      id: 'doc_1', 
      role: 'doctor', 
      name: 'Dr. Sarah Connor', 
      email: 'sarah@medtech.com',
      phoneNumber: '+91 98765 40003',
      dateOfBirth: '1985-11-14',
      age: 40,
      gender: 'Female',
      specialty: 'Cardiology',
      licenseNumber: 'REG-MC-904218',
      experienceYears: 14,
      hospitalAffiliation: 'MedTech Multi-Specialty Hospital',
      avatarUrl: '' 
    },
    { 
      id: 'doc_2', 
      role: 'doctor', 
      name: 'Dr. James House', 
      email: 'house@medtech.com',
      phoneNumber: '+91 98765 40004',
      dateOfBirth: '1979-06-11',
      age: 47,
      gender: 'Male',
      specialty: 'Diagnostic & Internal Medicine',
      licenseNumber: 'REG-MC-810239',
      experienceYears: 21,
      hospitalAffiliation: 'MedTech Diagnostic Institute',
      avatarUrl: '' 
    },
    { 
      id: 'doc_3', 
      role: 'doctor', 
      name: 'Dr. Elizabeth Blackwell', 
      email: 'elizabeth@medtech.com',
      phoneNumber: '+91 98765 40005',
      dateOfBirth: '1988-02-03',
      age: 38,
      gender: 'Female',
      specialty: 'General Medicine & Telehealth',
      licenseNumber: 'REG-MC-720194',
      experienceYears: 11,
      hospitalAffiliation: 'MedTech Health Center',
      avatarUrl: '' 
    },
    { 
      id: 'admin_1', 
      role: 'admin', 
      name: 'System Admin', 
      email: 'admin@medtech.com',
      phoneNumber: '+91 98765 40006',
      dateOfBirth: '1986-09-25',
      age: 39,
      gender: 'Male',
      staffId: 'ADM-8891',
      department: 'Hospital Administration & IT Security'
    }
  ],
  patientProfiles: {
    'pat_1': {
      userId: 'pat_1',
      age: 34,
      dateOfBirth: '1992-04-18',
      gender: 'Male',
      bloodGroup: 'O+',
      phoneNumber: '+91 98765 40001',
      emergencyContact: '+91 98765 41001',
      height: 178,
      weight: 75,
      medicalHistory: ['Mild Hypertension', 'Dust Allergy'],
      allergies: ['Penicillin', 'Peanuts'],
      currentMedicines: ['Lisinopril 5mg (1-0-0)'],
      vaccinationHistory: ['COVID-19 Booster', 'Influenza', 'Hepatitis B'],
      labReports: [
        { id: 'rep_1', title: 'Complete Blood Count (CBC)', date: '2026-05-12', type: 'PDF', url: '', analyzedSummary: 'Overall normal profile. Hemoglobin at 15.2 g/dL. Mild elevation in WBC suggesting a minor past cold.' },
        { id: 'rep_2', title: 'Lipid Profile Panel', date: '2026-06-01', type: 'Image', url: '', analyzedSummary: 'Total cholesterol is 210 mg/dL (slightly high). LDL is 130 mg/dL. Recommending a low-sodium Mediterranean diet.' }
      ]
    },
    'pat_2': {
      userId: 'pat_2',
      age: 29,
      dateOfBirth: '1997-08-22',
      gender: 'Female',
      bloodGroup: 'A-',
      phoneNumber: '+91 98765 40002',
      emergencyContact: '+91 98765 41002',
      height: 165,
      weight: 58,
      medicalHistory: ['Asthma'],
      allergies: ['Pollen'],
      currentMedicines: ['Albuterol Inhaler (As needed)'],
      vaccinationHistory: ['COVID-19 Full', 'Tetanus Shot 2024'],
      labReports: []
    }
  },
  healthMetrics: {
    'pat_1': [
      { date: '2026-07-07', bloodPressureSystolic: 128, bloodPressureDiastolic: 84, sugarLevel: 98, heartRate: 72, bmi: 23.7, waterIntake: 2.1, sleep: 7.5, steps: 8500 },
      { date: '2026-07-08', bloodPressureSystolic: 125, bloodPressureDiastolic: 82, sugarLevel: 95, heartRate: 70, bmi: 23.7, waterIntake: 2.5, sleep: 8.0, steps: 10200 },
      { date: '2026-07-09', bloodPressureSystolic: 130, bloodPressureDiastolic: 85, sugarLevel: 105, heartRate: 75, bmi: 23.7, waterIntake: 1.8, sleep: 6.5, steps: 6000 },
      { date: '2026-07-10', bloodPressureSystolic: 122, bloodPressureDiastolic: 80, sugarLevel: 92, heartRate: 68, bmi: 23.6, waterIntake: 3.0, sleep: 7.8, steps: 11000 },
      { date: '2026-07-11', bloodPressureSystolic: 124, bloodPressureDiastolic: 81, sugarLevel: 94, heartRate: 71, bmi: 23.6, waterIntake: 2.8, sleep: 8.2, steps: 9400 },
      { date: '2026-07-12', bloodPressureSystolic: 126, bloodPressureDiastolic: 83, sugarLevel: 97, heartRate: 73, bmi: 23.6, waterIntake: 2.4, sleep: 7.0, steps: 8800 }
    ],
    'pat_2': [
      { date: '2026-07-10', bloodPressureSystolic: 115, bloodPressureDiastolic: 75, sugarLevel: 88, heartRate: 65, bmi: 21.3, waterIntake: 2.0, sleep: 8.0, steps: 9200 },
      { date: '2026-07-11', bloodPressureSystolic: 118, bloodPressureDiastolic: 78, sugarLevel: 90, heartRate: 67, bmi: 21.3, waterIntake: 2.2, sleep: 7.5, steps: 10500 },
      { date: '2026-07-12', bloodPressureSystolic: 114, bloodPressureDiastolic: 74, sugarLevel: 85, heartRate: 64, bmi: 21.3, waterIntake: 2.5, sleep: 8.5, steps: 11200 }
    ]
  },
  appointments: [
    { id: 'apt_1', patientId: 'pat_1', patientName: 'John Doe', doctorId: 'doc_1', doctorName: 'Dr. Sarah Connor', specialty: 'Cardiology', date: '2026-07-14', time: '10:00 AM', status: 'approved', isEmergency: false, symptoms: 'Occasional mild chest tightness during morning runs.' },
    { id: 'apt_2', patientId: 'pat_2', patientName: 'Jane Smith', doctorId: 'doc_3', doctorName: 'Dr. Elizabeth Blackwell', specialty: 'General Medicine', date: '2026-07-15', time: '02:30 PM', status: 'pending', isEmergency: false, symptoms: 'Routine health checkup and allergy review.' }
  ],
  prescriptions: [
    {
      id: 'rx_1',
      appointmentId: 'apt_1',
      patientId: 'pat_1',
      patientName: 'John Doe',
      doctorId: 'doc_1',
      doctorName: 'Dr. Sarah Connor',
      date: '2026-06-10',
      diagnosis: 'Mild stress-induced blood pressure elevation',
      medicines: [
        { name: 'Lisinopril 5mg', dosage: '1-0-0', duration: '30 days', instructions: 'Take with water in the morning' },
        { name: 'Coenzyme Q10', dosage: '0-1-0', duration: '30 days', instructions: 'Take after lunch' }
      ],
      notes: 'Monitor BP daily. Cut down on caffeine and processed sugars. Follow up in a month.'
    }
  ],
  chatMessages: [
    { id: 'msg_1', senderId: 'pat_1', senderRole: 'patient', receiverId: 'doc_1', text: 'Hello Dr. Sarah, I uploaded my latest lipid panel report. Can you look at it?', timestamp: '2026-07-12T10:15:00Z' },
    { 
      id: 'msg_2', 
      senderId: 'doc_1', 
      senderRole: 'doctor', 
      receiverId: 'pat_1', 
      text: 'Hi John, I reviewed your reports and symptoms. I have prepared your updated digital medicine prescription below. Please download the official PDF for your records and pharmacy purchase.', 
      timestamp: '2026-07-12T11:00:00Z',
      prescriptionData: {
        rxId: 'RX-894210',
        doctorName: 'Dr. Sarah Connor',
        doctorSpecialty: 'Cardiologist',
        patientName: 'John Doe',
        patientAge: 34,
        patientGender: 'Male',
        patientBlood: 'O+',
        date: '2026-07-12',
        diagnosis: 'Mild Hypertension & Lipid Optimization',
        medicines: [
          { name: 'Lisinopril 5mg', dosage: '1-0-0', duration: '30 days', instructions: 'Take with water in the morning' },
          { name: 'Coenzyme Q10 100mg', dosage: '0-1-0', duration: '30 days', instructions: 'Take after lunch' },
          { name: 'Atorvastatin 10mg', dosage: '0-0-1', duration: '30 days', instructions: 'Take 1 tablet at bedtime' }
        ],
        notes: 'Maintain low-sodium diet, track morning BP daily, and drink 2.5L water.'
      }
    }
  ],
  reminders: [
    { id: 'rem_1', patientId: 'pat_1', medicineName: 'Lisinopril 5mg', time: '08:00 AM', dosage: '1 tablet', isActive: true },
    { id: 'rem_2', patientId: 'pat_1', medicineName: 'Coenzyme Q10', time: '01:30 PM', dosage: '1 capsule', isActive: true }
  ],
  bloodDonors: [
    { id: 'don_1', name: 'Robert Downey', bloodGroup: 'O+', city: 'Chennai', hospital: 'Apollo Hospitals', contactNumber: '+91 98765 40011', available: true },
    { id: 'don_2', name: 'Chris Evans', bloodGroup: 'A-', city: 'Chennai', hospital: 'Fortis Malar Hospital', contactNumber: '+91 98765 40012', available: true },
    { id: 'don_3', name: 'Scarlett Johansson', bloodGroup: 'B+', city: 'Chennai', hospital: 'Sri Ramachandra Medical Centre', contactNumber: '+91 98765 40013', available: true },
    { id: 'don_4', name: 'Mark Ruffalo', bloodGroup: 'O-', city: 'Chennai', hospital: 'Apollo Hospitals', contactNumber: '+91 98765 40014', available: false }
  ],
  hospitals: [
    { id: 'hosp_1', name: 'Apollo Hospitals Chennai', type: 'Hospital', address: '21 Greams Lane, Off Greams Road, Chennai, Tamil Nadu', distance: '1.4 km', contact: '+91 44 2829 3333', emergencyService: true, lat: 13.0604, lng: 80.2498 },
    { id: 'hosp_2', name: 'Fortis Malar Hospital', type: 'Hospital', address: '52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai', distance: '2.8 km', contact: '+91 44 4288 8000', emergencyService: true, lat: 13.0058, lng: 80.2545 },
    { id: 'hosp_3', name: 'Sri Ramachandra Medical Centre', type: 'Hospital', address: 'Porur, Chennai, Tamil Nadu', distance: '3.1 km', contact: '+91 44 2476 8020', emergencyService: true, lat: 13.0125, lng: 80.1697 },
    { id: 'clinic_demo_1', name: 'MedTech Community Clinic (Demo)', type: 'Clinic', address: 'Adyar, Chennai, Tamil Nadu', distance: '1.2 km', contact: '+91 90000 00001', emergencyService: false, lat: 13.0012, lng: 80.2565 },
    { id: 'pharmacy_demo_1', name: 'MedTech Pharmacy (Demo)', type: 'Pharmacy', address: 'Anna Nagar East, Chennai, Tamil Nadu', distance: '0.9 km', contact: '+91 90000 00002', emergencyService: false, lat: 13.0830, lng: 80.2083 }
  ]
};

class DBManager {
  private data: DatabaseState;
  private mongoClient: MongoClient | null = null;
  private runtimeCollection: Collection<Document> | null = null;
  private mongoConnectPromise: Promise<void> | null = null;
  private startupPromise: Promise<void> | null = null;

  constructor() {
    this.data = initialDbState;
    this.load();
    const importedAccountsNow = this.importSuppliedAccounts();
    this.initializeDoctorVerificationStatuses();
    this.startupPromise = this.connectMongo().then(async () => {
      if (importedAccountsNow) await this.purgeLegacyMongoAccounts();
    });
  }

  private initializeDoctorVerificationStatuses() {
    let changed = false;
    for (const user of this.data.users) {
      if (user.role !== 'doctor' || user.doctorVerificationStatus) continue;
      user.doctorVerificationStatus = this.data.doctorApplications[user.id] ? 'pending' : 'approved';
      changed = true;
    }
    if (changed) this.save();
  }

  private importSuppliedAccounts(): boolean {
    if (this.data.accountImportVersion === 3) return false;

    this.data.users = importedAccounts.map(account => account.user);
    this.data.doctorApplications = {};
    for (const user of this.data.users) {
      if (user.role === 'doctor') user.doctorVerificationStatus = 'approved';
    }
    this.data.passwordHashes = Object.fromEntries(
      importedAccounts.map(account => [account.user.id, createPasswordHash(account.password)])
    );
    this.data.patientProfiles = {};
    this.data.healthMetrics = {};
    this.data.appointments = [];
    this.data.prescriptions = [];
    this.data.chatMessages = [];
    this.data.reminders = [];
    this.data.runtimeLogs = [];
    this.data.accountImportVersion = 3;
    this.save();
    return true;
  }

  private async purgeLegacyMongoAccounts(): Promise<void> {
    if (!this.runtimeCollection) return;
    await this.runtimeCollection.deleteMany({
      documentType: { $in: ['user', 'patientProfile', 'runtimeLog'] }
    });
  }

  private connectMongo(): Promise<void> {
    if (!this.mongoConnectPromise) {
      this.mongoConnectPromise = this.connectMongoInternal().finally(() => {
        this.mongoConnectPromise = null;
      });
    }
    return this.mongoConnectPromise;
  }

  private async connectMongoInternal() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';

    try {
      this.mongoClient = new MongoClient(uri);
      await this.mongoClient.connect();
      const dbName = getMongoDbName();
      const collectionName = getMongoCollectionName();
      const db = this.mongoClient.db(dbName);
      this.runtimeCollection = db.collection(collectionName);
      console.log(`[MongoDB] Connected to database "${dbName}" and collection "${collectionName}".`);
    } catch (error) {
      this.mongoClient = null;
      this.runtimeCollection = null;
      console.warn('[MongoDB] Not connected. Falling back to local storage. Set MONGO_URI, MONGO_DB_NAME, and MONGO_COLLECTION to enable MongoDB writes.', error);
    }
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Merge with initial seed defaults just in case fields are missing
        this.data.users = this.data.users || initialDbState.users;
        this.data.passwordHashes = this.data.passwordHashes || {};
        this.data.doctorApplications = this.data.doctorApplications || {};
        this.data.patientProfiles = this.data.patientProfiles || initialDbState.patientProfiles;
        this.data.healthMetrics = this.data.healthMetrics || initialDbState.healthMetrics;
        this.data.appointments = this.data.appointments || initialDbState.appointments;
        this.data.prescriptions = this.data.prescriptions || initialDbState.prescriptions;
        this.data.chatMessages = this.data.chatMessages || initialDbState.chatMessages;
        this.data.reminders = this.data.reminders || initialDbState.reminders;
        this.data.bloodDonors = this.data.bloodDonors || initialDbState.bloodDonors;
        this.data.hospitals = this.data.hospitals || initialDbState.hospitals;
        this.data.runtimeLogs = this.data.runtimeLogs || initialDbState.runtimeLogs;
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Failed to load database. Using memory storage.', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write database file.', e);
    }
  }

  private async persistMongoDocument(documentType: 'runtimeLog' | 'user' | 'patientProfile' | 'doctorApplication', document: Record<string, any>) {
    try {
      if (!this.runtimeCollection) {
        await this.connectMongo();
      }

      if (this.runtimeCollection) {
        await this.runtimeCollection.insertOne({
          documentType,
          createdAt: new Date().toISOString(),
          ...document
        });
      }
    } catch (error) {
      console.warn(`[MongoDB] Failed to persist ${documentType} record.`, error);
    }
  }

  // Getters & Setters
  getUsers(): User[] {
    return this.data.users;
  }

  async addUser(user: User, password: string, doctorApplication?: DoctorApplication): Promise<User> {
    this.data.users.push(user);
    this.data.passwordHashes[user.id] = createPasswordHash(password);
    if (doctorApplication) this.data.doctorApplications[user.id] = doctorApplication;
    this.save();
    await this.persistMongoDocument('user', user as Record<string, any>);
    if (doctorApplication) {
      await this.persistMongoDocument('doctorApplication', doctorApplication as unknown as Record<string, any>);
    }
    return user;
  }

  verifyUserPassword(userId: string, password: string): boolean {
    return verifyPasswordHash(password, this.data.passwordHashes[userId]);
  }

  getDoctorApplications(): DoctorApplication[] {
    return Object.values(this.data.doctorApplications);
  }

  async approveDoctorApplication(userId: string): Promise<DoctorApplication | undefined> {
    const application = this.data.doctorApplications[userId];
    const user = this.data.users.find(candidate => candidate.id === userId && candidate.role === 'doctor');
    if (!application || !user) return undefined;

    application.status = 'approved';
    application.reviewedAt = new Date().toISOString();
    user.doctorVerificationStatus = 'approved';
    this.save();
    await this.persistMongoDocument('doctorApplication', application as unknown as Record<string, any>);
    await this.persistMongoDocument('user', user as Record<string, any>);
    return application;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.data.users.find(candidate => candidate.id === userId);
    if (!user) return undefined;

    Object.assign(user, updates);
    const profile = this.data.patientProfiles[userId];
    if (profile) {
      if (updates.age !== undefined) profile.age = updates.age;
      if (updates.gender !== undefined) profile.gender = updates.gender;
      if (updates.bloodGroup !== undefined) profile.bloodGroup = updates.bloodGroup;
      if (updates.phoneNumber !== undefined) profile.phoneNumber = updates.phoneNumber;
      if (updates.dateOfBirth !== undefined) profile.dateOfBirth = updates.dateOfBirth;
      if (updates.emergencyContact !== undefined) profile.emergencyContact = updates.emergencyContact;
      if (updates.majorHealthIssue !== undefined) profile.majorHealthIssue = updates.majorHealthIssue;
    }

    this.save();
    await this.persistMongoDocument('user', user as Record<string, any>);
    if (profile) {
      await this.persistMongoDocument('patientProfile', { userId, ...profile } as Record<string, any>);
    }
    return user;
  }

  getPatientProfile(userId: string): PatientProfile | undefined {
    return this.data.patientProfiles[userId];
  }

  async savePatientProfile(userId: string, profile: PatientProfile): Promise<PatientProfile> {
    this.data.patientProfiles[userId] = profile;
    this.save();
    await this.persistMongoDocument('patientProfile', { userId, ...profile } as Record<string, any>);
    return profile;
  }

  getHealthMetrics(userId: string): HealthMetric[] {
    return this.data.healthMetrics[userId] || [];
  }

  addHealthMetric(userId: string, metric: HealthMetric): HealthMetric {
    if (!this.data.healthMetrics[userId]) {
      this.data.healthMetrics[userId] = [];
    }
    this.data.healthMetrics[userId].push(metric);
    this.save();
    return metric;
  }

  getAppointments(): Appointment[] {
    return this.data.appointments;
  }

  addAppointment(apt: Appointment): Appointment {
    this.data.appointments.push(apt);
    this.save();
    return apt;
  }

  updateAppointmentStatus(id: string, status: 'approved' | 'rejected' | 'completed'): Appointment | undefined {
    const apt = this.data.appointments.find(a => a.id === id);
    if (apt) {
      apt.status = status;
      this.save();
    }
    return apt;
  }

  getPrescriptions(): Prescription[] {
    return this.data.prescriptions;
  }

  addPrescription(prescription: Prescription): Prescription {
    this.data.prescriptions.push(prescription);
    this.save();
    return prescription;
  }

  getChatMessages(userId1: string, userId2: string): ChatMessage[] {
    return this.data.chatMessages.filter(m => 
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  addChatMessage(msg: ChatMessage): ChatMessage {
    this.data.chatMessages.push(msg);
    this.save();
    return msg;
  }

  getReminders(patientId: string): MedicineReminder[] {
    return this.data.reminders.filter(r => r.patientId === patientId);
  }

  addReminder(reminder: MedicineReminder): MedicineReminder {
    this.data.reminders.push(reminder);
    this.save();
    return reminder;
  }

  deleteReminder(id: string) {
    this.data.reminders = this.data.reminders.filter(r => r.id !== id);
    this.save();
  }

  toggleReminder(id: string): MedicineReminder | undefined {
    const rem = this.data.reminders.find(r => r.id === id);
    if (rem) {
      rem.isActive = !rem.isActive;
      this.save();
    }
    return rem;
  }

  getBloodDonors(): BloodDonor[] {
    return this.data.bloodDonors;
  }

  addBloodDonor(donor: BloodDonor): BloodDonor {
    this.data.bloodDonors.push(donor);
    this.save();
    return donor;
  }

  getHospitals(): Hospital[] {
    return this.data.hospitals;
  }

  addHospital(hosp: Hospital): Hospital {
    this.data.hospitals.push(hosp);
    this.save();
    return hosp;
  }

  async insertRuntimeLog(payload: Record<string, any> = {}): Promise<Record<string, any>> {
    const entry = buildRuntimeLogEntry(payload);

    try {
      if (!this.runtimeCollection) {
        await this.connectMongo();
      }

      if (this.runtimeCollection) {
        const result = await this.runtimeCollection.insertOne({
          ...entry,
          documentType: 'runtimeLog',
          createdAt: new Date().toISOString()
        });
        return { ...entry, _id: result.insertedId, documentType: 'runtimeLog', createdAt: new Date().toISOString() };
      }
    } catch (error) {
      console.warn('[MongoDB] Insert failed, falling back to local runtime log storage.', error);
    }

    this.data.runtimeLogs.push(entry);
    this.save();
    return entry;
  }

  async getRuntimeLogs(limit = 50): Promise<Record<string, any>[]> {
    try {
      if (!this.runtimeCollection) {
        await this.connectMongo();
      }

      if (this.runtimeCollection) {
        return (await this.runtimeCollection.find({}).sort({ timestamp: -1 }).limit(limit).toArray()) as Record<string, any>[];
      }
    } catch (error) {
      console.warn('[MongoDB] Read failed, falling back to local runtime logs.', error);
    }

    return this.data.runtimeLogs.slice(-limit).reverse();
  }

  async closeConnection(): Promise<void> {
    await this.startupPromise;
    await this.mongoConnectPromise;
    await this.mongoClient?.close();
    this.mongoClient = null;
    this.runtimeCollection = null;
  }

  deleteDoctor(id: string) {
    this.data.users = this.data.users.filter(u => !(u.id === id && u.role === 'doctor'));
    this.save();
  }

  deletePatient(id: string) {
    this.data.users = this.data.users.filter(u => !(u.id === id && u.role === 'patient'));
    delete this.data.patientProfiles[id];
    delete this.data.healthMetrics[id];
    this.save();
  }
}

export const db = new DBManager();
