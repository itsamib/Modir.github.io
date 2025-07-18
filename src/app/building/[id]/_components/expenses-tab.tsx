"use client"

import { useState, useMemo } from 'react';
import { Building, Expense, Unit, useBuildingData, PaymentStatus, ChargeTo } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, SlidersHorizontal, UserCheck, Edit, Trash2, Users } from 'lucide-react';
import { AddExpenseDialog } from './add-expense-dialog';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge } from './payment-status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { faIR } from 'date-fns-jalali/locale';
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
    const { t, language } = useLanguage();

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

    const filteredExpenses = useMemo(() => {
        return building.expenses
            .filter(e => {
                const expenseDate = new Date(e.date);
                const yearMatches = yearFilter === "all" || getYear(expenseDate).toString() === yearFilter;
                const monthMatches = monthFilter === "all" || (expenseDate.getMonth() + 1).toString() === monthFilter;
                return yearMatches && monthMatches;
            })
            .filter(e => !showManagerExpenses || e.paidByManager)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [building.expenses, yearFilter, monthFilter, showManagerExpenses]);
    
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

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <CardTitle>{t('expensesTab.title')}</CardTitle>
                        <CardDescription>{t('expensesTab.description')}</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenAddDialog(null)} className="flex items-center gap-2">
                        <PlusCircle size={20} />
                        <span>{t('expensesTab.addExpense')}</span>
                    </Button>
                </div>
                 <div className="flex flex-wrap gap-4 items-center pt-4">
                    <SlidersHorizontal className="text-muted-foreground" />
                    <Select value={yearFilter} onValueChange={setYearFilter} dir={language === 'fa' ? 'rtl' : 'ltr'}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('expensesTab.filterByYear')} /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y === "all" ? t('expensesTab.allYears') : formatNumber(parseInt(y))}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={monthFilter} onValueChange={setMonthFilter} dir={language === 'fa' ? 'rtl' : 'ltr'}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('expensesTab.filterByMonth')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('expensesTab.allMonths')}</SelectItem>
                            {Array.from({length: 12}, (_, i) => <SelectItem key={i+1} value={String(i+1)}>{format(new Date(2000, i, 1), 'MMMM', { locale: faIR })}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <UserCheck className="text-muted-foreground"/>
                        <Label htmlFor="manager-expenses">{t('expensesTab.managerPayments')}</Label>
                        <Switch id="manager-expenses" checked={showManagerExpenses} onCheckedChange={setShowManagerExpenses} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('expensesTab.table.description')}</TableHead>
                                <TableHead>{t('expensesTab.table.date')}</TableHead>
                                <TableHead>{t('expensesTab.table.totalAmount')}</TableHead>
                                {building.units.map(unit => (
                                    <TableHead key={unit.id} className="text-center">{unit.name}</TableHead>
                                ))}
                                <TableHead className="text-center">{t('expensesTab.table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col gap-1">
                                            <span>{expense.description}</span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {expense.paidByManager && <Badge variant="secondary" className="w-fit text-xs"><UserCheck size={12} className="mx-1"/>{t('expensesTab.badges.paidByManager')}</Badge>}
                                                 <Badge variant="outline" className="w-fit text-xs"><Users size={12} className="mx-1"/>{chargeToText(expense.chargeTo)}</Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{format(new Date(expense.date), 'd MMMM yyyy', { locale: faIR })}</TableCell>
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
                </div>
                {filteredExpenses.length === 0 && (
                     <div className="text-center py-10 text-muted-foreground">{t('expensesTab.noExpensesFound')}</div>
                )}
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
