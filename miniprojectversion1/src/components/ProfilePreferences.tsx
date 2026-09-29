import React, { useEffect, useState } from 'react';
import { Moon, Save, Settings, Sun, X } from 'lucide-react';
import { User } from '../types';
import { formatIndianPhoneNumber } from '../lib/phone';

interface ProfilePreferencesProps {
  user: User;
  onUserUpdated: (user: User) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  showTrigger?: boolean;
}

type ThemeMode = 'light' | 'dark';

export default function ProfilePreferences({ user, onUserUpdated, isOpen, onOpen, onClose, showTrigger = true }: ProfilePreferencesProps) {
  const [draft, setDraft] = useState<User>(user);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(user);
  }, [user]);

  useEffect(() => {
    const storedTheme = localStorage.getItem(`medtech_theme_${user.id}`);
    const nextTheme: ThemeMode = storedTheme === 'dark' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, [user.id]);

  const updateText = (field: keyof User, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const changeTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    localStorage.setItem(`medtech_theme_${user.id}`, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          phoneNumber: formatIndianPhoneNumber(draft.phoneNumber),
          dateOfBirth: draft.dateOfBirth || '',
          age: draft.age,
          gender: draft.gender || '',
          bloodGroup: draft.bloodGroup || '',
          emergencyContact: formatIndianPhoneNumber(draft.emergencyContact),
          majorHealthIssue: draft.majorHealthIssue || '',
          specialty: draft.specialty || '',
          licenseNumber: draft.licenseNumber || '',
          hospitalAffiliation: draft.hospitalAffiliation || '',
          department: draft.department || ''
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save profile changes.');

      onUserUpdated(result as User);
      setDraft(result as User);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelClass = 'mb-1 block text-xs font-semibold text-slate-600';

  return (
    <>
      {showTrigger && <button
        type="button"
        onClick={() => { setDraft(user); setError(''); onOpen(); }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        title="Profile and appearance settings"
        aria-label="Open profile and appearance settings"
      >
        <Settings className="h-5 w-5" />
        <span>Edit profile</span>
      </button>}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-preferences-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="profile-preferences-title" className="text-lg font-bold text-slate-900">Profile & Appearance</h2>
                <p className="mt-1 text-xs text-slate-500">Changes to your profile are saved to your account.</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close settings">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 px-5 py-5">
              <fieldset className="space-y-3">
                <legend className="mb-2 text-sm font-bold text-slate-800">Personal profile</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className={labelClass}>Full name</span>
                    <input required className={inputClass} value={draft.name} onChange={event => updateText('name', event.target.value)} />
                  </label>
                  <label>
                    <span className={labelClass}>Email</span>
                    <input className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`} value={user.email} readOnly />
                  </label>
                  <label>
                    <span className={labelClass}>Phone</span>
                    <input type="tel" className={inputClass} value={draft.phoneNumber || ''} onChange={event => updateText('phoneNumber', event.target.value)} placeholder="+91 98765 43210" />
                  </label>
                  <label>
                    <span className={labelClass}>Date of birth</span>
                    <input type="date" className={inputClass} value={draft.dateOfBirth || ''} onChange={event => updateText('dateOfBirth', event.target.value)} />
                  </label>
                  <label>
                    <span className={labelClass}>Gender</span>
                    <input className={inputClass} value={draft.gender || ''} onChange={event => updateText('gender', event.target.value)} />
                  </label>

                  {user.role === 'patient' && (
                    <>
                      <label>
                        <span className={labelClass}>Age</span>
                        <input type="number" min="0" className={inputClass} value={draft.age ?? ''} onChange={event => setDraft(current => ({ ...current, age: event.target.value ? Number(event.target.value) : undefined }))} />
                      </label>
                      <label>
                        <span className={labelClass}>Blood group</span>
                        <input className={inputClass} value={draft.bloodGroup || ''} onChange={event => updateText('bloodGroup', event.target.value)} />
                      </label>
                      <label>
                        <span className={labelClass}>Emergency contact</span>
                        <input type="tel" className={inputClass} value={draft.emergencyContact || ''} onChange={event => updateText('emergencyContact', event.target.value)} placeholder="+91 98765 43210" />
                      </label>
                      <label>
                        <span className={labelClass}>Major health issue</span>
                        <input className={inputClass} value={draft.majorHealthIssue || ''} onChange={event => updateText('majorHealthIssue', event.target.value)} />
                      </label>
                    </>
                  )}

                  {user.role === 'doctor' && (
                    <>
                      <label>
                        <span className={labelClass}>Specialty</span>
                        <input className={inputClass} value={draft.specialty || ''} onChange={event => updateText('specialty', event.target.value)} />
                      </label>
                      <label>
                        <span className={labelClass}>Hospital affiliation</span>
                        <input className={inputClass} value={draft.hospitalAffiliation || ''} onChange={event => updateText('hospitalAffiliation', event.target.value)} />
                      </label>
                      <label>
                        <span className={labelClass}>License number</span>
                        <input className={inputClass} value={draft.licenseNumber || ''} onChange={event => updateText('licenseNumber', event.target.value)} />
                      </label>
                    </>
                  )}

                  {user.role === 'admin' && (
                    <label>
                      <span className={labelClass}>Department</span>
                      <input className={inputClass} value={draft.department || ''} onChange={event => updateText('department', event.target.value)} />
                    </label>
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-bold text-slate-800">Appearance</legend>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => changeTheme('light')} aria-pressed={theme === 'light'} className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <Sun className="h-5 w-5" />
                    <span className="text-sm font-semibold">Light</span>
                  </button>
                  <button type="button" onClick={() => changeTheme('dark')} aria-pressed={theme === 'dark'} className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${theme === 'dark' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <Moon className="h-5 w-5" />
                    <span className="text-sm font-semibold">Dark</span>
                  </button>
                </div>
              </fieldset>

              {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
              {saved && <p role="status" className="text-sm font-medium text-emerald-600">Profile saved.</p>}

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}