import { supabase } from './supabase';

interface Requirement {
  id: string;
  route_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface Availability {
  user_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export const generateDraftSchedule = async (weekStartDate: string) => {
  // 1. Fetch all requirements (the slots you need filled)
  const { data: requirements } = await supabase
    .from('route_requirements')
    .select('*');

  // 2. Fetch all employee availabilities
  const { data: availabilities } = await supabase
    .from('availability')
    .select('*');
    
  // 3. Fetch current drivers to track hours assigned (for fairness/limits)
  const { data: drivers } = await supabase.from('profiles').select('id');

  if (!requirements || !availabilities) return;

  const newShifts = [];

  // 4. The Matching Algorithm
  for (const req of requirements) {
    // Find drivers who are available on this day
    const availableDrivers = availabilities.filter(a => 
      a.day_of_week === req.day_of_week &&
      // Simple string comparison for time (assuming HH:MM:SS format)
      a.start_time <= req.start_time &&
      a.end_time >= req.end_time
    );

    // Heuristic: Pick a random available driver to distribute load
    // (In V2, you can pick based on least_hours_worked)
    const assignedDriver = availableDrivers.length > 0 
      ? availableDrivers[Math.floor(Math.random() * availableDrivers.length)]
      : null;

    newShifts.push({
      route_id: req.route_id,
      user_id: assignedDriver ? assignedDriver.user_id : null, // Null means "Open Shift"
      day_of_week: req.day_of_week,
      start_time: req.start_time,
      end_time: req.end_time,
      status: 'draft',
      week_start_date: weekStartDate
    });
  }

  // 5. Save to DB
  // First clear old drafts for this week to avoid duplicates
  await supabase
    .from('shifts')
    .delete()
    .eq('week_start_date', weekStartDate)
    .eq('status', 'draft');

  const { error } = await supabase.from('shifts').insert(newShifts);
  return { success: !error, error };
};
