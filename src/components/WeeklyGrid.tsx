import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { ShiftModal } from './ShiftModal';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

interface WeeklyGridProps {
  weekStart: Date;
  employees: Profile[];
  shifts: Shift[];
  onShiftsChange: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WeeklyGrid({ weekStart, employees, shifts, onShiftsChange }: WeeklyGridProps) {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const getDayDate = (dayIndex: number): Date => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };

  const getShiftsForEmployeeAndDay = (employeeId: string, dayIndex: number): Shift[] => {
    const dayDate = getDayDate(dayIndex);
    const dateStr = dayDate.toISOString().split('T')[0];
    return shifts
      .filter((s) => s.employee_id === employeeId && s.shift_date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const handleCellClick = (employeeId: string, dayIndex: number) => {
    const dayDate = getDayDate(dayIndex);
    const dateStr = dayDate.toISOString().split('T')[0];
    setSelectedEmployee(employeeId);
    setSelectedDate(dateStr);
    setSelectedShift(null);
    setModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setSelectedEmployee(shift.employee_id);
    setSelectedDate(shift.shift_date);
    setModalOpen(true);
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      const { error } = await supabase.from('shifts').delete().eq('id', shiftId);
      if (error) throw error;
      onShiftsChange();
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('Failed to delete shift');
    }
  };

  const calculateTotalHours = (employeeId: string): number => {
    const employeeShifts = shifts.filter((s) => s.employee_id === employeeId);
    return employeeShifts.reduce((total, shift) => {
      const [startHour, startMin] = shift.start_time.split(':').map(Number);
      const [endHour, endMin] = shift.end_time.split(':').map(Number);
      const hours = endHour - startHour + (endMin - startMin) / 60;
      return total + hours;
    }, 0);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 border border-gray-200 z-10">
                Employee
              </th>
              {DAYS.map((day, index) => {
                const date = getDayDate(index);
                const isToday =
                  date.toDateString() === new Date().toDateString();
                return (
                  <th
                    key={day}
                    className={`px-3 py-3 text-center text-sm font-semibold border border-gray-200 ${
                      isToday ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    <div>{day}</div>
                    <div className="text-xs font-normal text-gray-500">
                      {date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border border-gray-200">
                Total Hours
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white px-4 py-3 border border-gray-200 z-10">
                  <div className="font-medium text-gray-900">
                    {employee.full_name}
                  </div>
                  <div className="text-xs text-gray-500">{employee.role}</div>
                </td>
                {DAYS.map((_, dayIndex) => {
                  const dayShifts = getShiftsForEmployeeAndDay(
                    employee.id,
                    dayIndex
                  );
                  const date = getDayDate(dayIndex);
                  const isToday =
                    date.toDateString() === new Date().toDateString();
                  return (
                    <td
                      key={dayIndex}
                      className={`px-2 py-2 border border-gray-200 align-top ${
                        isToday ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="space-y-1 min-h-[60px]">
                        {dayShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={`relative group rounded-lg p-2 text-xs ${
                              shift.is_published
                                ? 'bg-green-100 border border-green-300'
                                : 'bg-yellow-100 border border-yellow-300'
                            }`}
                          >
                            <div className="font-semibold text-gray-900">
                              {shift.shift_role}
                            </div>
                            <div className="flex items-center space-x-1 text-gray-700 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatTime(shift.start_time)} -{' '}
                                {formatTime(shift.end_time)}
                              </span>
                            </div>
                            {!shift.is_published && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
                                Draft
                              </span>
                            )}
                            <div className="absolute top-1 right-1 hidden group-hover:flex space-x-1">
                              <button
                                onClick={() => handleEditShift(shift)}
                                className="p-1 bg-white rounded shadow hover:bg-gray-100"
                              >
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteShift(shift.id)}
                                className="p-1 bg-white rounded shadow hover:bg-gray-100"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => handleCellClick(employee.id, dayIndex)}
                          className="w-full flex items-center justify-center space-x-1 px-2 py-1.5 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-300 rounded-lg transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center border border-gray-200">
                  <div className="font-semibold text-gray-900">
                    {calculateTotalHours(employee.id).toFixed(1)}h
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ShiftModal
          shift={selectedShift}
          employeeId={selectedEmployee}
          date={selectedDate}
          employees={employees}
          onClose={() => setModalOpen(false)}
          onSave={onShiftsChange}
        />
      )}
    </>
  );
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
}
