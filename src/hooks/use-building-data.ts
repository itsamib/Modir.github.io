"use client";

import { useState, useEffect, useCallback } from 'react';
import { Building, Unit, Expense, PaymentStatus } from '@/lib/types';

const STORAGE_KEY = 'building_accountant_data_v2';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useEffect : () => {};

export const useBuildingData = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useIsomorphicLayoutEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setBuildings(JSON.parse(data));
      } else {
        // Initialize with empty array if no data
        setBuildings([]);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = useCallback((newData: Building[] | ((prev: Building[]) => Building[])) => {
    try {
        setBuildings(prevBuildings => {
            const updatedData = typeof newData === 'function' ? newData(prevBuildings) : newData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
            return updatedData;
        });
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
      return buildings.find(b => b.id === id);
  }, [buildings]);

  const addUnitToBuilding = (buildingId: string, unit: Omit<Unit, 'id'>) => {
      const newUnit = { ...unit, id: crypto.randomUUID() };
      saveData(prev => prev.map(b => 
          b.id === buildingId ? { ...b, units: [...b.units, newUnit] } : b
      ));
  };

  const updateUnitInBuilding = (buildingId: string, updatedUnit: Unit) => {
      saveData(prev => prev.map(b => {
          if (b.id === buildingId) {
              const updatedUnits = b.units.map(u => u.id === updatedUnit.id ? updatedUnit : u);
              return { ...b, units: updatedUnits };
          }
          return b;
      }));
  };
  
  const addExpenseToBuilding = (buildingId: string, expense: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>) => {
      saveData(prev => {
        const building = prev.find(b => b.id === buildingId);
        if (!building) return prev;

        const paymentStatus: Record<string, PaymentStatus> = {};
        
        // This was the bug: applicableUnits was only considered for custom, but it should apply to all
        const applicableUnitIds = expense.distributionMethod === 'custom'
            ? expense.applicableUnits || []
            : building.units.map(u => u.id);

        applicableUnitIds.forEach(unitId => {
            paymentStatus[unitId] = 'unpaid';
        });

        const newExpense: Expense = {
            ...expense,
            id: crypto.randomUUID(),
            buildingId,
            paymentStatus,
            // Ensure applicableUnits is stored correctly
            applicableUnits: expense.distributionMethod === 'custom' ? expense.applicableUnits : undefined,
        };

        return prev.map(b => 
            b.id === buildingId ? { ...b, expenses: [...b.expenses, newExpense] } : b
        );
      });
  };

  const updateExpensePaymentStatus = (buildingId: string, expenseId: string, unitId: string, status: PaymentStatus) => {
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
    }));
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
