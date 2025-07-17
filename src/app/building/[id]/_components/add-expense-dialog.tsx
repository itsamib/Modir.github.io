"use client"

import { useState, useEffect } from 'react';
import { Expense, Unit } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

interface AddExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>) => void;
  units: Unit[];
}

export function AddExpenseDialog({ isOpen, onClose, onSave, units }: AddExpenseDialogProps) {
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [distributionMethod, setDistributionMethod] = useState<Expense['distributionMethod']>('unit_count');
    const [paidByManager, setPaidByManager] = useState(false);
    const [applicableUnits, setApplicableUnits] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDescription('');
            setTotalAmount(0);
            setDate(new Date().toISOString().split('T')[0]);
            setDistributionMethod('unit_count');
            setPaidByManager(false);
            setApplicableUnits([]);
            setError('');
        }
    }, [isOpen]);
    
    useEffect(() => {
        if (distributionMethod === 'custom') {
            setApplicableUnits([]);
        } else {
            setApplicableUnits(units.map(u => u.id));
        }
    }, [distributionMethod, units]);


    const handleSave = () => {
        if (!description.trim() || totalAmount <= 0) {
            setError('شرح هزینه و مبلغ باید معتبر باشند.');
            return;
        }
        if (distributionMethod === 'custom' && applicableUnits.length === 0) {
            setError('برای تقسیم سفارشی، باید حداقل یک واحد را انتخاب کنید.');
            return;
        }
        setError('');
        onSave({
            description,
            totalAmount,
            date,
            distributionMethod,
            paidByManager,
            applicableUnits: distributionMethod === 'custom' ? applicableUnits : undefined,
        });
    };
    
    const handleUnitCheck = (unitId: string) => {
        setApplicableUnits(prev => 
            prev.includes(unitId)
                ? prev.filter(id => id !== unitId)
                : [...prev, unitId]
        );
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">افزودن هزینه جدید</DialogTitle>
          <DialogDescription>
            اطلاعات هزینه را برای تقسیم بین واحدها وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">شرح هزینه</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalAmount" className="text-right">مبلغ کل (تومان)</Label>
            <Input id="totalAmount" type="number" value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value))} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">تاریخ</Label>
            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="distributionMethod" className="text-right">روش تقسیم</Label>
            <Select value={distributionMethod} onValueChange={(val: Expense['distributionMethod']) => setDistributionMethod(val)}>
                <SelectTrigger className="col-span-3"><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="unit_count">بر اساس تعداد واحدها</SelectItem>
                    <SelectItem value="occupants">بر اساس نفرات</SelectItem>
                    <SelectItem value="area">بر اساس متراژ</SelectItem>
                    <SelectItem value="custom">اختصاصی/بدون تقسیم</SelectItem>
                </SelectContent>
            </Select>
          </div>
          {distributionMethod === 'custom' && (
              <div className="col-span-4 border rounded-md p-4">
                <Label className="mb-2 block">واحدهای مورد نظر را انتخاب کنید:</Label>
                <div className="grid grid-cols-2 gap-2">
                    {units.map(unit => (
                        <div key={unit.id} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox 
                                id={`unit-${unit.id}`}
                                checked={applicableUnits.includes(unit.id)}
                                onCheckedChange={() => handleUnitCheck(unit.id)}
                            />
                            <Label htmlFor={`unit-${unit.id}`}>{unit.name}</Label>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">مبلغ کل به طور مساوی بین واحدهای انتخاب شده تقسیم می‌شود.</p>
              </div>
          )}
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paidByManager" className="text-right">پرداختی مدیر</Label>
            <Switch id="paidByManager" checked={paidByManager} onCheckedChange={setPaidByManager} className="col-span-3 justify-self-start" />
          </div>

          {error && <p className="text-sm font-medium text-destructive col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>لغو</Button>
          <Button type="submit" onClick={handleSave}>ذخیره هزینه</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
