import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Users, Wand2 } from 'lucide-react';
import { WeeklyGrid } from './WeeklyGrid';
import { generateSchedule } from '../lib/scheduler';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Shift = Database['public']['Tables']['shifts']['Row'];

export function AdminDashboard() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  useEffect(() => { loadData(); }, [currentWeekStart]);

  const loadData = async () => {
    const startDate = new Date(currentWeekStart);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 14);

    const [empRes, shiftRes] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('shifts').select('*').gte('shift_date', startDate.toISOString()).lte('shift_date', endDate.toISOString())
    ]);

    if (empRes.data) setEmployees(empRes.data);
    if (shiftRes.data) setShifts(shiftRes.data);
    setLoading(false);
  };

  const handleAutoSchedule = async () => {
    if(!confirm("Generate draft schedule for this week?")) return;
    setLoading(true);
    try {
      await generateSchedule(currentWeekStart);
      await loadData();
      alert("Draft schedule generated!");
    } catch (e) {
      alert("Error generating schedule");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const publishAll = async () => {
    if(!confirm("Publish all drafts?")) return;
    await supabase.from('shifts').update({ is_published: true }).eq('is_published', false);
    loadData();
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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border">
        <div>
           <h2 className="text-2xl font-bold">Manager Dashboard</h2>
           <p className="text-gray-500">Week of {currentWeekStart.toLocaleDateString()}</p>
        </div>
        <div className="flex space-x-3">
           <button onClick={previousWeek} className="px-3 py-2 border rounded hover:bg-gray-50">← Prev</button>
           <button onClick={nextWeek} className="px-3 py-2 border rounded hover:bg-gray-50">Next →</button>
        </div>
      </div>

      <div className="flex space-x-3 justify-end">
           <button onClick={handleAutoSchedule} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
             <Wand2 className="w-4 h-4" /> <span>Auto-Schedule (Draft)</span>
           </button>
           <button onClick={publishAll} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
             <Plus className="w-4 h-4" /> <span>Publish All</span>
           </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <WeeklyGrid 
          weekStart={currentWeekStart} 
          employees={employees} 
          shifts={shifts} 
          onShiftsChange={loadData} 
        />
      </div>
    </div>
  );
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);
  return monday;
}
