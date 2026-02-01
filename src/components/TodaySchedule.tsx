import { Calendar, Clock, Users } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

interface TodayScheduleProps {
  shifts: Shift[];
  employees: Profile[];
}

export function TodaySchedule({ shifts, employees }: TodayScheduleProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts
    .filter((s) => s.shift_date === today && s.is_published)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const getEmployee = (employeeId: string) =>
    employees.find((e) => e.id === employeeId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {todayShifts.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No shifts scheduled for today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayShifts.map((shift) => {
            const employee = getEmployee(shift.employee_id);
            return (
              <div
                key={shift.id}
                className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {employee?.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {shift.shift_role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>
                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
}
