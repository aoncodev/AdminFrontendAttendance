"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  CalendarIcon,
  Download,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  format,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import type {
  EmployeeReport,
  ReportFilters,
  ReportSummary,
} from "@/types/reports";
import { AuthGuard } from "@/components/auth-guard";
import { Alert, AlertDescription } from "@/components/ui/alert";

// API Employee type based on actual response
interface ApiEmployee {
  id: number;
  name: string;
  qr_id: string;
  hourly_wage: number;
  role: string;
  start_time: string;
  created_at: string;
  otp: string;
}

// API Employees response
interface EmployeesResponse {
  employees: ApiEmployee[];
}

const API_URL = "https://qrbackend-doo3.onrender.com";

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    employee_id: null,
    date_range: "week",
    start_date: format(subWeeks(new Date(), 1), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
  });

  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  // State for API data
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [reportData, setReportData] = useState<EmployeeReport[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<ApiEmployee | null>(
    null
  );

  // Loading and error states
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate summary statistics from report data
  const reportSummary = useMemo((): ReportSummary => {
    if (reportData.length === 0) {
      return {
        total_days: 0,
        total_worked_hours: 0,
        total_break_hours: 0,
        total_wage: 0,
        average_hours_per_day: 0,
        late_days: 0,
        attendance_rate: 0,
      };
    }

    const totalWorkedHours = reportData.reduce(
      (sum, day) => sum + day.total_worked_hours,
      0
    );
    const totalBreakHours = reportData.reduce(
      (sum, day) => sum + day.total_break_hours,
      0
    );
    const totalWage = reportData.reduce((sum, day) => sum + day.total_wage, 0);
    const lateDays = reportData.filter((day) => day.is_late).length;

    // Calculate expected working days (excluding weekends)
    const startDate = new Date(filters.start_date);
    const endDate = new Date(filters.end_date);
    let expectedDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const isWeekend =
        currentDate.getDay() === 0 || currentDate.getDay() === 6;
      if (!isWeekend) expectedDays++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      total_days: reportData.length,
      total_worked_hours: totalWorkedHours,
      total_break_hours: totalBreakHours,
      total_wage: totalWage,
      average_hours_per_day: totalWorkedHours / reportData.length,
      late_days: lateDays,
      attendance_rate:
        expectedDays > 0 ? (reportData.length / expectedDays) * 100 : 0,
    };
  }, [reportData, filters]);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch report data when filters change
  useEffect(() => {
    if (filters.employee_id) {
      fetchReportData();
    } else {
      setReportData([]);
      setSelectedEmployee(null);
    }
  }, [filters]);



  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/api/employees`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EmployeesResponse = await response.json();

      if (result.employees) {
        setEmployees(result.employees);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees. Please try again.");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const fetchReportData = async () => {
    if (!filters.employee_id) return;

    try {
      setIsLoadingReport(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      
      const queryParams = new URLSearchParams({
        employee_id: filters.employee_id.toString(),
        start_date: filters.start_date,
        end_date: filters.end_date,
      });

      const response = await fetch(
        `${API_URL}/api/employee/reports?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EmployeeReport[] = await response.json();

      // Set report data directly since API returns array
      setReportData(result);

      // Find and set selected employee
      const employee = employees.find((emp) => emp.id === filters.employee_id);
      setSelectedEmployee(employee || null);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again.");
      setReportData([]);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (range) {
      case "day":
        startDate = today;
        break;
      case "week":
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      default:
        return;
    }

    // Convert to Seoul timezone (UTC+9) like attendance page
    const seoulStartDate = new Date(startDate.getTime() + 9 * 60 * 60 * 1000);
    const seoulEndDate = new Date(endDate.getTime() + 9 * 60 * 60 * 1000);

    setFilters((prev) => ({
      ...prev,
      date_range: range as "day" | "week" | "month" | "custom",
      start_date: seoulStartDate.toISOString().split("T")[0],
      end_date: seoulEndDate.toISOString().split("T")[0],
    }));
  };

  const handleCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      // Convert to Seoul timezone (UTC+9)
      const seoulStartDate = new Date(customStartDate.getTime() + 9 * 60 * 60 * 1000);
      const seoulEndDate = new Date(customEndDate.getTime() + 9 * 60 * 60 * 1000);

      setFilters((prev) => ({
        ...prev,
        date_range: "custom",
        start_date: seoulStartDate.toISOString().split("T")[0],
        end_date: seoulEndDate.toISOString().split("T")[0],
      }));
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const id = employeeId ? Number.parseInt(employeeId) : null;
    setFilters((prev) => ({ ...prev, employee_id: id }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  const handleExportReport = async () => {
    if (!filters.employee_id || reportData.length === 0) return;

    try {
      // Create CSV content
      const headers = [
        "Date",
        "Clock In",
        "Clock Out",
        "Worked Hours",
        "Break Hours",
        "Total Hours",
        "Wage Rate",
        "Total Wage",
        "Late Minutes",
        "Breaks",
      ];

      const csvContent = [
        headers.join(","),
        ...reportData.map((day) => [
          day.date,
          day.clock_in ? formatTime(day.clock_in) : "",
          day.clock_out ? formatTime(day.clock_out) : "",
          day.total_worked_hours.toFixed(2),
          day.total_break_hours.toFixed(2),
          day.total_hours.toFixed(2),
          day.hourly_wage.toFixed(2),
          day.total_wage.toFixed(2),
          day.late_minutes.toString(),
          day.breaks
            .map((b) => `${b.break_type}:${b.duration_minutes}m`)
            .join(";"),
        ]),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employee-report-${filters.employee_id}-${filters.start_date}-${filters.end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting report:", err);
      setError("Failed to export report. Please try again.");
    }
  };

  return (
    <AuthGuard>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold">Employee Reports</h1>
                <p className="text-muted-foreground">
                  Generate detailed attendance and payroll reports
                </p>
              </div>
              <Button
                onClick={handleExportReport}
                disabled={
                  !selectedEmployee ||
                  isLoadingReport ||
                  reportData.length === 0
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Report Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employee</label>
                    <Select
                      value={filters.employee_id?.toString() || ""}
                      onValueChange={handleEmployeeChange}
                      disabled={isLoadingEmployees}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingEmployees
                              ? "Loading..."
                              : "Select employee"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={employee.id.toString()}
                          >
                            {employee.name} ({employee.qr_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <Select
                      value={filters.date_range}
                      onValueChange={handleDateRangeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.date_range === "custom" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Start Date
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customStartDate ? (
                                format(customStartDate, "PPP")
                              ) : (
                                <span>Pick start date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={customStartDate}
                              onSelect={setCustomStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">End Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customEndDate ? (
                                format(customEndDate, "PPP")
                              ) : (
                                <span>Pick end date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={customEndDate}
                              onSelect={setCustomEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </>
                  )}
                </div>

                {filters.date_range === "custom" && (
                  <div className="mt-4">
                    <Button
                      onClick={handleCustomDateRange}
                      disabled={!customStartDate || !customEndDate}
                    >
                      Apply Custom Range
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoadingReport && (
              <Card className="mb-6">
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading report data...</span>
                </CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            {selectedEmployee && reportData.length > 0 && !isLoadingReport && (
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Hours Worked
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatHours(reportSummary.total_worked_hours)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {formatHours(reportSummary.average_hours_per_day)}
                      /day
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Wages
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportSummary.total_wage)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rate: {formatCurrency(selectedEmployee.hourly_wage)}/hr
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Attendance Rate
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportSummary.attendance_rate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reportSummary.total_days} days worked
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Late Days
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {reportSummary.late_days}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reportSummary.total_days > 0
                        ? (
                            (reportSummary.late_days /
                              reportSummary.total_days) *
                            100
                          ).toFixed(1)
                        : 0}
                      % of days
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Report Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedEmployee
                    ? `${selectedEmployee.name} - Detailed Report`
                    : "Select an employee to view report"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedEmployee && !isLoadingEmployees ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>Please select an employee to generate a report</p>
                  </div>
                ) : isLoadingEmployees ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Loading employees...
                    </p>
                  </div>
                ) : reportData.length === 0 && !isLoadingReport ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>No data available for the selected date range</p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Clock In</TableHead>
                          <TableHead>Clock Out</TableHead>
                          <TableHead>Breaks</TableHead>
                          <TableHead>Worked Hours</TableHead>
                          <TableHead>Break Hours</TableHead>
                          <TableHead>Total Hours</TableHead>
                          <TableHead>Wage Rate</TableHead>
                          <TableHead>Total Wage</TableHead>
                          <TableHead>Late</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((day, index) => (
                          <TableRow key={`${day.date}-${index}`}>
                            <TableCell className="font-medium">
                              {day.clock_in ? format(new Date(day.clock_in), "MMM dd, yyyy") : format(new Date(day.date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              {day.clock_in ? formatTime(day.clock_in) : "-"}
                            </TableCell>
                            <TableCell>
                              {day.clock_out ? formatTime(day.clock_out) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {day.breaks && day.breaks.length > 0 ? (
                                  day.breaks.map((breakInfo, breakIndex) => (
                                    <Badge
                                      key={breakIndex}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {breakInfo.break_type}:{" "}
                                      {breakInfo.duration_minutes}m
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    No breaks
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatHours(day.total_worked_hours)}
                            </TableCell>
                            <TableCell>
                              {formatHours(day.total_break_hours)}
                            </TableCell>
                            <TableCell>
                              {formatHours(day.total_hours)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(day.hourly_wage)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(day.total_wage)}
                            </TableCell>
                            <TableCell>
                              {day.is_late ? (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {day.late_minutes}m late
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  On time
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
