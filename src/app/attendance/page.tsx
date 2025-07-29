"use client";

import React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit, Coffee, Utensils, Wifi, Home, Heart, HandHeart } from "lucide-react";
import { EditAttendanceDialog } from "@/components/edit-attendance-dialog";
import { AuthGuard } from "@/components/auth-guard";

interface AttendanceRecord {
  attendance_id: string;
  break_time: number;
  breaks: Array<{
    break_type: string;
    duration_minutes: number | null;
    end: string | null;
    start: string;
  }> | null;
  clock_in: string | null;
  clock_out: string | null;
  employee: string;
  status: string;
  total_hours: number;
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);

  // Debug log for attendance logs updates
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
      .then((data: AttendanceRecord[]) => {
        console.log('Raw API data:', data);
        console.log('Data length:', data?.length || 0);
        // Show employees who are present, on break, or have any attendance record
        const activeEmployees = data.filter((item: AttendanceRecord) => 
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

  const handleEditAttendance = (attendance: AttendanceRecord) => {
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
      .then((data: AttendanceRecord[]) => {
        // Show employees who are present, on break, or have any attendance record
        const activeEmployees = data.filter((item: AttendanceRecord) => 
          item.status === "present" || 
          item.status === "on_break" || 
          item.clock_in !== null
        );
        setAttendanceLogs(activeEmployees);
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

  const getBreakTypeIcon = (breakType: string) => {
    switch (breakType.toLowerCase()) {
      case "eating":
        return <Utensils className="h-4 w-4" />;
      case "praying":
        return <HandHeart className="h-4 w-4" />;
      case "restroom":
        return <Home className="h-4 w-4" />;
      case "coffee":
        return <Coffee className="h-4 w-4" />;
      case "break":
        return <Coffee className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
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
                    className="w-[240px] justify-start text-left font-normal"
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
                                  log.breaks.map((breakLog, i) => (
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
