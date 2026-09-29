import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Calendar, FileText, MessageSquare, Home, Settings, Info, PhoneCall,
  Plus, Bell, LogOut, CheckCircle, Clock, Heart, 
  Droplet, Moon, Footprints, AlertTriangle, Printer, Sparkles, Bot, Eye, Trash2, Download
} from 'lucide-react';
import { User as UserType, PatientProfile, HealthMetric, Appointment, Prescription, MedicineReminder } from '../types';
import DiseasePredictor from './DiseasePredictor';
import DietRecommendation from './DietRecommendation';
import NearbyHospitals from './NearbyHospitals';
import BloodDonorFinder from './BloodDonorFinder';
import AIChatbotModal from './AIChatbotModal';
import MedicinePdfCard from './MedicinePdfCard';
import { generatePrescriptionPDF } from '../lib/pdfGenerator';
import { formatIndianPhoneNumber } from '../lib/phone';

interface PatientDashboardProps {
  user: UserType;
  onLogout: () => void;
  onEditProfile: () => void;
}

export default function PatientDashboard({ user, onLogout, onEditProfile }: PatientDashboardProps) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [activeTab, setActiveTab] = useState<'vitals' | 'home' | 'appointments' | 'reports' | 'chat' | 'predictor' | 'diet' | 'directory' | 'about' | 'contact'>('home');
  
  // Modals / Overlays
  const [showBotModal, setShowBotModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  // Health metrics logger form
  const [sys, setSys] = useState('120');
  const [dia, setDia] = useState('80');
  const [glucose, setGlucose] = useState('95');
  const [heart, setHeart] = useState('72');
  const [steps, setSteps] = useState('8000');
  const [water, setWater] = useState('2.5');
  const [sleep, setSleep] = useState('7.5');

  // Book Appointment form
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc_1');
  const [aptDate, setAptDate] = useState('2026-07-16');
  const [aptTime, setAptTime] = useState('11:00 AM');
  const [isEmergency, setIsEmergency] = useState(false);
  const [symptoms, setSymptoms] = useState('');

  // Lab reports fields
  const [reportTitle, setReportTitle] = useState('');
  const [fileContent, setFileContent] = useState(''); // Base64
  const [ocrLoading, setOcrLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState('');

  // Reminders fields
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00 AM');
  const [newMedDose, setNewMedDose] = useState('1 tablet');

  // Chats consultation
  const [chatDoctorId, setChatDoctorId] = useState('');
  const [doctorsList, setDoctorsList] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDashboardData = () => {
    // Profile
    fetch(`/api/patient/${user.id}/profile`)
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));

    // Metrics
    fetch(`/api/patient/${user.id}/metrics`)
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error(err));

    // Appointments
    fetch(`/api/appointments?patientId=${user.id}`)
      .then(res => res.json())
      .then(data => setAppointments(data))
      .catch(err => console.error(err));

    // Prescriptions
    fetch(`/api/prescriptions?patientId=${user.id}`)
      .then(res => res.json())
      .then(data => setPrescriptions(data))
      .catch(err => console.error(err));

    // Reminders
    fetch(`/api/reminders/${user.id}`)
      .then(res => res.json())
      .then(data => setReminders(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchDashboardData();
    fetch('/api/doctors')
      .then(response => {
        if (!response.ok) throw new Error('Could not load doctors.');
        return response.json();
      })
      .then((doctors: Array<{ id: string; name: string; specialty: string }>) => {
        setDoctorsList(doctors);
        setChatDoctorId(currentId => doctors.some(doctor => doctor.id === currentId) ? currentId : (doctors[0]?.id || ''));
      })
      .catch(error => {
        console.error(error);
        setDoctorsList([]);
        setChatDoctorId('');
      });
  }, [user.id]);

  // Handle chat stream polling or fetching
  const fetchChatHistory = () => {
    if (!chatDoctorId) {
      setChatMessages([]);
      return;
    }
    fetch(`/api/chats?user1=${user.id}&user2=${chatDoctorId}`)
      .then(res => res.json())
      .then(data => setChatMessages(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatHistory();
      const interval = setInterval(fetchChatHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, chatDoctorId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleLogVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const vitalPayload = {
      date: new Date().toISOString().split('T')[0],
      bloodPressureSystolic: parseInt(sys),
      bloodPressureDiastolic: parseInt(dia),
      sugarLevel: parseInt(glucose),
      heartRate: parseInt(heart),
      bmi: profile ? Number((profile.weight / ((profile.height / 100) ** 2)).toFixed(1)) : 23.5,
      waterIntake: parseFloat(water),
      sleep: parseFloat(sleep),
      steps: parseInt(steps)
    };

    fetch(`/api/patient/${user.id}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitalPayload)
    })
      .then(res => res.json())
      .then(() => {
        fetchDashboardData();
        // Reset vital logger fields
        alert('Vitals logged successfully!');
      })
      .catch(err => console.error(err));
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      alert('Please describe your symptoms.');
      return;
    }

    const doc = doctorsList.find(d => d.id === selectedDoctorId);
    const aptPayload = {
      patientId: user.id,
      patientName: user.name,
      doctorId: selectedDoctorId,
      doctorName: doc?.name || 'Dr. Medical Expert',
      specialty: doc?.specialty || 'General',
      date: aptDate,
      time: aptTime,
      isEmergency,
      symptoms
    };

    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aptPayload)
    })
      .then(res => res.json())
      .then(() => {
        fetchDashboardData();
        setSymptoms('');
        setIsEmergency(false);
        alert(isEmergency ? 'Priority Request Approved! Check calendar.' : 'Appointment request submitted for review.');
      })
      .catch(err => console.error(err));
  };

  // Lab Report File upload simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !fileContent) {
      alert('Please select a report file and name it.');
      return;
    }

    setOcrLoading(true);
    setActiveAnalysis('');

    // Trigger AI report analysis / OCR
    fetch('/api/ai/summarize-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportTitle, fileContentBase64: fileContent })
    })
      .then(res => res.json())
      .then(data => {
        setActiveAnalysis(data.summary);
        
        // Save the report back into patient's profile
        if (profile) {
          const newReport = {
            id: `rep_${Date.now()}`,
            title: reportTitle,
            date: new Date().toISOString().split('T')[0],
            type: 'Image' as const,
            url: fileContent,
            analyzedSummary: data.summary
          };
          
          const updatedProfile = {
            ...profile,
            labReports: [...profile.labReports, newReport]
          };

          fetch(`/api/patient/${user.id}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProfile)
          }).then(() => fetchDashboardData());
        }
        
        setReportTitle('');
        setFileContent('');
      })
      .catch(err => console.error(err))
      .finally(() => setOcrLoading(false));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: user.id,
        medicineName: newMedName,
        time: newMedTime,
        dosage: newMedDose
      })
    })
      .then(res => res.json())
      .then(() => {
        setNewMedName('');
        fetchDashboardData();
      })
      .catch(err => console.error(err));
  };

  const handleToggleReminder = (id: string) => {
    fetch(`/api/reminders/${id}/toggle`, { method: 'PATCH' })
      .then(() => fetchDashboardData())
      .catch(err => console.error(err));
  };

  const handleDeleteReminder = (id: string) => {
    fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      .then(() => fetchDashboardData())
      .catch(err => console.error(err));
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    setSendingChat(true);
    const doc = doctorsList.find(d => d.id === chatDoctorId);
    
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: user.id,
        senderRole: 'patient',
        receiverId: chatDoctorId,
        text: chatInput
      })
    })
      .then(res => res.json())
      .then(() => {
        setChatInput('');
        fetchChatHistory();
      })
      .catch(err => console.error(err))
      .finally(() => setSendingChat(false));
  };

  // Print style Prescription layout trigger
  const handlePrintPrescription = () => {
    window.print();
  };

  return (
    <div id="patient-dashboard" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Banner Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900"><span className="font-brand">MedTech</span> Patient Care</h1>
            <span className="text-[11px] block text-slate-500 font-medium">Patient Dashboard: {user.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* AI Helper trigger button */}
          <button 
            type="button"
            onClick={() => setShowBotModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-sm hover:shadow transition"
          >
            <Bot className="w-4 h-4 text-indigo-600 animate-bounce" />
            <span>AI Consult Bot</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
            title="Log Out Profile"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid md:grid-cols-12 gap-6">
        
        {/* Patient navigation menu */}
        <div className="md:col-span-3 md:col-start-10 md:row-start-1">
          {/* Patient navigation menu */}
          <nav aria-label="Patient navigation" className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex flex-col space-y-1 md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
            <details open className="mb-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <summary className="cursor-pointer list-none text-xs font-bold text-slate-800">
                <span className="block">Profile details</span>
                <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500">{user.name}</span>
              </summary>
              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-[11px] text-slate-600">
                <p><strong className="text-slate-800">Email:</strong> {user.email}</p>
                <p><strong className="text-slate-800">Phone:</strong> {formatIndianPhoneNumber(user.phoneNumber || profile?.phoneNumber) || 'Not provided'}</p>
                <p><strong className="text-slate-800">Date of birth:</strong> {user.dateOfBirth || profile?.dateOfBirth || 'Not provided'}</p>
                <p><strong className="text-slate-800">Age / Gender:</strong> {profile?.age ?? user.age ?? 'Not provided'} / {profile?.gender || user.gender || 'Not provided'}</p>
                <p><strong className="text-slate-800">Blood group:</strong> {profile?.bloodGroup || user.bloodGroup || 'Not provided'}</p>
                <p><strong className="text-slate-800">Emergency:</strong> {formatIndianPhoneNumber(user.emergencyContact || profile?.emergencyContact) || 'Not provided'}</p>
                <p><strong className="text-slate-800">Major health issue:</strong> {user.majorHealthIssue || profile?.majorHealthIssue || 'Not provided'}</p>
                {profile && <p><strong className="text-slate-800">Height / Weight:</strong> {profile.height} cm / {profile.weight} kg</p>}
                {profile && <p><strong className="text-slate-800">Allergies:</strong> {profile.allergies?.join(', ') || 'None declared'}</p>}
                {profile && <p><strong className="text-slate-800">Vaccinations:</strong> {profile.vaccinationHistory?.join(', ') || 'None recorded'}</p>}
                <button type="button" onClick={onEditProfile} className="mt-1 w-full rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50">
                  Edit profile details
                </button>
              </div>
            </details>
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'profileSettings', label: 'Profile Settings', icon: Settings },
              { id: 'about', label: 'About Us', icon: Info },
              { id: 'contact', label: 'Contact', icon: PhoneCall },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'reports', label: 'Lab Reports & OCR', icon: FileText },
              { id: 'chat', label: 'Doctor Chat', icon: MessageSquare },
              { id: 'predictor', label: 'AI Risk Predictor', icon: Sparkles },
              { id: 'diet', label: 'AI Diet Planner', icon: Bot },
              { id: 'directory', label: 'Clinics & Donors', icon: Heart }
            ].map(tab => {
              const Icon = tab.icon;
              const isProfileSettings = tab.id === 'profileSettings';
              const isActive = !isProfileSettings && activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => isProfileSettings ? onEditProfile() : setActiveTab(tab.id as typeof activeTab)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-2.5 text-left ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Patient page content */}
        <div className="md:col-span-9 md:col-start-1 md:row-start-1 space-y-6">

          {activeTab === 'home' && (
            <section className="space-y-5 animate-in fade-in duration-150" aria-labelledby="patient-home-title">
              <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase text-blue-700">Patient Home</p>
                <h2 id="patient-home-title" className="mt-1 text-2xl font-bold text-slate-900">Welcome, {user.name}</h2>
                <p className="mt-2 text-sm text-slate-600">Your care, appointments, reports, and clinical support in one place.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Appointments', value: appointments.length, action: 'appointments', icon: Calendar },
                  { label: 'Lab reports', value: profile?.labReports?.length || 0, action: 'reports', icon: FileText },
                  { label: 'Active reminders', value: reminders.filter(reminder => reminder.isActive).length, action: 'chat', icon: Bell }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.label} type="button" onClick={() => setActiveTab(item.action as typeof activeTab)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30">
                      <span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Icon className="h-4 w-4 text-blue-600" />{item.label}</span>
                      <span className="mt-2 block text-2xl font-bold text-slate-900">{item.value}</span>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Your care at a glance</h3>
                    <p className="mt-1 text-xs text-slate-500">Choose a section to continue.</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab('appointments')} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Book appointment</button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setActiveTab('chat')} className="rounded-lg border border-slate-200 px-3 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">Message your doctor</button>
                  <button type="button" onClick={() => setActiveTab('directory')} className="rounded-lg border border-slate-200 px-3 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">Find clinics and donors</button>
                  <button type="button" onClick={() => setActiveTab('predictor')} className="rounded-lg border border-slate-200 px-3 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">Open AI risk predictor</button>
                  <button type="button" onClick={() => setActiveTab('diet')} className="rounded-lg border border-slate-200 px-3 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">View AI diet planner</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'about' && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-150" aria-labelledby="about-title">
              <p className="text-xs font-bold uppercase text-blue-700">About MedTech</p>
              <h2 id="about-title" className="mt-1 text-xl font-bold text-slate-900">Connected care, centered on you</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">MedTech brings patient records, appointment requests, clinical conversations, lab reports, and health guidance into one healthcare workspace. Your dashboard gives you a single place to manage your care and communicate with your care team.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-blue-50/60 p-4"><h3 className="text-sm font-bold text-slate-800">Care coordination</h3><p className="mt-1 text-xs leading-5 text-slate-600">Request appointments and follow prescription updates.</p></div>
                <div className="rounded-lg bg-emerald-50/60 p-4"><h3 className="text-sm font-bold text-slate-800">Health records</h3><p className="mt-1 text-xs leading-5 text-slate-600">Keep reports and profile information together.</p></div>
                <div className="rounded-lg bg-amber-50/60 p-4"><h3 className="text-sm font-bold text-slate-800">Care guidance</h3><p className="mt-1 text-xs leading-5 text-slate-600">Use digital tools as support alongside professional medical advice.</p></div>
              </div>
            </section>
          )}

          {activeTab === 'contact' && (
            <section className="space-y-4 animate-in fade-in duration-150" aria-labelledby="contact-title">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase text-blue-700">Contact</p>
                <h2 id="contact-title" className="mt-1 text-xl font-bold text-slate-900">Get care or support</h2>
                <p className="mt-2 text-sm text-slate-600">For personal care questions, contact your doctor through secure Doctor Chat. For hospital assistance, use the listed Chennai hospital contact.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Your care team</h3>
                  <p className="mt-1 text-xs text-slate-500">Send a message about appointments, prescriptions, or follow-up care.</p>
                  <button type="button" onClick={() => setActiveTab('chat')} className="mt-4 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Open Doctor Chat</button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Apollo Hospitals Chennai</h3>
                  <p className="mt-1 text-xs text-slate-500">21 Greams Lane, Off Greams Road, Chennai</p>
                  <a href="tel:+914428293333" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><PhoneCall className="h-4 w-4" />+91 44 2829 3333</a>
                </div>
              </div>
            </section>
          )}

          {/* 1. HEALTH VITALS LOGS TAB */}
          {activeTab === 'vitals' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Daily medicine reminders bar */}
              {reminders.length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4.5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-900 flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Active Daily Medicine Reminders
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {reminders.map(rem => (
                      <div key={rem.id} className="p-3 bg-white rounded-xl border border-indigo-100/60 shadow-sm flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <input 
                            type="checkbox"
                            checked={rem.isActive}
                            onChange={() => handleToggleReminder(rem.id)}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          <div className={rem.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}>
                            <h5 className="text-xs font-extrabold">{rem.medicineName}</h5>
                            <p className="text-[10px]">{rem.dosage} at {rem.time}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteReminder(rem.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Split Metrics: Logger Form & Historical Graph */}
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Logger Form */}
                <div className="md:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Log Daily Vitals</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Maintain healthy diagnostic records for your cardiologist review.</p>
                  </div>

                  <form onSubmit={handleLogVitals} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Sys Pressure</label>
                        <input type="number" value={sys} onChange={e => setSys(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Dia Pressure</label>
                        <input type="number" value={dia} onChange={e => setDia(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Glucose (mg/dL)</label>
                        <input type="number" value={glucose} onChange={e => setGlucose(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Heart Rate (bpm)</label>
                        <input type="number" value={heart} onChange={e => setHeart(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500">Steps</label>
                        <input type="number" value={steps} onChange={e => setSteps(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500">Water (L)</label>
                        <input type="number" step="0.1" value={water} onChange={e => setWater(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500">Sleep (Hr)</label>
                        <input type="number" step="0.5" value={sleep} onChange={e => setSleep(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition">
                      Commit Diagnostics Entry
                    </button>
                  </form>

                  {/* Add Reminder Mini Form */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <span className="text-[11px] font-bold text-slate-700 block">Add New Medicine Reminder</span>
                    <form onSubmit={handleAddReminder} className="grid grid-cols-12 gap-1.5">
                      <div className="col-span-6">
                        <input 
                          type="text" 
                          required 
                          value={newMedName} 
                          onChange={e => setNewMedName(e.target.value)} 
                          placeholder="Meds Name (e.g. Aspirin)" 
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" 
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="text" 
                          value={newMedTime} 
                          onChange={e => setNewMedTime(e.target.value)} 
                          placeholder="08:00 AM" 
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs" 
                        />
                      </div>
                      <button type="submit" className="col-span-3 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>

                </div>

                {/* Analytical Graphs Representation */}
                <div className="md:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Vitals Diagnostics Trends</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Daily chronological tracking of heart rate and blood sugar indicators.</p>
                  </div>

                  {metrics.length > 0 ? (
                    <div className="space-y-6 my-4">
                      {/* Heart Rate mini chart */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center"><Heart className="w-4.5 h-4.5 mr-1 text-rose-500 fill-rose-500" /> Heart Rate (bpm)</span>
                          <span className="text-slate-500 font-mono">Latest: {metrics[metrics.length-1].heartRate} bpm</span>
                        </div>
                        {/* Custom beautiful responsive SVG line chart representing data */}
                        <div className="h-20 bg-slate-50/50 rounded-xl border border-slate-100 p-1 relative flex items-end">
                          <svg className="w-full h-full" viewBox="0 0 400 60">
                            <polyline
                              fill="none"
                              stroke="#ec4899"
                              strokeWidth="2.5"
                              points={metrics.map((m, idx) => `${(idx / (metrics.length - 1 || 1)) * 380 + 10},${50 - ((m.heartRate - 50) / 60) * 40}`).join(' ')}
                            />
                            {/* Dot pins */}
                            {metrics.map((m, idx) => (
                              <circle
                                key={idx}
                                cx={(idx / (metrics.length - 1 || 1)) * 380 + 10}
                                cy={50 - ((m.heartRate - 50) / 60) * 40}
                                r="3"
                                fill="#fff"
                                stroke="#ec4899"
                                strokeWidth="2.5"
                              />
                            ))}
                          </svg>
                        </div>
                      </div>

                      {/* Glucose levels mini chart */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center"><Droplet className="w-4.5 h-4.5 mr-1 text-teal-500" /> Blood Sugar Levels (mg/dL)</span>
                          <span className="text-slate-500 font-mono">Latest: {metrics[metrics.length-1].sugarLevel} mg/dL</span>
                        </div>
                        <div className="h-20 bg-slate-50/50 rounded-xl border border-slate-100 p-1 relative flex items-end">
                          <svg className="w-full h-full" viewBox="0 0 400 60">
                            <polyline
                              fill="none"
                              stroke="#0d9488"
                              strokeWidth="2.5"
                              points={metrics.map((m, idx) => `${(idx / (metrics.length - 1 || 1)) * 380 + 10},${50 - ((m.sugarLevel - 70) / 80) * 40}`).join(' ')}
                            />
                            {metrics.map((m, idx) => (
                              <circle
                                key={idx}
                                cx={(idx / (metrics.length - 1 || 1)) * 380 + 10}
                                cy={50 - ((m.sugarLevel - 70) / 80) * 40}
                                r="3"
                                fill="#fff"
                                stroke="#0d9488"
                                strokeWidth="2.5"
                              />
                            ))}
                          </svg>
                        </div>
                      </div>

                      {/* Interactive details panels */}
                      <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center justify-center"><Footprints className="w-3 h-3 mr-0.5 text-indigo-500" /> Steps</span>
                          <span className="text-xs font-bold text-slate-800">{metrics[metrics.length-1].steps}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center justify-center"><Droplet className="w-3 h-3 mr-0.5 text-blue-500" /> Water</span>
                          <span className="text-xs font-bold text-slate-800">{metrics[metrics.length-1].waterIntake} L</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center justify-center"><Moon className="w-3 h-3 mr-0.5 text-amber-500" /> Sleep</span>
                          <span className="text-xs font-bold text-slate-800">{metrics[metrics.length-1].sleep} Hr</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium">
                      No vitals history logged. Commit daily records on the left to see analytics.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 2. CLINICAL APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Book Appointment Form (Col 5) */}
                <div className="md:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Schedule Care Appointment</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Select your specialized clinic doctor and specify current symptoms.</p>
                  </div>

                  <form onSubmit={handleBookAppointment} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Select Specialized Physician</label>
                      <select 
                        value={selectedDoctorId} 
                        onChange={e => setSelectedDoctorId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                      >
                        {doctorsList.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Date</label>
                        <input type="date" value={aptDate} onChange={e => setAptDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Preferred Time</label>
                        <input type="text" value={aptTime} onChange={e => setAptTime(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 p-3 rounded-xl border border-amber-100 bg-amber-50/40">
                      <input 
                        type="checkbox" 
                        id="isEmergency"
                        checked={isEmergency}
                        onChange={e => setIsEmergency(e.target.checked)}
                        className="w-4.5 h-4.5 text-amber-600 border-slate-300 rounded focus:ring-amber-500" 
                      />
                      <label htmlFor="isEmergency" className="text-xs font-bold text-slate-700 cursor-pointer flex flex-col">
                        <span className="text-amber-800">Flag as Priority Request</span>
                        <span className="text-[10px] font-normal text-amber-600 leading-normal">Priority checkups receive immediate queue routing for urgent review.</span>
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Primary Symptoms</label>
                      <textarea
                        required
                        value={symptoms}
                        onChange={e => setSymptoms(e.target.value)}
                        placeholder="e.g. Occasional sharp chest tightness or rapid pulse..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none h-20"
                      />
                    </div>

                    <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition">
                      Confirm Appointment Booking
                    </button>
                  </form>
                </div>

                {/* Calendar View / Scheduled History (Col 7) */}
                <div className="md:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Your Consultation Calendar</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Track care approval logs and digital prescription follow-ups.</p>
                  </div>

                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {appointments.map(apt => (
                      <div key={apt.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2 text-left">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-xs">{apt.doctorName}</h4>
                            <span className="text-[10px] text-slate-400">{apt.specialty} Specialist</span>
                          </div>
                          
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border ${
                            apt.isEmergency ? 'bg-red-50 text-red-700 border-red-100' :
                            apt.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            apt.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {apt.isEmergency && <AlertTriangle className="w-3 h-3 mr-0.5" />}
                            <span>{apt.isEmergency ? 'Priority Approved' : apt.status.toUpperCase()}</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {apt.date}</span>
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {apt.time}</span>
                        </div>

                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                          <strong className="text-slate-800 block text-[10px] uppercase">Reported Symptoms:</strong>
                          {apt.symptoms}
                        </p>

                        {/* If appointment is completed or approved and has prescription */}
                        {prescriptions.find(p => p.appointmentId === apt.id) && (
                          <button
                            type="button"
                            onClick={() => setSelectedPrescription(prescriptions.find(p => p.appointmentId === apt.id) || null)}
                            className="inline-flex items-center space-x-1 py-1 px-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10.5px] font-bold border border-blue-100 mt-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Download Digital Rx</span>
                          </button>
                        )}
                      </div>
                    ))}

                    {appointments.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No medical consultations scheduled yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 3. LAB REPORTS & AI OCR TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Upload Section */}
                <div className="md:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Upload Medical Reports</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Upload lab diagnostic results (Blood, MRI, X-Ray) for Gemini AI clinical reading.</p>
                  </div>

                  <form onSubmit={handleAddReport} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Report Title</label>
                      <input 
                        type="text" 
                        required 
                        value={reportTitle}
                        onChange={e => setReportTitle(e.target.value)}
                        placeholder="e.g. Lipid Profile, Chest X-Ray..." 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Select File (Image / PDF)</label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 transition rounded-xl p-6 text-center space-y-2 bg-slate-50/50">
                        <FileText className="w-8 h-8 stroke-1 mx-auto text-slate-400" />
                        <input 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden" 
                          id="reportFile" 
                        />
                        <label htmlFor="reportFile" className="text-xs font-bold text-blue-600 cursor-pointer hover:underline block">
                          Browse Local Documents
                        </label>
                        <p className="text-[10px] text-slate-400">PDF, PNG or JPEG formats up to 5MB</p>
                        {fileContent && (
                          <div className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-100 inline-block">
                            ✓ Document Attached
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={ocrLoading}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
                    >
                      {ocrLoading ? (
                        <span>Simulating OCR Clinical Reading...</span>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-blue-200 fill-blue-200" />
                          <span>Upload & Analyze with Gemini</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Analytical summary feedback list (Col 7) */}
                <div className="md:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Medical Summary & Lab Logs</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Chronological lists of your medical test documentation and AI reviews.</p>
                  </div>

                  {activeAnalysis && (
                    <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100/60 space-y-2 animate-in slide-in-from-top-3 duration-200 text-left">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Latest Gemini Clinical Summarization
                      </span>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{activeAnalysis}</p>
                    </div>
                  )}

                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {profile?.labReports?.map(rep => (
                      <div key={rep.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-left space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{rep.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">Date Uploaded: {rep.date}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setActiveAnalysis(rep.analyzedSummary || '')}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition"
                            title="View Analysis"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        {rep.analyzedSummary && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100/50">
                            {rep.analyzedSummary}
                          </p>
                        )}
                      </div>
                    ))}

                    {(!profile || !profile.labReports || profile.labReports.length === 0) && (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No medical reports found. Please upload lab tests on the left.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 4. DOCTOR CONSULTATION CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[520px] animate-in fade-in duration-150 text-left">
              
              {/* Doctor select panel */}
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Active Consultation:</span>
                  <select
                    value={chatDoctorId}
                    onChange={e => setChatDoctorId(e.target.value)}
                    disabled={doctorsList.length === 0}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-bold text-blue-700"
                  >
                    {doctorsList.length === 0 && <option value="">No doctors available</option>}
                    {doctorsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10.5px] text-slate-500 font-medium">Doctor Online</span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
                {chatMessages.map(msg => {
                  const isMe = msg.senderId === user.id;
                  const hasRx = msg.prescriptionData && msg.prescriptionData.medicines && msg.prescriptionData.medicines.length > 0;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs shadow-sm ${
                        isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
                      }`}>
                        {/* Text Content */}
                        {msg.text && (
                          <p className="leading-relaxed whitespace-pre-line text-[12.5px] font-normal">{msg.text}</p>
                        )}

                        {/* Prescribed Medicine Attached PDF Card */}
                        {hasRx && (
                          <div className="mt-2 text-slate-900">
                            <MedicinePdfCard
                              type="doctor"
                              rxId={msg.prescriptionData.rxId}
                              clinicName={msg.prescriptionData.clinicName}
                              clinicAddress={msg.prescriptionData.clinicAddress}
                              clinicContact={msg.prescriptionData.clinicContact}
                              doctorName={msg.prescriptionData.doctorName || 'Dr. Sarah Connor'}
                              doctorSpecialty={msg.prescriptionData.doctorSpecialty || 'Specialist Physician'}
                              doctorRegNo={msg.prescriptionData.doctorRegNo || 'REG-MC-904218'}
                              patientName={user.name}
                              patientId={msg.prescriptionData.patientId || 'PAT-00189'}
                              patientAge={msg.prescriptionData.patientAge || profile?.age || 34}
                              patientGender={msg.prescriptionData.patientGender || profile?.gender || 'Male'}
                              patientBlood={msg.prescriptionData.patientBlood || profile?.bloodGroup || 'O+'}
                              patientWeight={msg.prescriptionData.patientWeight || (profile ? `${profile.weight} kg` : undefined)}
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
                              onAddToReminders={async (medsList) => {
                                try {
                                  for (const med of medsList) {
                                    await fetch('/api/reminders', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        patientId: user.id,
                                        medicineName: med.name,
                                        time: '08:00 AM',
                                        dosage: med.dosage
                                      })
                                    });
                                  }
                                  fetchDashboardData();
                                  alert(`Added ${medsList.length} prescribed medicine(s) to your daily reminders!`);
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
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
                  <div className="text-center py-16 text-slate-400 space-y-1">
                    <MessageSquare className="w-10 h-10 stroke-1 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">No diagnostic logs yet</p>
                    <p className="text-[11px]">Send a consultation message to start the secure patient-doctor chat thread.</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Send Chat Footer */}
              <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask your doctor about prescriptions, medicine dosage, symptoms..."
                  className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-slate-50/50"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatInput.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  Send
                </button>
              </form>

            </div>
          )}

          {/* 5. DISEASE PREDICTOR TAB */}
          {activeTab === 'predictor' && (
            <DiseasePredictor
              patientName={user.name}
              patientAge={profile?.age ?? user.age}
              patientGender={profile?.gender || user.gender}
              patientBlood={profile?.bloodGroup || user.bloodGroup}
            />
          )}

          {/* 6. AI DIET PLAN TAB */}
          {activeTab === 'diet' && (
            <DietRecommendation
              medicalHistory={profile?.medicalHistory || []}
              patientName={user.name}
              patientAge={profile?.age ?? user.age}
              patientGender={profile?.gender || user.gender}
            />
          )}

          {/* 7. HEALTHCARE DIRECTORY TAB */}
          {activeTab === 'directory' && (
            <div className="space-y-6">
              <NearbyHospitals />
              <BloodDonorFinder />
            </div>
          )}

        </div>

      </div>

      {/* AI Bot Companion overlay modal */}
      {showBotModal && (
        <AIChatbotModal
          onClose={() => setShowBotModal(false)}
          patientName={user.name}
          patientAge={profile?.age ?? user.age}
          patientGender={profile?.gender || user.gender}
          patientBlood={profile?.bloodGroup || user.bloodGroup}
        />
      )}

      {/* PRESCRIPTION PREVIEW MODAL / DIGITAL RX */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <span className="font-extrabold text-xs tracking-widest uppercase">Digital Clinical Rx</span>
              <button 
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="text-slate-400 hover:text-white text-xs font-bold font-mono"
              >
                CLOSE
              </button>
            </div>

            {/* Printable Prescription content */}
            <div id="rx-printable-sheet" className="p-8 space-y-6 bg-white text-left text-slate-800">
              
              {/* Clinical Title */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-blue-600 tracking-tight"><span className="font-brand">MedTech</span> Smart Clinic</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Digital diagnostic prescription protocols.</p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <p className="font-bold text-slate-700">{selectedPrescription.doctorName}</p>
                  <p>Primary Care Practitioner</p>
                </div>
              </div>

              {/* Patient details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-500 font-medium">PATIENT DETAILS:</p>
                  <h5 className="font-bold text-slate-800 text-sm mt-0.5">{selectedPrescription.patientName}</h5>
                  <p className="text-slate-400 text-[10.5px]">Reference ID: {selectedPrescription.patientId}</p>
                </div>

                <div className="text-right">
                  <p className="text-slate-500 font-medium">DATE OF EMISSION:</p>
                  <h5 className="font-bold text-slate-800 text-sm mt-0.5">{selectedPrescription.date}</h5>
                  <p className="text-slate-400 text-[10.5px]">Rx Serial: {selectedPrescription.id}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold uppercase text-slate-500 block">Primary Diagnostic Findings</span>
                <p className="text-xs text-slate-700 bg-blue-50/30 border border-blue-100/60 p-3 rounded-xl">
                  {selectedPrescription.diagnosis}
                </p>
              </div>

              {/* Medicines Grid */}
              <div className="space-y-2">
                <span className="text-[10.5px] font-bold uppercase text-slate-500 block">Prescribed Medicines Dosage Schedule</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5 text-center">Dosage</th>
                        <th className="p-2.5 text-center">Duration</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPrescription.medicines.map((med, idx) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="p-2.5 font-bold text-slate-800">{med.name}</td>
                          <td className="p-2.5 text-center font-mono text-[10.5px]">{med.dosage}</td>
                          <td className="p-2.5 text-center">{med.duration}</td>
                          <td className="p-2.5 text-[11px] text-slate-500">{med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clinical notes */}
              {selectedPrescription.notes && (
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold uppercase text-slate-500 block">Clinical Directives & Diet advice</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    &quot;{selectedPrescription.notes}&quot;
                  </p>
                </div>
              )}

              {/* Verified sign and Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-1 text-xs text-emerald-600 font-bold">
                  <CheckCircle className="w-4 h-4 fill-emerald-100" />
                  <span>Clinically Signed via MedTech Portal</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (!selectedPrescription) return;
                      generatePrescriptionPDF({
                        rxId: selectedPrescription.id,
                        doctorName: selectedPrescription.doctorName,
                        patientName: user.name,
                        date: selectedPrescription.date,
                        diagnosis: selectedPrescription.diagnosis,
                        medicines: selectedPrescription.medicines,
                        notes: selectedPrescription.notes
                      });
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={handlePrintPrescription}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
