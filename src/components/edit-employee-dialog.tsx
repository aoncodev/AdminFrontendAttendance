"use client";

import type React from "react";
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
import type { Employee } from "@/types/employee";

interface EditEmployeeDialogProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEmployee: Employee) => void;
}

export function EditEmployeeDialog({
  employee,
  isOpen,
  onClose,
  onSave,
}: EditEmployeeDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    qr_id: "",
    hourly_wage: 0,
    role: "employee" as "admin" | "employee",
    start_time: "09:00",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        qr_id: employee.qr_id,
        hourly_wage: employee.hourly_wage,
        role: employee.role,
        start_time: employee.start_time,
      });
    }
  }, [employee]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create updated employee object
    const updatedEmployee: Employee = {
      ...employee,
      ...formData,
    };

    onSave(updatedEmployee);
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    if (employee) {
      setFormData({
        name: employee.name,
        qr_id: employee.qr_id,
        hourly_wage: employee.hourly_wage,
        role: employee.role,
        start_time: employee.start_time,
      });
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information for {employee.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              type="text"
              placeholder="Enter employee name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-qr_id">QR ID</Label>
            <Input
              id="edit-qr_id"
              type="text"
              placeholder="e.g., EMP001"
              value={formData.qr_id}
              onChange={(e) => handleInputChange("qr_id", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-hourly_wage">Hourly Wage (KRW)</Label>
            <Input
              id="edit-hourly_wage"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={formData.hourly_wage || ""}
              onChange={(e) =>
                handleInputChange(
                  "hourly_wage",
                  Number.parseInt(e.target.value, 10) || 0
                )
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "employee") =>
                handleInputChange("role", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-start_hour">Start Time</Label>
            <Input
              id="edit-start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => handleInputChange("start_time", e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
