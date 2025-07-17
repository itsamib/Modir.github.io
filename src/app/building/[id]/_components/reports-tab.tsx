"use client"

import { useState } from 'react';
import { Building } from "@/hooks/use-building-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface ReportsTabProps {
    building: Building;
}

export function ReportsTab({ building }: ReportsTabProps) {
    const [exportType, setExportType] = useState("values");
    const { toast } = useToast();

    const handleExport = () => {
        // This is a placeholder for the actual Excel export functionality
        console.log(`Exporting ${building.name} data with ${exportType}`);
        toast({
            title: "خروجی اکسل",
            description: `فایل اکسل برای ساختمان "${building.name}" با موفقیت ایجاد شد. (شبیه‌سازی شده)`,
            className: "bg-primary text-primary-foreground"
        })
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
                         <p className="text-xs text-muted-foreground pr-6">خروجی شامل داده‌های نهایی و بدون فرمول‌های اکسل خواهد بود. (ساده و سریع)</p>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="formulas" id="r2" />
                            <Label htmlFor="r2">شامل فرمول‌های زنده اکسل</Label>
                        </div>
                        <p className="text-xs text-muted-foreground pr-6">خروجی شامل فرمول‌ها (مانند SUMIF) خواهد بود که محاسبات را در خود اکسل انجام می‌دهند. (پیشرفته)</p>

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
