"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, FileText } from "lucide-react";
import { exportAllOrdersToCSV } from "./actions";

interface Report {
  id: string;
  name: string;
  description: string;
  exportAction: () => Promise<string>;
}

const reports: Report[] = [
  {
    id: "all-orders",
    name: "All Orders",
    description: "Complete export of all orders with customer details, items, and payment information",
    exportAction: exportAllOrdersToCSV,
  },
  // Future reports can be added here:
  // {
  //   id: "monthly-sales",
  //   name: "Monthly Sales Summary",
  //   description: "Aggregated sales data grouped by month",
  //   exportAction: exportMonthlySalesToCSV,
  // },
];

export default function ReportsClient() {
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (report: Report) => {
    setExportingId(report.id);
    try {
      const csvContent = await report.exportAction();
      
      // Create a blob and download it
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.id}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export report. Please try again.");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Export data for analysis and record keeping
        </p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{report.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={() => handleExport(report)}
                  disabled={exportingId === report.id}
                >
                  {exportingId === report.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export to CSV
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {reports.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reports available yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
