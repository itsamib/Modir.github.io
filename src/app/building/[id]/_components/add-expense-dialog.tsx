
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
import { faIR } from 'date-fns/locale/fa-IR';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

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
    const [applicableUnits, setApplicableUnits] = useState<string[]>([]);
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
                setApplicableUnits(expense.applicableUnits || units.map(u => u.id));
            } else {
                setDescription('');
                setTotalAmount('');
                setDate(new Date());
                setDistributionMethod('unit_count');
                setPaidByManager(false);
                setChargeTo('all');
                setApplicableUnits(units.map(u => u.id));
            }
            setError('');
        }
    }, [isOpen, expense, units]);
    
    useEffect(() => {
        if (distributionMethod !== 'custom') {
            setApplicableUnits(units.map(u => u.id));
        }
    }, [distributionMethod, units]);


    const handleSave = () => {
        if (!description || !description.trim() || totalAmount === '' || totalAmount <= 0) {
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
            totalAmount: Number(totalAmount),
            date: date.toISOString(),
            distributionMethod,
            paidByManager,
            chargeTo,
            applicableUnits: distributionMethod === 'custom' ? applicableUnits : undefined,
        }, expense?.id);
    };
    
    const handleUnitCheck = (unitId: string) => {
        setApplicableUnits(prev => 
            prev.includes(unitId)
                ? prev.filter(id => id !== unitId)
                : [...prev, unitId]
        );
    }

    const handleSelectAllUnits = (checked: boolean | 'indeterminate') => {
        if (checked) {
            setApplicableUnits(units.map(u => u.id));
        } else {
            setApplicableUnits([]);
        }
    }
    
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{expense ? 'ویرایش هزینه' : 'افزودن هزینه جدید'}</DialogTitle>
          <DialogDescription>
            {expense ? 'اطلاعات هزینه را ویرایش کنید.' : 'اطلاعات هزینه را برای تقسیم بین واحدها وارد کنید.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">شرح هزینه</Label>
             <Combobox
                items={suggestedExpenses}
                value={description}
                onChange={setDescription}
                placeholder="انتخاب یا ورود شرح..."
                className="col-span-3"
              />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalAmount" className="text-right">مبلغ کل (تومان)</Label>
            <Input 
                id="totalAmount" 
                type="number" 
                value={totalAmount} 
                onChange={e => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="col-span-3 text-left" dir="ltr"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="date" className="text-right">تاریخ</Label>
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
            <Label htmlFor="distributionMethod" className="text-right">روش تقسیم</Label>
            <Select value={distributionMethod} onValueChange={(val: Expense['distributionMethod']) => setDistributionMethod(val)}>
                <SelectTrigger className="col-span-3"><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="unit_count">بر اساس تعداد واحدها</SelectItem>
                    <SelectItem value="occupants">بر اساس نفرات</SelectItem>
                    <SelectItem value="area">بر اساس متراژ</SelectItem>
                    <SelectItem value="custom">اختصاصی/سفارشی</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">پرداخت برای</Label>
              <RadioGroup 
                value={chargeTo} 
                onValueChange={(val: ChargeTo) => setChargeTo(val)}
                className="col-span-3 flex flex-col space-y-2"
              >
                  <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="all" id="r-all" />
                      <Label htmlFor="r-all">همه (ساکن فعلی)</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="owner" id="r-owner" />
                      <Label htmlFor="r-owner">فقط مالک</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="tenant" id="r-tenant" />
                      <Label htmlFor="r-tenant">فقط مستاجر</Label>
                  </div>
              </RadioGroup>
          </div>

          {distributionMethod === 'custom' && (
              <div className="col-span-4 border rounded-md p-4">
                <Label className="mb-2 block">واحدهای مورد نظر را انتخاب کنید:</Label>
                 <div className="flex items-center space-x-2 space-x-reverse pb-2 border-b mb-2">
                    <Checkbox 
                        id="select-all-units"
                        checked={applicableUnits.length === units.length ? true : applicableUnits.length === 0 ? false : 'indeterminate'}
                        onCheckedChange={handleSelectAllUnits}
                    />
                    <Label htmlFor="select-all-units" className="font-bold">انتخاب همه واحدها</Label>
                </div>
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
          <Button type="submit" onClick={handleSave}>ذخیره</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
