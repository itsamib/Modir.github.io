import { CopyrightFooter } from "@/components/copyright-footer";
import { Header } from "@/components/header";
import { BuildingDashboard } from "./_components/building-dashboard";

interface BuildingPageProps {
    params: {
        id: string;
    }
}

export default function BuildingPage({ params }: BuildingPageProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <BuildingDashboard buildingId={params.id} />
      </main>
      <CopyrightFooter />
    </div>
  )
}
