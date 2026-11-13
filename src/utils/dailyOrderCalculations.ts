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
  kitchenSpecLabel: string;
  ordersCount: number;
  totalPeople: number;
  estimatedAmount: number;
  estimatedUnit: string;
  perCapitaLabel: string;
}

export interface DailyCategoryDirectLine {
  category: string;
  icon: string;
  specLabel: string;
  dishDetails: string;
  peopleCount: number;
  estimatedAmount: number;
  estimatedUnit: string;
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
  fruitsBreakdown: { name: string; quantity: number; unit: string; specLabel: string }[];
  categoryDirectLines: DailyCategoryDirectLine[];
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

const CATEGORY_SPEC_NAMES: Record<string, string> = {
  arroz: 'Arroz',
  feijao: 'Feijão',
  principal: 'Prato principal',
  alternativa: 'Opção alternativa',
  guarnicao: 'Guarnição',
  salada: 'Salada',
  sobremesa: 'Sobremesa',
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

const FRUIT_BASE_PLURALS: Record<string, { singular: string; plural: string; icon: string }> = {
  laranja: { singular: 'Laranja', plural: 'Laranjas', icon: '🍊' },
  banana: { singular: 'Banana', plural: 'Bananas', icon: '🍌' },
  maçã: { singular: 'Maçã', plural: 'Maçãs', icon: '🍎' },
  maca: { singular: 'Maçã', plural: 'Maçãs', icon: '🍎' },
  melancia: { singular: 'Melancia', plural: 'Melancias', icon: '🍉' },
  abacaxi: { singular: 'Abacaxi', plural: 'Abacaxis', icon: '🍍' },
  mamão: { singular: 'Mamão', plural: 'Mamões', icon: '🍈' },
  mamao: { singular: 'Mamão', plural: 'Mamões', icon: '🍈' },
  melão: { singular: 'Melão', plural: 'Melões', icon: '🍈' },
  melao: { singular: 'Melão', plural: 'Melões', icon: '🍈' },
  uva: { singular: 'Uva', plural: 'Uvas', icon: '🍇' },
  manga: { singular: 'Manga', plural: 'Mangas', icon: '🥭' },
  pera: { singular: 'Pera', plural: 'Peras', icon: '🍐' },
  goiaba: { singular: 'Goiaba', plural: 'Goiabas', icon: '🍈' },
  morango: { singular: 'Morango', plural: 'Morangos', icon: '🍓' },
  mexerica: { singular: 'Mexerica', plural: 'Mexericas', icon: '🍊' },
  tangerina: { singular: 'Tangerina', plural: 'Tangerinas', icon: '🍊' },
  kiwi: { singular: 'Kiwi', plural: 'Kiwis', icon: '🥝' },
  pêssego: { singular: 'Pêssego', plural: 'Pêssegos', icon: '🍑' },
  pessego: { singular: 'Pêssego', plural: 'Pêssegos', icon: '🍑' },
};

export function formatFruitKitchenSpec(name: string, quantity: number, unit: string): { specLabel: string; icon: string } {
  const cleanName = (name || 'Fruta').trim();
  const cleanUnit = (unit || 'un').trim().toLowerCase();
  const qty = Math.round(quantity * 100) / 100;
  const firstWordRaw = cleanName.split(/\s+/)[0] || cleanName;
  const firstWordKey = firstWordRaw.toLowerCase();
  const knownFruit = FRUIT_BASE_PLURALS[firstWordKey];

  const icon = knownFruit?.icon || (cleanName.toLowerCase().includes('salada') ? '🍓' : '🍎');

  if (cleanUnit === 'un' || cleanUnit === 'unidade' || cleanUnit === 'unidades') {
    if (knownFruit) {
      const noun = qty === 1 ? knownFruit.singular : knownFruit.plural;
      return { specLabel: `Fruta: ${qty} ${noun}`, icon };
    }
    const baseWord = firstWordRaw;
    const pluralFallback =
      qty === 1
        ? baseWord
        : baseWord.endsWith('s') || baseWord.endsWith('z')
          ? baseWord
          : `${baseWord}s`;
    return { specLabel: `Fruta: ${qty} ${pluralFallback}`, icon };
  }

  if (cleanUnit === 'porções' || cleanUnit === 'porção' || cleanUnit === 'porcoes') {
    const unitLabel = qty === 1 ? 'porção' : 'porções';
    return { specLabel: `Fruta: ${qty} ${unitLabel} de ${cleanName}`, icon };
  }

  if (cleanUnit === 'fatias' || cleanUnit === 'fatia') {
    const unitLabel = qty === 1 ? 'fatia' : 'fatias';
    return { specLabel: `Fruta: ${qty} ${unitLabel} de ${knownFruit ? knownFruit.singular : cleanName}`, icon };
  }

  return {
    specLabel: `Fruta: ${qty} ${unit || 'kg'} de ${knownFruit ? knownFruit.singular : cleanName}`,
    icon,
  };
}

export function formatDishKitchenSpec(category: string, peopleCount: number): string {
  const cat = category.toLowerCase();
  const label = CATEGORY_SPEC_NAMES[cat] || category;
  const pessoaWord = peopleCount === 1 ? 'pessoa' : 'pessoas';
  return `${label} para ${peopleCount} ${pessoaWord}`;
}

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
          kitchenSpecLabel: formatDishKitchenSpec(d.category, d.peopleCount),
          ordersCount: d.orderIds.size,
          totalPeople: d.peopleCount,
          estimatedAmount: est.amount,
          estimatedUnit: est.unit,
          perCapitaLabel: est.perCapitaLabel,
        };
      });

      const fruitItems: DailyDishItemTotal[] = Array.from(dayBucket.fruitTotals.values()).map((fr) => {
        const formatted = formatFruitKitchenSpec(fr.name, fr.quantity, fr.unit);
        return {
          serviceDate: dayBucket.serviceDate,
          dayName: dayBucket.dayName,
          category: 'fruta',
          categoryLabel: 'Frutas (Rampa)',
          icon: formatted.icon,
          dishName: fr.name,
          kitchenSpecLabel: formatted.specLabel,
          ordersCount: fr.orderIds.size,
          totalPeople: fr.peopleSum,
          estimatedAmount: Math.round(fr.quantity * 100) / 100,
          estimatedUnit: fr.unit,
          perCapitaLabel: 'Qtd. solicitada direta',
        };
      });

      const allItems = [...dishItems, ...fruitItems].sort((a, b) => {
        const rankA = CATEGORY_ORDER[a.category] ?? 99;
        const rankB = CATEGORY_ORDER[b.category] ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        return a.dishName.localeCompare(b.dishName, 'pt-BR');
      });

      const fruitsBreakdown = Array.from(dayBucket.fruitTotals.values()).map((fr) => {
        const formatted = formatFruitKitchenSpec(fr.name, fr.quantity, fr.unit);
        return {
          name: fr.name,
          quantity: Math.round(fr.quantity * 100) / 100,
          unit: fr.unit,
          specLabel: formatted.specLabel,
        };
      });

      // Build ultra-explicit direct lines per category for the day
      // e.g. "Arroz para 20 pessoas", "Feijão para 30 pessoas", "Prato principal para 50 pessoas", "Fruta: 80 Laranjas"
      const categoryGroups = new Map<string, { totalPax: number; dishes: string[] }>();
      dishItems.forEach((it) => {
        const current = categoryGroups.get(it.category) || { totalPax: 0, dishes: [] };
        current.totalPax += it.totalPeople;
        if (it.dishName && !current.dishes.includes(it.dishName)) {
          current.dishes.push(`${it.dishName} (${it.totalPeople}p)`);
        }
        categoryGroups.set(it.category, current);
      });

      const categoryDirectLines: DailyCategoryDirectLine[] = [];
      (['arroz', 'feijao', 'principal', 'alternativa', 'guarnicao', 'salada', 'sobremesa'] as const).forEach((cat) => {
        const grp = categoryGroups.get(cat);
        if (!grp || grp.totalPax <= 0) return;
        const cfg = CATEGORY_DEFAULTS[cat];
        const est = getKitchenEstimateForItem(cat, grp.totalPax);
        categoryDirectLines.push({
          category: cat,
          icon: cfg.icon,
          specLabel: formatDishKitchenSpec(cat, grp.totalPax),
          dishDetails: grp.dishes.join(' + '),
          peopleCount: grp.totalPax,
          estimatedAmount: est.amount,
          estimatedUnit: est.unit,
        });
      });

      fruitItems.forEach((frItem) => {
        categoryDirectLines.push({
          category: 'fruta',
          icon: frItem.icon,
          specLabel: frItem.kitchenSpecLabel,
          dishDetails: frItem.dishName,
          peopleCount: frItem.totalPeople,
          estimatedAmount: frItem.estimatedAmount,
          estimatedUnit: frItem.estimatedUnit,
        });
      });

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
        categoryDirectLines,
        items: allItems,
      };
    });

  return summaries;
}
