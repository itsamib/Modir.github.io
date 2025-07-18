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

interface AddUnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unitData: Omit<Unit, 'id'>) => void;
  unit: Unit | null;
}

export function AddUnitDialog({ isOpen, onClose, onSave, unit }: AddUnitDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    area: 0,
    occupants: 1,
    ownerName: '',
    tenantName: ''
  });
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name,
        area: unit.area,
        occupants: unit.occupants,
        ownerName: unit.ownerName,
        tenantName: unit.tenantName || '',
      });
    } else {
      setFormData({
        name: '', area: 0, occupants: 1, ownerName: '', tenantName: ''
      });
    }
  }, [unit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.ownerName.trim()) {
        setError(t('addUnitDialog.errorNameRequired'));
        return;
    }
    setError('');
    onSave({
        ...formData,
        tenantName: formData.tenantName.trim() || null
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
            <Label htmlFor="name" className="text-right">{t('addUnitDialog.nameLabel')}</Label>
            <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="area" className="text-right">{t('addUnitDialog.areaLabel')}</Label>
            <Input id="area" type="number" value={formData.area} onChange={handleChange} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="occupants" className="text-right">{t('addUnitDialog.occupantsLabel')}</Label>
            <Input id="occupants" type="number" value={formData.occupants} onChange={handleChange} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ownerName" className="text-right">{t('addUnitDialog.ownerNameLabel')}</Label>
            <Input id="ownerName" value={formData.ownerName} onChange={handleChange} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tenantName" className="text-right">{t('addUnitDialog.tenantNameLabel')}</Label>
            <Input id="tenantName" value={formData.tenantName} onChange={handleChange} className="col-span-3" placeholder={t('global.optional')}/>
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
