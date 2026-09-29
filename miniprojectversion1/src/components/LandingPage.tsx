import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, User, Heart, Key, Star, LogIn, ArrowRight, 
  Mail, Calendar, Eye, EyeOff, Stethoscope, Building2, 
  CheckCircle2, AlertCircle, Sparkles, UserPlus, FileBadge, 
  HeartPulse, Briefcase, Hash, Clock, Lock
} from 'lucide-react';
import { formatIndianPhoneNumber } from '../lib/phone';

interface LandingPageProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [isRegister, setIsRegister] = useState(false);

  // Login inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Common Registration fields (all roles)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1996-05-15');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState('Male');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Patient-specific registration fields
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [majorHealthIssue, setMajorHealthIssue] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');

  // Doctor-specific registration fields
  const [specialty, setSpecialty] = useState('Cardiology');
  const [licenseNumber, setLicenseNumber] = useState('REG-MC-904218');
  const [experienceYears, setExperienceYears] = useState('10');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('MedTech Multi-Specialty Hospital');
  const [degreeFile, setDegreeFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const [doctorSignupPending, setDoctorSignupPending] = useState(false);

  // Admin-specific registration fields
  const [staffId, setStaffId] = useState('ADM-8891');
  const [department, setDepartment] = useState('Hospital Administration & IT');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup' | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Auto calculate age whenever dateOfBirth changes
  useEffect(() => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (!isNaN(calculatedAge) && calculatedAge >= 0 && calculatedAge <= 120) {
        setAge(calculatedAge);
      }
    }
  }, [dateOfBirth]);

  useEffect(() => {
    if (!isRegister) {
      setIdentifier(demoAccounts[role].email);
      setPassword('');
      setOtpCode('');
      setOtpSent(false);
      setOtpVerified(false);
      setOtpPurpose(null);
    }
  }, [role, isRegister]);

  // Demo accounts data
  const demoAccounts = {
    patient: { 
      email: '2425013@saec.ac.in',
      phone: '',
      name: 'Harish K',
      age: 30,
      dob: '',
      blood: '',
      detail: 'Patient account'
    },
    doctor: { 
      email: '2425002@saec.ac.in',
      phone: '',
      name: 'Amarnath JS',
      age: 30,
      dob: '',
      specialty: 'Doctor',
      detail: 'Doctor account'
    },
    admin: { 
      email: '2425001@saec.ac.in',
      phone: '',
      name: 'Abishek R',
      age: 30,
      dob: '',
      dept: 'Administration',
      detail: 'Administrator account'
    }
  };

  const handleDemoLogin = (selectedRole: 'patient' | 'doctor' | 'admin') => {
    const demo = demoAccounts[selectedRole];
    setRole(selectedRole);
    setIsRegister(false);
    setIdentifier(demo.email);
    setPassword('');
    setError('');
    setSuccessMsg('Account email filled. Enter the password from your account details to sign in.');
  };

  const handleSendOtp = () => {
    if (!email.trim()) {
      setError('Please enter your email address before requesting the OTP.');
      return;
    }

    setOtpSending(true);
    setOtpVerified(false);
    setOtpPurpose('signup');
    setError('');
    setSuccessMsg('');

    fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to send OTP.');
        setOtpSent(true);
        setOtpPurpose('signup');
        setOtpCode('');
        setSuccessMsg('OTP sent to your email address. Please check your inbox.');
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setOtpSending(false);
      });
  };

  const handleVerifyOtp = () => {
    const otpEmail = otpPurpose === 'login' ? identifier.trim() : email.trim();
    if (!otpEmail || !otpCode.trim()) {
      setError('Enter the OTP sent to your email before verifying.');
      return;
    }

    setOtpVerifying(true);
    setError('');
    setSuccessMsg('');

    fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otpEmail, otp: otpCode })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'OTP verification failed.');
        if (data.purpose === 'login') {
          onLoginSuccess(data.token, data.user);
          return;
        }
        setOtpVerified(true);
        setSuccessMsg('OTP verified successfully. You can now complete registration.');
      })
      .catch(err => {
        setOtpVerified(false);
        setError(err.message);
      })
      .finally(() => {
        setOtpVerifying(false);
      });
  };

  const handleDegreeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setDegreeFile(null);
    if (!file) return;

    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!supportedTypes.includes(file.type)) {
      setError('Upload your degree as a PDF, JPG, or PNG file.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Degree file must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDegreeFile({ name: file.name, type: file.type, data: reader.result });
        setError('');
        setDoctorSignupPending(false);
      }
    };
    reader.onerror = () => setError('Could not read the selected degree file. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleRequestLoginOtp = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/auth/login/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), password, role })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send login code.');

      setOtpPurpose('login');
      setOtpSent(true);
      setOtpVerified(false);
      setOtpCode('');
      setSuccessMsg('A sign-in code was sent to your registered email. Enter it below to finish signing in.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send login code.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (isRegister) {
      if (!name.trim()) {
        setError('Please provide your full legal name.');
        setLoading(false);
        return;
      }
      if (!email.trim()) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      if (!otpSent || !otpVerified || !otpCode.trim() || otpPurpose !== 'signup') {
        setError('Please verify your email with the OTP sent to your inbox before registering.');
        setLoading(false);
        return;
      }
      if (role === 'doctor' && !degreeFile) {
        setError('Upload your degree certificate before submitting your doctor application.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password.');
        setLoading(false);
        return;
      }

      const payload = {
        name,
        email,
        password,
        phoneNumber: formatIndianPhoneNumber(phoneNumber),
        otp: otpCode,
        dateOfBirth,
        age,
        gender,
        role,
        // Role specifics
        bloodGroup: role === 'patient' ? bloodGroup : undefined,
        majorHealthIssue: role === 'patient' ? majorHealthIssue : undefined,
        emergencyContact: role === 'patient' ? formatIndianPhoneNumber(emergencyContact) : undefined,
        height: role === 'patient' ? height : undefined,
        weight: role === 'patient' ? weight : undefined,
        specialty: role === 'doctor' ? specialty : undefined,
        licenseNumber: role === 'doctor' ? licenseNumber : undefined,
        experienceYears: role === 'doctor' ? experienceYears : undefined,
        hospitalAffiliation: role === 'doctor' ? hospitalAffiliation : undefined,
        staffId: role === 'admin' ? staffId : undefined,
        department: role === 'admin' ? department : undefined,
        degreeFile: role === 'doctor' ? degreeFile : undefined,
      };

      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Registration failed');
          if (data.pendingApproval) {
            setDoctorSignupPending(true);
            setSuccessMsg('Your doctor account and degree file were submitted for admin verification. You can sign in after approval.');
            return;
          }
          setSuccessMsg('Account registered successfully! Logging you in...');
          setTimeout(() => {
            onLoginSuccess(data.token, data.user);
          }, 600);
        })
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (!identifier.trim()) {
        setError('Please enter your email address.');
        setLoading(false);
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        setLoading(false);
        return;
      }
      if (otpSent && otpPurpose === 'login') {
        setError('Enter the email code and select Verify Login Code to continue.');
        setLoading(false);
        return;
      }

      void handleRequestLoginOtp();
    }
  };

  const getRoleIcon = (r: 'patient' | 'doctor' | 'admin') => {
    switch (r) {
      case 'patient': return <User className="w-4 h-4" />;
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div id="landing-page" className="min-h-screen bg-slate-50 flex flex-col font-sans justify-between text-slate-800">
      
      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-brand font-extrabold text-lg tracking-tight text-slate-900">MedTech</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">CLINICAL SUITE</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Hospital & Telehealth Diagnostic Portal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Diagnostic Gateway Active</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center my-auto">
        
        {/* Unified Auth Card - Crisp Clean White Theme */}
        <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          
          {/* Top subtle blue accent banner */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>

          {/* Card Header with high-contrast text */}
          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              {isRegister ? (
                <>
                  <UserPlus className="w-6 h-6 text-blue-600" />
                  <span>Register Clinical Profile</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span>Secure Portal Authentication</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {isRegister 
                ? 'Create a verified health record with your contact details, vitals, and credentials.'
                : 'Select your role and authenticate with your registered credentials below.'}
            </p>
          </div>

          {/* Role Segmented Tabs (Patient, Doctor, Admin) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Select Access Role</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase">Role: {role}</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {(['patient', 'doctor', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setError('');
                    setOtpCode('');
                    setOtpSent(false);
                    setOtpVerified(false);
                    setOtpPurpose(null);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 capitalize ${
                    role === r 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {getRoleIcon(r)}
                  <span>{r === 'patient' ? 'Patient' : r === 'doctor' ? 'Doctor' : 'Admin'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            
            {/* LOGIN MODE CONTROLS */}
            {!isRegister && (
              <>
                {/* Primary Identifier Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Registered Email Address</span>
                  </label>

                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={e => {
                      setIdentifier(e.target.value);
                      setOtpCode('');
                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtpPurpose(null);
                    }}
                    placeholder={
                      role === 'patient' 
                        ? 'john@example.com' 
                        : role === 'doctor' 
                          ? 'sarah@medtech.com' 
                          : 'admin@medtech.com'
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      <span>Security Password</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setOtpCode('');
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtpPurpose(null);
                      }}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 pr-10 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {otpSent && otpPurpose === 'login' && (
                  <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                    <label htmlFor="login-otp" className="block text-xs font-bold text-slate-700">Email sign-in code</label>
                    <input
                      id="login-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={handleVerifyOtp} disabled={otpVerifying || otpCode.length !== 6} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                        {otpVerifying ? 'Verifying...' : 'Verify Login Code'}
                      </button>
                      <button type="button" onClick={handleRequestLoginOtp} disabled={loading} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-60">
                        Resend
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* REGISTRATION MODE CONTROLS */}
            {isRegister && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {role === 'doctor' ? 'Full Medical Doctor Name' : role === 'admin' ? 'Staff Full Name' : 'Patient Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={role === 'doctor' ? 'Dr. Elizabeth Blackwell' : role === 'admin' ? 'Marcus Vance' : 'Jane Doe'}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span>Official Email</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        setOtpCode('');
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtpPurpose(null);
                      }}
                      placeholder="user@medtech.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending || !email.trim()}
                      className="whitespace-nowrap px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {otpSending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">OTP Verification Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || !otpCode.trim()}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-[10px] font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {otpVerifying ? 'Verifying OTP...' : otpVerified ? 'OTP Verified' : 'Verify OTP'}
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <Hash className="w-3 h-3 text-blue-600" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                {/* Date of Birth, Calculated Age, and Gender */}
                <div className="grid grid-cols-12 gap-2.5">
                  <div className="col-span-5 space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span>Date of Birth</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>Age</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={age}
                      onChange={e => setAge(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs text-center text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                  </div>

                  <div className="col-span-4 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Gender</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* ROLE SPECIFIC DETAILS */}
                
                {/* 1. Patient Specific Details */}
                {role === 'patient' && (
                  <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-2.5 text-left">
                    <div className="flex items-center space-x-1.5 text-blue-800 text-xs font-bold">
                      <HeartPulse className="w-4 h-4 text-blue-600" />
                      <span>Patient Clinical Vitals & Emergency Contacts</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Blood Group</label>
                        <select
                          value={bloodGroup}
                          onChange={e => setBloodGroup(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-rose-700"
                        >
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Height (cm)</label>
                        <input
                          type="number"
                          value={height}
                          onChange={e => setHeight(e.target.value)}
                          placeholder="175"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-center"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Weight (kg)</label>
                        <input
                          type="number"
                          value={weight}
                          onChange={e => setWeight(e.target.value)}
                          placeholder="70"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Major Health Issue (optional)</label>
                      <input
                        type="text"
                        value={majorHealthIssue}
                        onChange={e => setMajorHealthIssue(e.target.value)}
                        placeholder="e.g. Asthma, Diabetes, Hypertension"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Emergency Phone Number (optional)</label>
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={e => setEmergencyContact(e.target.value)}
                        placeholder="e.g. +91 98765 43210 (Family/Guardian)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Doctor Specific Details */}
                {role === 'doctor' && (
                  <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-2.5 text-left">
                    <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      <span>Doctor Credentials & Medical License</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Specialty</label>
                        <select
                          value={specialty}
                          onChange={e => setSpecialty(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                        >
                          <option value="Cardiology">Cardiology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="General Medicine">General Medicine</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Diagnostic Medicine">Diagnostic Medicine</option>
                          <option value="Oncology">Oncology</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Medical License / Reg No</label>
                        <input
                          type="text"
                          required
                          value={licenseNumber}
                          onChange={e => setLicenseNumber(e.target.value)}
                          placeholder="e.g. REG-MC-904218"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Hospital Affiliation</label>
                        <input
                          type="text"
                          value={hospitalAffiliation}
                          onChange={e => setHospitalAffiliation(e.target.value)}
                          placeholder="MedTech Multi-Specialty Hospital"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                        />
                      </div>

                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Years Exp</label>
                        <input
                          type="number"
                          value={experienceYears}
                          onChange={e => setExperienceYears(e.target.value)}
                          placeholder="10"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="doctor-degree-file" className="text-[10px] font-bold text-slate-600">Degree certificate (required for admin verification)</label>
                      <input
                        id="doctor-degree-file"
                        type="file"
                        required={!degreeFile}
                        accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                        onChange={handleDegreeFileChange}
                        className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-2 text-xs text-slate-700 file:mr-2 file:rounded-md file:border-0 file:bg-emerald-50 file:px-2 file:py-1 file:text-xs file:font-bold file:text-emerald-800"
                      />
                      <p className="text-[10px] text-slate-500">PDF, JPG, or PNG, up to 5 MB. {degreeFile ? `Selected: ${degreeFile.name}` : 'Your account stays pending until an admin verifies this document.'}</p>
                    </div>
                  </div>
                )}

                {/* 3. Admin Specific Details */}
                {role === 'admin' && (
                  <div className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-2.5 text-left">
                    <div className="flex items-center space-x-1.5 text-purple-800 text-xs font-bold">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span>Hospital Staff Identity & Department</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Employee Staff ID</label>
                        <input
                          type="text"
                          required
                          value={staffId}
                          onChange={e => setStaffId(e.target.value)}
                          placeholder="e.g. ADM-8891"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Department</label>
                        <select
                          value={department}
                          onChange={e => setDepartment(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                        >
                          <option value="Hospital Administration & IT">Hospital Administration & IT</option>
                          <option value="Clinical Operations">Clinical Operations</option>
                          <option value="Medical Records & Registry">Medical Records & Registry</option>
                          <option value="Emergency & ICU Management">Emergency & ICU Management</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Create Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || doctorSignupPending || (!isRegister && otpSent && otpPurpose === 'login')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{doctorSignupPending ? 'Awaiting Admin Verification' : isRegister ? role === 'doctor' ? 'Submit Doctor Verification' : 'Complete Registration & Sign In' : otpSent && otpPurpose === 'login' ? 'Login code sent' : 'Send Login OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sandbox Credentials */}
          <div className="border-t border-slate-200 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <span>Account Quick Fill</span>
              <span className="text-blue-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Fill Role & Email
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {/* Patient Demo */}
              <button 
                type="button"
                onClick={() => handleDemoLogin('patient')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs text-slate-800 group-hover:text-blue-700 transition truncate">{demoAccounts.patient.name}</span>
                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                </div>
                <div className="mt-1 space-y-0.5 text-[9.5px]">
                  <p className="text-slate-700 font-bold">Age {demoAccounts.patient.age} • {demoAccounts.patient.blood}</p>
                  <p className="text-slate-500 truncate">{demoAccounts.patient.phone}</p>
                </div>
                <span className="mt-2 text-[9px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200 text-center">
                  PATIENT ACCESS
                </span>
              </button>

              {/* Doctor Demo */}
              <button 
                type="button"
                onClick={() => handleDemoLogin('doctor')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs text-slate-800 group-hover:text-emerald-700 transition truncate">{demoAccounts.doctor.name}</span>
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="mt-1 space-y-0.5 text-[9.5px]">
                  <p className="text-slate-700 font-bold">{demoAccounts.doctor.specialty}</p>
                  <p className="text-slate-500 truncate">{demoAccounts.doctor.phone}</p>
                </div>
                <span className="mt-2 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200 text-center">
                  DOCTOR ACCESS
                </span>
              </button>

              {/* Admin Demo */}
              <button 
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left transition flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs text-slate-800 group-hover:text-purple-700 transition truncate">{demoAccounts.admin.name}</span>
                  <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                </div>
                <div className="mt-1 space-y-0.5 text-[9.5px]">
                  <p className="text-slate-700 font-bold">{demoAccounts.admin.dept}</p>
                  <p className="text-slate-500 truncate">{demoAccounts.admin.phone}</p>
                </div>
                <span className="mt-2 text-[9px] font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded border border-purple-200 text-center">
                  ADMIN ACCESS
                </span>
              </button>
            </div>
          </div>

          {/* Toggle between Login and Register */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-center text-xs text-slate-600 font-medium">
            <span>{isRegister ? 'Already have an existing profile?' : 'Need to register a new account?'}</span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccessMsg('');
                setOtpCode('');
                setOtpSent(false);
                setOtpVerified(false);
                setOtpPurpose(null);
                setDegreeFile(null);
                setDoctorSignupPending(false);
              }}
              className="ml-1.5 text-blue-600 font-bold hover:text-blue-800 hover:underline"
            >
              {isRegister ? 'Log in here' : 'Create profile'}
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-slate-500 text-[11px]">
        <p>© 2026 MedTech Inc. All Rights Reserved. HIPAA compliant, fully sandboxed AI clinical environment.</p>
      </footer>
      
    </div>
  );
}
