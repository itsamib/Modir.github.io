"use client"

import { useState } from 'react';
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

interface CreateBuildingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, unitCount: number) => void;
}

export function CreateBuildingDialog({ isOpen, onClose, onSave }: CreateBuildingDialogProps) {
  const [name, setName] = useState('');
  const [unitCount, setUnitCount] = useState(1);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('نام ساختمان نمی‌تواند خالی باشد.');
      return;
    }
    if (unitCount <= 0) {
      setError('تعداد واحدها باید حداقل ۱ باشد.');
      return;
    }
    setError('');
    onSave(name, unitCount);
    setName('');
    setUnitCount(1);
  };

  const handleClose = () => {
    setName('');
    setUnitCount(1);
    setError('');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">ایجاد ساختمان جدید</DialogTitle>
          <DialogDescription>
            اطلاعات ساختمان جدید را برای شروع مدیریت هزینه‌ها وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              نام ساختمان
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="مثال: برج بهار"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unitCount" className="text-right">
              تعداد واحدها
            </Label>
            <Input
              id="unitCount"
              type="number"
              value={unitCount}
              onChange={(e) => setUnitCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="col-span-3"
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>لغو</Button>
          <Button type="submit" onClick={handleSave}>ذخیره</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
