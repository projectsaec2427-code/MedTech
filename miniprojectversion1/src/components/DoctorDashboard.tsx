import React, { useState, useEffect } from 'react';
import { 
  User, Activity, Calendar, MessageSquare, Sparkles, FileText, 
  Clock, AlertTriangle, CheckCircle, Eye, LogOut, Check, X, ShieldAlert,
  Plus, Pill, Trash2, Download, Paperclip
} from 'lucide-react';
import { User as UserType, Appointment, PatientProfile, HealthMetric, PrescribedMedicine } from '../types';
import PrescriptionModule from './PrescriptionModule';
import MedicinePdfCard from './MedicinePdfCard';
import { formatIndianPhoneNumber } from '../lib/phone';

interface DoctorDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export default function DoctorDashboard({ user, onLogout }: DoctorDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'chats' | 'diagnose'>('appointments');
  
  // Selected contexts for active workflows
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  
  // Patient details context
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [patientMetrics, setPatientMetrics] = useState<HealthMetric[]>([]);

  // Clinical chats
  const [chatPatientId, setChatPatientId] = useState('pat_1');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Chat Medicine Prescription composer state
  const [showRxComposer, setShowRxComposer] = useState(false);
  const [rxDate, setRxDate] = useState(new Date().toISOString().split('T')[0]);
  const [rxTime, setRxTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [rxPatientName, setRxPatientName] = useState('');
  const [rxPatientAge, setRxPatientAge] = useState<number | string>(34);
  const [rxPatientGender, setRxPatientGender] = useState('Male');
  const [rxPatientBlood, setRxPatientBlood] = useState('O+');
  const [rxPatientWeight, setRxPatientWeight] = useState('72 kg');
  const [rxPatientBP, setRxPatientBP] = useState('120/80 mmHg');
  const [rxSymptoms, setRxSymptoms] = useState('');
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxLabTests, setRxLabTests] = useState('');
  const [rxFollowUpDate, setRxFollowUpDate] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxMedicines, setRxMedicines] = useState<PrescribedMedicine[]>([
    { name: 'Paracetamol 650mg', dosage: '1-0-1', duration: '5 days', instructions: 'After meals with water' }
  ]);

  // Sync patient particulars when chatPatientId changes
  useEffect(() => {
    if (chatPatientId === 'pat_1') {
      setRxPatientName('John Doe');
      setRxPatientAge(34);
      setRxPatientGender('Male');
      setRxPatientBlood('O+');
      setRxPatientWeight('72 kg');
      setRxPatientBP('120/80 mmHg');
    } else {
      setRxPatientName('Jane Smith');
      setRxPatientAge(29);
      setRxPatientGender('Female');
      setRxPatientBlood('A-');
      setRxPatientWeight('58 kg');
      setRxPatientBP('110/70 mmHg');
    }
  }, [chatPatientId]);

  const applyRxPreset = (preset: string) => {
    if (preset === 'fever') {
      setRxDiagnosis('Acute Febrile Illness & Upper Respiratory Infection');
      setRxSymptoms('Fever 100.8°F, chills, mild dry cough, throat irritation');
      setRxLabTests('CBC, Dengue NS1 / Malarial Antigen if fever persists > 48 hrs');
      setRxFollowUpDate('After 5 Days (or SOS)');
      setRxNotes('Drink at least 3L warm water daily. Frequent steam inhalation. Adequate bed rest.');
      setRxMedicines([
        { name: 'Paracetamol 650mg (Dolo)', dosage: '1-0-1', duration: '5 days', instructions: 'After meals with water' },
        { name: 'Azithromycin 500mg', dosage: '1-0-0', duration: '3 days', instructions: '1 hour before lunch' },
        { name: 'Levocetirizine + Montelukast', dosage: '0-0-1', duration: '5 days', instructions: 'At bedtime' },
        { name: 'Vitamin C 500mg + Zinc', dosage: '1-0-0', duration: '10 days', instructions: 'After breakfast' }
      ]);
    } else if (preset === 'hypertension') {
      setRxDiagnosis('Primary Essential Stage-1 Hypertension');
      setRxSymptoms('Occasional morning occipital headache, mild dizziness, elevated BP');
      setRxLabTests('Lipid Profile, Serum Electrolytes, ECG 12-Lead, Serum Creatinine');
      setRxFollowUpDate('After 14 Days (Review BP log)');
      setRxNotes('Strict low-sodium diet (<2g salt/day). 30 mins brisk walking daily. Avoid smoking & caffeine.');
      setRxMedicines([
        { name: 'Telmisartan 40mg', dosage: '1-0-0', duration: '30 days', instructions: 'Morning after breakfast' },
        { name: 'Amlodipine 5mg', dosage: '0-0-1', duration: '30 days', instructions: 'Night at bedtime' },
        { name: 'Aspirin 75mg (Ecosprin)', dosage: '0-1-0', duration: '30 days', instructions: 'After lunch' }
      ]);
    } else if (preset === 'acidity') {
      setRxDiagnosis('Gastroesophageal Reflux Disease (GERD) & Dyspepsia');
      setRxSymptoms('Epigastric burning, acid reflux, post-meal bloating');
      setRxLabTests('Ultrasound Abdomen if upper abdominal pain persists');
      setRxFollowUpDate('After 7 Days');
      setRxNotes('Avoid spicy, fried and oily meals. Do not lie down immediately after food. Eat smaller frequent meals.');
      setRxMedicines([
        { name: 'Pantoprazole 40mg + Domperidone 30mg', dosage: '1-0-0', duration: '14 days', instructions: '30 mins before breakfast' },
        { name: 'Sucralfate Oral Suspension (10ml)', dosage: '1-0-1', duration: '7 days', instructions: '2 hours after meals' },
        { name: 'Digestive Enzymes Capsule', dosage: '1-1-1', duration: '7 days', instructions: 'Immediately after meals' }
      ]);
    }
  };

  // AI assistant suggestions
  const [aiDiagnoseLoading, setAiDiagnoseLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const fetchDoctorData = () => {
    fetch(`/api/appointments?doctorId=${user.id}`)
      .then(res => res.json())
      .then(data => setAppointments(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchDoctorData();
  }, [user.id]);

  // Load patient diagnostic history context
  useEffect(() => {
    if (selectedPatientId) {
      // Profile
      fetch(`/api/patient/${selectedPatientId}/profile`)
        .then(res => res.json())
        .then(data => setPatientProfile(data))
        .catch(err => console.error(err));

      // Metrics
      fetch(`/api/patient/${selectedPatientId}/metrics`)
        .then(res => res.json())
        .then(data => setPatientMetrics(data))
        .catch(err => console.error(err));
    }
  }, [selectedPatientId]);

  // Consultation chats poll
  const fetchConsultationChats = () => {
    fetch(`/api/chats?user1=${user.id}&user2=${chatPatientId}`)
      .then(res => res.json())
      .then(data => setChatMessages(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchConsultationChats();
      const interval = setInterval(fetchConsultationChats, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, chatPatientId]);

  const handleApproveApt = (id: string, approve: boolean) => {
    fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: approve ? 'approved' : 'rejected' })
    })
      .then(() => fetchDoctorData())
      .catch(err => console.error(err));
  };

  const handleAddRxRow = () => {
    setRxMedicines(prev => [...prev, { name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After meals' }]);
  };

  const handleRemoveRxRow = (idx: number) => {
    setRxMedicines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRxMedChange = (idx: number, field: keyof PrescribedMedicine, val: string) => {
    setRxMedicines(prev => prev.map((med, i) => {
      if (i === idx) {
        return { ...med, [field]: val };
      }
      return med;
    }));
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !showRxComposer) || sendingChat) return;

    setSendingChat(true);

    const targetPatientName = (rxPatientName || '').trim() || (chatPatientId === 'pat_1' ? 'John Doe' : 'Jane Smith');
    const hasValidMedicines = showRxComposer && rxMedicines.some(m => m.name.trim().length > 0);

    const payload: any = {
      senderId: user.id,
      senderRole: 'doctor',
      receiverId: chatPatientId,
      text: chatInput.trim() || (hasValidMedicines ? 'Official prescription & medication guidance attached below. Please download the generated PDF for your records and pharmacy purchase.' : 'Consultation update.')
    };

    if (hasValidMedicines) {
      payload.prescriptionData = {
        rxId: `RX-${Math.floor(100000 + Math.random() * 900000)}`,
        clinicName: 'MedTech Multi-Specialty Hospital & Telehealth Center',
        clinicAddress: '42 Medical Park Blvd, Suite 400, NY 10001',
        clinicContact: 'Tel: +91 44 2829 3333 | rx@medtech-health.org',
        doctorName: user.name,
        doctorSpecialty: 'Specialist Physician & Clinical Consultant',
        doctorRegNo: 'REG-MC-904218',
        patientName: targetPatientName,
        patientId: chatPatientId === 'pat_1' ? 'PAT-00189' : 'PAT-00244',
        patientAge: Number(rxPatientAge) || (chatPatientId === 'pat_1' ? 34 : 29),
        patientGender: rxPatientGender || (chatPatientId === 'pat_1' ? 'Male' : 'Female'),
        patientBlood: rxPatientBlood || (chatPatientId === 'pat_1' ? 'O+' : 'A-'),
        patientWeight: rxPatientWeight || (chatPatientId === 'pat_1' ? '72 kg' : '58 kg'),
        patientBP: rxPatientBP || (chatPatientId === 'pat_1' ? '120/80 mmHg' : '110/70 mmHg'),
        date: rxDate || new Date().toISOString().split('T')[0],
        time: rxTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        symptoms: rxSymptoms.trim() || undefined,
        diagnosis: rxDiagnosis.trim() || 'Clinical Consultation via Telehealth',
        vitals: `BP: ${rxPatientBP || '120/80 mmHg'} | Pulse: 74 bpm | SpO2: 98% | Temp: 98.6°F`,
        labTestsAdvised: rxLabTests.trim() || undefined,
        nextFollowUpDate: rxFollowUpDate.trim() || undefined,
        medicines: rxMedicines.filter(m => m.name.trim().length > 0),
        notes: rxNotes.trim() || 'Follow prescribed timing instructions and stay well hydrated.'
      };
    }

    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(() => {
        setChatInput('');
        if (showRxComposer) {
          setShowRxComposer(false);
          setRxDiagnosis('');
          setRxSymptoms('');
          setRxLabTests('');
          setRxFollowUpDate('');
          setRxNotes('');
          setRxMedicines([{ name: 'Paracetamol 650mg', dosage: '1-0-1', duration: '5 days', instructions: 'After meals with water' }]);
        }
        fetchConsultationChats();
      })
      .catch(err => console.error(err))
      .finally(() => setSendingChat(false));
  };

  const handleTriggerAIDiagnosis = () => {
    if (!selectedApt) return;

    setAiDiagnoseLoading(true);
    setAiSuggestions([]);

    fetch('/api/ai/doctor-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: selectedApt.symptoms,
        history: patientProfile?.medicalHistory || [],
        patientAge: patientProfile?.age || 30,
        patientGender: patientProfile?.gender || 'Male'
      })
    })
      .then(res => res.json())
      .then(data => {
        setAiSuggestions(data.suggestions || []);
      })
      .catch(err => console.error(err))
      .finally(() => setAiDiagnoseLoading(false));
  };

  const pendingApts = appointments.filter(a => a.status === 'pending');
  const upcomingApts = appointments.filter(a => a.status === 'approved');
  const completedApts = appointments.filter(a => a.status === 'completed');

  return (
    <div id="doctor-dashboard" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header Banner */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900">MedTech Clinical Center</h1>
            <span className="text-[11px] block text-slate-500 font-medium">Doctor Workspace: {user.name}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
          title="Log Out Profile"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </header>

      {/* Main Container Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid md:grid-cols-12 gap-6">
        
        {/* Left column navigation & quick overview stats (Col 3) */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Doctor Profile Overview Card */}
          <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">{user.name}</h4>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{user.specialty || 'Specialist Physician'}</p>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded-xl text-center text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Age</span>
                <span className="font-bold text-slate-800 text-xs">{user.age || 40} yrs</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Experience</span>
                <span className="font-bold text-slate-800 text-xs">{user.experienceYears || 14}+ yrs</span>
              </div>
            </div>

            <div className="text-left text-[11px] space-y-1 bg-emerald-50/25 p-2.5 rounded-xl border border-emerald-100/40">
              <p className="text-slate-500"><strong className="text-slate-700">Phone:</strong> {formatIndianPhoneNumber(user.phoneNumber || '+91 98765 40003')}</p>
              <p className="text-slate-500"><strong className="text-slate-700">DOB:</strong> {user.dateOfBirth || '1985-11-14'}</p>
              <p className="text-slate-500"><strong className="text-slate-700">License:</strong> {user.licenseNumber || 'REG-MC-904218'}</p>
              <p className="text-slate-500"><strong className="text-slate-700">Center:</strong> {user.hospitalAffiliation || 'MedTech Multi-Specialty Hospital'}</p>
            </div>
          </div>

          {/* Vitals Overview Widgets */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4 text-left">
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs tracking-tight uppercase">Workspace Diagnostics</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Approval rates & session tallies.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-amber-800 block">Pending</span>
                <span className="text-lg font-black text-amber-600">{pendingApts.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block">Today Visits</span>
                <span className="text-lg font-black text-emerald-600">{upcomingApts.length}</span>
              </div>
            </div>

            {appointments.some(a => a.isEmergency && a.status === 'pending') && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold animate-pulse flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Urgent Priority Visit Pending Approval!</span>
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex flex-col space-y-1">
            <button
              onClick={() => { setActiveTab('appointments'); setSelectedApt(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-2.5 text-left ${
                activeTab === 'appointments' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Diagnostic Consults</span>
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-2.5 text-left ${
                activeTab === 'chats' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Consultation Chats</span>
            </button>
          </div>

          {/* Quick patient directory contextual picker */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-3.5 text-left">
            <div>
              <h4 className="font-bold text-slate-800 text-xs tracking-tight uppercase">Patient Chart Viewer</h4>
              <p className="text-[10px] text-slate-400">Select any patient to review history files.</p>
            </div>

            <div className="space-y-1">
              {[
                { id: 'pat_1', name: 'John Doe', age: 34 },
                { id: 'pat_2', name: 'Jane Smith', age: 29 }
              ].map(pat => (
                <button
                  key={pat.id}
                  onClick={() => { setSelectedPatientId(pat.id); setActiveTab('appointments'); }}
                  className={`w-full py-2 px-3 rounded-xl text-xs text-left font-medium transition ${
                    selectedPatientId === pat.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {pat.name} (Age: {pat.age})
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right column tab panel (Col 9) */}
        <div className="md:col-span-9 space-y-6">

          {/* 1. CLINICAL APPOINTMENTS WORKSPACE */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Split layout: Appointments List & Patient Chart details review */}
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Visits List (Col 5) */}
                <div className="md:col-span-5 space-y-4">
                  
                  {/* PENDING CONTROL PANEL */}
                  {pendingApts.length > 0 && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                      <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Pending Bookings</span>
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {pendingApts.map(apt => (
                          <div key={apt.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-left">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-xs">{apt.patientName}</h4>
                                <span className="text-[10px] text-slate-400">Symptoms: {apt.symptoms}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10.5px]">
                              <span className="text-slate-500 font-mono">{apt.date} at {apt.time}</span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => handleApproveApt(apt.id, false)}
                                  className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleApproveApt(apt.id, true)}
                                  className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TODAY & UPCOMING VISITS LIST */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Approved Consultation Calendar</span>
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {upcomingApts.map(apt => (
                        <div
                          key={apt.id}
                          onClick={() => { setSelectedApt(apt); setSelectedPatientId(apt.patientId); }}
                          className={`p-3.5 rounded-xl border transition cursor-pointer text-left space-y-1.5 ${
                            selectedApt?.id === apt.id 
                              ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                              : 'bg-white hover:bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-extrabold text-slate-800 text-xs">{apt.patientName}</h4>
                            <span className="text-[10.5px] font-mono text-slate-500">{apt.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">{apt.symptoms}</p>
                        </div>
                      ))}

                      {upcomingApts.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-xs">
                          No active clinical consultations booked for today.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMPLETED VISITS LOG */}
                  {completedApts.length > 0 && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
                      <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Completed Sessions</span>
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 text-xs">
                        {completedApts.map(apt => (
                          <div key={apt.id} className="p-2 border border-slate-100/50 bg-slate-50/20 rounded flex justify-between">
                            <span className="font-semibold text-slate-600">{apt.patientName}</span>
                            <span className="text-[10.5px] text-slate-400 font-mono">{apt.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Patient Chart Details & Rx Emitting Panel (Col 7) */}
                <div className="md:col-span-7 space-y-6">
                  
                  {/* PATIENT CHART DATA PREVIEW */}
                  {selectedPatientId && patientProfile ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 text-left animate-in fade-in duration-200">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            Interactive Clinical Chart
                          </span>
                          <h4 className="font-black text-slate-800 text-sm mt-1">
                            Patient Record Summary: {patientProfile.userId === 'pat_1' ? 'John Doe' : 'Jane Smith'}
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-rose-600 font-mono">Blood: {patientProfile.bloodGroup}</span>
                      </div>

                      {/* Vital Graphs review directly in doctor view! */}
                      {patientMetrics.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest block">Heart Rate Chronological log</span>
                          <div className="h-14 bg-slate-50 rounded-lg p-1 relative flex items-end border border-slate-100">
                            <svg className="w-full h-full" viewBox="0 0 300 40">
                              <polyline
                                fill="none"
                                stroke="#ec4899"
                                strokeWidth="2"
                                points={patientMetrics.map((m, idx) => `${(idx / (patientMetrics.length - 1 || 1)) * 280 + 10},${35 - ((m.heartRate - 50) / 60) * 25}`).join(' ')}
                              />
                            </svg>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Fasting stats: {patientMetrics[patientMetrics.length-1].sugarLevel} mg/dL</span>
                            <span>Avg blood pressure: {patientMetrics[patientMetrics.length-1].bloodPressureSystolic}/{patientMetrics[patientMetrics.length-1].bloodPressureDiastolic}</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <p><strong className="text-slate-800">Age:</strong> {patientProfile.age} yrs</p>
                        <p><strong className="text-slate-800">Gender:</strong> {patientProfile.gender}</p>
                        <p><strong className="text-slate-800">Height / Weight:</strong> {patientProfile.height}cm / {patientProfile.weight}kg</p>
                        <p><strong className="text-slate-800">Medical History:</strong> {(patientProfile.medicalHistory || []).join(', ') || 'None declared'}</p>
                        <p className="col-span-2"><strong className="text-slate-800">Allergies:</strong> {(patientProfile.allergies || []).join(', ') || 'None declared'}</p>
                      </div>

                      {/* Gemini-assisted Clinical Diagnostician suggestions */}
                      {selectedApt && (
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-900 flex items-center">
                              <Sparkles className="w-4.5 h-4.5 mr-1.5 text-indigo-600 animate-pulse fill-indigo-100" />
                              Gemini Diagnosis Co-Pilot
                            </span>
                            
                            <button
                              type="button"
                              onClick={handleTriggerAIDiagnosis}
                              disabled={aiDiagnoseLoading}
                              className="py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition flex items-center space-x-1"
                            >
                              <span>{aiDiagnoseLoading ? 'Running Differential...' : 'Deduce Diagnosis'}</span>
                            </button>
                          </div>

                          {aiSuggestions.length > 0 && (
                            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5">
                              <span className="text-[10px] font-bold text-indigo-800 uppercase block">Clinical checks deduced from symptoms</span>
                              <ul className="space-y-1">
                                {aiSuggestions.map((s, idx) => (
                                  <li key={idx} className="text-xs text-slate-700 flex items-start justify-between">
                                    <div className="flex items-start">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 mr-2 shrink-0"></span>
                                      <span>{s}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center py-16 border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-xs">
                      Select a patient from the approved list or sidebar to load diagnostic history and details.
                    </div>
                  )}

                  {/* DYNAMIC DIGITAL PRESCRIPTION EMITTING */}
                  {selectedApt && selectedApt.status !== 'completed' && (
                    <PrescriptionModule
                      appointmentId={selectedApt.id}
                      patientId={selectedApt.patientId}
                      patientName={selectedApt.patientName}
                      doctorId={user.id}
                      doctorName={user.name}
                      onSuccess={() => {
                        fetchDoctorData();
                        setSelectedApt(null);
                      }}
                    />
                  )}

                </div>

              </div>
            </div>
          )}

          {/* 2. CLINICAL CONSULTATION CHATS WORKSPACE WITH MEDICINE PDF PRESCRIPTION BUILDER */}
          {activeTab === 'chats' && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px] animate-in fade-in duration-150 text-left">
              
              {/* Patient Selector Header */}
              <div className="p-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Active Patient Consultation:</span>
                  <select
                    value={chatPatientId}
                    onChange={e => setChatPatientId(e.target.value)}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-bold text-blue-700 shadow-2xs"
                  >
                    <option value="pat_1">John Doe (Cardiology Patient • Age 34 • O+)</option>
                    <option value="pat_2">Jane Smith (General Medicine • Age 29 • A-)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowRxComposer(!showRxComposer)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs ${
                      showRxComposer 
                        ? 'bg-blue-700 text-white' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>{showRxComposer ? 'Hide Prescription Builder' : '+ Attach Medicine Rx PDF'}</span>
                  </button>

                  <div className="flex items-center space-x-1 pl-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10.5px] text-slate-500 font-medium">Patient Online</span>
                  </div>
                </div>
              </div>

              {/* Message Streams */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {chatMessages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  const hasRx = msg.prescriptionData && msg.prescriptionData.medicines && msg.prescriptionData.medicines.length > 0;
                  
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs shadow-sm ${
                        isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200/70 text-slate-800 rounded-tl-none'
                      }`}>
                        {/* Text Message */}
                        {msg.text && (
                          <p className="leading-relaxed whitespace-pre-line text-[12.5px] font-normal">{msg.text}</p>
                        )}

                        {/* Medicine Prescription Attached Card */}
                        {hasRx && (
                          <div className="mt-2 text-slate-900">
                            <MedicinePdfCard
                              type="doctor"
                              rxId={msg.prescriptionData.rxId}
                              clinicName={msg.prescriptionData.clinicName}
                              clinicAddress={msg.prescriptionData.clinicAddress}
                              clinicContact={msg.prescriptionData.clinicContact}
                              doctorName={msg.prescriptionData.doctorName || user.name}
                              doctorSpecialty={msg.prescriptionData.doctorSpecialty || 'Specialist Physician'}
                              doctorRegNo={msg.prescriptionData.doctorRegNo || 'REG-MC-904218'}
                              patientName={msg.prescriptionData.patientName || (chatPatientId === 'pat_1' ? 'John Doe' : 'Jane Smith')}
                              patientId={msg.prescriptionData.patientId || (chatPatientId === 'pat_1' ? 'PAT-00189' : 'PAT-00244')}
                              patientAge={msg.prescriptionData.patientAge || (chatPatientId === 'pat_1' ? 34 : 29)}
                              patientGender={msg.prescriptionData.patientGender || (chatPatientId === 'pat_1' ? 'Male' : 'Female')}
                              patientBlood={msg.prescriptionData.patientBlood || (chatPatientId === 'pat_1' ? 'O+' : 'A-')}
                              patientWeight={msg.prescriptionData.patientWeight}
                              patientBP={msg.prescriptionData.patientBP}
                              date={msg.prescriptionData.date || msg.timestamp?.split('T')[0]}
                              time={msg.prescriptionData.time}
                              symptoms={msg.prescriptionData.symptoms}
                              diagnosis={msg.prescriptionData.diagnosis}
                              vitals={msg.prescriptionData.vitals}
                              labTestsAdvised={msg.prescriptionData.labTestsAdvised}
                              nextFollowUpDate={msg.prescriptionData.nextFollowUpDate}
                              medicines={msg.prescriptionData.medicines}
                              notes={msg.prescriptionData.notes}
                            />
                          </div>
                        )}

                        <span className={`text-[9.5px] block mt-1.5 font-medium ${isMe ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {chatMessages.length === 0 && (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 stroke-1 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No consultation messages yet</p>
                    <p className="text-[11px] max-w-sm mx-auto">Send clinical advice or attach an official digital medicine prescription with downloadable PDF to the patient.</p>
                  </div>
                )}
              </div>

              {/* Collapsible Doctor Medicine Prescription Builder */}
              {showRxComposer && (
                <div className="p-4 bg-blue-50/60 border-t border-blue-200/80 space-y-3.5 animate-in slide-in-from-bottom-2 duration-150 text-left max-h-[380px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-950 font-bold text-xs">
                      <Pill className="w-4 h-4 text-blue-600" />
                      <span>Digital Medicine Prescription Builder (Official PDF Document)</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => applyRxPreset('fever')}
                        className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 rounded text-[10px] font-bold border border-blue-200 transition"
                      >
                        🌡️ Fever & Infection
                      </button>
                      <button
                        type="button"
                        onClick={() => applyRxPreset('hypertension')}
                        className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 rounded text-[10px] font-bold border border-blue-200 transition"
                      >
                        🫀 Hypertension
                      </button>
                      <button
                        type="button"
                        onClick={() => applyRxPreset('acidity')}
                        className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 rounded text-[10px] font-bold border border-blue-200 transition"
                      >
                        🩺 Acidity & GERD
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRxComposer(false)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Date, Time & Patient Identity Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold uppercase text-slate-500">Prescription Date</label>
                      <input
                        type="date"
                        value={rxDate}
                        onChange={e => setRxDate(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold uppercase text-slate-500">Prescription Time</label>
                      <input
                        type="text"
                        value={rxTime}
                        onChange={e => setRxTime(e.target.value)}
                        placeholder="11:30 AM"
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold uppercase text-slate-500">Patient Full Name</label>
                      <input
                        type="text"
                        value={rxPatientName}
                        onChange={e => setRxPatientName(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50 font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold uppercase text-slate-500">Patient Vitals / BP</label>
                      <input
                        type="text"
                        value={rxPatientBP}
                        onChange={e => setRxPatientBP(e.target.value)}
                        placeholder="120/80 mmHg"
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50 font-mono"
                      />
                    </div>
                  </div>

                  {/* Patient Demographics */}
                  <div className="grid grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold uppercase text-slate-500">Age</label>
                      <input
                        type="number"
                        value={rxPatientAge}
                        onChange={e => setRxPatientAge(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold uppercase text-slate-500">Gender</label>
                      <select
                        value={rxPatientGender}
                        onChange={e => setRxPatientGender(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold uppercase text-slate-500">Blood Group</label>
                      <input
                        type="text"
                        value={rxPatientBlood}
                        onChange={e => setRxPatientBlood(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold uppercase text-slate-500">Weight</label>
                      <input
                        type="text"
                        value={rxPatientWeight}
                        onChange={e => setRxPatientWeight(e.target.value)}
                        placeholder="70 kg"
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Clinical Symptoms & Diagnosis */}
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-600">Chief Symptoms / Complaints</label>
                      <input
                        type="text"
                        value={rxSymptoms}
                        onChange={e => setRxSymptoms(e.target.value)}
                        placeholder="e.g. Fever 101°F for 2 days, dry cough, sore throat..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-600">Clinical Diagnosis</label>
                      <input
                        type="text"
                        value={rxDiagnosis}
                        onChange={e => setRxDiagnosis(e.target.value)}
                        placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Lab Tests Advised & Next Review Date */}
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-600">Lab Tests Advised (Optional)</label>
                      <input
                        type="text"
                        value={rxLabTests}
                        onChange={e => setRxLabTests(e.target.value)}
                        placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray PA view..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-600">Next Follow-Up / Review</label>
                      <input
                        type="text"
                        value={rxFollowUpDate}
                        onChange={e => setRxFollowUpDate(e.target.value)}
                        placeholder="e.g. After 7 Days (2026-08-22) or SOS if symptoms worsen"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Diet & Lifestyle Directives */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-600">Dietary & Lifestyle Instructions</label>
                    <input
                      type="text"
                      value={rxNotes}
                      onChange={e => setRxNotes(e.target.value)}
                      placeholder="e.g. Low sodium diet, drink 3L warm water daily, steam inhalation 2x daily, adequate bed rest..."
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Medicines table inputs */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-slate-600">Medicines Regimen ({rxMedicines.length})</span>
                      <button
                        type="button"
                        onClick={handleAddRxRow}
                        className="px-2 py-0.5 bg-white hover:bg-slate-50 text-blue-700 rounded border border-blue-200 text-[10.5px] font-bold flex items-center space-x-1 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Medicine Row</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {rxMedicines.map((med, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                          <div className="col-span-4">
                            <input
                              type="text"
                              required
                              placeholder="Medicine Name & Strength (e.g. Paracetamol 650mg)"
                              value={med.name}
                              onChange={e => handleRxMedChange(idx, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Dosage (1-0-1)"
                              value={med.dosage}
                              onChange={e => handleRxMedChange(idx, 'dosage', e.target.value)}
                              className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs text-center bg-slate-50/50 font-mono"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Duration (5 days)"
                              value={med.duration}
                              onChange={e => handleRxMedChange(idx, 'duration', e.target.value)}
                              className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs text-center bg-slate-50/50"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              placeholder="Instructions (After meals)"
                              value={med.instructions}
                              onChange={e => handleRxMedChange(idx, 'instructions', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50/50"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            {rxMedicines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRxRow(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer text field & send button */}
              <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRxComposer(!showRxComposer)}
                  title="Attach Medicine Rx PDF"
                  className={`p-2 rounded-xl border transition ${
                    showRxComposer ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Pill className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={showRxComposer ? "Write message text accompanying this prescription..." : "Send consultation advice, explain medication dosage, or attach Rx..."}
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-slate-50/50"
                />
                
                <button
                  type="submit"
                  disabled={sendingChat || (!chatInput.trim() && !showRxComposer)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <span>{showRxComposer ? 'Send with Rx PDF' : 'Send'}</span>
                </button>
              </form>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
