
"use client"

import { useState, useEffect } from 'react';
import { Expense, Unit, ChargeTo } from "@/hooks/use-building-data"
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
import { Combobox } from '@/components/ui/combobox';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AddExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>, expenseId?: string) => void;
  units: Unit[];
  expense: Expense | null;
}

const suggestedExpenses = [
    { value: 'شارژ ماهیانه', label: 'شارژ ماهیانه' },
    { value: 'قبض آب', label: 'قبض آب' },
    { value: 'قبض برق', label: 'قبض برق' },
    { value: 'قبض گاز', label: 'قبض گاز' },
    { value: 'نظافت', label: 'نظافت' },
];

export function AddExpenseDialog({ isOpen, onClose, onSave, units, expense }: AddExpenseDialogProps) {
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState<number | ''>('');
    const [date, setDate] = useState<Date>(new Date());
    const [distributionMethod, setDistributionMethod] = useState<Expense['distributionMethod']>('unit_count');
    const [paidByManager, setPaidByManager] = useState(false);
    const [chargeTo, setChargeTo] = useState<ChargeTo>('all');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (expense) {
                setDescription(expense.description);
                setTotalAmount(expense.totalAmount);
                setDate(new Date(expense.date));
                setDistributionMethod(expense.distributionMethod);
                setPaidByManager(expense.paidByManager);
                setChargeTo(expense.chargeTo || 'all');
            } else {
                setDescription('');
                setTotalAmount('');
                setDate(new Date());
                setDistributionMethod('unit_count');
                setPaidByManager(false);
                setChargeTo('all');
            }
            setError('');
        }
    }, [isOpen, expense, units]);
    

    const handleSave = () => {
        if (!description.trim() || totalAmount === '' || totalAmount <= 0) {
            setError('شرح هزینه و مبلغ باید معتبر باشند.');
            return;
        }
        setError('');
        onSave({
            description,
            totalAmount: Number(totalAmount),
            date: date.toISOString(),
            distributionMethod,
            paidByManager,
            chargeTo,
            applicableUnits: undefined, // applicableUnits is only for custom
        }, expense?.id);
    };
    
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{expense ? 'ویرایش هزینه' : 'افزودن هزینه جدید'}</DialogTitle>
          <DialogDescription>
            {expense ? 'اطلاعات هزینه را ویرایش کنید.' : 'اطلاعات هزینه را برای تقسیم بین واحدها وارد کنید.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right text-xs">شرح هزینه</Label>
             <Combobox
                items={suggestedExpenses}
                value={description}
                onChange={setDescription}
                placeholder="انتخاب یا ورود شرح..."
                className="col-span-3"
              />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalAmount" className="text-right text-xs">مبلغ کل (تومان)</Label>
            <Input 
                id="totalAmount" 
                type="number" 
                value={totalAmount} 
                onChange={e => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="col-span-3 text-left" dir="ltr"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="date" className="text-right text-xs">تاریخ</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "col-span-3 justify-start text-right font-normal",
                        !date && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {date ? format(date, 'd MMMM yyyy', { locale: faIR }) : <span>یک تاریخ انتخاب کنید</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        initialFocus
                        locale={faIR}
                    />
                </PopoverContent>
            </Popover>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="distributionMethod" className="text-right text-xs">روش تقسیم</Label>
            <Select 
                value={distributionMethod} 
                onValueChange={(val: Expense['distributionMethod']) => setDistributionMethod(val)}
                dir="rtl"
            >
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="روش تقسیم را انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unit_count">بر اساس تعداد واحد</SelectItem>
                    <SelectItem value="occupants">بر اساس تعداد نفرات</SelectItem>
                    <SelectItem value="area">بر اساس متراژ</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
             <Label className="text-right text-xs">پرداخت برای</Label>
             <RadioGroup
                value={chargeTo}
                onValueChange={(val: ChargeTo) => setChargeTo(val)}
                className="col-span-3 flex items-center space-x-4 rtl:space-x-reverse"
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="all" id="r-all" />
                    <Label htmlFor="r-all" className="text-xs font-normal">همه ساکنین</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="owner" id="r-owner" />
                    <Label htmlFor="r-owner" className="text-xs font-normal">فقط مالک</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="tenant" id="r-tenant" />
                    <Label htmlFor="r-tenant" className="text-xs font-normal">فقط مستاجر</Label>
                </div>
            </RadioGroup>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paidByManager" className="text-right text-xs">پرداختی مدیر</Label>
            <Switch id="paidByManager" checked={paidByManager} onCheckedChange={setPaidByManager} className="col-span-3 justify-self-start" />
          </div>

          {error && <p className="text-sm font-medium text-destructive col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>لغو</Button>
          <Button type="submit" onClick={handleSave}>ذخیره</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
