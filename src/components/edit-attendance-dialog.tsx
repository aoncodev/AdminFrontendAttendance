"use client";

import type { ReactElement } from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";

// New interface matching your API response
interface Break {
  break_type: string;
  duration_minutes: number | null;
  end: string | null;
  start: string;
}

interface AttendanceRecord {
  attendance_id: string; // Changed from id to attendance_id
  break_time: number;
  breaks: Break[] | null;
  clock_in: string | null;
  clock_out: string | null;
  employee: string;
  status: string;
  total_hours: number;
}

interface EditAttendanceDialogProps {
  attendance: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Changed to just trigger refresh
}

export function EditAttendanceDialog({
  attendance,
  isOpen,
  onClose,
  onSave,
}: EditAttendanceDialogProps): ReactElement | null {
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string>("");

  // Initialize form when attendance changes
  useEffect(() => {
    if (attendance) {
      console.log('Edit Dialog - Attendance Data:', attendance); // Debug log
      console.log('Edit Dialog - ID:', attendance.attendance_id); // Debug log
      
      // Format clock in time - handle null values
      if (attendance.clock_in) {
        const clockInDate = new Date(attendance.clock_in);
        // Convert to local timezone for datetime-local input
        const localClockIn = new Date(clockInDate.getTime() - (clockInDate.getTimezoneOffset() * 60000));
        setClockIn(localClockIn.toISOString().slice(0, 16));
      } else {
        setClockIn("");
      }
      
      // Format clock out time - handle null values
      if (attendance.clock_out) {
        const clockOutDate = new Date(attendance.clock_out);
        // Convert to local timezone for datetime-local input
        const localClockOut = new Date(clockOutDate.getTime() - (clockOutDate.getTimezoneOffset() * 60000));
        setClockOut(localClockOut.toISOString().slice(0, 16));
      } else {
        setClockOut("");
      }
      
      setBreaks(attendance.breaks || []);
      
      // Use the actual ID from the API response
      setAttendanceId(attendance.attendance_id);
    }
  }, [attendance]);

  const formatDateTimeLocal = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Convert to local timezone for datetime-local input
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      return localDate.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return "";
    }
  };

  // Calculate status based on clock out time (matching main page logic)
  const getDisplayStatus = () => {
    if (!attendance) return "";
    return attendance.clock_out ? "Completed" : "Active";
  };

  const addBreak = () => {
    const newBreak: Break = {
      break_type: "eating",
      duration_minutes: null,
      start: new Date().toISOString(),
      end: null,
    };
    setBreaks([...breaks, newBreak]);
  };

  const updateBreak = (index: number, field: keyof Break, value: string | number) => {
    const updatedBreaks = [...breaks];
    updatedBreaks[index] = {
      ...updatedBreaks[index],
      [field]: value,
    };
    setBreaks(updatedBreaks);
  };

  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!attendance) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token");
      console.log('Token for edit save:', token ? 'Present' : 'Missing'); // Debug log
      
      if (!token) {
        console.error('No authentication token found for edit');
        throw new Error('No authentication token found');
      }
      
      // Update main attendance record
      const attendanceResponse = await fetch(`https://qrbackend-doo3.onrender.com/api/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clock_in: clockIn ? new Date(clockIn).toISOString() : null,
          clock_out: clockOut ? new Date(clockOut).toISOString() : null,
          status: "present"
        }),
      });

      if (!attendanceResponse.ok) {
        console.error('Attendance update error:', attendanceResponse.status, attendanceResponse.statusText);
        throw new Error(`Attendance update failed: ${attendanceResponse.status}`);
      }

      // Update breaks
      const breaksResponse = await fetch(`https://qrbackend-doo3.onrender.com/api/attendance/${attendanceId}/breaks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          breaks: breaks.map(breakItem => ({
            break_type: breakItem.break_type,
            start: breakItem.start,
            end: breakItem.end
          }))
        }),
      });

      if (!breaksResponse.ok) {
        console.error('Breaks update error:', breaksResponse.status, breaksResponse.statusText);
        throw new Error(`Breaks update failed: ${breaksResponse.status}`);
      }

      // Add a small delay to ensure backend has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));

      onSave(); // Trigger refresh of attendance data
      onClose();
    } catch (error) {
      console.error('Error updating attendance:', error);
      // You might want to show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateBreakDuration = (breakItem: Break) => {
    const start = new Date(breakItem.start);
    const end = breakItem.end ? new Date(breakItem.end) : new Date();
    const diff = end.getTime() - start.getTime();
    const minutes = Math.round(diff / (1000 * 60));
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  if (!attendance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Attendance Record</DialogTitle>
          <DialogDescription>
            Modify clock in/out times and break records for {attendance.employee}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Name</Label>
                  <div className="font-medium">{attendance.employee}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant="outline">{getDisplayStatus()}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clock In/Out Times */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clock In/Out Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clock-in">Clock In Time</Label>
                  <Input
                    id="clock-in"
                    type="datetime-local"
                    value={clockIn}
                    onChange={(e) => setClockIn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clock-out">Clock Out Time</Label>
                  <Input
                    id="clock-out"
                    type="datetime-local"
                    value={clockOut}
                    onChange={(e) => setClockOut(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty if still working
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Break Records */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Break Records ({breaks.length})
              </CardTitle>
              <Button onClick={addBreak} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Break
              </Button>
            </CardHeader>
            <CardContent>
              {breaks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No breaks recorded
                </p>
              ) : (
                <div className="space-y-4">
                  {breaks.map((breakItem, index) => (
                    <Card
                      key={index}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-2">
                            <Label>Break Type</Label>
                            <Select
                              value={breakItem.break_type}
                              onValueChange={(value) =>
                                updateBreak(index, "break_type", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="eating">
                                  🍽️ Eating
                                </SelectItem>
                                <SelectItem value="restroom">
                                  🚻 Restroom
                                </SelectItem>
                                <SelectItem value="praying">
                                  🙏 Praying
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-4">
                            <Label>Break Start</Label>
                            <Input
                              type="datetime-local"
                              value={breakItem.start ? formatDateTimeLocal(breakItem.start) : ""}
                              onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                updateBreak(index, "start", newDate.toISOString());
                              }}
                            />
                          </div>
                          <div className="col-span-4">
                            <Label>Break End</Label>
                            <Input
                              type="datetime-local"
                              value={breakItem.end ? formatDateTimeLocal(breakItem.end) : ""}
                              onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                updateBreak(index, "end", newDate.toISOString());
                              }}
                            />
                          </div>
                          <div className="col-span-1">
                            <Label>Duration</Label>
                            <div className="text-sm font-medium">
                              {calculateBreakDuration(breakItem)}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBreak(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
