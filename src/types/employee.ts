export interface Employee {
  id: number;
  name: string;
  qr_id: string;
  hourly_wage: number;
  role: "admin" | "employee";
  start_time: string; // Format: "HH:MM"
  created_at: string;
}

export interface CreateEmployeeData {
  name: string;
  qr_id: string;
  hourly_wage: number;
  role: "admin" | "employee";
  start_time: string;
}
