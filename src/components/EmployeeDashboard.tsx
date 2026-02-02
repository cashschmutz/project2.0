import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Briefcase, ArrowLeftRight, Settings } from 'lucide-react';
import { AvailabilityForm } from './AvailabilityForm';
import type { Database } from '../lib/database.types';

type Shift = Database['public']['Tables']['shifts']['Row'];

export function EmployeeDashboard() {
  const { profile } = useAuth();
  const [view, setView] = useState<'schedule' | 'availability'>('schedule');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShifts();
  }, [profile]);

  const loadShifts = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', profile.id)
        .eq('is_published', true)
        .gte('shift_date', new Date().toISOString().split('T')[0])
        .order('shift_date', { ascending: true });

      if (error) throw error;
      setShifts(data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'availability') {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setView('schedule')}
          className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 mb-4"
        >
          <span>← Back to Schedule</span>
        </button>
        <AvailabilityForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <button
          onClick={() => setView('availability')}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <Settings className="w-4 h-4" />
          <span>Update Availability</span>
        </button>
      </div>

      {/* Existing Today's Shifts Logic */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Upcoming Schedule</h2>
        </div>
        
        {shifts.length === 0 ? (
           <p className="text-gray-500">No upcoming shifts.</p>
        ) : (
          <div className="space-y-3">
             {shifts.map(shift => (
               <div key={shift.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                 <div>
                    <p className="font-semibold">{new Date(shift.shift_date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
                    <p className="text-xs text-blue-600 font-bold">{shift.shift_role}</p>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
}
