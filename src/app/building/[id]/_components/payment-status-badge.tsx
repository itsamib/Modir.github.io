"use client"

import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/hooks/use-building-data";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  onClick: () => void;
}

export function PaymentStatusBadge({ status, onClick }: PaymentStatusBadgeProps) {
  const isPaid = status === "paid";
  const { t } = useLanguage();
  
  return (
    <button onClick={onClick} className="w-fit rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
      <Badge
        className={cn(
          "flex cursor-pointer items-center gap-1 border-2 text-xs",
          isPaid ? "border-green-500 bg-green-100 text-green-700 hover:bg-green-200" : "border-red-500 bg-red-100 text-red-700 hover:bg-red-200",
          "dark:bg-transparent"
        )}
      >
        {isPaid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        <span>{isPaid ? t('paymentStatus.paid') : t('paymentStatus.unpaid')}</span>
      </Badge>
    </button>
  );
}
