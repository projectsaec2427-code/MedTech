import React, { useState } from 'react';
import { Activity, Thermometer, Brain, ShieldAlert, HeartHandshake, Eye, Star, Download, Pill } from 'lucide-react';
import { PrescribedMedicine } from '../types';
import MedicinePdfCard from './MedicinePdfCard';
import { generateAICareReportPDF } from '../lib/pdfGenerator';

interface DiseasePredictorProps {
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientBlood?: string;
}

export default function DiseasePredictor({ patientName, patientAge, patientGender, patientBlood }: DiseasePredictorProps) {
  const [symptomsText, setSymptomsText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [age, setAge] = useState(String(patientAge ?? 32));
  const [gender, setGender] = useState(patientGender || 'Male');
  const [loading, setLoading] = useState(false);
  
  const [result, setResult] = useState<{
    possibleDisease: string;
    riskPercentage: number;
    preventiveMeasures: string[];
    recommendedDoctor: string;
    medicines?: PrescribedMedicine[];
    isMock?: boolean;
  } | null>(null);

  const presetSymptoms = [
    'Frequent Urination & Increased Thirst',
    'Chronic dry cough & Shortness of breath',
    'Irregular chest pain & Heart palpitations',
    'Yellowish skin color & Dark urine',
    'Itchy skin rashes & dry eczema scales',
    'Fatigue, joint pain, & general muscle stiffness'
  ];

  const handleToggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(prev => prev.filter(s => s !== sym));
    } else {
      setSelectedSymptoms(prev => [...prev, sym]);
    }
  };

  const handlePredict = async () => {
    const combinedSymptoms = [
      ...selectedSymptoms,
      ...(symptomsText ? [symptomsText] : [])
    ].join(', ');

    if (!combinedSymptoms) {
      alert('Please specify at least one symptom for risk assessment.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/predict-disease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: combinedSymptoms,
          age,
          gender
        })
      });

      if (!res.ok) throw new Error('Prediction API failed');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      alert('Symptom assessment failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">AI-Powered Disease Risk Assessment</h3>
          <p className="text-xs text-slate-500">Assess potential conditions and risk factors using symptom evaluation parameters.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Symptoms Form Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 block">Select Common Symptoms</span>
            <div className="flex flex-wrap gap-2">
              {presetSymptoms.map(sym => {
                const isActive = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handleToggleSymptom(sym)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      isActive 
                        ? 'bg-teal-50 text-teal-700 border-teal-200' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Other Symptoms or Notes</label>
            <textarea
              value={symptomsText}
              onChange={e => setSymptomsText(e.target.value)}
              placeholder="Describe what you feel (e.g. sharp headache, knee swelling...)"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Profile Age</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handlePredict}
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition"
          >
            {loading ? 'Evaluating Symptoms...' : 'Analyze Symptoms & Predict Risks'}
          </button>
        </div>

        {/* Symptoms Assessment Results Panel */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-5 flex flex-col justify-center min-h-[300px]">
          {loading && (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500">Correlating symptoms against clinical knowledge bases...</p>
            </div>
          )}

          {!loading && !result && (
            <div className="text-center py-8 space-y-2 text-slate-400">
              <Brain className="w-12 h-12 stroke-1.25 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No active risk assessment</p>
              <p className="text-[11px] max-w-xs mx-auto">Select symptoms or add clinical notes on the left, then click Assess to calculate potential risk factors.</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    Suspected Condition
                  </span>
                  <h4 className="font-bold text-slate-800 text-base mt-1">{result.possibleDisease}</h4>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Calculated Risk
                  </span>
                  <div className="flex items-center space-x-1 justify-end mt-1">
                    <span className={`text-xl font-black ${
                      result.riskPercentage > 40 ? 'text-rose-600' : result.riskPercentage > 25 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {result.riskPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphical meter */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.riskPercentage > 40 ? 'bg-rose-500' : result.riskPercentage > 25 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${result.riskPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Low Risk</span>
                  <span>Moderate Risk</span>
                  <span>Elevated Warning</span>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-3.5 bg-white border border-slate-100 rounded-xl space-y-1.5 shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  <span>Clinical Follow-Up Recommendation</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Recommended Specialist Consultation: <strong className="text-indigo-600">{result.recommendedDoctor}</strong>
                </p>
              </div>

              {/* Preventive Measures */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">Immediate Preventative Actions</span>
                <ul className="space-y-1">
                  {result.preventiveMeasures.map((measure, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 mr-2 shrink-0"></span>
                      <span>{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prescribed/Suggested Medicines & PDF Card */}
              {result.medicines && result.medicines.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-700 block">Suggested Clinical & First-Aid Medicines</span>
                  <MedicinePdfCard
                    type="ai"
                    patientName={patientName}
                    patientAge={patientAge}
                    patientGender={patientGender}
                    patientBlood={patientBlood}
                    diagnosis={result.possibleDisease}
                    medicines={result.medicines}
                    notes={`Preventative measures: ${result.preventiveMeasures.join(', ')}`}
                  />
                </div>
              )}

              {/* Download AI Care Report PDF */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    generateAICareReportPDF({
                      title: 'AI Diagnostic Risk & Care Protocol',
                      patientName,
                      summary: `Suspected Condition: ${result.possibleDisease} (Estimated Risk: ${result.riskPercentage}%).\nRecommended Clinical Specialist: ${result.recommendedDoctor}`,
                      recommendations: result.preventiveMeasures,
                      medicines: result.medicines
                    });
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download AI Care Assessment PDF</span>
                </button>
              </div>

              {result.isMock && (
                <div className="text-[10px] text-slate-400 italic text-center pt-2">
                  Demo assessment is calculated locally. Add Gemini API Key for dynamic clinical assessment.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
