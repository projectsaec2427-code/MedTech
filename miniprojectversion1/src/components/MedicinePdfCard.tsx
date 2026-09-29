import React, { useState } from 'react';
import { FileText, Download, Printer, Plus, Check, Pill, ShieldCheck, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { PrescribedMedicine } from '../types';
import { generatePrescriptionPDF, generateAICareReportPDF } from '../lib/pdfGenerator';

interface MedicinePdfCardProps {
  type?: 'doctor' | 'ai';
  title?: string;
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
  patientPhone?: string;
  date?: string;
  time?: string;
  symptoms?: string;
  diagnosis?: string;
  vitals?: string;
  labTestsAdvised?: string;
  nextFollowUpDate?: string;
  medicines: PrescribedMedicine[];
  notes?: string;
  preventiveMeasures?: string[];
  onAddToReminders?: (medicines: PrescribedMedicine[]) => void;
  compact?: boolean;
}

export default function MedicinePdfCard({
  type = 'doctor',
  title,
  rxId,
  clinicName,
  clinicAddress,
  clinicContact,
  diagnosis,
  doctorName = 'Dr. Sarah Connor, MD',
  doctorSpecialty = 'Senior Specialist Physician',
  doctorRegNo = 'GMC-894210 (Verified)',
  patientName = 'Patient',
  patientId,
  patientAge = 34,
  patientGender = 'Male',
  patientBlood = 'O+',
  patientWeight,
  patientBP,
  patientPhone,
  date,
  time,
  symptoms,
  vitals,
  labTestsAdvised,
  nextFollowUpDate,
  medicines = [],
  notes,
  preventiveMeasures = [],
  onAddToReminders,
  compact = false
}: MedicinePdfCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [addedReminders, setAddedReminders] = useState(false);

  const isDoctor = type === 'doctor';
  const displayDate = date || new Date().toISOString().split('T')[0];
  const displayTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      if (isDoctor) {
        generatePrescriptionPDF({
          rxId,
          clinicName,
          clinicAddress,
          clinicContact,
          doctorName,
          doctorSpecialty,
          doctorRegNo,
          patientName,
          patientId,
          patientAge,
          patientGender,
          patientBlood,
          patientWeight,
          patientBP,
          patientPhone,
          date: displayDate,
          time: displayTime,
          symptoms,
          diagnosis: diagnosis || title || 'Prescribed Clinical Treatment',
          vitals,
          labTestsAdvised,
          nextFollowUpDate,
          medicines,
          notes
        });
      } else {
        generateAICareReportPDF({
          title: title || 'MedTech AI Health & Medication Advisory',
          patientName,
          conditionOrGoal: diagnosis || 'Clinical Health Assessment',
          summary: notes || 'Care guidelines and recommended over-the-counter / supportive medications.',
          medicines,
          preventiveMeasures,
          date: displayDate
        });
      }
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRemindersClick = () => {
    if (onAddToReminders && medicines.length > 0) {
      onAddToReminders(medicines);
      setAddedReminders(true);
      setTimeout(() => setAddedReminders(false), 3000);
    }
  };

  if (!medicines || medicines.length === 0) return null;

  return (
    <div className={`rounded-2xl border transition-all text-left overflow-hidden shadow-sm my-2.5 ${
      isDoctor 
        ? 'bg-blue-50/40 border-blue-200/80' 
        : 'bg-indigo-50/40 border-indigo-200/80'
    } ${compact ? 'p-3.5' : 'p-4.5'}`}>
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-2.5 mb-3 border-slate-200/70">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-xs ${
            isDoctor ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
            {isDoctor ? <Pill className="w-4.5 h-4.5" /> : <Sparkles className="w-4 h-4 fill-indigo-200" />}
          </div>
          <div>
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="font-bold text-xs text-slate-900 tracking-tight">
                {isDoctor ? 'Official Clinical Prescription (Rx)' : 'AI Recommended Medication Schedule'}
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                isDoctor ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {isDoctor ? 'Verified Rx' : 'AI Copilot'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {isDoctor ? `Dr. ${doctorName}` : `Clinical advisory for ${patientName}`} • <span className="font-semibold text-slate-700">{displayDate}</span> {displayTime && `(${displayTime})`}
            </p>
          </div>
        </div>

        {/* Quick actions in header */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            title="Download Prescription PDF"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs ${
              isDoctor
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Patient Particulars & Date Strip */}
      <div className="mb-2.5 px-3 py-2 bg-white/90 rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
        <div>
          <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Patient</span>
          <span className="font-bold text-slate-800">{patientName}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Age / Gender / Blood</span>
          <span className="font-semibold text-slate-700">{patientAge} yrs • {patientGender} • {patientBlood || 'O+'}</span>
        </div>
        {patientBP && (
          <div>
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Blood Pressure</span>
            <span className="font-semibold text-slate-700">{patientBP}</span>
          </div>
        )}
        {patientWeight && (
          <div>
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Weight</span>
            <span className="font-semibold text-slate-700">{patientWeight}</span>
          </div>
        )}
      </div>

      {/* Diagnosis or Title Badge */}
      {(diagnosis || title) && (
        <div className="mb-2.5 px-3 py-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs flex-wrap gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {isDoctor ? 'Clinical Diagnosis:' : 'Indication / Condition:'}
          </span>
          <span className="font-bold text-blue-900">{diagnosis || title}</span>
        </div>
      )}

      {/* Symptoms if present */}
      {symptoms && (
        <div className="mb-2.5 px-3 py-1.5 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-950">
          <span className="font-bold mr-1">Chief Complaints / Symptoms:</span>
          <span>{symptoms}</span>
        </div>
      )}

      {/* Medicines Table / List */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
          <span>Prescribed Medications & Schedule ({medicines.length})</span>
          <span className="text-slate-400 font-normal">Dosage: Morning - Noon - Night</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 shadow-xs">
          {medicines.map((med, index) => (
            <div key={index} className="p-2.5 flex items-center justify-between hover:bg-slate-50/60 transition text-xs">
              <div className="space-y-0.5 max-w-[60%]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs truncate">{med.name}</span>
                </div>
                {med.instructions && (
                  <p className="text-[10.5px] text-slate-500 pl-5">
                    {med.instructions}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 text-right">
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-800 font-mono font-bold text-[10.5px] rounded border border-blue-100">
                    {med.dosage || '1-0-1'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                    {med.duration || '5 days'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lab tests advised if any */}
      {labTestsAdvised && (
        <div className="mt-2.5 p-2 bg-amber-50/70 rounded-xl border border-amber-200/60 text-amber-900 text-xs">
          <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5">Lab Tests Advised:</span>
          <p className="font-medium text-[11px]">{labTestsAdvised}</p>
        </div>
      )}

      {/* Directives & Notes */}
      {notes && (
        <div className="mt-2.5 p-2.5 bg-white/90 rounded-xl border border-slate-200/60 text-slate-700 text-xs leading-relaxed">
          <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider mb-0.5">
            Clinical Instructions & Dietary Advice:
          </span>
          <p className="italic text-slate-600 text-[11px]">{notes}</p>
        </div>
      )}

      {/* Follow-up review date if any */}
      {nextFollowUpDate && (
        <div className="mt-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center justify-between">
          <span>Next Follow-up / Review Date:</span>
          <span className="font-bold">{nextFollowUpDate} (or SOS)</span>
        </div>
      )}

      {/* Footer Interactive Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Electronically Certified Clinical Document</span>
        </div>

        <div className="flex items-center space-x-2">
          {onAddToReminders && (
            <button
              type="button"
              onClick={handleRemindersClick}
              disabled={addedReminders}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition flex items-center space-x-1 shadow-xs"
            >
              {addedReminders ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Added to Reminders!</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>+ Add to Reminders</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200 transition flex items-center space-x-1 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

    </div>
  );
}
