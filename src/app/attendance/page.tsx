"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { CalendarIcon, Edit } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EditAttendanceDialog } from "@/components/edit-attendance-dialog";
import type { AttendanceWithEmployee } from "@/types/attendance";
import { AuthGuard } from "@/components/auth-guard";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]); // Use any[] for API response
  const [editingAttendance, setEditingAttendance] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Debug log for attendanceLogs changes
  useEffect(() => {
    console.log('Attendance logs updated:', attendanceLogs);
  }, [attendanceLogs]);

  useEffect(() => {
    // Convert selectedDate to Seoul timezone (KST, UTC+9) and format as YYYY-MM-DD
    const seoulDate = new Date(selectedDate.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = seoulDate.toISOString().split("T")[0];
    
    const token = localStorage.getItem("auth_token");
    console.log('Fetching attendance for date:', dateStr);
    console.log('Token present:', !!token);
    
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    fetch(`https://qrbackend-doo3.onrender.com/api/attendance/daily?date=${dateStr}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        console.log('API Response status:', res.status);
        if (!res.ok) {
          console.error('API Error:', res.status, res.statusText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Raw API data:', data);
        console.log('Data length:', data?.length || 0);
        // Show employees who are present, on break, or have any attendance record
        const activeEmployees = data.filter((item: any) => 
          item.status === "present" || 
          item.status === "on_break" || 
          item.clock_in !== null
        );
        console.log('Active employees:', activeEmployees);
        setAttendanceLogs(activeEmployees);
      })
      .catch((error) => {
        console.error('Error fetching attendance:', error);
        setAttendanceLogs([]);
      });
  }, [selectedDate]);

  const handleEditAttendance = (attendance: any) => {
    setEditingAttendance(attendance);
    setIsEditDialogOpen(true);
  };

  const handleSaveAttendance = () => {
    // Refresh the attendance data after edit
    const seoulDate = new Date(selectedDate.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = seoulDate.toISOString().split("T")[0];
    const token = localStorage.getItem("auth_token");
    
    fetch(`https://qrbackend-doo3.onrender.com/api/attendance/daily?date=${dateStr}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // Only keep present employees
        setAttendanceLogs(data.filter((item: any) => item.status === "present"));
      })
      .catch((error) => {
        console.error('Error refreshing attendance data:', error);
        setAttendanceLogs([]);
      });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const calculateWorkingHours = (clockIn: string, clockOut: string | null) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const diff = end.getTime() - start.getTime();
    return diff / (1000 * 60 * 60); // Convert to hours
  };

  const calculateTotalBreakTime = (breaks: any[]) => {
    return breaks.reduce((total, breakLog) => {
      if (breakLog.break_end) {
        const start = new Date(breakLog.break_start);
        const end = new Date(breakLog.break_end);
        const diff = end.getTime() - start.getTime();
        return total + diff / (1000 * 60 * 60); // Convert to hours
      }
      return total;
    }, 0);
  };

  const getBreakTypeIcon = (breakType: string) => {
    switch (breakType) {
      case "eating":
        return "🍽️";
      case "restroom":
        return "🚻";
      case "praying":
        return "🙏";
      default:
        return "⏸️";
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
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-muted-foreground">
                  Daily attendance overview and management
                </p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  Daily Attendance - {format(selectedDate, "MMMM dd, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Breaks</TableHead>
                        <TableHead>Break Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="text-muted-foreground">
                              No attendance data available for {format(selectedDate, "MMMM dd, yyyy")}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendanceLogs.map((log, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{log.employee}</div>
                              </div>
                            </TableCell>
                            <TableCell>{log.clock_in ? formatTime(log.clock_in) : "-"}</TableCell>
                            <TableCell>
                              {log.clock_out ? (
                                formatTime(log.clock_out)
                              ) : (
                                <Badge variant="outline">Still working</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDuration(log.total_hours)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {log.breaks && log.breaks.length > 0 ? (
                                  log.breaks.map((breakLog: any, i: number) => (
                                    <span key={i} title={`${breakLog.break_type} break`}>
                                      {getBreakTypeIcon(breakLog.break_type)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">No breaks</span>
                                )}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({log.breaks ? log.breaks.length : 0})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDuration(log.break_time)}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                if (log.status === "on_break") {
                                  return <Badge className="bg-yellow-500 hover:bg-yellow-600">On Break</Badge>;
                                } else if (log.clock_out) {
                                  return <Badge variant="secondary">Completed</Badge>;
                                } else {
                                  return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
                                }
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAttendance(log)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <EditAttendanceDialog
              attendance={editingAttendance}
              isOpen={isEditDialogOpen}
              onClose={() => {
                setIsEditDialogOpen(false);
                setEditingAttendance(null);
              }}
              onSave={handleSaveAttendance}
            />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
