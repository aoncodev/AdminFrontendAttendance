"use client";

import type React from "react";

import { useState } from "react";
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
import type { Employee, CreateEmployeeData } from "@/types/employee";

interface CreateEmployeeFormProps {
  onSubmit: (employee: Employee) => void;
}

export function CreateEmployeeForm({ onSubmit }: CreateEmployeeFormProps) {
  const [formData, setFormData] = useState<CreateEmployeeData>({
    name: "",
    qr_id: "",
    hourly_wage: 0,
    role: "employee",
    start_time: "09:00",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create new employee with mock ID and timestamp
    const newEmployee: Employee = {
      ...formData,
      id: Date.now(), // In real app, this would come from the backend
      created_at: new Date().toISOString(),
    };

    onSubmit(newEmployee);

    // Reset form
    setFormData({
      name: "",
      qr_id: "",
      hourly_wage: 0,
      role: "employee",
      start_time: "09:00",
    });

    setIsSubmitting(false);
  };

  const handleInputChange = (
    field: keyof CreateEmployeeData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter employee name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="qr_id">QR ID</Label>
        <Input
          id="qr_id"
          type="text"
          placeholder="e.g., EMP001"
          value={formData.qr_id}
          onChange={(e) => handleInputChange("qr_id", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hourly_wage">Hourly Wage (₩)</Label>
        <Input
          id="hourly_wage"
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
        <Label htmlFor="role">Role</Label>
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
        <Label htmlFor="start_time">Start Time</Label>
        <Input
          id="start_time"
          type="time"
          value={formData.start_time}
          onChange={(e) => handleInputChange("start_time", e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Employee"}
      </Button>
    </form>
  );
}
