
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Building, Unit, Expense, PaymentStatus, ChargeTo } from '@/lib/types';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'building_accountant_data_v3';

let memoryState: Building[] = [];
const listeners: Set<(state: Building[]) => void> = new Set();

const broadcastChanges = () => {
    listeners.forEach(listener => listener(memoryState));
};

const loadInitialData = () => {
    if (typeof window !== 'undefined' && memoryState.length === 0) {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                memoryState = JSON.parse(data);
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            memoryState = [];
        }
    }
};

loadInitialData();

export const useBuildingData = () => {
  const [buildings, setBuildings] = useState<Building[]>(memoryState);
  const [loading, setLoading] = useState(() => typeof window === 'undefined' || (memoryState.length === 0 && (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY))));

  useEffect(() => {
    const listener = (newState: Building[]) => {
      setBuildings(newState);
      if (loading) setLoading(false);
    };
    listeners.add(listener);
    
    setBuildings(memoryState);
    if(loading && memoryState.length > 0) setLoading(false);
    if(loading && typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)){
       setLoading(false)
    }


    return () => {
      listeners.delete(listener);
    };
  }, [loading]);

  const saveData = useCallback((newData: Building[] | ((prev: Building[]) => Building[]), callback?: () => void) => {
    try {
        const updatedData = typeof newData === 'function' ? newData(memoryState) : newData;
        memoryState = updatedData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
        broadcastChanges();
        if (callback) callback();
    } catch (error) {
        console.error("Failed to save data to localStorage", error);
    }
  }, []);

  const addBuilding = (name: string, unitCount: number) => {
    const newBuilding: Building = {
      id: crypto.randomUUID(),
      name,
      units: Array.from({ length: unitCount }, (_, i) => ({
        id: crypto.randomUUID(),
        name: 'unitsTab.table.defaultUnitName',
        unitNumber: i + 1,
        area: 100,
        occupants: 2,
        ownerName: '',
        tenantName: null,
        ownerPhone: '',
        tenantPhone: ''
      })),
      expenses: [],
    };
    saveData(prev => [...prev, newBuilding]);
  };

  const updateBuilding = (buildingId: string, newName: string) => {
    saveData(prev => prev.map(b => b.id === buildingId ? { ...b, name: newName } : b));
  };

  const deleteBuilding = (buildingId: string) => {
    saveData(prev => prev.filter(b => b.id !== buildingId));
  };
  
  const getBuildingById = useCallback((id: string) => {
      return memoryState.find(b => b.id === id);
  }, []);

  const addUnitToBuilding = (buildingId: string, unit: Omit<Unit, 'id'| 'unitNumber'>, callback?: () => void) => {
      saveData(prev => prev.map(b => {
          if (b.id === buildingId) {
              const newUnitNumber = b.units.length > 0 ? Math.max(...b.units.map(u => u.unitNumber)) + 1 : 1;
              const newUnit = { 
                  ...unit, 
                  id: crypto.randomUUID(),
                  unitNumber: newUnitNumber
              };
              return { ...b, units: [...b.units, newUnit] };
          }
          return b;
      }), callback);
  };

  const updateUnitInBuilding = (buildingId: string, updatedUnit: Unit, callback?: () => void) => {
      saveData(prev => prev.map(b => {
          if (b.id === buildingId) {
              const updatedUnits = b.units.map(u => u.id === updatedUnit.id ? updatedUnit : u);
              return { ...b, units: updatedUnits };
          }
          return b;
      }), callback);
  };
  
  const addExpenseToBuilding = (buildingId: string, expense: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>, callback?: () => void) => {
      saveData(prev => {
        const building = prev.find(b => b.id === buildingId);
        if (!building) return prev;

        const paymentStatus: Record<string, PaymentStatus> = {};
        
        if (expense.distributionMethod !== 'general') {
             const applicableUnitIds = expense.distributionMethod === 'custom' && expense.applicableUnits?.length
                ? expense.applicableUnits
                : building.units.map(u => u.id);

            applicableUnitIds.forEach(unitId => {
                paymentStatus[unitId] = 'unpaid';
            });
        }

        const newExpense: Expense = {
            ...expense,
            id: crypto.randomUUID(),
            buildingId,
            paymentStatus,
            chargeTo: expense.chargeTo || 'all',
            applicableUnits: expense.distributionMethod === 'custom' ? expense.applicableUnits : building.units.map(u => u.id),
            isBuildingCharge: expense.isBuildingCharge || false,
            deductFromFund: expense.deductFromFund || false,
        };

        return prev.map(b => 
            b.id === buildingId ? { ...b, expenses: [...b.expenses, newExpense] } : b
        );
      }, callback);
  };

  const updateExpenseInBuilding = (buildingId: string, expenseId: string, expenseData: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>, callback?: () => void) => {
      saveData(prev => prev.map(b => {
          if (b.id !== buildingId) return b;
          
          const updatedExpenses = b.expenses.map(e => {
              if (e.id !== expenseId) return e;
              
              let paymentStatus = e.paymentStatus;
              if (e.distributionMethod !== 'general' && expenseData.distributionMethod === 'general') {
                  paymentStatus = {};
              }

              const updatedExpense: Expense = {
                  ...e,
                  ...expenseData,
                  paymentStatus,
                   chargeTo: expenseData.chargeTo || 'all',
                   applicableUnits: expenseData.distributionMethod === 'custom' ? expenseData.applicableUnits : b.units.map(u => u.id),
                   isBuildingCharge: expenseData.isBuildingCharge || false,
                   deductFromFund: expenseData.deductFromFund || false,
              };
              return updatedExpense;
          });
          
          return { ...b, expenses: updatedExpenses };
      }), callback);
  };

  const updateExpensePaymentStatus = (buildingId: string, expenseId: string, unitId: string, status: PaymentStatus, callback?: () => void) => {
    saveData(prev => prev.map(b => {
        if (b.id === buildingId) {
            const updatedExpenses = b.expenses.map(e => {
                if (e.id === expenseId) {
                    const newPaymentStatus = { ...e.paymentStatus, [unitId]: status };
                    return { ...e, paymentStatus: newPaymentStatus };
                }
                return e;
            });
            return { ...b, expenses: updatedExpenses };
        }
        return b;
    }), callback);
  };

  const deleteExpenseFromBuilding = (buildingId: string, expenseId: string, callback?: () => void) => {
    saveData(prev => prev.map(b => {
        if (b.id === buildingId) {
            const updatedExpenses = b.expenses.filter(e => e.id !== expenseId);
            return { ...b, expenses: updatedExpenses };
        }
        return b;
    }), callback);
  };

  const exportData = (buildingId?: string): string => {
    if (buildingId) {
        const buildingToExport = memoryState.find(b => b.id === buildingId);
        return buildingToExport ? JSON.stringify(buildingToExport, null, 2) : "{}";
    }
    return JSON.stringify(memoryState, null, 2);
  };

  const importData = (jsonData: string, callback?: () => void) => {
    try {
        const parsedData = JSON.parse(jsonData);
        if (Array.isArray(parsedData)) {
            saveData(parsedData, callback);
        } else if (typeof parsedData === 'object' && parsedData.id && parsedData.name) {
             saveData(prev => {
                const existingIndex = prev.findIndex(b => b.id === parsedData.id);
                if (existingIndex > -1) {
                    const newState = [...prev];
                    newState[existingIndex] = parsedData;
                    return newState;
                } else {
                    return [...prev, parsedData];
                }
            }, callback);
        }
        else {
            throw new Error("Invalid data format");
        }
    } catch(error) {
        console.error("Failed to import data", error);
        throw error;
    }
  };

  const importExcelData = (file: File, callback: (success: boolean, message: string) => void) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = e.target?.result;
              const workbook = XLSX.read(data, { type: 'array' });
              
              const unitsSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('واحدها')); // More flexible
              const expensesSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('هزینه')); // More flexible

              if (!unitsSheetName) {
                  return callback(false, "شیت مشخصات واحدها در فایل اکسل یافت نشد.");
              }

              const unitsSheet = workbook.Sheets[unitsSheetName];
              const unitsJson = XLSX.utils.sheet_to_json<any>(unitsSheet);

              const newUnits: Unit[] = unitsJson.map((row, index) => {
                  const unitNumber = row['شماره واحد'] || (index + 1);
                  const name = row['نام واحد'] || `unitsTab.table.defaultUnitName`;
                  const ownerName = row['نام مالک/مستاجر'] || row['نام مالک'] || '';
                  const tenantName = row['نام مستاجر'] || null;
                  
                  return {
                      id: crypto.randomUUID(),
                      unitNumber: Number(unitNumber),
                      name: name,
                      area: Number(row['متراژ (مترمربع)']) || 0,
                      occupants: Number(row['تعداد نفرات']) || 1,
                      ownerName: ownerName,
                      ownerPhone: String(row['شماره تماس'] || row['تلفن مالک'] || ''),
                      tenantName: tenantName,
                      tenantPhone: String(row['تلفن مستاجر'] || ''),
                  }
              });

              let newExpenses: Expense[] = [];
              if (expensesSheetName) {
                  const expensesSheet = workbook.Sheets[expensesSheetName];
                  const expensesJson = XLSX.utils.sheet_to_json<any>(expensesSheet);
                  
                  newExpenses = expensesJson.map(row => {
                      const dateValue = row['تاریخ'] || row['Date'];
                      let date;
                      if (typeof dateValue === 'number') {
                          // Excel date (serial number) to JS Date
                          date = new Date(Math.round((dateValue - 25569) * 86400 * 1000)).toISOString();
                      } else if (typeof dateValue === 'string') {
                          date = new Date(dateValue).toISOString();
                      } else {
                          date = new Date().toISOString();
                      }

                      const expense: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'> = {
                          description: String(row['نوع هزینه'] || row['شرح هزینه'] || 'هزینه نامشخص'),
                          totalAmount: Number(row['مبلغ کل'] || 0),
                          date: date,
                          distributionMethod: 'unit_count', // Default, can be refined
                          paidByManager: String(row['پرداخت کننده']).toLowerCase() === 'مدیر',
                          chargeTo: 'all', // Default
                          isBuildingCharge: (String(row['نوع هزینه']).includes('شارژ')),
                          deductFromFund: false, // Cannot be determined from sample
                      };
                      
                      const paymentStatus: Record<string, PaymentStatus> = {};
                      newUnits.forEach(unit => {
                          paymentStatus[unit.id] = 'unpaid';
                      });

                      return {
                          ...expense,
                          id: crypto.randomUUID(),
                          buildingId: '',
                          paymentStatus,
                      };
                  });
              }

              const buildingName = file.name.replace(/\.(xlsx|xls)$/, '');
              const newBuilding: Building = {
                  id: crypto.randomUUID(),
                  name: buildingName,
                  units: newUnits,
                  expenses: newExpenses,
              };
              newBuilding.expenses.forEach(exp => exp.buildingId = newBuilding.id);
              
              saveData(prev => [...prev, newBuilding]);
              callback(true, `ساختمان '${buildingName}' با موفقیت از فایل اکسل وارد شد.`);

          } catch (error) {
              console.error("Excel import failed:", error);
              callback(false, "خطا در پردازش فایل اکسل. لطفاً ساختار فایل را بررسی کنید.");
          }
      };
      reader.readAsArrayBuffer(file);
  };


  return { 
    buildings, 
    loading, 
    addBuilding,
    updateBuilding,
    deleteBuilding,
    getBuildingById,
    addUnitToBuilding,
    updateUnitInBuilding,
    addExpenseToBuilding,
    updateExpenseInBuilding,
    updateExpensePaymentStatus,
    deleteExpenseFromBuilding,
    exportData,
    importData,
    importExcelData,
  };
};

export type { Building, Unit, Expense, PaymentStatus, ChargeTo };

    