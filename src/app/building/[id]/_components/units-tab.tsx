"use client"

import { useState } from 'react';
import { Building, Unit, useBuildingData } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Home } from 'lucide-react';
import { AddUnitDialog } from './add-unit-dialog';
import { useLanguage } from '@/context/language-context';

interface UnitsTabProps {
    building: Building;
    onDataChange: () => void;
}

export function UnitsTab({ building, onDataChange }: UnitsTabProps) {
    const { addUnitToBuilding, updateUnitInBuilding } = useBuildingData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const { t } = useLanguage();

    const handleSaveUnit = (unitData: Omit<Unit, 'id' | 'name' | 'unitNumber'> & { name: string; }) => {
        const callback = () => {
            onDataChange();
            setIsDialogOpen(false);
            setEditingUnit(null);
        };

        if (editingUnit) {
            updateUnitInBuilding(building.id, { ...editingUnit, ...unitData }, callback);
        } else {
            addUnitToBuilding(building.id, unitData, callback);
        }
    }

    const openAddDialog = () => {
        setEditingUnit(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (unit: Unit) => {
        setEditingUnit(unit);
        setIsDialogOpen(true);
    };
    
    const getUnitName = (unit: Unit) => {
        // If name is a translation key (e.g., 'unitsTab.table.defaultUnitName'), translate it.
        // Otherwise, it's a custom name, so return it as is.
        if (unit.name.includes('.')) {
            return t(unit.name, { number: unit.unitNumber });
        }
        return unit.name;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>{t('unitsTab.title')}</CardTitle>
                    <CardDescription>{t('unitsTab.description')}</CardDescription>
                </div>
                <Button onClick={openAddDialog} className="flex items-center gap-2">
                    <PlusCircle size={20} />
                    <span>{t('unitsTab.addUnit')}</span>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('unitsTab.table.name')}</TableHead>
                            <TableHead>{t('unitsTab.table.area')}</TableHead>
                            <TableHead>{t('unitsTab.table.occupants')}</TableHead>
                            <TableHead>{t('unitsTab.table.ownerName')}</TableHead>
                            <TableHead>{t('addUnitDialog.ownerPhoneLabel')}</TableHead>
                            <TableHead>{t('unitsTab.table.tenantName')}</TableHead>
                            <TableHead>{t('addUnitDialog.tenantPhoneLabel')}</TableHead>
                            <TableHead>{t('unitsTab.table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {building.units.map(unit => (
                            <TableRow key={unit.id}>
                                <TableCell className="font-medium">{getUnitName(unit)}</TableCell>
                                <TableCell>{unit.area}</TableCell>
                                <TableCell>{unit.occupants}</TableCell>
                                <TableCell>{unit.ownerName}</TableCell>
                                <TableCell>{unit.ownerPhone || ' - '}</TableCell>
                                <TableCell>{unit.tenantName || ' - '}</TableCell>
                                <TableCell>{unit.tenantPhone || ' - '}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(unit)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <AddUnitDialog 
                isOpen={isDialogOpen}
                onClose={() => { setIsDialogOpen(false); setEditingUnit(null); }}
                onSave={handleSaveUnit}
                unit={editingUnit}
            />
        </Card>
    )
}
