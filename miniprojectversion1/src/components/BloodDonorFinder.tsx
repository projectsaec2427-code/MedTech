import React, { useState, useEffect } from 'react';
import { Search, Heart, UserCheck, Phone, CheckCircle, MapPin } from 'lucide-react';
import { BloodDonor } from '../types';
import { formatIndianPhoneNumber, toIndianTelHref } from '../lib/phone';

export default function BloodDonorFinder() {
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [bloodGroup, setBloodGroup] = useState('All');
  const [city, setCity] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<BloodDonor | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'register'>('search');
  
  // Registration Form
  const [regName, setRegName] = useState('');
  const [regBlood, setRegBlood] = useState('O+');
  const [regCity, setRegCity] = useState('');
  const [regHospital, setRegHospital] = useState('');
  const [regContact, setRegContact] = useState('');
  const [showRegSuccess, setShowRegSuccess] = useState(false);

  const fetchDonors = () => {
    let url = '/api/donors';
    const params: string[] = [];
    if (bloodGroup !== 'All') params.push(`bloodGroup=${encodeURIComponent(bloodGroup)}`);
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const validated = Array.isArray(data) ? data : [];
        setDonors(validated);
        if (validated.length > 0 && !selectedDonor) {
          setSelectedDonor(validated[0]);
        }
      })
      .catch(err => {
        console.error(err);
        setDonors([]);
      });
  };

  useEffect(() => {
    fetchDonors();
  }, [bloodGroup, city]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    fetch('/api/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName,
        bloodGroup: regBlood,
        city: regCity,
        hospital: regHospital,
        contactNumber: formatIndianPhoneNumber(regContact)
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Registration failed');
        return res.json();
      })
      .then((newDonor) => {
        setShowRegSuccess(true);
        setRegName('');
        setRegCity('');
        setRegHospital('');
        setRegContact('');
        setSelectedDonor(newDonor);
        fetchDonors(); // reload list
        setTimeout(() => setShowRegSuccess(false), 4000);
      })
      .catch(err => alert(err.message));
  };

  return (
    <div id="blood-donor-finder" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
      
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm font-sans">Blood Donor Finder & Live Map</h3>
          <p className="text-xs text-slate-500">Search active matching donors in your city or register to save lives.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Control Column (Col 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Subtabs for Search vs Register */}
          <div className="flex border border-slate-100 bg-slate-50/50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubTab('search')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeSubTab === 'search'
                  ? 'bg-white text-red-600 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Search Active Donors ({donors.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('register')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeSubTab === 'register'
                  ? 'bg-white text-red-600 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register as Donor
            </button>
          </div>

          {activeSubTab === 'search' ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Filters */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="All">All Groups</option>
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
                  <label className="text-[10px] font-bold uppercase text-slate-500">Search City</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. San Francisco"
                      className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 flex-1">
                {donors.map((donor) => {
                  const isSelected = selectedDonor?.id === donor.id;
                  return (
                    <div 
                      key={donor.id}
                      onClick={() => setSelectedDonor(donor)}
                      className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-red-50/50 border-red-200 shadow-sm' 
                          : 'bg-white hover:bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-800 text-xs">{donor.name}</h4>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold border border-red-150">
                              {donor.bloodGroup}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <p className="flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" /> {donor.city}</p>
                            <p className="text-[10px] text-slate-400 ml-4">Ref: {donor.hospital}</p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className={`text-[9.5px] font-bold ${donor.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {donor.available ? '● Available' : '● Engaged'}
                          </span>
                          <a
                            href={`tel:${toIndianTelHref(donor.contactNumber)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center space-x-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded shadow-sm transition"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>Contact</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {donors.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No matching blood donors found.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Registration Form
            <div className="bg-slate-50/30 rounded-xl border border-slate-100 p-4 space-y-3 flex-1">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs flex items-center">
                  <UserCheck className="w-4 h-4 mr-1.5 text-red-500" />
                  Become a Donor
                </h4>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">List yourself to help patients find you quickly in high-priority critical cases.</p>
              </div>

              {showRegSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-1 animate-in fade-in duration-200">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Registered successfully! You are now live on the GPS map.</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">Blood Group</label>
                    <select
                      value={regBlood}
                      onChange={e => setRegBlood(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option>O+</option>
                      <option>O-</option>
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">City</label>
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={e => setRegCity(e.target.value)}
                      placeholder="e.g. San Francisco"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Preferred Hospital Reference</label>
                  <input
                    type="text"
                    required
                    value={regHospital}
                    onChange={e => setRegHospital(e.target.value)}
                    placeholder="e.g. Presidio Family Clinic"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Contact Telephone</label>
                  <input
                    type="tel"
                    required
                    value={regContact}
                    onChange={e => setRegContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Confirm Donor Listing
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Map Column (Col 7) */}
        <div className="lg:col-span-7 h-[380px] bg-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden relative">
          
          {/* Mock Interactive Map Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-50/40 via-slate-100 to-amber-50/20 flex items-center justify-center opacity-90">
            {/* Minimal SVG Grid & Road Representation for Maps Grounding Theme */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-donors" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fca5a5" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-donors)" />
              {/* Simulated streets */}
              <line x1="0" y1="160" x2="600" y2="160" stroke="#fff" strokeWidth="18" />
              <line x1="220" y1="0" x2="220" y2="400" stroke="#fff" strokeWidth="16" />
              <line x1="0" y1="260" x2="600" y2="260" stroke="#fff" strokeWidth="16" />
              <line x1="460" y1="0" x2="460" y2="400" stroke="#fff" strokeWidth="12" />
            </svg>

            {/* Render Donor pins */}
            {donors.map((d, index) => {
              // Deterministic placement on the grid
              const lefts = ['28%', '65%', '42%', '75%', '30%', '52%', '78%'];
              const tops = ['38%', '25%', '68%', '75%', '52%', '45%', '58%'];
              const isSelected = selectedDonor?.id === d.id;

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDonor(d)}
                  className="absolute cursor-pointer group transition-all duration-300"
                  style={{ 
                    left: lefts[index % lefts.length], 
                    top: tops[index % tops.length] 
                  }}
                >
                  <div className={`relative flex items-center justify-center p-2 rounded-full shadow-md transition-all ${
                    isSelected ? 'bg-red-600 text-white scale-110 z-20 ring-4 ring-red-100' : 'bg-white hover:bg-red-50 text-red-500 scale-100 z-10'
                  }`}>
                    <Heart className="w-4 h-4 fill-current stroke-current" />
                    
                    {/* Small tag indicator on hover */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      {d.name} ({d.bloodGroup})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Card Overlay at bottom */}
          {selectedDonor ? (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl p-3.5 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200 z-10">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    GPS Selected Donor
                  </span>
                  <span className="text-[10px] font-bold text-slate-800">{selectedDonor.bloodGroup}</span>
                  <span className={`text-[10px] ${selectedDonor.available ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    • {selectedDonor.available ? 'Available' : 'Engaged'}
                  </span>
                </div>
                <h5 className="font-extrabold text-slate-800 text-xs tracking-tight">{selectedDonor.name}</h5>
                <p className="text-[10.5px] text-slate-500 max-w-sm">City: {selectedDonor.city} • Ref: {selectedDonor.hospital}</p>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${toIndianTelHref(selectedDonor.contactNumber)}`}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-[10.5px] rounded-lg shadow-sm transition flex items-center space-x-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {formatIndianPhoneNumber(selectedDonor.contactNumber)}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm border border-slate-100/50 rounded-xl p-3 shadow text-center z-10 pointer-events-none">
              <p className="text-[11px] font-medium text-slate-500">Select an active blood donor from the list or map to view GPS details and contact reference.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
