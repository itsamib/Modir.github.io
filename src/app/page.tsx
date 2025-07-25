// src/app/page.tsx
"use client"; // این خط برای کامپوننت‌های سمت کلاینت ضروری است

import { useState, useEffect, useRef } from "react";
import { useBuildingData } from "@/hooks/use-building-data";
import { Header } from "@/components/header";
import { BuildingList } from "@/components/building-list";
import { Button } from "@/components/ui/button";
import { CreateBuildingDialog } from "@/components/create-building-dialog";
import { PlusCircle, Upload, Download } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { WelcomeScreen } from "@/components/welcome-screen";
import { cn } from "@/lib/utils";

export default function Home() {
  const { buildings, addBuilding, loading, importData, importExcelData } = useBuildingData();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t } = useLanguage();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true);
  const [isWelcomeFading, setIsWelcomeFading] = useState(false);

  useEffect(() => {
    setIsClient(true)
    const welcomeTimer = setTimeout(() => {
      setIsWelcomeFading(true);
      setTimeout(() => setShowWelcome(false), 500); // Wait for fade-out animation
    }, 2000); // Show welcome screen for 2 seconds

    return () => clearTimeout(welcomeTimer);
  }, [])

  const handleAddBuilding = (name: string, unitCount: number) => {
    addBuilding(name, unitCount);
    setIsCreateDialogOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToImport(file);
      setIsImportAlertOpen(true);
    }
    // Reset file input to allow importing the same file again
    event.target.value = '';
  }

  const handleConfirmImport = () => {
    if (!fileToImport) return;

    const isExcel = fileToImport.name.endsWith('.xlsx') || fileToImport.name.endsWith('.xls');

    if (isExcel) {
        importExcelData(fileToImport, (success, message) => {
            if (success) {
                toast({
                    title: t('home.importSuccessTitle'),
                    description: message,
                    className: "bg-primary text-primary-foreground"
                });
            } else {
                toast({
                    title: t('global.error'),
                    description: message,
                    variant: "destructive"
                });
            }
            setIsImportAlertOpen(false);
            setFileToImport(null);
        })
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    importData(text);
                    toast({
                        title: t('home.importSuccessTitle'),
                        description: t('home.importSuccessDesc'),
                        className: "bg-primary text-primary-foreground"
                    });
                }
            } catch (error) {
                console.error("Import failed:", error);
                toast({
                    title: t('global.error'),
                    description: t('home.importErrorDesc'),
                    variant: "destructive"
                });
            } finally {
                setIsImportAlertOpen(false);
                setFileToImport(null);
            }
        };
        reader.readAsText(fileToImport);
    }
  }
  
  const handleGlobalExport = () => {
    try {
        const jsonData = exportData();
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `backup-all-buildings.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
            title: t('home.exportSuccessTitle'),
            description: t('home.exportSuccessDesc'),
            className: "bg-primary text-primary-foreground"
        });
    } catch (error) {
        console.error("Global export failed:", error);
        toast({
            title: t('global.error'),
            description: t('reportsTab.exportErrorDesc'), // Reusing a similar error message
            variant: "destructive"
        });
    }
  }


  if (!isClient) {
    return null; // or a loading skeleton
  }
  
  if (showWelcome) {
    return <WelcomeScreen isFading={isWelcomeFading} />;
  }


  return (
    <div className={cn("flex flex-col min-h-screen bg-background", "animate-fade-in")}>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-headline font-bold text-primary">
            {t('home.myBuildings')}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="application/json, .xlsx, .xls"
              onChange={handleFileChange}
            />
            <Button onClick={handleImportClick} variant="outline" className="flex items-center gap-2">
              <Upload size={20} />
              <span>{t('home.importData')}</span>
            </Button>
            <Button onClick={handleGlobalExport} variant="outline" className="flex items-center gap-2">
              <Download size={20} />
              <span>{t('home.exportAll')}</span>
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <PlusCircle size={20} />
              <span>{t('home.newBuilding')}</span>
            </Button>
          </div>
        </div>
        
        {loading ? (
            <p>{t('home.loadingBuildings')}</p>
        ) : buildings.length > 0 ? (
          <BuildingList buildings={buildings} />
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h2 className="text-xl font-semibold text-muted-foreground">{t('home.noBuildingsFound')}</h2>
              <p className="text-muted-foreground mt-2">{t('home.noBuildingsCTA')}</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">{t('home.newBuilding')}</Button>
          </div>
        )}

      </main>
      <CreateBuildingDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleAddBuilding}
      />
      <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('home.importConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('home.importConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToImport(null)}>{t('global.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} className="bg-destructive hover:bg-destructive/90">{t('home.importConfirmAction')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
