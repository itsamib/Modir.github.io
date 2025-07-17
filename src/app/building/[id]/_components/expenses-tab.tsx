
"use client"

import { useState, useMemo } from 'react';
import { Building, Expense, Unit, useBuildingData, PaymentStatus } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, SlidersHorizontal, UserCheck, Edit, Trash2 } from 'lucide-react';
import { AddExpenseDialog } from './add-expense-dialog';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge } from './payment-status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface ExpensesTabProps {
    building: Building;
    onDataChange: () => void;
}

const getAmountPerUnit = (expense: Expense, unit: Unit, allUnits: Unit[]): number => {
    let amount = 0;
    switch (expense.distributionMethod) {
        case 'unit_count': {
            const applicableUnits = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
            amount = applicableUnits.length > 0 ? expense.totalAmount / applicableUnits.length : 0;
            break;
        }
        case 'occupants': {
            const applicableUnits = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
            const totalOccupants = applicableUnits.reduce((sum, u) => sum + u.occupants, 0);
            amount = totalOccupants > 0 ? (expense.totalAmount * unit.occupants) / totalOccupants : 0;
            break;
        }
        case 'area': {
            const applicableUnits = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
            const totalArea = applicableUnits.reduce((sum, u) => sum + u.area, 0);
            amount = totalArea > 0 ? (expense.totalAmount * unit.area) / totalArea : 0;
            break;
        }
        case 'custom': {
            if (expense.applicableUnits?.includes(unit.id)) {
                 if (expense.customAmounts && expense.customAmounts[unit.id]) {
                    amount = expense.customAmounts[unit.id];
                 } else {
                    const numApplicable = expense.applicableUnits?.length || 1;
                    amount = expense.totalAmount / numApplicable;
                 }
            } else {
                amount = 0;
            }
            break;
        }
        default:
            amount = 0;
            break;
    }
    return Math.ceil(amount / 1000) * 1000;
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

    const years = useMemo(() => {
        const expenseYears = building.expenses.map(e => new Date(e.date).toLocaleDateString('fa-IR', { year: 'numeric' }));
        return ["all", ...Array.from(new Set(expenseYears)).sort((a, b) => b.localeCompare(a)).map(String)];
    }, [building.expenses]);

    const filteredExpenses = useMemo(() => {
        return building.expenses
            .filter(e => {
                const expenseDate = new Date(e.date);
                const yearMatches = yearFilter === "all" || expenseDate.toLocaleDateString('fa-IR', { year: 'numeric' }) === yearFilter;
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
    
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <CardTitle>لیست هزینه‌ها</CardTitle>
                        <CardDescription>هزینه‌های ثبت‌شده برای ساختمان را مشاهده و مدیریت کنید.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenAddDialog(null)} className="flex items-center gap-2">
                        <PlusCircle size={20} />
                        <span>افزودن هزینه</span>
                    </Button>
                </div>
                 <div className="flex flex-wrap gap-4 items-center pt-4">
                    <SlidersHorizontal className="text-muted-foreground" />
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="فیلتر بر اساس سال" /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y === "all" ? "همه سال‌ها" : y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="فیلتر بر اساس ماه" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه ماه‌ها</SelectItem>
                            {Array.from({length: 12}, (_, i) => <SelectItem key={i+1} value={String(i+1)}>{new Date(0, i).toLocaleString('fa-IR', { month: 'long' })}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <UserCheck className="text-muted-foreground"/>
                        <Label htmlFor="manager-expenses">پرداختی‌های مدیر</Label>
                        <Switch id="manager-expenses" checked={showManagerExpenses} onCheckedChange={setShowManagerExpenses} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>شرح هزینه</TableHead>
                                <TableHead>تاریخ</TableHead>
                                <TableHead>مبلغ کل</TableHead>
                                {building.units.map(unit => (
                                    <TableHead key={unit.id} className="text-center">{unit.name}</TableHead>
                                ))}
                                <TableHead className="text-center">عملیات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{expense.description}</span>
                                            {expense.paidByManager && <Badge variant="secondary" className="w-fit mt-1">پرداخت توسط مدیر</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{new Date(expense.date).toLocaleDateString('fa-IR')}</TableCell>
                                    <TableCell>{Math.ceil(expense.totalAmount).toLocaleString('fa-IR')} تومان</TableCell>
                                    {building.units.map(unit => {
                                        const amountPerUnit = getAmountPerUnit(expense, unit, building.units);
                                        const status = expense.paymentStatus[unit.id] || 'unpaid';
                                        
                                        const isApplicable = expense.distributionMethod !== 'custom' || expense.applicableUnits?.includes(unit.id);

                                        return (
                                            <TableCell key={unit.id} className="text-center">
                                                {isApplicable ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span>{amountPerUnit.toLocaleString('fa-IR')}</span>
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
                     <div className="text-center py-10 text-muted-foreground">هیچ هزینه‌ای با فیلترهای انتخابی یافت نشد.</div>
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
                    <AlertDialogTitle>آیا از حذف این هزینه مطمئن هستید؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        این عمل قابل بازگشت نیست. با حذف این هزینه، تمام اطلاعات مربوط به آن برای همیشه پاک خواهد شد.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>لغو</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

    
