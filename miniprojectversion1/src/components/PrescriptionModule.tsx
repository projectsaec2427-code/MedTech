import React, { useState } from 'react';
import { Plus, Trash2, Printer, FileText, CheckCircle, Download } from 'lucide-react';
import { Prescription } from '../types';
import { generatePrescriptionPDF } from '../lib/pdfGenerator';

interface PrescriptionModuleProps {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId: string;
  onSuccess: () => void;
}

export default function PrescriptionModule({
  patientId, patientName, doctorId, doctorName, appointmentId, onSuccess
}: PrescriptionModuleProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [labTests, setLabTests] = useState('');
  const [followUpDate, setFollowUpDate] = useState('After 7 Days (or SOS)');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; duration: string; instructions: string }>>([
    { name: '', dosage: '1-0-1', duration: '7 days', instructions: 'After meals' }
  ]);
  const [loading, setLoading] = useState(false);
  const [createdRx, setCreatedRx] = useState<Prescription | null>(null);

  const handleAddRow = () => {
    setMedicines(prev => [...prev, { name: '', dosage: '1-0-1', duration: '7 days', instructions: 'After meals' }]);
  };

  const handleRemoveRow = (idx: number) => {
    setMedicines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx: number, field: string, val: string) => {
    setMedicines(prev => prev.map((med, i) => {
      if (i === idx) {
        return { ...med, [field]: val };
      }
      return med;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert('Please fill out the diagnostic evaluation.');
      return;
    }
    if (medicines.some(m => !m.name.trim())) {
      alert('Please fill out the name for all prescribed medicines.');
      return;
    }

    setLoading(true);
    const payload = {
      appointmentId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      date,
      diagnosis,
      symptoms: symptoms.trim() || undefined,
      labTestsAdvised: labTests.trim() || undefined,
      nextFollowUpDate: followUpDate.trim() || undefined,
      medicines,
      notes
    };

    fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setCreatedRx(data);
        // Change status of appointment to completed
        fetch(`/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        }).then(() => {
          onSuccess();
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleDownloadPDF = () => {
    if (!createdRx) return;
    generatePrescriptionPDF({
      rxId: createdRx.id,
      clinicName: 'MedTech Multi-Specialty Hospital & Telehealth Center',
      clinicAddress: '42 Medical Park Blvd, Suite 400, NY 10001',
      clinicContact: 'Tel: +91 44 2829 3333 | rx@medtech-health.org',
      doctorName: createdRx.doctorName,
      doctorSpecialty: 'Specialist Physician & Clinical Consultant',
      doctorRegNo: 'REG-MC-904218',
      patientName: createdRx.patientName,
      patientId: patientId,
      patientAge: 34,
      patientGender: 'Male',
      patientBlood: 'O+',
      patientWeight: '72 kg',
      patientBP: '120/80 mmHg',
      date: createdRx.date || date,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      symptoms: symptoms.trim() || undefined,
      diagnosis: createdRx.diagnosis,
      vitals: 'BP: 120/80 mmHg | Pulse: 74 bpm | SpO2: 98%',
      labTestsAdvised: labTests.trim() || undefined,
      nextFollowUpDate: followUpDate.trim() || undefined,
      medicines: createdRx.medicines,
      notes: createdRx.notes
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5 text-left">
      <div className="flex items-center space-x-2">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="font-extrabold text-slate-800 text-sm">Write Digital Clinical Rx</h3>
      </div>

      {!createdRx ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Prescription Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Next Follow-Up / Review</label>
              <input
                type="text"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                placeholder="After 7 Days (or SOS)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Symptoms & Clinical Complaints</label>
              <input
                type="text"
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="e.g. Fever, persistent cough, fatigue"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Patient Diagnostic Findings</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Mild Hypertension, Chronic Bronchitis review, etc."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Lab Tests Advised (Optional)</label>
            <input
              type="text"
              value={labTests}
              onChange={e => setLabTests(e.target.value)}
              placeholder="e.g. CBC, Serum Creatinine, Chest X-Ray"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">Prescribed Dosage Schedule</span>
              <button
                type="button"
                onClick={handleAddRow}
                className="py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10.5px] font-bold flex items-center space-x-1 border border-blue-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/40">
              {medicines.map((med, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      required
                      placeholder="Medicine Name & strength"
                      value={med.name}
                      onChange={e => handleMedChange(idx, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1-0-1"
                      value={med.dosage}
                      onChange={e => handleMedChange(idx, 'dosage', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="7 days"
                      value={med.duration}
                      onChange={e => handleMedChange(idx, 'duration', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="After meals"
                      value={med.instructions}
                      onChange={e => handleMedChange(idx, 'instructions', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Clinical Directives & Diet Advice</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Monitor blood pressure daily; limit sodium intake, etc."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none h-16"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            {loading ? 'Submitting Rx...' : 'Digitally Sign & Complete Appointment'}
          </button>
        </form>
      ) : (
        <div className="space-y-4 p-4 border border-emerald-100 bg-emerald-50/20 rounded-2xl">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-100" />
            <span>Prescription Digitally Emitted & Signed!</span>
          </div>

          <p className="text-xs text-slate-600">
            The Rx record has been synchronized back to the patient profile history logs. You can download the official clinical PDF or print it directly.
          </p>

          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Rx PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
