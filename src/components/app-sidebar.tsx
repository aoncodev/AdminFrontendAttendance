"use client";

import * as React from "react";
import Link from "next/link";
import { IconUsers, IconClock, IconReport } from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/attendance">
                <span className="text-lg font-bold">QR Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {/* Attendance Link - Now the main dashboard */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/attendance" className="flex items-center space-x-2">
                <IconClock className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Employees Link */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/employees" className="flex items-center space-x-2">
                <IconUsers className="h-5 w-5" />
                <span>Employees</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Reports Link */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/reports" className="flex items-center space-x-2">
                <IconReport className="h-5 w-5" />
                <span>Reports</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>{/* Optional footer content */}</SidebarFooter>
    </Sidebar>
  );
}
