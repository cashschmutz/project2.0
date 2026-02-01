import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Clock, User, Briefcase } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

interface ShiftModalProps {
  shift: Shift | null;
  employeeId: string;
  date: string;
  employees: Profile[];
  onClose: () => void;
  onSave: () => void;
}

export function ShiftModal({ shift, employeeId, date, employees, onClose, onSave }: ShiftModalProps) {
  const [formData, setFormData] = useState({
    employee_id: employeeId,
    shift_date: date,
    start_time: '09:00',
    end_time: '17:00',
    shift_role: '',
    is_published: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shift) {
      setFormData({
        employee_id: shift.employee_id,
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_role: shift.shift_role,
        is_published: shift.is_published,
      });
    }
  }, [shift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.shift_role.trim()) {
        throw new Error('Role is required');
      }

      if (shift) {
        const { error: updateError } = await supabase
          .from('shifts')
          .update({
            employee_id: formData.employee_id,
            shift_date: formData.shift_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            shift_role: formData.shift_role,
            is_published: formData.is_published,
          })
          .eq('id', shift.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('shifts').insert({
          employee_id: formData.employee_id,
          shift_date: formData.shift_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          shift_role: formData.shift_role,
          is_published: formData.is_published,
        });

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === formData.employee_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {shift ? 'Edit Shift' : 'Create Shift'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              <span>Employee</span>
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) =>
                setFormData({ ...formData, employee_id: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={formData.shift_date}
              onChange={(e) =>
                setFormData({ ...formData, shift_date: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4" />
              <span>Role/Position</span>
            </label>
            <input
              type="text"
              value={formData.shift_role}
              onChange={(e) =>
                setFormData({ ...formData, shift_role: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="e.g., Cashier, Manager, Server"
              required
            />
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) =>
                setFormData({ ...formData, is_published: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_published" className="text-sm text-gray-700">
              <span className="font-medium">Publish immediately</span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Employees can see published shifts
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition transform hover:scale-105 active:scale-95"
            >
              {loading ? 'Saving...' : shift ? 'Update Shift' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
