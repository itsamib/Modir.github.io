"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  notFoundMessage?: string;
  searchPlaceholder?: string;
}

export function Combobox({ 
  items, 
  value, 
  onChange, 
  placeholder, 
  className,
  notFoundMessage = "موردی یافت نشد.",
  searchPlaceholder = "جستجو..."
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleSelect = (currentValue: string) => {
    const newValue = items.find(item => item.value.toLowerCase() === currentValue.toLowerCase())?.value || '';
    onChange(newValue)
    setInputValue(newValue)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedValue = e.target.value;
    setInputValue(typedValue);
    onChange(typedValue);
    if (!open) {
      setOpen(true);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative w-full", className)}>
            <input
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    "pr-10"
                )}
                onClick={() => setOpen(o => !o)}
            />
            <Button
                variant="ghost"
                role="combobox"
                aria-expanded={open}
                className="absolute inset-y-0 right-0 px-3"
                onClick={() => setOpen(o => !o)}
            >
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue} 
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>{notFoundMessage}</CommandEmpty>
            <CommandGroup>
              {items
                .filter(item => item.label.toLowerCase().includes(inputValue.toLowerCase()))
                .map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
