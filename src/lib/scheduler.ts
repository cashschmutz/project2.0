import { supabase } from './supabase';

export async function generateSchedule(startDate: Date) {
  // 1. Fetch requirements and employees
  const { data: requirements } = await supabase.from('route_requirements').select('*');
  const { data: availabilities } = await supabase.from('availability').select('*');
  const { data: employees } = await supabase.from('profiles').select('*');
  
  if (!requirements || !availabilities || !employees) return { error: 'Missing data' };

  const newShifts = [];
  
  // Helper to get actual date for "Monday", "Tuesday" etc.
  const getDateForDay = (dayName: string) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const targetIndex = days.indexOf(dayName);
    // Assume startDate is the upcoming Monday
    const date = new Date(startDate);
    date.setDate(date.getDate() + targetIndex);
    return date.toISOString().split('T')[0];
  };

  // 2. Loop through every slot needed
  for (const req of requirements) {
    const reqStart = parseInt(req.start_time.replace(':', ''));
    const reqEnd = parseInt(req.end_time.replace(':', ''));

    // Find drivers available
    const availableDrivers = employees.filter(emp => {
      const empAvail = availabilities.find(a => a.employee_id === emp.id && a.day_of_week === req.day_of_week);
      if (!empAvail) return false;
      
      const availStart = parseInt(empAvail.start_time.replace(':', ''));
      const availEnd = parseInt(empAvail.end_time.replace(':', ''));
      return availStart <= reqStart && availEnd >= reqEnd;
    });

    // 3. Pick random driver (Basic logic)
    const selectedDriver = availableDrivers.length > 0 
      ? availableDrivers[Math.floor(Math.random() * availableDrivers.length)]
      : null;

    if (selectedDriver) {
      newShifts.push({
        employee_id: selectedDriver.id,
        route_id: req.route_id,
        shift_date: getDateForDay(req.day_of_week),
        start_time: req.start_time,
        end_time: req.end_time,
        shift_role: 'Driver',
        is_published: false // Draft mode
      });
    }
  }

  // 4. Insert Shifts
  if (newShifts.length > 0) {
    const { error } = await supabase.from('shifts').insert(newShifts);
    if (error) throw error;
  }

  return { success: true, count: newShifts.length };
}
