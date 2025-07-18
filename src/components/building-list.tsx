import type { Building } from "@/hooks/use-building-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface BuildingListProps {
  buildings: Building[];
}

export function BuildingList({ buildings }: BuildingListProps) {
  const { t, language } = useLanguage();
  const ArrowIcon = language === 'fa' ? ArrowLeft : ArrowRight;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {buildings.map((building) => (
        <Card key={building.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">{building.name}</CardTitle>
            <CardDescription>
                {t('buildingList.cardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="flex items-center text-muted-foreground space-x-4 space-x-reverse">
                <div className="flex items-center gap-2">
                    <Home size={16} />
                    <span>{building.units.length} {t('buildingList.units')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{building.expenses.length} {t('buildingList.expenses')}</span>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/building/${building.id}`} className="flex items-center gap-2">
                <span>{t('buildingList.viewDashboard')}</span>
                <ArrowIcon size={16} />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
