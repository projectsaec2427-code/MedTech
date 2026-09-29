import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Hospital } from '../types';
import { formatIndianPhoneNumber } from '../lib/phone';

export default function NearbyHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    fetch('/api/hospitals')
      .then(res => res.json())
      .then(data => {
        const validated = Array.isArray(data) ? data : [];
        setHospitals(validated);
        if (validated.length > 0) setSelectedHospital(validated[0]);
      })
      .catch(err => {
        console.error(err);
        setHospitals([]);
      });
  }, []);

  const filtered = (hospitals || []).filter(h => filterType === 'All' || h.type === filterType);

  const directionsUrl = selectedHospital
    ? `https://www.google.com/maps/dir/?${new URLSearchParams({
        api: '1',
        destination: `${selectedHospital.lat},${selectedHospital.lng}`,
        travelmode: 'driving'
      }).toString()}`
    : undefined;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Nearby Hospitals & Care Facilities</h3>
            <p className="text-xs text-slate-500">Locate pharmacies, urgent care clinics, and medical centers.</p>
          </div>
        </div>

        {/* Rapid filter */}
        <div className="flex items-center space-x-1">
          {['All', 'Hospital', 'Clinic', 'Pharmacy'].map(t => (
            <button
              key={t}
              onClick={() => {
                setFilterType(t);
                const nextSelection = hospitals.find(hospital => t === 'All' || hospital.type === t);
                setSelectedHospital(nextSelection || null);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition ${
                filterType === t 
                  ? 'bg-rose-50 border-rose-200 text-rose-700' 
                  : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Split layout: Hospital List & Visual Map Grid */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* List (Col 5) */}
        <div className="md:col-span-5 space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {filtered.map(h => (
            <div
              key={h.id}
              onClick={() => setSelectedHospital(h)}
              className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                selectedHospital?.id === h.id 
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                  : 'bg-white hover:bg-slate-50/50 border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  h.type === 'Hospital' ? 'bg-rose-50 text-rose-700' : h.type === 'Pharmacy' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {h.type}
                </span>
                <span className="text-[10.5px] font-semibold text-slate-500 font-mono">{h.distance}</span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm mt-1">{h.name}</h4>
              <p className="text-[11.5px] text-slate-500 flex items-start mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0 mt-0.5" />
                <span>{h.address}</span>
              </p>
              <p className="text-[11.5px] text-slate-500 flex items-center mt-1">
                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <span>{formatIndianPhoneNumber(h.contact)}</span>
              </p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No matching healthcare facilities found.
            </div>
          )}
        </div>

        {/* Map visualization with custom GPS pins representation (Col 7) */}
        <div className="md:col-span-7 h-[380px] bg-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden relative">
          
          {selectedHospital && (
            <iframe
              title={`Google Map showing ${selectedHospital.name}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${selectedHospital.lat},${selectedHospital.lng}`)}&z=15&output=embed`}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          )}

          {/* Info Card Overlay at bottom */}
          {selectedHospital && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl p-4 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200 z-10">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    GPS Selected
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">lat: {selectedHospital.lat}, lng: {selectedHospital.lng}</span>
                </div>
                <h5 className="font-extrabold text-slate-800 text-xs tracking-tight">{selectedHospital.name}</h5>
                <p className="text-[10.5px] text-slate-500 max-w-sm">{selectedHospital.address}</p>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <a
                  href={directionsUrl}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10.5px] rounded-lg shadow-sm transition flex items-center space-x-1 disabled:cursor-wait disabled:opacity-70"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions from my location</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
