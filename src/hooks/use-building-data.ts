"use client";

import { useState, useEffect, useCallback } from 'react';
import { Building, Unit, Expense, PaymentStatus } from '@/lib/types';

const STORAGE_KEY = 'building_accountant_data';

export const useBuildingData = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setBuildings(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = useCallback((newData: Building[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setBuildings(newData);
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
        area: 0,
        occupants: 1,
        ownerName: `مالک واحد ${i + 1}`,
        tenantName: null,
      })),
      expenses: [],
    };
    const updatedBuildings = [...buildings, newBuilding];
    saveData(updatedBuildings);
  };
  
  const getBuildingById = useCallback((id: string) => {
      return buildings.find(b => b.id === id);
  }, [buildings]);

  const addUnitToBuilding = (buildingId: string, unit: Omit<Unit, 'id'>) => {
      const newUnit = { ...unit, id: crypto.randomUUID() };
      const updatedBuildings = buildings.map(b => {
          if (b.id === buildingId) {
              return { ...b, units: [...b.units, newUnit] };
          }
          return b;
      });
      saveData(updatedBuildings);
  };

  const updateUnitInBuilding = (buildingId: string, updatedUnit: Unit) => {
      const updatedBuildings = buildings.map(b => {
          if (b.id === buildingId) {
              const updatedUnits = b.units.map(u => u.id === updatedUnit.id ? updatedUnit : u);
              return { ...b, units: updatedUnits };
          }
          return b;
      });
      saveData(updatedBuildings);
  };
  
  const addExpenseToBuilding = (buildingId: string, expense: Omit<Expense, 'id' | 'buildingId' | 'paymentStatus'>) => {
      const building = getBuildingById(buildingId);
      if (!building) return;

      const paymentStatus: Record<string, PaymentStatus> = {};
      const applicableUnits = expense.applicableUnits || building.units.map(u => u.id);
      
      applicableUnits.forEach(unitId => {
        paymentStatus[unitId] = 'unpaid';
      });

      const newExpense: Expense = {
          ...expense,
          id: crypto.randomUUID(),
          buildingId,
          paymentStatus,
      };

      const updatedBuildings = buildings.map(b => {
          if (b.id === buildingId) {
              return { ...b, expenses: [...b.expenses, newExpense] };
          }
          return b;
      });
      saveData(updatedBuildings);
  };

  const updateExpensePaymentStatus = (buildingId: string, expenseId: string, unitId: string, status: PaymentStatus) => {
    const updatedBuildings = buildings.map(b => {
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
    });
    saveData(updatedBuildings);
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
