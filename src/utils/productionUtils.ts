import { DishProductionQty, DayProduction, DayMenu, MealSlot } from '../types';
import { normalizeSlotItems } from './validators';

export interface CategoryPerCapitaConfig {
  unit: string;
  defaultPerCapitaGrams: number; // in grams or ml
  unitMultiplier: number; // factor to convert (pax * grams) to unit
  label: string;
}

export const CATEGORY_PRODUCTION_STANDARDS: Record<string, CategoryPerCapitaConfig> = {
  principal: {
    unit: 'kg',
    defaultPerCapitaGrams: 140, // 140g limpo por pessoa
    unitMultiplier: 0.001,
    label: 'Prato Principal',
  },
  grelhado_nobre: {
    unit: 'kg',
    defaultPerCapitaGrams: 130, // 130g por pessoa
    unitMultiplier: 0.001,
    label: 'Grelhado Nobre',
  },
  alternativa: {
    unit: 'kg',
    defaultPerCapitaGrams: 120, // 120g por pessoa
    unitMultiplier: 0.001,
    label: 'Opção Alternativa (Ave/Peixe)',
  },
  massa_especial: {
    unit: 'kg',
    defaultPerCapitaGrams: 110, // 110g por pessoa
    unitMultiplier: 0.001,
    label: 'Massa Especial',
  },
  vegetariano: {
    unit: 'kg',
    defaultPerCapitaGrams: 100, // 100g por pessoa
    unitMultiplier: 0.001,
    label: 'Opção Vegetariana',
  },
  guarnicao: {
    unit: 'kg',
    defaultPerCapitaGrams: 90, // 90g por pessoa
    unitMultiplier: 0.001,
    label: 'Guarnição',
  },
  acompanhamento: {
    unit: 'kg',
    defaultPerCapitaGrams: 160, // ~90g arroz + ~70g feijão
    unitMultiplier: 0.001,
    label: 'Acompanhamentos Base',
  },
  salada: {
    unit: 'kg',
    defaultPerCapitaGrams: 60, // 60g por pessoa
    unitMultiplier: 0.001,
    label: 'Salada',
  },
  salada_fria: {
    unit: 'kg',
    defaultPerCapitaGrams: 50,
    unitMultiplier: 0.001,
    label: 'Pista Fria / Especial',
  },
  sobremesa: {
    unit: 'porções',
    defaultPerCapitaGrams: 1, // 1 porção
    unitMultiplier: 1,
    label: 'Sobremesa',
  },
};

export function getDishQuantityKey(category: string, dishName: string): string {
  return `${category}__${dishName.trim().toLowerCase()}`;
}

export function getDefaultQuantityForDish(
  category: string,
  dishName: string,
  paxTarget: number = 400,
  itemsInCategoryCount: number = 1
): DishProductionQty {
  const std = CATEGORY_PRODUCTION_STANDARDS[category] || {
    unit: 'kg',
    defaultPerCapitaGrams: 100,
    unitMultiplier: 0.001,
    label: category,
  };

  // If there are multiple items in the same category (e.g. 2 main meats), divide proportionally
  const share = itemsInCategoryCount > 1 ? 1 / itemsInCategoryCount : 1;
  const rawAmount = paxTarget * std.defaultPerCapitaGrams * std.unitMultiplier * share;
  
  // Format rounded nicely
  const roundedAmount = std.unit === 'porções' || std.unit === 'unidades'
    ? Math.round(rawAmount)
    : Math.round(rawAmount * 10) / 10;

  let defaultNotes = '';
  if (category === 'principal' || category === 'grelhado_nobre') {
    defaultNotes = 'Temperar com antecedência. Checar ponto de cozimento.';
  } else if (category === 'alternativa') {
    defaultNotes = 'Aferir temperatura interna (mín. 74ºC).';
  } else if (category === 'acompanhamento') {
    defaultNotes = 'Monitorar reposição contínua na rampa.';
  } else if (category === 'suco') {
    defaultNotes = 'Manter refrigerado a 4ºC.';
  }

  return {
    amount: roundedAmount,
    unit: std.unit,
    pax: paxTarget,
    perCapitaGrams: Math.round(std.defaultPerCapitaGrams * share),
    notes: defaultNotes,
  };
}

export interface DayProductionSummary {
  pax: number;
  totalMeatKg: number;
  totalSidesKg: number;
  totalSaladKg: number;
  totalJuiceLiters: number;
  totalDessertPortions: number;
  dishesCount: number;
}

export function calculateDayProductionSummary(
  dayMenu: DayMenu,
  production?: DayProduction
): DayProductionSummary {
  const pax = production?.paxTarget || 400;
  let totalMeatKg = 0;
  let totalSidesKg = 0;
  let totalSaladKg = 0;
  let totalJuiceLiters = 0;
  let totalDessertPortions = 0;
  let dishesCount = 0;

  const categories = Object.keys(dayMenu.lunch) as (keyof MealSlot)[];

  categories.forEach((catKey) => {
    const rawItems = dayMenu.lunch[catKey];
    const items = normalizeSlotItems(rawItems);
    dishesCount += items.length;

    const catStr = String(catKey);

    items.forEach((dish) => {
      const qKey = getDishQuantityKey(catStr, dish);
      const qtyData = production?.quantities?.[qKey] || getDefaultQuantityForDish(catStr, dish, pax, items.length);
      const numAmount = typeof qtyData.amount === 'number' ? qtyData.amount : parseFloat(String(qtyData.amount)) || 0;

      if (catStr === 'principal' || catStr === 'grelhadoNobre' || catStr === 'alternativa') {
        if (qtyData.unit === 'kg') totalMeatKg += numAmount;
      } else if (catStr === 'guarnicao' || catStr === 'acompanhamento' || catStr === 'massaEspecial' || catStr === 'vegetariano') {
        if (qtyData.unit === 'kg') totalSidesKg += numAmount;
      } else if (catStr === 'salada' || catStr === 'saladaEspecial') {
        if (qtyData.unit === 'kg') totalSaladKg += numAmount;
      } else if (catStr === 'suco') {
        if (qtyData.unit === 'litros') totalJuiceLiters += numAmount;
      } else if (catStr === 'sobremesa') {
        totalDessertPortions += numAmount;
      }
    });
  });

  return {
    pax,
    totalMeatKg: Math.round(totalMeatKg * 10) / 10,
    totalSidesKg: Math.round(totalSidesKg * 10) / 10,
    totalSaladKg: Math.round(totalSaladKg * 10) / 10,
    totalJuiceLiters: Math.round(totalJuiceLiters),
    totalDessertPortions: Math.round(totalDessertPortions),
    dishesCount,
  };
}
