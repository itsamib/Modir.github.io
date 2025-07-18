
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Building, Unit, Expense, PaymentStatus, ChargeTo } from '@/lib/types';

const STORAGE_KEY = 'building_accountant_data_v3'; // Version updated for new data structure

// This state is shared across all instances of the hook
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
            } else {
                // Try to load from old key and migrate
                const oldData = localStorage.getItem('building_accountant_data_v2');
                if (oldData) {
                    const parsedOldData: Building[] = JSON.parse(oldData);
                    memoryState = parsedOldData.map(building => ({
                        ...building,
                        expenses: building.expenses.map(expense => ({
                            ...expense,
                            isBuildingCharge: expense.description.includes("شارژ") || expense.description.toLowerCase().includes("charge"),
                            deductFromFund: false,
                        }))
                    }));
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
                    localStorage.removeItem('building_accountant_data_v2');
                } else {
                    memoryState = [];
                }
            }
        } catch (error) {
            console.error("Failed to load or migrate data from localStorage", error);
            memoryState = [];
        }
    }
};

loadInitialData();

export const useBuildingData = () => {
  const [buildings, setBuildings] = useState<Building[]>(memoryState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listener = (newState: Building[]) => {
      setBuildings(newState);
      if (loading) setLoading(false);
    };
    listeners.add(listener);
    
    if(memoryState.length > 0 || localStorage.getItem(STORAGE_KEY)) {
        setLoading(false);
    }
    
    listener(memoryState);

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
        name: 'unitsTab.table.defaultUnitName', // Use translation key
        unitNumber: i + 1,
        area: 100,
        occupants: 2,
        ownerName: '', // Let user fill this
        tenantName: null,
      })),
      expenses: [],
    };
    saveData(prev => [...prev, newBuilding]);
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
              
              let paymentStatus = e.paymentStatus; // Keep existing payment statuses
              // If distribution method changes from something to general, clear payment status
              if (e.distributionMethod !== 'general' && expenseData.distributionMethod === 'general') {
                  paymentStatus = {};
              }

              const updatedExpense: Expense = {
                  ...e, // keep id and buildingId
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
        // Basic validation can be added here
        if (Array.isArray(parsedData)) { // It's a full backup of all buildings
            saveData(parsedData, callback);
        } else if (typeof parsedData === 'object' && parsedData.id && parsedData.name) { // It's a single building backup
             saveData(prev => {
                // It's a single building, check if it exists
                const existingIndex = prev.findIndex(b => b.id === parsedData.id);
                if (existingIndex > -1) {
                    // Update existing building
                    const newState = [...prev];
                    newState[existingIndex] = parsedData;
                    return newState;
                } else {
                    // Add as a new building
                    return [...prev, parsedData];
                }
            }, callback);
        }
        else {
            throw new Error("Invalid data format");
        }
    } catch(error) {
        console.error("Failed to import data", error);
        throw error; // Re-throw to be caught by the UI
    }
  }


  return { 
    buildings, 
    loading, 
    addBuilding,
    getBuildingById,
    addUnitToBuilding,
    updateUnitInBuilding,
    addExpenseToBuilding,
    updateExpenseInBuilding,
    updateExpensePaymentStatus,
    deleteExpenseFromBuilding,
    exportData,
    importData,
  };
};

export type { Building, Unit, Expense, PaymentStatus, ChargeTo };
