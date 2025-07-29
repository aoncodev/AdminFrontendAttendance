"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { CreateEmployeeForm } from "@/components/create-employee-form";
import { EditEmployeeDialog } from "@/components/edit-employee-dialog";
import type { Employee } from "@/types/employee";
import { AuthGuard } from "@/components/auth-guard";
import router from "next/router";
import { QRCodeGenerator } from "../utils/qr_code_generator";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await fetch(`${API_URL}/api/employees`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        const data = await res.json();
        if (res.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          router.push(
            `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          );
          return;
        }
        setEmployees(data.employees);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };

    loadEmployees();
  }, []);

  const handleCreateEmployee = async (newEmployee: Employee) => {
    try {
      const res = await fetch(`${API_URL}/api/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(newEmployee),
      });

      const created = await res.json();
      setEmployees((prev) => [...prev, created]);
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Failed to create employee:", err);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleSaveEmployee = async (updatedEmployee: Employee) => {
    try {
      const res = await fetch(
        `${API_URL}/api/employees/${updatedEmployee.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify(updatedEmployee),
        }
      );

      const saved = await res.json();

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === saved.id ? saved : emp))
      );
      setEditingEmployee(null);
    } catch (err) {
      console.error("Failed to update employee:", err);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/employees/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (err) {
      console.error("Failed to delete employee:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const generateAndDownloadQR = async (employee: Employee) => {
    try {
      // Generate QR code as data URL
      const qrDataURL = await QRCodeGenerator.generateQRCode(
        employee.qr_id,
        512
      );

      // Create download link
      const link = document.createElement("a");
      link.href = qrDataURL;
      link.download = `${employee.qr_id}-${employee.name.replace(
        /\s+/g,
        "_"
      )}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating QR code:", error);
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
                <h1 className="text-2xl font-semibold">Employees</h1>
                <p className="text-muted-foreground">
                  Manage your team members and their information
                </p>
              </div>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                      Create a new employee profile with their basic
                      information.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateEmployeeForm onSubmit={handleCreateEmployee} />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Employee List ({employees.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>QR ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Hourly Wage</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {employee.qr_id}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateAndDownloadQR(employee)}
                                title="Download QR Code"
                                className="h-6 w-6 p-0 hover:bg-muted"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                employee.role === "admin"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {employee.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(employee.hourly_wage)}
                          </TableCell>
                          <TableCell>{employee.start_time}</TableCell>
                          <TableCell>
                            {formatDate(employee.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEmployee(employee)}
                                title="Edit employee"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Delete employee"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Employee
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{" "}
                                      <strong>{employee.name}</strong>? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteEmployee(employee.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Edit Employee Dialog */}
            <EditEmployeeDialog
              employee={editingEmployee}
              isOpen={isEditDialogOpen}
              onClose={() => {
                setIsEditDialogOpen(false);
                setEditingEmployee(null);
              }}
              onSave={handleSaveEmployee}
            />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
