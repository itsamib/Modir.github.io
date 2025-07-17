"use client";

import { useState, useEffect, useCallback } from 'react';
import { Building, Unit, Expense, PaymentStatus } from '@/lib/types';

const STORAGE_KEY = 'building_accountant_data_v2';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useEffect : () => {};

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
            memoryState = data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            memoryState = [];
        }
    }
};

loadInitialData();

export const useBuildingData = () => {
  const [buildings, setBuildings] = useState<Building[]>(memoryState);
  const [loading, setLoading] = useState(memoryState.length === 0);

  useEffect(() => {
    // Component mounts, subscribe to changes
    const listener = (newState: Building[]) => {
      setBuildings(newState);
      if (loading) setLoading(false);
    };
    listeners.add(listener);
    
    // Initial sync
    listener(memoryState);

    // Component unmounts, unsubscribe
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
        name: `واحد ${i + 1}`,
        area: 100,
        occupants: 2,
        ownerName: `مالک واحد ${i + 1}`,
        tenantName: null,
      })),
      expenses: [],
    };
    saveData(prev => [...prev, newBuilding]);
  };
  
  const getBuildingById = useCallback((id: string) => {
      return memoryState.find(b => b.id === id);
  }, []);

  const addUnitToBuilding = (buildingId: string, unit: Omit<Unit, 'id'>, callback?: () => void) => {
      const newUnit = { ...unit, id: crypto.randomUUID() };
      saveData(prev => prev.map(b => 
          b.id === buildingId ? { ...b, units: [...b.units, newUnit] } : b
      ), callback);
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
        
        const applicableUnitIds = expense.distributionMethod === 'custom' && expense.applicableUnits?.length
            ? expense.applicableUnits
            : building.units.map(u => u.id);

        applicableUnitIds.forEach(unitId => {
            paymentStatus[unitId] = 'unpaid';
        });

        const newExpense: Expense = {
            ...expense,
            id: crypto.randomUUID(),
            buildingId,
            paymentStatus,
            applicableUnits: expense.distributionMethod === 'custom' ? expense.applicableUnits : building.units.map(u => u.id),
        };

        return prev.map(b => 
            b.id === buildingId ? { ...b, expenses: [...b.expenses, newExpense] } : b
        );
      }, callback);
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


  return { 
    buildings, 
    loading, 
    addBuilding,
    getBuildingById,
    addUnitToBuilding,
    updateUnitInBuilding,
    addExpenseToBuilding,
    updateExpensePaymentStatus
  };
};

export type { Building, Unit, Expense, PaymentStatus };
