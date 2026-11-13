/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientRampaOrder } from '../types';

/**
 * Regra de 8 dias na planilha de pedidos:
 * Ex: Pedido feito na segunda-feira 08/10/2026 -> no dia 15/10/2026 (8º dia corrido, 7 dias decorridos)
 * o pedido atinge a data de vencimento e é apagado automaticamente (do primeiro/mais antigo em diante).
 */
export const ORDER_RETENTION_DAY_INCLUSIVE = 8;
export const ORDER_RETENTION_ELAPSED_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeToLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Faz o parse seguro de datas em YYYY-MM-DD, ISO-8601 ou DD/MM/YYYY (ou DD/MM/YY)
 * evitando deslocamento de fuso horário UTC -> Local.
 */
export function parseFlexibleOrderDate(raw?: string | Date | null): Date | null {
  if (!raw) return null;

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : normalizeToLocalMidnight(raw);
  }

  const str = String(raw).trim();
  if (!str) return null;

  // Formato ISO ou YYYY-MM-DD (ex: "2026-10-08" ou "2026-10-08T09:30:00Z")
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Formato brasileiro DD/MM/YYYY ou DD/MM/YY (ex: "08/10/2026" ou "08/10/26")
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]) - 1;
    let year = Number(brMatch[3]);
    if (year < 100) {
      year += 2000;
    }
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : normalizeToLocalMidnight(fallback);
}

export function formatDateBr(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateIso(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getOrderReferenceDate(
  order: Pick<ClientRampaOrder, 'orderDate' | 'createdAt' | 'serviceDate'>,
  fallbackNow: Date = new Date()
): Date {
  return (
    parseFlexibleOrderDate(order.orderDate) ||
    parseFlexibleOrderDate(order.createdAt) ||
    parseFlexibleOrderDate(order.serviceDate) ||
    normalizeToLocalMidnight(fallbackNow)
  );
}

export interface OrderRetentionInfo {
  referenceDate: Date;
  referenceDateBr: string;
  expirationDate: Date;
  expirationDateBr: string;
  elapsedDays: number;
  currentDayNumber: number;
  daysRemaining: number;
  isExpired: boolean;
  statusLabel: string;
}

export function getOrderRetentionInfo(
  order: Pick<ClientRampaOrder, 'orderDate' | 'createdAt' | 'serviceDate'>,
  now: Date = new Date()
): OrderRetentionInfo {
  const todayMidnight = normalizeToLocalMidnight(now);
  const referenceDate = getOrderReferenceDate(order, todayMidnight);
  const expirationDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + ORDER_RETENTION_ELAPSED_DAYS
  );

  const elapsedDays = Math.floor((todayMidnight.getTime() - referenceDate.getTime()) / MS_PER_DAY);
  const currentDayNumber = Math.max(1, elapsedDays + 1);
  const daysRemaining = Math.max(0, ORDER_RETENTION_ELAPSED_DAYS - elapsedDays);
  const isExpired = elapsedDays >= ORDER_RETENTION_ELAPSED_DAYS;

  const referenceDateBr = formatDateBr(referenceDate);
  const expirationDateBr = formatDateBr(expirationDate);

  let statusLabel = '';
  if (isExpired) {
    statusLabel = `Expirado (${expirationDateBr} · 8º dia)`;
  } else if (daysRemaining === 1) {
    statusLabel = `Apaga amanhã (${expirationDateBr} · 8º dia)`;
  } else {
    statusLabel = `${expirationDateBr} (faltam ${daysRemaining}d)`;
  }

  return {
    referenceDate,
    referenceDateBr,
    expirationDate,
    expirationDateBr,
    elapsedDays,
    currentDayNumber,
    daysRemaining,
    isExpired,
    statusLabel,
  };
}

export function splitExpiredOrders(
  orders: ClientRampaOrder[],
  now: Date = new Date()
): {
  activeOrders: ClientRampaOrder[];
  expiredOrders: ClientRampaOrder[];
} {
  const activeOrders: ClientRampaOrder[] = [];
  const expiredWithTimestamp: { order: ClientRampaOrder; ts: number }[] = [];

  for (const order of orders) {
    const info = getOrderRetentionInfo(order, now);
    if (info.isExpired) {
      const createdTs = order.createdAt ? Date.parse(order.createdAt) : NaN;
      const ts = Number.isNaN(createdTs) ? info.referenceDate.getTime() : createdTs;
      expiredWithTimestamp.push({ order, ts });
    } else {
      activeOrders.push(order);
    }
  }

  // Ordena os expirados do mais antigo ("primeiro pedido") para o mais recente
  expiredWithTimestamp.sort((a, b) => a.ts - b.ts);

  return {
    activeOrders,
    expiredOrders: expiredWithTimestamp.map((item) => item.order),
  };
}

export function getNextExpiringOrder(
  orders: ClientRampaOrder[],
  now: Date = new Date()
): { order: ClientRampaOrder; info: OrderRetentionInfo } | null {
  if (!orders.length) return null;

  const ranked = orders
    .map((order) => ({
      order,
      info: getOrderRetentionInfo(order, now),
    }))
    .sort((a, b) => a.info.expirationDate.getTime() - b.info.expirationDate.getTime());

  return ranked[0] || null;
}
