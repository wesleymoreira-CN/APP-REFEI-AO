/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientRampaOrder } from '../types';
import { formatDateBr, parseFlexibleOrderDate } from './orderRetention';

export interface DailyDishItemTotal {
  serviceDate: string;
  dayName: string;
  category: string;
  categoryLabel: string;
  icon: string;
  dishName: string;
  ordersCount: number;
  totalPeople: number;
  estimatedAmount: number;
  estimatedUnit: string;
  perCapitaLabel: string;
}

export interface DailyProductionSummary {
  serviceDate: string;
  dayName: string;
  sortTime: number;
  ordersCount: number;
  totalMaxPax: number;
  totalArrozPax: number;
  totalFeijaoPax: number;
  totalPrincipalPax: number;
  totalGuarnicaoPax: number;
  totalSaladaPax: number;
  totalSobremesaPax: number;
  fruitsBreakdown: { name: string; quantity: number; unit: string }[];
  items: DailyDishItemTotal[];
}

const CATEGORY_ORDER: Record<string, number> = {
  arroz: 1,
  feijao: 2,
  principal: 3,
  alternativa: 4,
  guarnicao: 5,
  salada: 6,
  sobremesa: 7,
  fruta: 8,
};

const CATEGORY_DEFAULTS: Record<string, { label: string; icon: string; gramsPerPax: number; unit: string }> = {
  arroz: { label: 'Arroz', icon: '🍚', gramsPerPax: 90, unit: 'kg' },
  feijao: { label: 'Feijão', icon: '🫘', gramsPerPax: 70, unit: 'kg' },
  principal: { label: 'Prato Principal', icon: '🥩', gramsPerPax: 140, unit: 'kg' },
  alternativa: { label: 'Opção Alternativa', icon: '🍗', gramsPerPax: 120, unit: 'kg' },
  guarnicao: { label: 'Guarnição', icon: '🥔', gramsPerPax: 90, unit: 'kg' },
  salada: { label: 'Salada', icon: '🥬', gramsPerPax: 60, unit: 'kg' },
  sobremesa: { label: 'Sobremesa', icon: '🍮', gramsPerPax: 1, unit: 'porções' },
};

export function getKitchenEstimateForItem(
  category: string,
  peopleCount: number
): { amount: number; unit: string; perCapitaLabel: string } {
  const cat = category.toLowerCase();
  const cfg = CATEGORY_DEFAULTS[cat] || { label: category, icon: '🍽️', gramsPerPax: 100, unit: 'kg' };

  if (cfg.unit === 'porções') {
    const qty = Math.round(peopleCount);
    return {
      amount: qty,
      unit: 'porções',
      perCapitaLabel: '1 porção / pessoa',
    };
  }

  const rawKg = (peopleCount * cfg.gramsPerPax) / 1000;
  const roundedKg = Math.round(rawKg * 100) / 100;
  return {
    amount: roundedKg,
    unit: cfg.unit,
    perCapitaLabel: `${cfg.gramsPerPax}g / pessoa`,
  };
}

