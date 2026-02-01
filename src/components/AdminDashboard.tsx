import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Eye, EyeOff, Users } from 'lucide-react';
import { WeeklyGrid } from './WeeklyGrid';
import { TodaySchedule } from './TodaySchedule';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

export function AdminDashboard() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Replace the loadData function with this optimized version

const loadData = async () => {
  try {
    // Calculate date range (2 weeks back to 4 weeks forward to be safe)
    const startDate = new Date(currentWeekStart);
    startDate.setDate(startDate.getDate() - 14);
    
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 28);

    const [employeesResult, shiftsResult] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase
        .from('shifts')
        .select('*')
        .gte('shift_date', startDate.toISOString().split('T')[0]) // Filter Start
        .lte('shift_date', endDate.toISOString().split('T')[0])   // Filter End
    ]);

    if (employeesResult.error) throw employeesResult.error;
    if (shiftsResult.error) throw shiftsResult.error;

    setEmployees(employeesResult.data || []);
    setShifts(shiftsResult.data || []);
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setLoading(false);
  }
};

// IMPORTANT: You must also add 'currentWeekStart' to the useEffect dependency array
// so data re-fetches when the user changes weeks.
useEffect(() => {
  loadData();
}, [currentWeekStart]);

  const publishAllDrafts = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { error } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .gte('shift_date', currentWeekStart.toISOString().split('T')[0])
        .lt('shift_date', weekEnd.toISOString().split('T')[0])
        .eq('is_published', false);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error publishing shifts:', error);
      alert('Failed to publish shifts');
    }
  };

  const previousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const currentWeekShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.shift_date);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return shiftDate >= currentWeekStart && shiftDate < weekEnd;
  });

  const displayedShifts = showPublishedOnly
    ? currentWeekShifts.filter((s) => s.is_published)
    : currentWeekShifts;

  const hasDrafts = currentWeekShifts.some((s) => !s.is_published);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TodaySchedule shifts={shifts} employees={employees} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Weekly Schedule</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPublishedOnly(!showPublishedOnly)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition"
            >
              {showPublishedOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showPublishedOnly ? 'Show All' : 'Published Only'}</span>
            </button>

            {hasDrafts && (
              <button
                onClick={publishAllDrafts}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Schedule</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousWeek}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition"
          >
            ← Previous Week
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">Week of</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentWeekStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <button
            onClick={nextWeek}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition"
          >
            Next Week →
          </button>
        </div>

        <WeeklyGrid
          weekStart={currentWeekStart}
          employees={employees}
          shifts={displayedShifts}
          onShiftsChange={loadData}
        />
      </div>
    </div>
  );
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
