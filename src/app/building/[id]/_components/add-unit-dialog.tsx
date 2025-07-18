"use client"

import { useState, useEffect } from 'react';
import { Unit } from "@/hooks/use-building-data"
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
import { useLanguage } from '@/context/language-context';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface AddUnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unitData: Omit<Unit, 'id' | 'name' | 'unitNumber'> & { name: string; }) => void;
  unit: Unit | null;
}

export function AddUnitDialog({ isOpen, onClose, onSave, unit }: AddUnitDialogProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    customName: '',
    area: 0,
    occupants: 1,
    ownerName: '',
    tenantName: ''
  });
  const [isVacant, setIsVacant] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (unit) {
            const isCustomName = !unit.name.startsWith('unitsTab.table.defaultUnitName');
            const vacant = !unit.tenantName && unit.occupants === 0;
            setIsVacant(vacant);
            setFormData({
                customName: isCustomName ? unit.name : '',
                area: unit.area,
                occupants: vacant ? 0 : unit.occupants,
                ownerName: unit.ownerName,
                tenantName: vacant ? '' : (unit.tenantName || ''),
            });
        } else {
            setIsVacant(false);
            setFormData({
                customName: '', area: 0, occupants: 1, ownerName: '', tenantName: ''
            });
        }
        setError('');
    }
  }, [unit, isOpen]);

  useEffect(() => {
    if (isVacant) {
        setFormData(prev => ({
            ...prev,
            occupants: 0,
            tenantName: ''
        }));
    } else {
        // If it was vacant and now is not, reset occupants to 1 if it was 0
        setFormData(prev => ({
            ...prev,
            occupants: prev.occupants === 0 ? 1 : prev.occupants
        }));
    }
  }, [isVacant]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSave = () => {
    if (!formData.ownerName.trim()) {
        setError(t('addUnitDialog.errorOwnerRequired'));
        return;
    }
    setError('');

    const finalName = formData.customName.trim() || 'unitsTab.table.defaultUnitName';
    
    onSave({
        ...formData,
        name: finalName,
        tenantName: isVacant ? null : (formData.tenantName.trim() || null),
        occupants: isVacant ? 0 : Math.max(1, formData.occupants), // Ensure occupants is at least 1 if not vacant
        area: formData.area
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{unit ? t('addUnitDialog.editTitle') : t('addUnitDialog.addTitle')}</DialogTitle>
          <DialogDescription>
            {t('addUnitDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customName" className="text-right">{t('addUnitDialog.nameLabel')}</Label>
            <Input id="customName" value={formData.customName} onChange={handleChange} className="col-span-3" placeholder={t('unitsTab.table.defaultUnitName', { number: unit?.unitNumber })}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="area" className="text-right">{t('addUnitDialog.areaLabel')}</Label>
            <Input id="area" type="number" value={formData.area} onChange={handleChange} className="col-span-3"/>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ownerName" className="text-right">{t('addUnitDialog.ownerNameLabel')}</Label>
            <Input id="ownerName" value={formData.ownerName} onChange={handleChange} className="col-span-3"/>
          </div>

          <Separator />
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox id="isVacant" checked={isVacant} onCheckedChange={(checked) => setIsVacant(checked as boolean)} />
            <Label htmlFor="isVacant" className="font-medium">{t('addUnitDialog.isVacantLabel')}</Label>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="occupants" className="text-right">{t('addUnitDialog.occupantsLabel')}</Label>
            <Input id="occupants" type="number" value={formData.occupants} onChange={handleChange} className="col-span-3" disabled={isVacant}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tenantName" className="text-right">{t('addUnitDialog.tenantNameLabel')}</Label>
            <Input id="tenantName" value={formData.tenantName || ''} onChange={handleChange} className="col-span-3" placeholder={t('global.optional')} disabled={isVacant}/>
          </div>
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
