export interface EmployeeReport {
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  breaks: BreakSummary[];
  total_worked_hours: number;
  total_break_hours: number;
  total_hours: number; // worked + break
  hourly_wage: number;
  total_wage: number;
  late_minutes: number;
  is_late: boolean;
}

export interface BreakSummary {
  break_type: string;
  duration_minutes: number;
  count: number;
}

export interface ReportFilters {
  employee_id: number | null;
  date_range: "day" | "week" | "month" | "custom";
  start_date: string;
  end_date: string;
}

export interface ReportSummary {
  total_days: number;
  total_worked_hours: number;
  total_break_hours: number;
  total_wage: number;
  average_hours_per_day: number;
  late_days: number;
  attendance_rate: number;
}
