"use client"

import { useState } from 'react';
import { Building, Expense, Unit } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ReportsTabProps {
    building: Building;
}

const getAmountPerUnit = (expense: Expense, unit: Unit, allUnits: Unit[]): number => {
    switch (expense.distributionMethod) {
        case 'unit_count': {
             const applicableUnits = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
             return applicableUnits.length > 0 ? expense.totalAmount / applicableUnits.length : 0;
        }
        case 'occupants': {
            const applicableUnits = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
            const totalOccupants = applicableUnits.reduce((sum, u) => sum + u.occupants, 0);
            return totalOccupants > 0 ? (expense.totalAmount * unit.occupants) / totalOccupants : 0;
        }
        case 'area': {
            const applicableUnits = expense.applicableUnits ? allUnits.filter(u => expense.applicableUnits?.includes(u.id)) : allUnits;
            const totalArea = applicableUnits.reduce((sum, u) => sum + u.area, 0);
            return totalArea > 0 ? (expense.totalAmount * unit.area) / totalArea : 0;
        }
        case 'custom': {
            if (expense.applicableUnits?.includes(unit.id)) {
                 if (expense.customAmounts && expense.customAmounts[unit.id]) {
                    return expense.customAmounts[unit.id];
                 }
                 const numApplicable = expense.applicableUnits?.length || 1;
                 return expense.totalAmount / numApplicable;
            }
            return 0;
        }
        default:
            return 0;
    }
};


export function ReportsTab({ building }: ReportsTabProps) {
    const [exportType, setExportType] = useState("values");
    const { toast } = useToast();

    const handleExport = () => {
        try {
            const data = building.expenses.flatMap(expense => {
                return building.units.map(unit => {
                    const isApplicable = expense.distributionMethod !== 'custom' || expense.applicableUnits?.includes(unit.id);
                    if (!isApplicable) return null;

                    const amount = getAmountPerUnit(expense, unit, building.units);
                    const paymentStatus = expense.paymentStatus[unit.id] || 'unpaid';

                    return {
                        'شرح هزینه': expense.description,
                        'تاریخ': new Date(expense.date).toLocaleDateString('fa-IR'),
                        'مبلغ کل هزینه': expense.totalAmount,
                        'روش تقسیم': expense.distributionMethod,
                        'پرداخت توسط مدیر': expense.paidByManager ? 'بله' : 'خیر',
                        'واحد': unit.name,
                        'مالک': unit.ownerName,
                        'مستاجر': unit.tenantName || '-',
                        'سهم واحد': amount,
                        'وضعیت پرداخت': paymentStatus === 'paid' ? 'پرداخت شده' : 'پرداخت نشده',
                    };
                }).filter(Boolean); // Filter out null values
            });

            if (data.length === 0) {
                 toast({
                    title: "خطا",
                    description: "هیچ داده‌ای برای خروجی گرفتن وجود ندارد.",
                    variant: "destructive"
                });
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "گزارش هزینه ها");
            
            // Note: 'formulas' export type is more complex and requires careful sheet construction.
            // This implementation primarily handles 'values'.
            XLSX.writeFile(workbook, `${building.name}-report.xlsx`);

            toast({
                title: "خروجی اکسل موفق",
                description: `فایل اکسل برای ساختمان "${building.name}" با موفقیت ایجاد شد.`,
                className: "bg-primary text-primary-foreground"
            });

        } catch (error) {
             console.error("Excel export failed:", error);
             toast({
                title: "خطا در تهیه خروجی",
                description: "مشکلی در ایجاد فایل اکسل پیش آمد. لطفا دوباره تلاش کنید.",
                variant: "destructive"
             })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>تهیه گزارش اکسل</CardTitle>
                <CardDescription>از اطلاعات هزینه‌ها و واحدها خروجی اکسل تهیه کنید.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label className="font-semibold">نوع خروجی</Label>
                    <RadioGroup defaultValue="values" value={exportType} onValueChange={setExportType}>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="values" id="r1" />
                            <Label htmlFor="r1">فقط مقادیر محاسبه‌شده</Label>
                        </div>
                         <p className="text-xs text-muted-foreground pr-6">خروجی شامل داده‌های نهایی و بدون فرمول‌های اکسل خواهد بود. (توصیه شده)</p>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="formulas" id="r2" disabled />
                            <Label htmlFor="r2">شامل فرمول‌های زنده اکسل (به زودی)</Label>
                        </div>
                        <p className="text-xs text-muted-foreground pr-6">خروجی شامل فرمول‌ها خواهد بود که محاسبات را در خود اکسل انجام می‌دهند.</p>

                    </RadioGroup>
                </div>
                <Button onClick={handleExport} className="w-full md:w-auto flex items-center gap-2">
                    <Download size={20}/>
                    <span>تهیه خروجی</span>
                </Button>
            </CardContent>
        </Card>
    )
}
