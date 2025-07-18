"use client"

import { useState, useEffect, useMemo } from 'react';
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
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns-jalali';
import { faIR, enUS } from 'date-fns-jalali/locale';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/language-context';

type ExpenseCategory = 'monthly_charge' | 'utility_bill' | 'cleaning' | 'repairs' | 'other';

interface AddExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>, expenseId?: string) => void;
  units: Unit[];
  expense: Expense | null;
}


export function AddExpenseDialog({ isOpen, onClose, onSave, units, expense }: AddExpenseDialogProps) {
    const { t, language, direction } = useLanguage();
    
    const expenseCategories = useMemo(() => [
        { value: 'monthly_charge', key: 'addExpenseDialog.categories.monthly_charge', label: t('addExpenseDialog.categories.monthly_charge') },
        { value: 'utility_bill', key: 'addExpenseDialog.categories.utility_bill', label: t('addExpenseDialog.categories.utility_bill') },
        { value: 'cleaning', key: 'addExpenseDialog.categories.cleaning', label: t('addExpenseDialog.categories.cleaning') },
        { value: 'repairs', key: 'addExpenseDialog.categories.repairs', label: t('addExpenseDialog.categories.repairs') },
        { value: 'other', key: 'addExpenseDialog.categories.other', label: t('addExpenseDialog.categories.other') },
    ], [t]);

    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('monthly_charge');
    const [totalAmount, setTotalAmount] = useState<number | ''>('');
    const [date, setDate] = useState<Date>(new Date());
    const [distributionMethod, setDistributionMethod] = useState<Expense['distributionMethod']>('unit_count');
    const [paidByManager, setPaidByManager] = useState(false);
    const [deductFromFund, setDeductFromFund] = useState(false);
    const [chargeTo, setChargeTo] = useState<ChargeTo>('all');
    const [applicableUnits, setApplicableUnits] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (expense) {
                const foundCategory = expenseCategories.find(c => c.key === expense.description);
                if (foundCategory) {
                    setCategory(foundCategory.value as ExpenseCategory);
                    setDescription('');
                } else {
                    // It must be a custom description
                    setCategory('other');
                    setDescription(expense.description);
                }
                setTotalAmount(expense.totalAmount);
                setDate(new Date(expense.date));
                setDistributionMethod(expense.distributionMethod);
                setPaidByManager(expense.paidByManager);
                setDeductFromFund(expense.deductFromFund || false);
                setChargeTo(expense.chargeTo || 'all');
                setApplicableUnits(expense.applicableUnits || units.map(u => u.id));
            } else {
                setCategory('monthly_charge');
                setDescription('');
                setTotalAmount('');
                setDate(new Date());
                setDistributionMethod('unit_count');
                setPaidByManager(false);
                setDeductFromFund(false);
                setChargeTo('all');
                setApplicableUnits(units.map(u => u.id));
            }
            setError('');
        }
    }, [isOpen, expense, units, expenseCategories]);
    
    useEffect(() => {
        // If manager isn't paying, it can't be deducted from the fund.
        if (!paidByManager) {
            setDeductFromFund(false);
        }
    }, [paidByManager]);

    const handleUnitSelection = (unitId: string, checked: boolean) => {
        setApplicableUnits(prev => 
            checked ? [...prev, unitId] : prev.filter(id => id !== unitId)
        );
    };

    const handleSelectAll = (checked: boolean) => {
        setApplicableUnits(checked ? units.map(u => u.id) : []);
    };

    const handleSave = () => {
        let finalDescription: string;
        if (category === 'other') {
            finalDescription = description.trim();
        } else {
            finalDescription = expenseCategories.find(c => c.value === category)?.key || 'addExpenseDialog.categories.other';
        }

        if ((category === 'other' && !finalDescription) || totalAmount === '' || totalAmount <= 0) {
            setError(t('addExpenseDialog.errorInvalid'));
            return;
        }
        if (distributionMethod === 'custom' && applicableUnits.length === 0) {
            setError(t('addExpenseDialog.errorCustomNoUnits'));
            return;
        }
        setError('');
        
        const isBuildingCharge = category === 'monthly_charge';

        onSave({
            description: finalDescription,
            totalAmount: Number(totalAmount),
            date: date.toISOString(),
            distributionMethod,
            paidByManager,
            chargeTo,
            applicableUnits: distributionMethod === 'custom' ? applicableUnits : undefined,
            isBuildingCharge,
            deductFromFund: paidByManager ? deductFromFund : false,
        }, expense?.id);
    };
    
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{expense ? t('addExpenseDialog.editTitle') : t('addExpenseDialog.addTitle')}</DialogTitle>
          <DialogDescription>
            {t('addExpenseDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          
           <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-xs pt-3">{t('addExpenseDialog.expenseDescription')}</Label>
                <div className="col-span-3 space-y-2">
                    <RadioGroup value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)} dir={direction}>
                        <div className="grid grid-cols-2 gap-2">
                        {expenseCategories.map(cat => (
                            <div key={cat.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                                <RadioGroupItem value={cat.value} id={`cat-${cat.value}`} />
                                <Label htmlFor={`cat-${cat.value}`} className="font-normal text-xs">{cat.label}</Label>
                            </div>
                        ))}
                        </div>
                    </RadioGroup>
                    {category === 'other' && (
                        <Input 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('addExpenseDialog.otherPlaceholder')}
                            className="mt-2"
                        />
                    )}
                </div>
            </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalAmount" className="text-right text-xs">
                {distributionMethod === 'custom' ? t('addExpenseDialog.amountPerUnit') : t('addExpenseDialog.totalAmount')} {t('addExpenseDialog.currency')}
            </Label>
            <Input 
                id="totalAmount" 
                type="number" 
                value={totalAmount} 
                onChange={e => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="col-span-3 text-left" dir="ltr"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="date" className="text-right text-xs">{t('addExpenseDialog.date')}</Label>
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
                    {date ? format(date, 'd MMMM yyyy', { locale: language === 'fa' ? faIR : enUS }) : <span>{t('addExpenseDialog.selectDate')}</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        initialFocus
                        locale={language === 'fa' ? faIR : enUS}
                    />
                </PopoverContent>
            </Popover>
          </div>

           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="distributionMethod" className="text-right text-xs">{t('addExpenseDialog.distributionMethod')}</Label>
            <Select 
                value={distributionMethod} 
                onValueChange={(val: Expense['distributionMethod']) => setDistributionMethod(val)}
                dir={direction}
            >
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('addExpenseDialog.selectDistributionMethod')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unit_count">{t('addExpenseDialog.methods.unit_count')}</SelectItem>
                    <SelectItem value="occupants">{t('addExpenseDialog.methods.occupants')}</SelectItem>
                    <SelectItem value="area">{t('addExpenseDialog.methods.area')}</SelectItem>
                    <SelectItem value="custom">{t('addExpenseDialog.methods.custom')}</SelectItem>
                </SelectContent>
            </Select>
          </div>

          {distributionMethod === 'custom' && (
             <div className="col-span-4 space-y-4 rounded-lg border bg-muted/50 p-4">
                 <p className="text-xs text-muted-foreground">
                    {t('addExpenseDialog.customAllocation.description')}
                </p>
                <Separator />
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Checkbox
                            id="select-all-units"
                            checked={applicableUnits.length === units.length}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                        <Label htmlFor="select-all-units" className="font-normal">{t('addExpenseDialog.customAllocation.selectAll')}</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-32 overflow-y-auto">
                        {units.map(unit => (
                            <div key={unit.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Checkbox
                                    id={`unit-${unit.id}`}
                                    checked={applicableUnits.includes(unit.id)}
                                    onCheckedChange={(checked) => handleUnitSelection(unit.id, checked as boolean)}
                                />
                                <Label htmlFor={`unit-${unit.id}`} className="font-normal">{t(unit.name, { number: unit.unitNumber })}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
           )}

          <div className="grid grid-cols-4 items-center gap-4">
             <Label className="text-right text-xs">{t('addExpenseDialog.chargeTo')}</Label>
             <RadioGroup
                value={chargeTo}
                onValueChange={(val: ChargeTo) => setChargeTo(val)}
                className="col-span-3 flex items-center gap-x-4"
                dir={direction}
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="all" id="r-all" />
                    <Label htmlFor="r-all" className="font-normal text-xs">{t('addExpenseDialog.chargeToOptions.all')}</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="owner" id="r-owner" />
                    <Label htmlFor="r-owner" className="font-normal text-xs">{t('addExpenseDialog.chargeToOptions.owner')}</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="tenant" id="r-tenant" />
                    <Label htmlFor="r-tenant" className="font-normal text-xs">{t('addExpenseDialog.chargeToOptions.tenant')}</Label>
                </div>
            </RadioGroup>
          </div>
          
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paidByManager" className="text-right text-xs">{t('addExpenseDialog.paidByManager')}</Label>
            <Switch id="paidByManager" checked={paidByManager} onCheckedChange={setPaidByManager} className="col-span-3 justify-self-start" />
          </div>

           {paidByManager && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deductFromFund" className="text-right text-xs">{t('addExpenseDialog.deductFromFund')}</Label>
              <Switch id="deductFromFund" checked={deductFromFund} onCheckedChange={setDeductFromFund} className="col-span-3 justify-self-start" />
            </div>
          )}


          {error && <p className="text-sm font-medium text-destructive col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('global.cancel')}</Button>
          <Button type="submit" onClick={handleSave}>{t('global.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
