import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Briefcase, ArrowLeftRight } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Shift = Database['public']['Tables']['shifts']['Row'];

export function EmployeeDashboard() {
  const { profile } = useAuth();
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
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setShifts(data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupShiftsByWeek = () => {
    const weeks: { [key: string]: Shift[] } = {};

    shifts.forEach((shift) => {
      const date = new Date(shift.shift_date);
      const weekStart = getMonday(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(shift);
    });

    return weeks;
  };

  const calculateTotalHours = (weekShifts: Shift[]): number => {
    return weekShifts.reduce((total, shift) => {
      const [startHour, startMin] = shift.start_time.split(':').map(Number);
      const [endHour, endMin] = shift.end_time.split(':').map(Number);
      const hours = endHour - startHour + (endMin - startMin) / 60;
      return total + hours;
    }, 0);
  };

  const todayShifts = shifts.filter(
    (s) => s.shift_date === new Date().toISOString().split('T')[0]
  );

  const weeks = groupShiftsByWeek();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading your shifts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {todayShifts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-600 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Today's Shifts</h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {todayShifts.map((shift) => (
              <div
                key={shift.id}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {shift.shift_role}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(shift.start_time)} -{' '}
                          {formatTime(shift.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-lg transition"
                    onClick={() => alert('Shift swap functionality coming soon!')}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Request Swap</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Upcoming Schedule</h2>
        </div>

        {Object.keys(weeks).length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming shifts scheduled</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(weeks).map(([weekStart, weekShifts]) => {
              const startDate = new Date(weekStart);
              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + 6);

              return (
                <div key={weekStart} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Week of {startDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' - '}
                        {endDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {weekShifts.length} shift{weekShifts.length !== 1 ? 's' : ''} •{' '}
                        {calculateTotalHours(weekShifts).toFixed(1)} hours
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {weekShifts.map((shift) => {
                      const shiftDate = new Date(shift.shift_date);
                      const isToday =
                        shift.shift_date === new Date().toISOString().split('T')[0];

                      return (
                        <div
                          key={shift.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isToday
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-center min-w-[60px]">
                              <div className="text-xs font-medium text-gray-500 uppercase">
                                {shiftDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                })}
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {shiftDate.getDate()}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {shift.shift_role}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {formatTime(shift.start_time)} -{' '}
                                  {formatTime(shift.end_time)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-white border border-gray-300 rounded-lg transition"
                            onClick={() => alert('Shift swap functionality coming soon!')}
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Swap</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
}
