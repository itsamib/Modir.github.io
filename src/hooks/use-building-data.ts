
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Building, Unit, Expense, PaymentStatus, ChargeTo } from '@/lib/types';
import * as XLSX from 'xlsx';
import { useLanguage } from '@/context/language-context';

const STORAGE_KEY = 'building_accountant_data_v3';

let memoryState: Building[] = [];
const listeners: Set<(state: Building[]) => void> = new Set();

const broadcastChanges = () => {
    listeners.forEach(listener => listener(memoryState));
};

const loadInitialData = () => {
    if (typeof window !== 'undefined') {
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
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    loadInitialData(); // Ensure data is loaded on client
    setBuildings(memoryState);
    
    const listener = (newState: Building[]) => {
      setBuildings(newState);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

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
        const dataToImport = Array.isArray(parsedData) ? parsedData : [parsedData];
        
        saveData(prev => {
            const newState = [...prev];
            dataToImport.forEach(building => {
                if (building.id && building.name) {
                    const existingIndex = newState.findIndex(b => b.id === building.id);
                    if (existingIndex > -1) {
                        newState[existingIndex] = building;
                    } else {
                        newState.push(building);
                    }
                }
            });
            return newState;
        }, callback);

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
                
                // --- Find metadata sheet to get building ID and Name ---
                const metaSheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'metadata');
                if (!metaSheetName) {
                    return callback(false, t('excelImport.errors.noMetaSheet'));
                }
                const metaSheet = workbook.Sheets[metaSheetName];
                const metaData = XLSX.utils.sheet_to_json<any>(metaSheet, { header: 1 });
                const buildingId = metaData.find(row => row[0] === 'buildingId')?.[1];
                const buildingName = metaData.find(row => row[0] === 'buildingName')?.[1];

                if (!buildingId || !buildingName) {
                     return callback(false, t('excelImport.errors.noIdOrName'));
                }

                // --- Find Units sheet ---
                const unitsSheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'units');
                if (!unitsSheetName) {
                    return callback(false, t('excelImport.errors.noUnitsSheet'));
                }
                const unitsSheet = workbook.Sheets[unitsSheetName];
                const unitsJson = XLSX.utils.sheet_to_json<any>(unitsSheet);

                const newUnits: Unit[] = unitsJson.map(row => ({
                    id: row['id'],
                    unitNumber: Number(row['unitNumber']),
                    name: row['name'],
                    area: Number(row['area']),
                    occupants: Number(row['occupants']),
                    ownerName: row['ownerName'],
                    ownerPhone: row['ownerPhone'] || '',
                    tenantName: row['tenantName'] || null,
                    tenantPhone: row['tenantPhone'] || '',
                }));
                
                // --- Find Expenses sheet ---
                const expensesSheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'expenses');
                if (!expensesSheetName) {
                    return callback(false, t('excelImport.errors.noExpensesSheet'));
                }
                const expensesSheet = workbook.Sheets[expensesSheetName];
                const expensesJson = XLSX.utils.sheet_to_json<any>(expensesSheet);
                
                const newExpenses: Expense[] = expensesJson.map(row => ({
                    id: row['id'],
                    buildingId: buildingId,
                    description: row['description'],
                    totalAmount: Number(row['totalAmount']),
                    date: new Date(row['date']).toISOString(),
                    distributionMethod: row['distributionMethod'],
                    paidByManager: row['paidByManager'] === true || row['paidByManager'] === 'true',
                    chargeTo: row['chargeTo'],
                    isBuildingCharge: row['isBuildingCharge'] === true || row['isBuildingCharge'] === 'true',
                    deductFromFund: row['deductFromFund'] === true || row['deductFromFund'] === 'true',
                    applicableUnits: row['applicableUnits'] ? JSON.parse(row['applicableUnits']) : undefined,
                    paymentStatus: row['paymentStatus'] ? JSON.parse(row['paymentStatus']) : {},
                }));

                const newBuilding: Building = {
                    id: buildingId,
                    name: buildingName,
                    units: newUnits,
                    expenses: newExpenses,
                };
                
                importData(JSON.stringify(newBuilding), () => {
                     callback(true, t('excelImport.success', { buildingName }));
                });

            } catch (error) {
                console.error("Excel import failed:", error);
                callback(false, t('excelImport.errors.processingError'));
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
