export interface User {
  id: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  avatarUrl?: string;
  // Role-specific extensions
  specialty?: string;
  licenseNumber?: string;
  experienceYears?: number;
  hospitalAffiliation?: string;
  staffId?: string;
  department?: string;
  bloodGroup?: string;
  majorHealthIssue?: string;
  emergencyContact?: string;
  doctorVerificationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface DoctorApplication {
  userId: string;
  name: string;
  email: string;
  degreeFileName: string;
  degreeFileMimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  degreeFileData: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export interface PatientProfile {
  userId: string;
  age: number;
  dateOfBirth?: string;
  gender: string;
  bloodGroup: string;
  phoneNumber?: string;
  majorHealthIssue?: string;
  emergencyContact?: string;
  height: number; // in cm
  weight: number; // in kg
  medicalHistory: string[];
  allergies: string[];
  currentMedicines: string[];
  vaccinationHistory: string[];
  labReports: LabReport[];
}

export interface LabReport {
  id: string;
  title: string;
  date: string;
  type: 'PDF' | 'Image';
  url: string; // Base64 or local ref
  analyzedSummary?: string;
}

export interface HealthMetric {
  date: string;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  sugarLevel: number;
  heartRate: number;
  bmi: number;
  waterIntake: number; // liters
  sleep: number; // hours
  steps: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  isEmergency: boolean;
  symptoms: string;
  notes?: string;
}

export interface PrescribedMedicine {
  name: string;
  dosage: string; // e.g., "1-0-1" or "500mg Twice Daily"
  duration: string; // e.g., "5 days"
  instructions: string; // e.g., "After food"
  notes?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  patientBlood?: string;
  patientWeight?: string | number;
  patientBP?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorRegNo?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicContact?: string;
  date: string;
  time?: string;
  symptoms?: string;
  diagnosis: string;
  labTestsAdvised?: string;
  nextFollowUpDate?: string;
  medicines: PrescribedMedicine[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'patient' | 'doctor' | 'ai';
  receiverId: string;
  text: string;
  timestamp: string;
  filePath?: string;
  fileType?: string;
  prescriptionData?: {
    rxId?: string;
    clinicName?: string;
    clinicAddress?: string;
    clinicContact?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    doctorRegNo?: string;
    patientName?: string;
    patientId?: string;
    patientAge?: number | string;
    patientGender?: string;
    patientBlood?: string;
    patientWeight?: string | number;
    patientBP?: string;
    date?: string;
    time?: string;
    symptoms?: string;
    diagnosis?: string;
    labTestsAdvised?: string;
    nextFollowUpDate?: string;
    medicines: PrescribedMedicine[];
    notes?: string;
  };
}

export interface MedicineReminder {
  id: string;
  patientId: string;
  medicineName: string;
  time: string; // e.g., "08:00"
  dosage: string;
  isActive: boolean;
}

export interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: string;
  city: string;
  hospital: string;
  contactNumber: string;
  available: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  type: 'Hospital' | 'Clinic' | 'Pharmacy';
  address: string;
  distance: string;
  contact: string;
  emergencyService: boolean;
  ambulanceContact?: string;
  lat: number;
  lng: number;
}
