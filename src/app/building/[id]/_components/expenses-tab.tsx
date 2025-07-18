"use client"

import { useState, useMemo } from 'react';
import { Building, Expense, Unit, useBuildingData, PaymentStatus, ChargeTo } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, SlidersHorizontal, UserCheck, Edit, Trash2, Users, Calendar, Building as BuildingIcon } from 'lucide-react';
import { AddExpenseDialog } from './add-expense-dialog';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge } from './payment-status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { format, getYear } from 'date-fns-jalali';
import { faIR, enUS } from 'date-fns-jalali/locale';
import { useLanguage } from '@/context/language-context';

interface ExpensesTabProps {
    building: Building;
    onDataChange: () => void;
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


export function ExpensesTab({ building, onDataChange }: ExpensesTabProps) {
    const { addExpenseToBuilding, updateExpenseInBuilding, updateExpensePaymentStatus, deleteExpenseFromBuilding } = useBuildingData();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<string>("all");
    const [monthFilter, setMonthFilter] = useState<string>("all");
    const [showManagerExpenses, setShowManagerExpenses] = useState(false);
    const [viewMode, setViewMode] = useState<'byDate' | 'byUnit'>('byDate');
    const { t, language, direction } = useLanguage();

    const chargeToText = (chargeTo: ChargeTo) => {
        switch(chargeTo) {
            case 'owner': return t('expensesTab.badges.chargeToOwner');
            case 'tenant': return t('expensesTab.badges.chargeToTenant');
            default: return t('expensesTab.badges.chargeToAll');
        }
    }

    const years = useMemo(() => {
        const expenseYears = building.expenses.map(e => getYear(new Date(e.date)).toString());
        return ["all", ...Array.from(new Set(expenseYears)).sort((a, b) => b.localeCompare(a))];
    }, [building.expenses]);

    const dateFilteredExpenses = useMemo(() => {
        return building.expenses
            .filter(e => {
                const expenseDate = new Date(e.date);
                const yearMatches = yearFilter === "all" || getYear(expenseDate).toString() === yearFilter;
                const monthMatches = monthFilter === "all" || (expenseDate.getMonth() + 1).toString() === monthFilter;
                return yearMatches && monthMatches;
            })
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [building.expenses, yearFilter, monthFilter]);
    
    const managerFilteredExpenses = useMemo(() => {
        const sourceExpenses = viewMode === 'byDate' ? dateFilteredExpenses : building.expenses;
        return sourceExpenses
            .filter(e => !showManagerExpenses || e.paidByManager)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [viewMode, dateFilteredExpenses, building.expenses, showManagerExpenses]);

    const expensesByUnit = useMemo(() => {
        const result: Record<string, { unit: Unit, expenses: (Expense & { amount: number })[], totalUnpaid: number }> = {};
        building.units.forEach(unit => {
            const unitExpenses: (Expense & { amount: number })[] = [];
            let totalUnpaidForUnit = 0;

            for (const expense of building.expenses) {
                const amount = getAmountPerUnit(expense, unit, building.units);
                if (amount > 0) {
                    unitExpenses.push({ ...expense, amount });
                    const isUnpaid = (expense.paymentStatus[unit.id] || 'unpaid') === 'unpaid';
                    if (isUnpaid) {
                        totalUnpaidForUnit += amount;
                    }
                }
            }

            unitExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            result[unit.id] = { unit, expenses: unitExpenses, totalUnpaid: totalUnpaidForUnit };
        });
        return result;
    }, [building.units, building.expenses]);


    const handleOpenAddDialog = (expense: Expense | null) => {
        setEditingExpense(expense);
        setIsAddDialogOpen(true);
    }
    
    const handleCloseAddDialog = () => {
        setEditingExpense(null);
        setIsAddDialogOpen(false);
    }

    const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>, expenseId?: string) => {
        const callback = () => {
            onDataChange();
            handleCloseAddDialog();
        };

        if (expenseId) {
            updateExpenseInBuilding(building.id, expenseId, expenseData, callback);
        } else {
            addExpenseToBuilding(building.id, expenseData, callback);
        }
    }

    const handleUpdateStatus = (expenseId: string, unitId: string, currentStatus: PaymentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
        updateExpensePaymentStatus(building.id, expenseId, unitId, newStatus, onDataChange);
    }

    const openDeleteDialog = (expenseId: string) => {
        setDeletingExpenseId(expenseId);
        setIsDeleteDialogOpen(true);
    }

    const handleDeleteExpense = () => {
        if (deletingExpenseId) {
            deleteExpenseFromBuilding(building.id, deletingExpenseId, () => {
                onDataChange();
                setIsDeleteDialogOpen(false);
                setDeletingExpenseId(null);
            });
        }
    }
    
    const getTotalAmountForDisplay = (expense: Expense) => {
        if (expense.distributionMethod === 'custom') {
            const perUnitAmount = expense.totalAmount;
            const applicableUnitCount = expense.applicableUnits?.length ?? 0;
            return perUnitAmount * applicableUnitCount;
        }
        return expense.totalAmount;
    }
    
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat(language === 'fa' ? 'fa-IR' : 'en-US').format(num);
    }

    const getExpenseDescription = (description: string) => {
        // If description is a translation key, translate it. Otherwise, return it as is.
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

    const renderByDateView = () => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('expensesTab.table.description')}</TableHead>
                        <TableHead>{t('expensesTab.table.date')}</TableHead>
                        <TableHead>{t('expensesTab.table.totalAmount')}</TableHead>
                        {building.units.map(unit => (
                            <TableHead key={unit.id} className="text-center">{getUnitName(unit)}</TableHead>
                        ))}
                        <TableHead className="text-center">{t('expensesTab.table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {managerFilteredExpenses.map(expense => (
                        <TableRow key={expense.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col gap-1">
                                    <span>{getExpenseDescription(expense.description)}</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {expense.paidByManager && <Badge variant="secondary" className="w-fit text-xs flex items-center gap-1"><UserCheck size={12} />{t('expensesTab.badges.paidByManager')}</Badge>}
                                         <Badge variant="outline" className="w-fit text-xs flex items-center gap-1"><Users size={12} />{chargeToText(expense.chargeTo)}</Badge>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{format(new Date(expense.date), 'd MMMM yyyy', { locale: language === 'fa' ? faIR : enUS })}</TableCell>
                            <TableCell>{formatNumber(Math.ceil(getTotalAmountForDisplay(expense)))}</TableCell>
                            {building.units.map(unit => {
                                const amountPerUnit = getAmountPerUnit(expense, unit, building.units);
                                const status = expense.paymentStatus[unit.id] || 'unpaid';
                                
                                const isApplicable = amountPerUnit > 0;

                                return (
                                    <TableCell key={unit.id} className="text-center">
                                        {isApplicable ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span>{formatNumber(amountPerUnit)}</span>
                                                 <PaymentStatusBadge 
                                                    status={status}
                                                    onClick={() => handleUpdateStatus(expense.id, unit.id, status)}
                                                 />
                                            </div>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </TableCell>
                                )
                            })}
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenAddDialog(expense)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(expense.id)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {managerFilteredExpenses.length === 0 && (
                 <div className="text-center py-10 text-muted-foreground">{t('expensesTab.noExpensesFound')}</div>
            )}
        </div>
    );

    const renderByUnitView = () => (
        <Accordion type="single" collapsible className="w-full">
            {Object.values(expensesByUnit).map(({ unit, expenses, totalUnpaid }) => (
                <AccordionItem value={unit.id} key={unit.id}>
                    <AccordionTrigger>
                       <div className="flex justify-between w-full items-center rtl:pr-2 ltr:pl-2">
                            <span>{getUnitName(unit)}</span>
                            {totalUnpaid > 0 ? (
                                <Badge variant="destructive">{t('expensesTab.unpaidAmount', {amount: formatNumber(totalUnpaid)})}</Badge>
                            ) : (
                                <Badge className="bg-green-500 hover:bg-green-600">{t('expensesTab.allPaid')}</Badge>
                            )}
                       </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        {expenses.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('expensesTab.table.description')}</TableHead>
                                        <TableHead>{t('expensesTab.table.date')}</TableHead>
                                        <TableHead>{t('expensesTab.table.unitShare')}</TableHead>
                                        <TableHead className="text-center">{t('expensesTab.table.paymentStatus')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map(expense => (
                                        <TableRow key={`${unit.id}-${expense.id}`}>
                                            <TableCell className="font-medium">{getExpenseDescription(expense.description)}</TableCell>
                                            <TableCell>{format(new Date(expense.date), 'd MMMM yyyy', { locale: language === 'fa' ? faIR : enUS })}</TableCell>
                                            <TableCell>{formatNumber(expense.amount)}</TableCell>
                                            <TableCell className="flex justify-center">
                                                <PaymentStatusBadge 
                                                    status={expense.paymentStatus[unit.id] || 'unpaid'}
                                                    onClick={() => handleUpdateStatus(expense.id, unit.id, expense.paymentStatus[unit.id] || 'unpaid')}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground p-4">{t('expensesTab.noExpensesForUnit')}</p>
                        )}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1">
                        <CardTitle>{t('expensesTab.title')}</CardTitle>
                        <CardDescription>{t('expensesTab.description')}</CardDescription>
                    </div>
                     <Button onClick={() => handleOpenAddDialog(null)} className="flex items-center gap-2 rtl:ml-0 ltr:ml-auto rtl:mr-auto shrink-0">
                        <PlusCircle size={20} />
                        <span>{t('expensesTab.addExpense')}</span>
                    </Button>
                </div>
                 <div className="flex flex-col gap-4 pt-4 border-t mt-4 items-start sm:items-end">
                     <div className="flex flex-wrap gap-4 items-center w-full justify-start rtl:justify-end">
                        <RadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="flex gap-x-4 gap-y-2 items-center" dir={direction}>
                            <Label>{t('expensesTab.viewMode.title')}</Label>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <RadioGroupItem value="byDate" id="byDate" />
                                <Label htmlFor="byDate" className="font-normal flex items-center gap-2"><Calendar size={16}/> {t('expensesTab.viewMode.byDate')}</Label>
                            </div>
                             <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <RadioGroupItem value="byUnit" id="byUnit" />
                                <Label htmlFor="byUnit" className="font-normal flex items-center gap-2"><BuildingIcon size={16}/> {t('expensesTab.viewMode.byUnit')}</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {viewMode === 'byDate' && (
                        <div className="flex flex-wrap gap-4 items-center w-full justify-start rtl:justify-end">
                            <SlidersHorizontal className="text-muted-foreground" />
                            <Select value={yearFilter} onValueChange={setYearFilter} dir={direction}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('expensesTab.filterByYear')} /></SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y} value={y}>{y === "all" ? t('expensesTab.allYears') : formatNumber(parseInt(y))}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={monthFilter} onValueChange={setMonthFilter} dir={direction}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('expensesTab.filterByMonth')} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('expensesTab.allMonths')}</SelectItem>
                                    {Array.from({length: 12}, (_, i) => <SelectItem key={i+1} value={String(i+1)}>{format(new Date(2000, i, 1), 'MMMM', { locale: language === 'fa' ? faIR : enUS })}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-4 items-center justify-start rtl:justify-end w-full">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <UserCheck className="text-muted-foreground"/>
                            <Label htmlFor="manager-expenses">{t('expensesTab.managerPayments')}</Label>
                            <Switch id="manager-expenses" checked={showManagerExpenses} onCheckedChange={setShowManagerExpenses} />
                            <p className="text-xs text-muted-foreground">{t('expensesTab.managerPaymentsTooltip')}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === 'byDate' ? renderByDateView() : renderByUnitView()}
            </CardContent>
            <AddExpenseDialog
                isOpen={isAddDialogOpen}
                onClose={handleCloseAddDialog}
                onSave={handleSaveExpense}
                units={building.units}
                expense={editingExpense}
            />
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('expensesTab.confirmDeleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('expensesTab.confirmDeleteDesc')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('global.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive hover:bg-destructive/90">{t('global.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
