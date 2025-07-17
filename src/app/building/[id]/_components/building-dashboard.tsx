"use client";

import { useEffect, useState, useCallback } from "react";
import { useBuildingData, Building } from "@/hooks/use-building-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpensesTab } from "./expenses-tab";
import { UnitsTab } from "./units-tab";
import { ReportsTab } from "./reports-tab";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BuildingDashboardProps {
  buildingId: string;
}

export function BuildingDashboard({ buildingId }: BuildingDashboardProps) {
  const { getBuildingById, loading } = useBuildingData();
  const [building, setBuilding] = useState<Building | null | undefined>(undefined);

  const fetchBuilding = useCallback(() => {
    const foundBuilding = getBuildingById(buildingId);
    setBuilding(foundBuilding);
  }, [buildingId, getBuildingById]);

  useEffect(() => {
    if (!loading) {
      fetchBuilding();
    }
  }, [loading, fetchBuilding]);

  const handleDataChange = () => {
    fetchBuilding();
  };

  if (loading || building === undefined) {
    return (
      <div>
        <Skeleton className="h-10 w-1/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-destructive">ساختمان یافت نشد</h2>
        <p className="text-muted-foreground mt-2">
          ممکن است این ساختمان حذف شده باشد یا آدرس اشتباه باشد.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/" className="flex items-center gap-2">
            <ArrowRight size={16} />
            <span>بازگشت به لیست ساختمان‌ها</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="text-primary" size={36} />
        <h1 className="text-4xl font-bold font-headline text-primary">{building.name}</h1>
      </div>
      <p className="text-lg text-muted-foreground mb-8">
        داشبورد مدیریت هزینه‌ها و واحدهای ساختمان
      </p>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="expenses">هزینه‌ها</TabsTrigger>
          <TabsTrigger value="units">واحدها</TabsTrigger>
          <TabsTrigger value="reports">گزارش‌ها</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <ExpensesTab building={building} onDataChange={handleDataChange} />
        </TabsContent>
        <TabsContent value="units">
          <UnitsTab building={building} onDataChange={handleDataChange} />
        </TabsContent>
        <TabsContent value="reports">
            <ReportsTab building={building} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