export function buildDailyOrderProductionSummaries(
  orders: ClientRampaOrder[]
): DailyProductionSummary[] {
  const dayMap = new Map<
    string,
    {
      serviceDate: string;
      dayName: string;
      sortTime: number;
      ordersCount: number;
      totalMaxPax: number;
      totalArrozPax: number;
      totalFeijaoPax: number;
      totalPrincipalPax: number;
      totalGuarnicaoPax: number;
      totalSaladaPax: number;
      totalSobremesaPax: number;
      fruitTotals: Map<string, { name: string; quantity: number; unit: string; orderIds: Set<string>; peopleSum: number }>;
      dishTotals: Map<
        string,
        {
          category: string;
          categoryLabel: string;
          icon: string;
          dishName: string;
          peopleCount: number;
          orderIds: Set<string>;
        }
      >;
    }
  >();

  orders.forEach((order) => {
    const parsedServiceDate = parseFlexibleOrderDate(order.serviceDate) || parseFlexibleOrderDate(order.orderDate);
    const serviceDateKey = parsedServiceDate ? formatDateBr(parsedServiceDate) : (order.serviceDate || 'Sem data');
    const sortTime = parsedServiceDate ? parsedServiceDate.getTime() : Number.MAX_SAFE_INTEGER;
    const dayName = order.dayName || 'Rampa';

    if (!dayMap.has(serviceDateKey)) {
      dayMap.set(serviceDateKey, {
        serviceDate: serviceDateKey,
        dayName,
        sortTime,
        ordersCount: 0,
        totalMaxPax: 0,
        totalArrozPax: 0,
        totalFeijaoPax: 0,
        totalPrincipalPax: 0,
        totalGuarnicaoPax: 0,
        totalSaladaPax: 0,
        totalSobremesaPax: 0,
        fruitTotals: new Map(),
        dishTotals: new Map(),
      });
    }

    const dayBucket = dayMap.get(serviceDateKey)!;
    dayBucket.ordersCount += 1;
    dayBucket.totalMaxPax += Number(order.numberOfPeople) || 0;

    const items = Array.isArray(order.mealItems) ? order.mealItems : [];
    const findItem = (cat: string) => items.find((it) => it.category.toLowerCase() === cat);

    const arrozItem = findItem('arroz');
    const feijaoItem = findItem('feijao');
    const principalItem = findItem('principal');
    const guarnicaoItem = findItem('guarnicao');
    const saladaItem = findItem('salada');
    const sobremesaItem = findItem('sobremesa');

    dayBucket.totalArrozPax += arrozItem ? Number(arrozItem.peopleCount) || 0 : Number(order.numberOfPeople) || 0;
    dayBucket.totalFeijaoPax += feijaoItem ? Number(feijaoItem.peopleCount) || 0 : Number(order.numberOfPeople) || 0;
    dayBucket.totalPrincipalPax += principalItem ? Number(principalItem.peopleCount) || 0 : Number(order.numberOfPeople) || 0;
    dayBucket.totalGuarnicaoPax += guarnicaoItem ? Number(guarnicaoItem.peopleCount) || 0 : Number(order.numberOfPeople) || 0;
    dayBucket.totalSaladaPax += saladaItem ? Number(saladaItem.peopleCount) || 0 : Number(order.numberOfPeople) || 0;
    dayBucket.totalSobremesaPax += sobremesaItem ? Number(sobremesaItem.peopleCount) || 0 : Number(order.numberOfPeople) || 0;

    // Aggregate each dish/food item separately per day
    if (items.length > 0) {
      items.forEach((it) => {
        const cat = (it.category || 'principal').toLowerCase();
        const cfg = CATEGORY_DEFAULTS[cat];
        const cleanDishName = (it.dishName || cfg?.label || 'Preparação').trim();
        const key = `${cat}::${cleanDishName.toLowerCase()}`;
        const existing = dayBucket.dishTotals.get(key);
        const pax = Number(it.peopleCount) || 0;

        if (!existing) {
          dayBucket.dishTotals.set(key, {
            category: cat,
            categoryLabel: it.categoryLabel || cfg?.label || cat,
            icon: it.icon || cfg?.icon || '🍽️',
            dishName: cleanDishName,
            peopleCount: pax,
            orderIds: new Set([order.id]),
          });
        } else {
          existing.peopleCount += pax;
          existing.orderIds.add(order.id);
        }
      });
    } else {
      // Fallback if an order has no granular mealItems
      (['arroz', 'feijao', 'principal', 'guarnicao', 'salada', 'sobremesa'] as const).forEach((cat) => {
        const cfg = CATEGORY_DEFAULTS[cat];
        const key = `${cat}::${cfg.label.toLowerCase()}`;
        const existing = dayBucket.dishTotals.get(key);
        const pax = Number(order.numberOfPeople) || 0;
        if (!existing) {
          dayBucket.dishTotals.set(key, {
            category: cat,
            categoryLabel: cfg.label,
            icon: cfg.icon,
            dishName: cfg.label,
            peopleCount: pax,
            orderIds: new Set([order.id]),
          });
        } else {
          existing.peopleCount += pax;
          existing.orderIds.add(order.id);
        }
      });
    }

    // Aggregate fruits separately per day
    if (Array.isArray(order.fruits)) {
      order.fruits.forEach((fr) => {
        const fruitName = (fr.name || 'Fruta').trim();
        const fruitUnit = (fr.unit || 'un').trim();
        const fKey = `${fruitName.toLowerCase()}::${fruitUnit.toLowerCase()}`;
        const existingFruit = dayBucket.fruitTotals.get(fKey);
        const qty = Number(fr.quantity) || 0;
        const people = Number(order.numberOfPeople) || 0;

        if (!existingFruit) {
          dayBucket.fruitTotals.set(fKey, {
            name: fruitName,
            quantity: qty,
            unit: fruitUnit,
            orderIds: new Set([order.id]),
            peopleSum: people,
          });
        } else {
          existingFruit.quantity += qty;
          existingFruit.peopleSum += people;
          existingFruit.orderIds.add(order.id);
        }
      });
    }
  });

  const summaries: DailyProductionSummary[] = Array.from(dayMap.values())
    .sort((a, b) => a.sortTime - b.sortTime)
    .map((dayBucket) => {
      const dishItems: DailyDishItemTotal[] = Array.from(dayBucket.dishTotals.values()).map((d) => {
        const est = getKitchenEstimateForItem(d.category, d.peopleCount);
        return {
          serviceDate: dayBucket.serviceDate,
          dayName: dayBucket.dayName,
          category: d.category,
          categoryLabel: d.categoryLabel,
          icon: d.icon,
          dishName: d.dishName,
          ordersCount: d.orderIds.size,
          totalPeople: d.peopleCount,
          estimatedAmount: est.amount,
          estimatedUnit: est.unit,
          perCapitaLabel: est.perCapitaLabel,
        };
      });

      const fruitItems: DailyDishItemTotal[] = Array.from(dayBucket.fruitTotals.values()).map((fr) => ({
        serviceDate: dayBucket.serviceDate,
        dayName: dayBucket.dayName,
        category: 'fruta',
        categoryLabel: 'Frutas (Rampa)',
        icon: '🍎',
        dishName: fr.name,
        ordersCount: fr.orderIds.size,
        totalPeople: fr.peopleSum,
        estimatedAmount: Math.round(fr.quantity * 100) / 100,
        estimatedUnit: fr.unit,
        perCapitaLabel: 'Qtd. solicitada direta',
      }));

      const allItems = [...dishItems, ...fruitItems].sort((a, b) => {
        const rankA = CATEGORY_ORDER[a.category] ?? 99;
        const rankB = CATEGORY_ORDER[b.category] ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        return a.dishName.localeCompare(b.dishName, 'pt-BR');
      });

      const fruitsBreakdown = Array.from(dayBucket.fruitTotals.values()).map((fr) => ({
        name: fr.name,
        quantity: Math.round(fr.quantity * 100) / 100,
        unit: fr.unit,
      }));

      return {
        serviceDate: dayBucket.serviceDate,
        dayName: dayBucket.dayName,
        sortTime: dayBucket.sortTime,
        ordersCount: dayBucket.ordersCount,
        totalMaxPax: dayBucket.totalMaxPax,
        totalArrozPax: dayBucket.totalArrozPax,
        totalFeijaoPax: dayBucket.totalFeijaoPax,
        totalPrincipalPax: dayBucket.totalPrincipalPax,
        totalGuarnicaoPax: dayBucket.totalGuarnicaoPax,
        totalSaladaPax: dayBucket.totalSaladaPax,
        totalSobremesaPax: dayBucket.totalSobremesaPax,
        fruitsBreakdown,
        items: allItems,
      };
    });

  return summaries;
}
