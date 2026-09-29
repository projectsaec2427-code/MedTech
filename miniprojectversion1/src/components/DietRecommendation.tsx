import React, { useState } from 'react';
import { Apple, Utensils, Droplet, Dumbbell, Sparkles, RefreshCw, Download } from 'lucide-react';
import { generateAICareReportPDF } from '../lib/pdfGenerator';

interface DietRecommendationProps {
  medicalHistory: string[];
  patientName: string;
  patientAge?: number;
  patientGender?: string;
}

export default function DietRecommendation({ medicalHistory, patientName, patientAge, patientGender }: DietRecommendationProps) {
  const [goals, setGoals] = useState('Build stamina & lose body fat');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{
    breakfast: string;
    lunch: string;
    dinner: string;
    fruits: string;
    waterIntake: string;
    exercisePlan: string;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setPlan(null);

    try {
      const res = await fetch('/api/ai/diet-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: patientAge,
          gender: patientGender,
          medicalHistory,
          goals
        })
      });

      if (!res.ok) throw new Error('Diet plan failed');
      const data = await res.json();
      setPlan(data);
    } catch (e) {
      console.error(e);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <Apple className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm font-sans">AI Diet & Exercise Recommendations</h3>
            <p className="text-xs text-slate-500">Personalized nutritionist schedules adapted to medical conditions.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center space-x-1"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-orange-200 fill-orange-200" />
              <span>Build Plan</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Primary Health & Fitness Focus</label>
          <input
            type="text"
            value={goals}
            onChange={e => setGoals(e.target.value)}
            placeholder="e.g. build muscle, manage hypertension, low-glycemic, etc."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Display generated plan */}
        {plan ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2 animate-in fade-in duration-200">
            <div className="p-4 bg-orange-50/40 border border-orange-100/60 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-800">
                <Utensils className="w-4 h-4 text-orange-600" />
                <span>Breakfast Plan</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{plan.breakfast}</p>
            </div>

            <div className="p-4 bg-orange-50/40 border border-orange-100/60 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-800">
                <Utensils className="w-4 h-4 text-orange-600" />
                <span>Lunch Plan</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{plan.lunch}</p>
            </div>

            <div className="p-4 bg-orange-50/40 border border-orange-100/60 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-800">
                <Utensils className="w-4 h-4 text-orange-600" />
                <span>Dinner Plan</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{plan.dinner}</p>
            </div>

            <div className="p-4 bg-indigo-50/40 border border-indigo-100/60 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-800">
                <Apple className="w-4 h-4 text-indigo-600" />
                <span>Fruits & Snacks</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{plan.fruits}</p>
            </div>

            <div className="p-4 bg-teal-50/40 border border-teal-100/60 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-800">
                <Droplet className="w-4 h-4 text-teal-600" />
                <span>Target Hydration</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{plan.waterIntake}</p>
            </div>

            <div className="p-4 bg-amber-50/40 border border-amber-100/60 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
                <Dumbbell className="w-4 h-4 text-amber-600" />
                <span>Recommended Fitness</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{plan.exercisePlan}</p>
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  generateAICareReportPDF({
                    title: 'AI Diet, Nutrition & Fitness Chart',
                    patientName,
                    summary: `Personalized Nutrition Plan for: ${goals}.\nHydration Goal: ${plan.waterIntake}\nFitness Protocol: ${plan.exercisePlan}`,
                    recommendations: [
                      `Breakfast: ${plan.breakfast}`,
                      `Lunch: ${plan.lunch}`,
                      `Dinner: ${plan.dinner}`,
                      `Fruits & Snacks: ${plan.fruits}`,
                      `Hydration: ${plan.waterIntake}`,
                      `Exercise Plan: ${plan.exercisePlan}`
                    ]
                  });
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Diet & Nutrition Care PDF</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <Utensils className="w-8 h-8 stroke-1 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500">Click &apos;Build Plan&apos; to formulate customized daily meals and fitness outlines based on your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
