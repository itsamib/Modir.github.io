"use client"

import { useState, useMemo } from 'react';
import { Building, Expense, Unit, useBuildingData } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, SlidersHorizontal, UserCheck } from 'lucide-react';
import { AddExpenseDialog } from './add-expense-dialog';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge } from './payment-status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ExpensesTabProps {
    building: Building;
    onDataChange: () => void;
}

const getAmountPerUnit = (expense: Expense, unit: Unit, allUnits: Unit[]): number => {
    // This function logic seems correct and doesn't need changes for the request.
    // It calculates share based on different methods.
    switch (expense.distributionMethod) {
        case 'unit_count':
            const applicableUnitsCount = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
            return applicableUnitsCount.length > 0 ? expense.totalAmount / applicableUnitsCount.length : 0;
        case 'occupants':
            const applicableUnitsOccupants = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
            const totalOccupants = applicableUnitsOccupants.reduce((sum, u) => sum + u.occupants, 0);
            return totalOccupants > 0 ? (expense.totalAmount * unit.occupants) / totalOccupants : 0;
        case 'area':
            const applicableUnitsArea = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
            const totalArea = applicableUnitsArea.reduce((sum, u) => sum + u.area, 0);
            return totalArea > 0 ? (expense.totalAmount * unit.area) / totalArea : 0;
        case 'custom':
            if (expense.applicableUnits?.includes(unit.id)) {
                 if (expense.customAmounts && expense.customAmounts[unit.id]) {
                    return expense.customAmounts[unit.id];
                 }
                 const numApplicable = expense.applicableUnits?.length || 1;
                 return expense.totalAmount / numApplicable;
            }
            return 0;
        default:
            return 0;
    }
};

export function ExpensesTab({ building, onDataChange }: ExpensesTabProps) {
    const { addExpenseToBuilding, updateExpensePaymentStatus } = useBuildingData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [yearFilter, setYearFilter] = useState<string>("all");
    const [monthFilter, setMonthFilter] = useState<string>("all");
    const [showManagerExpenses, setShowManagerExpenses] = useState(false);

    const years = useMemo(() => {
        const expenseYears = building.expenses.map(e => new Date(e.date).getFullYear());
        return ["all", ...Array.from(new Set(expenseYears)).sort((a, b) => b - a).map(String)];
    }, [building.expenses]);

    const filteredExpenses = useMemo(() => {
        return building.expenses
            .filter(e => yearFilter === "all" || new Date(e.date).getFullYear().toString() === yearFilter)
            .filter(e => monthFilter === "all" || (new Date(e.date).getMonth() + 1).toString() === monthFilter)
            .filter(e => !showManagerExpenses || e.paidByManager)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [building.expenses, yearFilter, monthFilter, showManagerExpenses]);

    const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>) => {
        addExpenseToBuilding(building.id, expenseData, () => {
            onDataChange();
            setIsDialogOpen(false);
        });
    }

    const handleUpdateStatus = (expenseId: string, unitId: string, currentStatus: PaymentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
        updateExpensePaymentStatus(building.id, expenseId, unitId, newStatus, onDataChange);
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <CardTitle>لیست هزینه‌ها</CardTitle>
                        <CardDescription>هزینه‌های ثبت‌شده برای ساختمان را مشاهده و مدیریت کنید.</CardDescription>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
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
                                                        <span>{Math.ceil(amountPerUnit).toLocaleString('fa-IR')}</span>
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
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSaveExpense}
                units={building.units}
            />
        </Card>
    )
}
