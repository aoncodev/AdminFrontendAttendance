export interface AttendanceLog {
  id: number;
  employee_id: number;
  clock_in: string;
  clock_out: string | null;
  created_at: string;
}

export interface BreakLog {
  id: number;
  attendance_id: number;
  break_type: string;
  break_start: string;
  break_end: string | null;
  created_at: string;
}

export interface AttendanceWithEmployee extends AttendanceLog {
  employee_name: string;
  employee_qr_id: string;
  breaks: BreakLog[];
}

export type EmployeeStatus = "clocked_out" | "working" | "on_break";

export interface EmployeeStatusInfo {
  employee_id: number;
  employee_name: string;
  employee_qr_id: string;
  status: EmployeeStatus;
  clock_in_time?: string;
  current_break?: BreakLog;
  total_hours_today: number;
  total_break_time: number;
}
