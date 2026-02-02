import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateDraftSchedule } from '../lib/scheduler';

export default function AdminDashboard() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'routes' | 'schedule'>('schedule');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: r } = await supabase.from('routes').select('*');
    const { data: req } = await supabase.from('route_requirements').select('*, routes(name)');
    const { data: s } = await supabase.from('shifts').select('*, routes(name), profiles(email)');
    
    if (r) setRoutes(r);
    if (req) setRequirements(req);
    if (s) setShifts(s);
  };

  const handleCreateRoute = async () => {
    const name = prompt("Enter Route Name (e.g., 'Blue Route')");
    if (name) {
      await supabase.from('routes').insert([{ name }]);
      fetchData();
    }
  };

  const handleAddRequirement = async (routeId: string) => {
    // Simplified input for demo - normally use a Modal
    const day = prompt("Day? (Monday-Friday)");
    const start = prompt("Start Time? (08:00)");
    const end = prompt("End Time? (12:00)");
    
    if (day && start && end) {
      await supabase.from('route_requirements').insert([{
        route_id: routeId, day_of_week: day, start_time: start, end_time: end
      }]);
      fetchData();
    }
  };

  const handleGenerateSchedule = async () => {
    setLoading(true);
    // Assuming current week start for demo
    await generateDraftSchedule('2026-02-02'); 
    await fetchData();
    setLoading(false);
    alert("Draft Schedule Created!");
  };

  const handlePublish = async () => {
    await supabase
      .from('shifts')
      .update({ status: 'published' })
      .eq('status', 'draft');
    fetchData();
    alert("Schedule Published to Employees!");
  };

  const exportToCSV = () => {
    const headers = ['Day', 'Route', 'Start', 'End', 'Driver', 'Email'];
    const rows = shifts.map(s => [
      s.day_of_week, 
      s.routes?.name, 
      s.start_time, 
      s.end_time, 
      s.user_id ? 'Assigned' : 'OPEN', 
      s.profiles?.email || 'N/A'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "schedule_export.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <div className="space-x-4">
          <button onClick={() => setView('routes')} className="px-4 py-2 bg-gray-200 rounded">Manage Routes</button>
          <button onClick={() => setView('schedule')} className="px-4 py-2 bg-blue-100 rounded">View Schedule</button>
        </div>
      </div>

      {view === 'routes' && (
        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl">Route Requirements (The Skeleton)</h2>
            <button onClick={handleCreateRoute} className="bg-green-500 text-white px-3 py-1 rounded">+ Add Route</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map(route => (
              <div key={route.id} className="border p-4 rounded">
                <h3 className="font-bold text-lg text-blue-600">{route.name}</h3>
                <button 
                  onClick={() => handleAddRequirement(route.id)}
                  className="text-sm text-gray-500 hover:text-black mb-2"
                >
                  + Add Required Slot
                </button>
                <ul className="text-sm">
                  {requirements.filter(r => r.route_id === route.id).map(req => (
                    <li key={req.id} className="flex justify-between border-b py-1">
                      <span>{req.day_of_week}</span>
                      <span>{req.start_time.slice(0,5)} - {req.end_time.slice(0,5)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'schedule' && (
        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between mb-4 items-center">
            <h2 className="text-xl">Schedule (Drafts are yellow, Published are green)</h2>
            <div className="space-x-2">
              <button onClick={handleGenerateSchedule} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">
                {loading ? 'Generating...' : '1. Generate Draft'}
              </button>
              <button onClick={handlePublish} className="bg-green-600 text-white px-4 py-2 rounded">
                2. Publish Live
              </button>
              <button onClick={exportToCSV} className="bg-gray-600 text-white px-4 py-2 rounded">
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Route</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift.id} className={shift.status === 'draft' ? 'bg-yellow-50' : 'bg-green-50'}>
                    <td className="border px-4 py-2">{shift.day_of_week}</td>
                    <td className="border px-4 py-2 font-medium">{shift.routes?.name}</td>
                    <td className="border px-4 py-2">{shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}</td>
                    <td className="border px-4 py-2">
                      {shift.profiles?.email || <span className="text-red-500 font-bold">UNASSIGNED</span>}
                    </td>
                    <td className="border px-4 py-2 uppercase text-xs font-bold text-gray-500">{shift.status}</td>
                    <td className="border px-4 py-2">
                      <button className="text-blue-500 text-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
