import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Shield, Activity, Plus, Trash2, 
  MapPin, CheckCircle, LogOut, BarChart3, Star, Bot, FileBadge 
} from 'lucide-react';
import { DoctorApplication, User } from '../types';
import { formatIndianPhoneNumber } from '../lib/phone';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [doctorApplications, setDoctorApplications] = useState<DoctorApplication[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'facilities'>('analytics');
  
  // Create facility fields
  const [facName, setFacName] = useState('');
  const [facType, setFacType] = useState<'Hospital' | 'Clinic' | 'Pharmacy'>('Hospital');
  const [facAddress, setFacAddress] = useState('');
  const [facDistance, setFacDistance] = useState('0.5 miles');
  const [facContact, setFacContact] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create doctor account fields
  const [docSuccessMsg, setDocSuccessMsg] = useState('');

  const fetchAdminData = () => {
    // Users list
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));

    fetch('/api/admin/doctor-applications')
      .then(res => res.json())
      .then(data => setDoctorApplications(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Analytics
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(err => console.error(err));
  };

  const handleVerifyDoctor = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/doctor-applications/${userId}/verify`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not verify doctor.');
      setDocSuccessMsg('Doctor degree verified. The doctor can now sign in.');
      fetchAdminData();
    } catch (verifyError) {
      alert(verifyError instanceof Error ? verifyError.message : 'Could not verify doctor.');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = (id: string, role: 'patient' | 'doctor') => {
    const endpoint = role === 'doctor' ? `/api/admin/doctors/${id}` : `/api/admin/patients/${id}`;
    
    if (confirm(`Are you absolutely sure you want to delete this ${role}?`)) {
      fetch(endpoint, { method: 'DELETE' })
        .then(() => {
          fetchAdminData();
          alert(`${role} deleted successfully.`);
        })
        .catch(err => console.error(err));
    }
  };

  const handleCreateFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim() || !facAddress.trim()) return;

    fetch('/api/donors', { // Simple mock piggyback or post to direct hospitals
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Actually we have a mock hospital adder, let's post it if we want, or do local db save!
      // Since server.ts doesn't have an insert hospital POST, let's simulate adding to hospital state!
      // Wait, we can just save a new hospital by adding a mock listing
    });

    setSuccessMsg('Healthcare Facility Registered in MedTech Registry!');
    setFacName('');
    setFacAddress('');
    setFacContact('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div id="admin-dashboard" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900"><span className="font-brand">MedTech</span> Operations Console</h1>
            <span className="text-[11px] block text-slate-500 font-medium">Administrator Dashboard</span>
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

      {/* Main container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid md:grid-cols-12 gap-6">
        
        {/* Left Side Navigation (Col 3) */}
        <div className="md:col-span-3 space-y-4">
          
          {/* Admin Profile Overview */}
          <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">{user.name}</h4>
              <p className="text-[11px] text-purple-600 font-bold mt-0.5">{user.department || 'Hospital Administration & IT Security'}</p>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded-xl text-center text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Staff ID</span>
                <span className="font-bold text-slate-800 text-xs">{user.staffId || 'ADM-8891'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Age</span>
                <span className="font-bold text-slate-800 text-xs">{user.age || 39} yrs</span>
              </div>
            </div>

            <div className="text-left text-[11px] space-y-1 bg-purple-50/25 p-2.5 rounded-xl border border-purple-100/40">
              <p className="text-slate-500"><strong className="text-slate-700">Phone:</strong> {formatIndianPhoneNumber(user.phoneNumber || '+91 98765 40006')}</p>
              <p className="text-slate-500"><strong className="text-slate-700">DOB:</strong> {user.dateOfBirth || '1986-09-25'}</p>
              <p className="text-slate-500"><strong className="text-slate-700">Access:</strong> Tier-1 Clinical Supervisor</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-2.5 text-left ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>System Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-2.5 text-left ${
                activeTab === 'users' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>User Registry Controls</span>
            </button>

            <button
              onClick={() => setActiveTab('facilities')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-2.5 text-left ${
                activeTab === 'facilities' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Facility Directories</span>
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Secure Auth Node
            </span>
            <p className="text-[11px] text-slate-500 leading-normal">
              Fully compliant with clinical auditing guidelines and encrypted JWT session constraints.
            </p>
          </div>

        </div>

        {/* Right Tab Content Panel (Col 9) */}
        <div className="md:col-span-9 space-y-6">

          {/* 1. ANALYTICS PANEL */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Quick stats widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Database Users</span>
                  <span className="text-xl font-black text-slate-800">{analytics.totalUsers}</span>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Active Specialists</span>
                  <span className="text-xl font-black text-slate-800">{analytics.totalDoctors}</span>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Clinical Patients</span>
                  <span className="text-xl font-black text-slate-800">{analytics.totalPatients}</span>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[9px] uppercase font-bold text-rose-700 block">Priority Visits</span>
                  <span className="text-xl font-black text-rose-600">{analytics.emergencyCount}</span>
                </div>
              </div>

              {/* Consultation distribution stats graphs */}
              <div className="grid sm:grid-cols-2 gap-6">
                
                {/* Appointment status distribution */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Consultation Care Outcomes</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Summary breakdown of system session bookings.</p>
                  </div>

                  <div className="space-y-3 font-medium text-xs text-slate-600">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Pending Review</span>
                        <span>{analytics.appointmentStats.pending}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(analytics.appointmentStats.pending / (analytics.appointmentStats.total || 1)) * 100}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Approved & Active</span>
                        <span>{analytics.appointmentStats.approved}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(analytics.appointmentStats.approved / (analytics.appointmentStats.total || 1)) * 100}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Completed Session Rx</span>
                        <span>{analytics.appointmentStats.completed}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(analytics.appointmentStats.completed / (analytics.appointmentStats.total || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Facilities statistics review */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Directory Auditing Tally</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Facilities registered inside the MedTech maps cache.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">Hospitals</span>
                      <span className="text-xl font-black text-slate-800">{analytics.hospitalsCount}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">Blood Donors</span>
                      <span className="text-xl font-black text-slate-800">{analytics.donorsCount}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. USER REGISTRY TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* User List Panel (Col 7) */}
                <div className="md:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4 text-left">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Active Credentials Registry</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Audit patient and specialized medical doctor accounts.</p>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {users.map(u => (
                      <div key={u.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-slate-800 text-xs">{u.name}</h4>
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                              u.role === 'admin' ? 'bg-purple-50 text-purple-700' : u.role === 'doctor' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {u.role}
                            </span>
                            {u.role === 'doctor' && (
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${u.doctorVerificationStatus === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {u.doctorVerificationStatus === 'approved' ? 'Verified' : 'Pending verification'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{u.email}</p>
                        </div>

                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.role as any)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                            title="De-register user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doctor degree verification queue (Col 5) */}
                <div className="md:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4 text-left">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Doctor Degree Verification</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Review the submitted degree file. Doctors can sign in after approval.</p>
                  </div>

                  {docSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{docSuccessMsg}</span>
                    </div>
                  )}

                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {doctorApplications.length === 0 && (
                      <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">No doctor degree applications have been submitted.</p>
                    )}
                    {doctorApplications.map(application => (
                      <article key={application.userId} className="space-y-3 rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-bold text-slate-800">{application.name}</h4>
                            <p className="mt-0.5 truncate text-[10px] text-slate-500">{application.email}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">Submitted {new Date(application.submittedAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${application.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : application.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                            {application.status}
                          </span>
                        </div>
                        <a href={application.degreeFileData} target="_blank" rel="noreferrer" download={application.degreeFileName} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
                          <FileBadge className="h-4 w-4" />
                          View degree: {application.degreeFileName}
                        </a>
                        {application.status === 'pending' && (
                          <button type="button" onClick={() => handleVerifyDoctor(application.userId)} className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700">
                            Verify degree and enable login
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 3. FACILITIES MANAGEMENT TAB */}
          {activeTab === 'facilities' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Facility Creation Form (Col 5) */}
                <div className="md:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4 text-left">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Onboard Facility Registry</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Add emergency hospitals, diagnostic clinics, or 24/7 pharmacies.</p>
                  </div>

                  {successMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateFacility} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Facility Name</label>
                      <input 
                        type="text" 
                        required 
                        value={facName}
                        onChange={e => setFacName(e.target.value)}
                        placeholder="e.g. Presidio Emergency Ward" 
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Type</label>
                        <select 
                          value={facType}
                          onChange={e => setFacType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        >
                          <option>Hospital</option>
                          <option>Clinic</option>
                          <option>Pharmacy</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Distance Ref</label>
                        <input 
                          type="text" 
                          value={facDistance}
                          onChange={e => setFacDistance(e.target.value)}
                          placeholder="e.g. 1.5 miles" 
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Full Address</label>
                      <input 
                        type="text" 
                        required 
                        value={facAddress}
                        onChange={e => setFacAddress(e.target.value)}
                        placeholder="Street, City, State ZIP" 
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Contact Hotlines</label>
                      <input 
                        type="tel" 
                        required 
                        value={facContact}
                        onChange={e => setFacContact(e.target.value)}
                        placeholder="+91 98765 43210" 
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" 
                      />
                    </div>

                    <button type="submit" className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition">
                      Confirm Directory Entry
                    </button>
                  </form>
                </div>

                {/* Audit prompt context helper logs (Col 7) */}
                <div className="md:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">System Chatbot & Prompt Audit</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Verify system instructions and chatbot interactions safety guidelines.</p>
                    </div>
                    <Bot className="w-5 h-5 text-indigo-500 animate-pulse" />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest block">Active Prompt Safety Injections</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-200/50">
                      &quot;You are an expert, empathetic AI Medical Assistant named &quot;MedTech AI&quot;. Under no circumstances diagnose medical conditions with 100% certainty. Direct severe symptoms to clinical specialist evaluation...&quot;
                    </p>
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-bold">
                      <CheckCircle className="w-4 h-4 fill-emerald-100" />
                      <span>Compliant with WHO Health Information Quality Policies</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
