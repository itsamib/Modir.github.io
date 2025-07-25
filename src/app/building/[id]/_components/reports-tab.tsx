
"use client"

import { useState, useMemo } from 'react';
import { Building, Expense, Unit } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Download, Users, Home, UserX, Wallet, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format, startOfMonth } from 'date-fns-jalali';
import { faIR, enUS } from 'date-fns-jalali/locale';
import { useLanguage } from '@/context/language-context';

interface ReportsTabProps {
    building: Building;
}

const getAmountPerUnit = (expense: Expense, unit: Unit, allUnits: Unit[]): number => {
    if (expense.distributionMethod === 'general') {
        return 0; // No amount per unit for general expenses
    }
    
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
    const { t, language, direction } = useLanguage();

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(language === 'fa' ? 'fa-IR' : 'en-US').format(num);
    }
    
    const getExpenseDescription = (description: string) => {
        if (description.includes('.')) {
            return t(description);
        }
        return description;
    }
    
     const getUnitName = (unit: Unit) => {
        if (unit.name.includes('.')) {
            return t(unit.name, { number: unit.unitNumber });
        }
        return unit.name;
    }

    const stats = useMemo(() => {
        const totalUnits = building.units.length;
        const totalOccupants = building.units.reduce((sum, unit) => sum + unit.occupants, 0);
        
        const vacantUnitsList = building.units.filter(unit => unit.tenantName === null && unit.occupants === 0);
        const vacantUnitsCount = vacantUnitsList.length;
        const vacantUnitNames = vacantUnitsList.map(u => getUnitName(u));


        const fundInflow = building.expenses
            .filter(e => e.isBuildingCharge)
            .reduce((sum, e) => {
                 if (e.distributionMethod === 'custom') {
                     return sum + (e.totalAmount * (e.applicableUnits?.length || 0));
                 }
                 return sum + e.totalAmount;
            }, 0);

        const fundOutflow = building.expenses
            .filter(e => e.deductFromFund)
            .reduce((sum, e) => {
                // For custom distribution, totalAmount is per unit
                if (e.distributionMethod === 'custom') {
                    return sum + (e.totalAmount * (e.applicableUnits?.length || 0));
                }
                 // For general expenses, it's just the total amount
                if (e.distributionMethod === 'general') {
                    return sum + e.totalAmount;
                }
                return sum + e.totalAmount;
            }, 0);

        const fundBalance = fundInflow - fundOutflow;
        
        const now = new Date();
        const startOfCurrentJalaliMonth = startOfMonth(now);
        
        const overdueDebts = building.units.map(unit => {
            const unpaidAmount = building.expenses.reduce((sum, expense) => {
                const expenseDate = new Date(expense.date);
                const isOverdue = expenseDate < startOfCurrentJalaliMonth;
                const isUnpaid = (expense.paymentStatus[unit.id] || 'unpaid') === 'unpaid';

                if (isOverdue && isUnpaid) {
                    const amount = getAmountPerUnit(expense, unit, building.units);
                    return sum + amount;
                }
                return sum;
            }, 0);

            return {
                unitId: unit.id,
                unitName: getUnitName(unit),
                amount: unpaidAmount
            };
        }).filter(debt => debt.amount > 0);


        return { totalUnits, totalOccupants, vacantUnitsCount, vacantUnitNames, fundBalance, overdueDebts, fundInflow, fundOutflow };

    }, [building, t, language]);


    const handleExport = () => {
        try {
            const workbook = XLSX.utils.book_new();

            // --- Metadata Sheet (for round-trip import) ---
            const metaData = [
                ['buildingId', building.id],
                ['buildingName', building.name]
            ];
            const metaWorksheet = XLSX.utils.aoa_to_sheet(metaData);
            XLSX.utils.book_append_sheet(workbook, metaWorksheet, "metadata");

            // --- Units Sheet ---
            const unitsData = building.units.map(unit => ({
                id: unit.id,
                unitNumber: unit.unitNumber,
                name: getUnitName(unit),
                area: unit.area,
                occupants: unit.occupants,
                ownerName: unit.ownerName,
                ownerPhone: unit.ownerPhone,
                tenantName: unit.tenantName,
                tenantPhone: unit.tenantPhone
            }));
            const unitsWorksheet = XLSX.utils.json_to_sheet(unitsData);
            XLSX.utils.book_append_sheet(workbook, unitsWorksheet, "Units");

            // --- Expenses Sheet ---
            const expensesData = building.expenses.map(expense => ({
                id: expense.id,
                description: getExpenseDescription(expense.description),
                totalAmount: expense.totalAmount,
                date: new Date(expense.date).toISOString().split('T')[0], // YYYY-MM-DD
                distributionMethod: expense.distributionMethod,
                chargeTo: expense.chargeTo,
                paidByManager: expense.paidByManager,
                isBuildingCharge: expense.isBuildingCharge,
                deductFromFund: expense.deductFromFund,
                applicableUnits: JSON.stringify(expense.applicableUnits),
                paymentStatus: JSON.stringify(expense.paymentStatus),
            }));
            const expensesWorksheet = XLSX.utils.json_to_sheet(expensesData);
            XLSX.utils.book_append_sheet(workbook, expensesWorksheet, "Expenses");

            // --- Individual Unit Sheets ---
            building.units.forEach(unit => {
                if (typeof unit.unitNumber !== 'number') {
                    console.warn(`Skipping sheet for unit with invalid unitNumber:`, unit);
                    return; // Skip if unitNumber is not valid
                }

                const unitExpensesData = building.expenses.map(expense => {
                    const amount = getAmountPerUnit(expense, unit, building.units);
                    if (amount === 0) return null;
                    return {
                        expenseId: expense.id,
                        description: getExpenseDescription(expense.description),
                        date: new Date(expense.date).toISOString().split('T')[0],
                        unitShare: amount,
                        paymentStatus: t(`paymentStatus.${expense.paymentStatus[unit.id] || 'unpaid'}`)
                    };
                }).filter(Boolean);

                if (unitExpensesData.length > 0) {
                    const unitWorksheet = XLSX.utils.json_to_sheet(unitExpensesData as any[]);
                    const safeSheetName = `Unit_${unit.unitNumber}`.slice(0, 31);
                    XLSX.utils.book_append_sheet(workbook, unitWorksheet, safeSheetName);
                }
            });
            
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
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-col rtl:items-end ltr:items-start">
                    <CardTitle>{t('reportsTab.stats.title')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-4 bg-muted/50">
                        <div className="flex items-center gap-4" dir={direction}>
                            <Home className="w-8 h-8 text-primary"/>
                            <div className="rtl:text-right ltr:text-left">
                                <p className="text-sm text-muted-foreground">{t('reportsTab.stats.totalUnits')}</p>
                                <p className="text-2xl font-bold">{formatNumber(stats.totalUnits)}</p>
                            </div>
                        </div>
                    </Card>
                     <Card className="p-4 bg-muted/50">
                        <div className="flex items-center gap-4" dir={direction}>
                            <Users className="w-8 h-8 text-primary"/>
                            <div className="rtl:text-right ltr:text-left">
                                <p className="text-sm text-muted-foreground">{t('reportsTab.stats.totalOccupants')}</p>
                                <p className="text-2xl font-bold">{formatNumber(stats.totalOccupants)}</p>
                            </div>
                        </div>
                    </Card>
                     <Card className="p-4 bg-muted/50 flex flex-col justify-between">
                        <div className="flex items-center gap-4" dir={direction}>
                            <UserX className="w-8 h-8 text-primary"/>
                            <div className="rtl:text-right ltr:text-left">
                                <p className="text-sm text-muted-foreground">{t('reportsTab.stats.vacantUnits')}</p>
                                <p className="text-2xl font-bold">{formatNumber(stats.vacantUnitsCount)}</p>
                            </div>
                        </div>
                        {stats.vacantUnitsCount > 0 && (
                             <p className="text-xs text-muted-foreground mt-2 truncate rtl:text-right ltr:text-left">
                                {t('reportsTab.stats.whichUnits')}: {stats.vacantUnitNames.join(', ')}
                             </p>
                        )}
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-col rtl:items-end ltr:items-start">
                    <CardTitle>{t('reportsTab.fund.title')}</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center justify-center p-6 rounded-lg bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                        <div className="text-center flex items-center gap-4">
                            <Wallet size={40}/>
                            <div>
                                <p className="font-semibold">{t('reportsTab.fund.balance')}</p>
                                <p className="text-4xl font-bold tracking-tight">{formatNumber(stats.fundBalance)} {t('addExpenseDialog.currency')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                         <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-2"><ArrowDown size={16}/> {t('reportsTab.fund.inflow')}</p>
                            <p className="font-bold">{formatNumber(stats.fundInflow)}</p>
                         </div>
                         <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400 font-semibold flex items-center justify-center gap-2"><ArrowUp size={16}/> {t('reportsTab.fund.outflow')}</p>
                            <p className="font-bold">{formatNumber(stats.fundOutflow)}</p>
                         </div>
                    </div>
                 </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-col rtl:items-end ltr:items-start">
                    <CardTitle className="flex items-center gap-2 rtl:flex-row-reverse">
                        <AlertTriangle className="text-destructive"/>
                        {t('reportsTab.overdue.title')}
                    </CardTitle>
                    <CardDescription>{t('reportsTab.overdue.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.overdueDebts.length > 0 ? (
                        <ul className="space-y-2">
                           {stats.overdueDebts.map(debt => (
                               <li key={debt.unitId} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg" dir={direction}>
                                   <span className="font-medium">{debt.unitName}</span>
                                   <span className="font-semibold text-destructive">{formatNumber(debt.amount)} {t('addExpenseDialog.currency')}</span>
                               </li>
                           ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">{t('reportsTab.overdue.none')}</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-col rtl:items-end ltr:items-start">
                    <CardTitle>{t('reportsTab.export.title')}</CardTitle>
                    <CardDescription>{t('reportsTab.export.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 rtl:text-right ltr:text-left">
                        <Label className="font-semibold">{t('reportsTab.exportType')}</Label>
                        <RadioGroup defaultValue="values" value={exportType} onValueChange={setExportType} dir={direction}>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <RadioGroupItem value="values" id="r1" />
                                <Label htmlFor="r1">{t('reportsTab.exportValues')}</Label>
                            </div>
                            <p className="text-xs text-muted-foreground ltr:pl-6 rtl:pr-6">{t('reportsTab.exportValuesDesc')}</p>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <RadioGroupItem value="formulas" id="r2" disabled />
                                <Label htmlFor="r2">{t('reportsTab.exportFormulas')}</Label>
                            </div>
                            <p className="text-xs text-muted-foreground ltr:pl-6 rtl:pr-6">{t('reportsTab.exportFormulasDesc')}</p>

                        </RadioGroup>
                    </div>
                    <div className="flex" dir={direction}>
                        <Button onClick={handleExport} className="w-full md:w-auto flex items-center gap-2 rtl:mr-auto ltr:ml-auto">
                            <Download size={20}/>
                            <span>{t('reportsTab.exportButton')}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
