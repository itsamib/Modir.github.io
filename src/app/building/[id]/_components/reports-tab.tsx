"use client"

import { useState } from 'react';
import { Building, Expense, Unit, ChargeTo } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns-jalali';
import { useLanguage } from '@/context/language-context';

interface ReportsTabProps {
    building: Building;
}

const getAmountPerUnit = (expense: Expense, unit: Unit, allUnits: Unit[]): number => {
    let amount = 0;
    
    const chargeTo = expense.chargeTo || 'all';
    
    const isOwnerOccupied = !unit.tenantName;
    if (chargeTo === 'tenant' && isOwnerOccupied) return 0;
    if (chargeTo === 'owner' && !isOwnerOccupied) return 0;

    if (expense.distributionMethod === 'custom') {
        if (expense.applicableUnits?.includes(unit.id)) {
            amount = expense.totalAmount;
        } else {
            amount = 0;
        }
    } else {
        const applicableUnitsForDivision = allUnits.filter(u => {
            const unitIsOwnerOccupied = !u.tenantName;
            if (chargeTo === 'tenant') return !unitIsOwnerOccupied;
            if (chargeTo === 'owner') return unitIsOwnerOccupied;
            return true;
        });

        if (!applicableUnitsForDivision.some(u => u.id === unit.id)) return 0;

        switch (expense.distributionMethod) {
            case 'unit_count': {
                const numApplicable = applicableUnitsForDivision.length;
                amount = numApplicable > 0 ? expense.totalAmount / numApplicable : 0;
                break;
            }
            case 'occupants': {
                const totalOccupants = applicableUnitsForDivision.reduce((sum, u) => sum + u.occupants, 0);
                amount = totalOccupants > 0 ? (expense.totalAmount * unit.occupants) / totalOccupants : 0;
                break;
            }
            case 'area': {
                const totalArea = applicableUnitsForDivision.reduce((sum, u) => sum + u.area, 0);
                amount = totalArea > 0 ? (expense.totalAmount * unit.area) / totalArea : 0;
                break;
            }
            default:
                amount = 0;
                break;
        }
    }

    if (amount === 0) return 0;
    
    return Math.ceil(amount / 500) * 500;
};

export function ReportsTab({ building }: ReportsTabProps) {
    const [exportType, setExportType] = useState("values");
    const { toast } = useToast();
    const { t } = useLanguage();

    const chargeToText = (chargeTo: ChargeTo) => {
        switch(chargeTo) {
            case 'owner': return t('expensesTab.badges.chargeToOwner');
            case 'tenant': return t('expensesTab.badges.chargeToTenant');
            default: return t('expensesTab.badges.chargeToAll');
        }
    }

    const handleExport = () => {
        try {
            const data = building.expenses.flatMap(expense => {
                return building.units.map(unit => {
                    const amount = getAmountPerUnit(expense, unit, building.units);
                    if (amount === 0) return null;
                    
                    const paymentStatus = expense.paymentStatus[unit.id] || 'unpaid';

                    let totalExpenseAmount = expense.totalAmount;
                    if(expense.distributionMethod === 'custom') {
                        totalExpenseAmount = (expense.applicableUnits?.length ?? 0) * expense.totalAmount;
                    }

                    return {
                        'شرح هزینه': expense.description,
                        'تاریخ': format(new Date(expense.date), 'yyyy/MM/dd'),
                        'مبلغ کل هزینه': Math.ceil(totalExpenseAmount),
                        'روش تقسیم': expense.distributionMethod,
                        'پرداخت توسط مدیر': expense.paidByManager ? 'بله' : 'خیر',
                        'پرداخت برای': chargeToText(expense.chargeTo),
                        'واحد': unit.name,
                        'مالک': unit.ownerName,
                        'مستاجر': unit.tenantName || '-',
                        'سهم واحد': amount,
                        'وضعیت پرداخت': paymentStatus === 'paid' ? 'پرداخت شده' : 'پرداخت نشده',
                    };
                }).filter(Boolean);
            });

            if (data.length === 0) {
                 toast({
                    title: t('global.error'),
                    description: t('reportsTab.noData'),
                    variant: "destructive"
                });
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(data as any[]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Report");
            
            XLSX.writeFile(workbook, `${building.name}-report.xlsx`);

            toast({
                title: t('reportsTab.exportSuccessTitle'),
                description: t('reportsTab.exportSuccessDesc', { buildingName: building.name }),
                className: "bg-primary text-primary-foreground"
            });

        } catch (error) {
             console.error("Excel export failed:", error);
             toast({
                title: t('reportsTab.exportErrorTitle'),
                description: t('reportsTab.exportErrorDesc'),
                variant: "destructive"
             })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('reportsTab.title')}</CardTitle>
                <CardDescription>{t('reportsTab.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label className="font-semibold">{t('reportsTab.exportType')}</Label>
                    <RadioGroup defaultValue="values" value={exportType} onValueChange={setExportType}>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="values" id="r1" />
                            <Label htmlFor="r1">{t('reportsTab.exportValues')}</Label>
                        </div>
                         <p className="text-xs text-muted-foreground px-6">{t('reportsTab.exportValuesDesc')}</p>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="formulas" id="r2" disabled />
                            <Label htmlFor="r2">{t('reportsTab.exportFormulas')}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground px-6">{t('reportsTab.exportFormulasDesc')}</p>

                    </RadioGroup>
                </div>
                <Button onClick={handleExport} className="w-full md:w-auto flex items-center gap-2">
                    <Download size={20}/>
                    <span>{t('reportsTab.exportButton')}</span>
                </Button>
            </CardContent>
        </Card>
    )
}
