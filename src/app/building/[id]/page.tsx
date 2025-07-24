// app/building/[id]/page.tsx

import { Header } from "@/components/header";
import { BuildingDashboard } from "./_components/building-dashboard";

interface BuildingPageProps {
  params: {
    id: string;
  };
}

/**
 * generateStaticParams is a Next.js function that tells Next.js
 * which dynamic paths (e.g., building IDs) should be pre-rendered
 * at build time when using `output: 'export'`.
 *
 * This is crucial for static exports (like for GitHub Pages)
 * because it ensures all possible dynamic pages are generated
 * as static HTML files.
 *
 * You MUST replace the placeholder logic below with your actual
 * data fetching mechanism to retrieve all valid building IDs.
 */
export async function generateStaticParams() {
  // --- IMPORTANT: REPLACE THIS LOGIC WITH YOUR ACTUAL DATA FETCHING ---
  //
  // Example 1: If your building IDs are known and fixed (e.g., from a config file)
  const allBuildingIds = [
    { id: 'building_A' }, // Example ID
    { id: 'building_B' }, // Example ID
    { id: 'building_C' }, // Example ID
    // Add all other building IDs that should have a static page
  ];
  return allBuildingIds.map((building) => ({
    id: building.id,
  }));

  // Example 2: If you fetch building IDs from an API (recommended for dynamic data)
  // Uncomment and adapt the following if you have an API endpoint:
  /*
  try {
    const response = await fetch('https://your-api.com/api/buildings-list'); // Replace with your actual API endpoint
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const buildings = await response.json();
    // Assuming your API returns an array of objects like [{ id: '123', name: '...' }]
    return buildings.map((building: { id: string }) => ({
      id: building.id,
    }));
  } catch (error) {
    console.error("Error fetching building IDs for static params:", error);
    // Return an empty array or a default set of IDs if fetching fails
    return [];
  }
  */

  // Example 3: If you read building IDs from a local JSON file (e.g., in `public/data/`)
  // This requires Node.js `fs` and `path` modules, which are available during build.
  // Uncomment and adapt the following if you use a local file:
  /*
  const fs = require('fs/promises');
  const path = require('path');
  const filePath = path.join(process.cwd(), 'public', 'data', 'building_ids.json'); // Adjust path as needed
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const buildingIdsData = JSON.parse(fileContents);
    // Assuming building_ids.json is an array of strings or objects with an 'id' field
    return buildingIdsData.map((id: string | { id: string }) => ({
      id: typeof id === 'string' ? id : id.id,
    }));
  } catch (error) {
    console.error("Error reading local building IDs file:", error);
    return [];
  }
  */
  // --- END OF IMPORTANT SECTION ---
}

// This is your BuildingPage component, exactly as you provided it.
export default function BuildingPage({ params }: BuildingPageProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* The buildingId is passed to your BuildingDashboard component */}
        <BuildingDashboard buildingId={params.id} />
      </main>
    </div>
  );
}