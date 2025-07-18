"use client"

import { useState, useEffect } from "react";
import { useBuildingData } from "@/hooks/use-building-data";
import { Header } from "@/components/header";
import { BuildingList } from "@/components/building-list";
import { Button } from "@/components/ui/button";
import { CreateBuildingDialog } from "@/components/create-building-dialog";
import { PlusCircle } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export default function Home() {
  const { buildings, addBuilding, loading } = useBuildingData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useLanguage();

  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleAddBuilding = (name: string, unitCount: number) => {
    addBuilding(name, unitCount);
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-headline font-bold text-primary">
            {t('home.myBuildings')}
          </h1>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <PlusCircle size={20} />
            <span>{t('home.newBuilding')}</span>
          </Button>
        </div>
        
        {isClient && loading ? (
           <p>{t('home.loadingBuildings')}</p>
        ) : isClient && buildings.length > 0 ? (
          <BuildingList buildings={buildings} />
        ) : isClient ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h2 className="text-xl font-semibold text-muted-foreground">{t('home.noBuildingsFound')}</h2>
              <p className="text-muted-foreground mt-2">{t('home.noBuildingsCTA')}</p>
          </div>
        ) : null}

      </main>
      <CreateBuildingDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleAddBuilding}
      />
    </div>
  );
}
