import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/kanban-board";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_protected/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  return (
    
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* 1. Stats Cards (Stays at top) */}
              <SectionCards />
              
              {/* 2. View Toggle (Table vs Kanban) */}
              <div className="px-4 lg:px-6 flex gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="flex gap-2"
                >
                  <LayoutList className="h-4 w-4" />
                  Table
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className="flex gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </Button>
              </div>

              {/* 3. Task List/Board (Table or Kanban) */}
              {viewMode === "table" ? (
                <DataTable />
              ) : (
                <div className="px-4 lg:px-6">
                  <KanbanBoard />
                </div>
              )}

              {/* 4. Activity Chart (Moved DOWN to bottom) */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

