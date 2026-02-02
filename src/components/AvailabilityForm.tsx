import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Clock } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Availability = Database['public']['Tables']['availability']['Row'];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function AvailabilityForm() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilities, setAvailabilities] = useState<Record<string, { start: string; end: string }>>({});

  useEffect(() => {
    loadAvailability();
  }, [profile]);

  const loadAvailability = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('employee_id', profile.id);

      if (error) throw error;

      const availMap: Record<string, { start: string; end: string }> = {};
      data?.forEach((a) => {
        availMap[a.day_of_week] = { start: a.start_time, end: a.end_time };
      });
      setAvailabilities(availMap);
    } catch (err) {
      console.error('Error loading availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (day: string, field: 'start' | 'end', value: string) => {
    setAvailabilities((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      // 1. Delete old availability
      await supabase.from('availability').delete().eq('employee_id', profile.id);

      // 2. Prepare new entries
      const updates = Object.entries(availabilities)
        .filter(([_, times]) => times.start && times.end) // Only save if both times exist
        .map(([day, times]) => ({
          employee_id: profile.id,
          day_of_week: day,
          start_time: times.start,
          end_time: times.end,
        }));

      if (updates.length > 0) {
        const { error } = await supabase.from('availability').insert(updates);
        if (error) throw error;
      }
      alert('Availability saved successfully!');
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-6 border-b pb-4">
        <Clock className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Weekly Availability</h2>
          <p className="text-sm text-gray-500">Set the hours you are available to work (remember the 50% rule!)</p>
        </div>
      </div>

      <div className="space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition">
            <div className="w-28 font-medium text-gray-700">{day}</div>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={availabilities[day]?.start || ''}
                onChange={(e) => handleChange(day, 'start', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-gray-400">to</span>
              <input
                type="time"
                value={availabilities[day]?.end || ''}
                onChange={(e) => handleChange(day, 'end', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
