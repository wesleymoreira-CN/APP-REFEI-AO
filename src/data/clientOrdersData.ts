/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientRampaOrder, FruitOrderItem } from '../types';

export interface AvailableFruit {
  id: string;
  name: string;
  icon: string;
  category: 'cítrica' | 'tropical' | 'da estação' | 'fatiada';
  defaultUnit: 'un' | 'kg' | 'porções' | 'fatias';
  perPersonEstimate: string; // Ex: '1 un por pessoa' ou '150g por pessoa'
  description: string;
}

export const CANONICAL_FRUITS: AvailableFruit[] = [
  {
    id: 'f-banana',
    name: 'Banana Prata da Região',
    icon: '🍌',
    category: 'tropical',
    defaultUnit: 'un',
    perPersonEstimate: '1 un por pessoa',
    description: 'Banana prata selecionada, rica em potássio e ideal para consumo rápido.',
  },
  {
    id: 'f-maca',
    name: 'Maçã Gala / Fuji',
    icon: '🍎',
    category: 'da estação',
    defaultUnit: 'un',
    perPersonEstimate: '1 un por pessoa',
    description: 'Maçã fresca, higienizada e pronta para consumo individual.',
  },
  {
    id: 'f-melancia',
    name: 'Melancia Fatiada Gelada',
    icon: '🍉',
    category: 'fatiada',
    defaultUnit: 'kg',
    perPersonEstimate: '180g (1 fatia generosa) por pessoa',
    description: 'Fatias frescas e bem geladas, armazenadas sob refrigeração < 10°C.',
  },
  {
    id: 'f-abacaxi',
    name: 'Abacaxi Pérola Fatiado',
    icon: '🍍',
    category: 'tropical',
    defaultUnit: 'kg',
    perPersonEstimate: '140g por pessoa',
    description: 'Abacaxi doce e refrescante, sem miolo duro, cortado em rodelas.',
  },
  {
    id: 'f-laranja',
    name: 'Laranja Pera Rio Descascada',
    icon: '🍊',
    category: 'cítrica',
    defaultUnit: 'un',
    perPersonEstimate: '1 un por pessoa',
    description: 'Laranja pera descascada inteira ou cortada ao meio para fácil consumo.',
  },
  {
    id: 'f-mamao',
    name: 'Mamão Formosa em Cubos / Fatias',
    icon: '🍈',
    category: 'tropical',
    defaultUnit: 'kg',
    perPersonEstimate: '150g por pessoa',
    description: 'Mamão maduro em cubos higienizados com toque de hortelã fresca.',
  },
  {
    id: 'f-uva',
    name: 'Uva Niágara / Thompson sem Semente',
    icon: '🍇',
    category: 'da estação',
    defaultUnit: 'kg',
    perPersonEstimate: '100g por pessoa',
    description: 'Cachos lavados e higienizados de uva doce da estação.',
  },
  {
    id: 'f-manga',
    name: 'Manga Palmer Fatiada',
    icon: '🥭',
    category: 'tropical',
    defaultUnit: 'kg',
    perPersonEstimate: '130g por pessoa',
    description: 'Manga palmer sem fiapos, fatiada em tiras doces.',
  },
  {
    id: 'f-salada-frutas',
    name: 'Salada de Frutas Mista com Suco Natural de Laranja',
    icon: '🍓',
    category: 'fatiada',
    defaultUnit: 'porções',
    perPersonEstimate: '1 porção (180ml) por pessoa',
    description: 'Mix de maçã, banana, melão, mamão e uva imersos em suco puro de laranja.',
  },
];

function buildRelativeOrderDates(daysAgo: number): {
  orderDate: string;
  serviceDate: string;
  dayName: string;
  createdAt: string;
} {
  const now = new Date();
  const ref = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 9, 30, 0);
  const yyyy = ref.getFullYear();
  const mm = String(ref.getMonth() + 1).padStart(2, '0');
  const dd = String(ref.getDate()).padStart(2, '0');
  const weekdayNames = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  return {
    orderDate: `${yyyy}-${mm}-${dd}`,
    serviceDate: `${dd}/${mm}/${yyyy}`,
    dayName: weekdayNames[ref.getDay()] || 'Segunda-feira',
    createdAt: `${yyyy}-${mm}-${dd}T09:30:00`,
  };
}

const sampleDateOldest = buildRelativeOrderDates(5);
const sampleDateMiddle = buildRelativeOrderDates(2);
const sampleDateToday = buildRelativeOrderDates(0);

export const INITIAL_CLIENT_ORDERS: ClientRampaOrder[] = [
  {
    id: 'order-1',
    orderNumber: 'PED-RAMPA-001',
    clientName: 'Wesley Moreira (Admin MASTER)',
    clientEmail: 'wesley.moreira@comunidadecancaonova.com',
    clientPhone: '(12) 3186-2000',
    departmentOrGroup: 'Coordenação de Nutrição & Alimentação',
    orderDate: sampleDateOldest.orderDate,
    serviceDate: sampleDateOldest.serviceDate,
    dayName: sampleDateOldest.dayName,
    mealShift: 'Almoço',
    numberOfPeople: 10,
    mealItems: [
      { id: 'arroz', category: 'arroz', categoryLabel: 'Arroz', dishName: 'Arroz Branco Agulhinha Soltinho', peopleCount: 5, icon: '🍚' },
      { id: 'feijao', category: 'feijao', categoryLabel: 'Feijão', dishName: 'Feijão Carioca Especial', peopleCount: 5, icon: '🫘' },
      { id: 'principal', category: 'principal', categoryLabel: 'Prato Principal', dishName: 'Picadinho Bife à Role Recheado', peopleCount: 8, icon: '🥩' },
      { id: 'guarnicao', category: 'guarnicao', categoryLabel: 'Guarnição do Buffet', dishName: 'Purê de Mandioquinha Perfumado', peopleCount: 8, icon: '🥔' },
      { id: 'salada', category: 'salada', categoryLabel: 'Salada Fresca', dishName: 'Salada Tropical Refrescante', peopleCount: 5, icon: '🥬' },
      { id: 'sobremesa', category: 'sobremesa', categoryLabel: 'Frutas ou Sobremesa', dishName: 'Frutas Frescas da Estação', peopleCount: 10, icon: '🍮' },
    ],
    fruits: [
      { id: 'f-banana', name: 'Banana Prata da Região', quantity: 10, unit: 'un', notes: 'Fruta do dia' },
    ],
    specialDietNotes: 'Pedido teste oficial do sistema de rampa com quantitativo detalhado por pessoa.',
    status: 'aprovado',
    createdAt: sampleDateOldest.createdAt,
  },
  {
    id: 'order-2',
    orderNumber: 'PED-RAMPA-002',
    clientName: 'Lucas Ferreira (Coordenação de Retiros)',
    clientEmail: 'eventos.retiros@cancaonova.com',
    clientPhone: '(12) 3186-2000',
    departmentOrGroup: 'Retiro Nacional de Jovens Sarados',
    orderDate: sampleDateMiddle.orderDate,
    serviceDate: sampleDateMiddle.serviceDate,
    dayName: sampleDateMiddle.dayName,
    mealShift: 'Almoço',
    numberOfPeople: 350,
    mealItems: [
      { id: 'arroz', category: 'arroz', categoryLabel: 'Arroz', dishName: 'Arroz Branco Agulhinha', peopleCount: 350, icon: '🍚' },
      { id: 'feijao', category: 'feijao', categoryLabel: 'Feijão', dishName: 'Feijão Carioca Especial', peopleCount: 350, icon: '🫘' },
      { id: 'principal', category: 'principal', categoryLabel: 'Prato Principal', dishName: 'Carne de Panela com Cenoura e Batata', peopleCount: 350, icon: '🥩' },
      { id: 'guarnicao', category: 'guarnicao', categoryLabel: 'Guarnição do Buffet', dishName: 'Legumes Salteados no Azeite', peopleCount: 350, icon: '🥔' },
      { id: 'salada', category: 'salada', categoryLabel: 'Salada Fresca', dishName: 'Mix de Folhas Nobres', peopleCount: 280, icon: '🥬' },
      { id: 'sobremesa', category: 'sobremesa', categoryLabel: 'Frutas ou Sobremesa', dishName: 'Melancia Fatiada Gelada', peopleCount: 350, icon: '🍮' },
    ],
    fruits: [
      { id: 'f-melancia', name: 'Melancia Fatiada Gelada', quantity: 65, unit: 'kg', notes: 'Servir bem gelada no buffet' },
    ],
    specialDietNotes: 'Temos aproximadamente 15 pessoas vegetarianas e 3 celíacos no grupo.',
    status: 'aprovado',
    createdAt: sampleDateMiddle.createdAt,
  },
  {
    id: 'order-3',
    orderNumber: 'PED-RAMPA-003',
    clientName: 'Ir. Maria Helena (Peregrinos de Fátima)',
    clientEmail: 'cliente.peregrinos@cancaonova.com',
    clientPhone: '(11) 98765-4321',
    departmentOrGroup: 'Caravana Peregrinos de Fátima (3 Ônibus)',
    orderDate: sampleDateToday.orderDate,
    serviceDate: sampleDateToday.serviceDate,
    dayName: sampleDateToday.dayName,
    mealShift: 'Almoço',
    numberOfPeople: 140,
    mealItems: [
      { id: 'arroz', category: 'arroz', categoryLabel: 'Arroz', dishName: 'Arroz Branco Agulhinha', peopleCount: 140, icon: '🍚' },
      { id: 'feijao', category: 'feijao', categoryLabel: 'Feijão', dishName: 'Feijão Preto Especial', peopleCount: 140, icon: '🫘' },
      { id: 'principal', category: 'principal', categoryLabel: 'Prato Principal', dishName: 'Feijoada Completa Canção Nova', peopleCount: 140, icon: '🥩' },
      { id: 'guarnicao', category: 'guarnicao', categoryLabel: 'Guarnição do Buffet', dishName: 'Farofa Rica e Couve Refogada', peopleCount: 140, icon: '🥔' },
      { id: 'salada', category: 'salada', categoryLabel: 'Salada Fresca', dishName: 'Salada Coleslaw Tropical', peopleCount: 100, icon: '🥬' },
      { id: 'sobremesa', category: 'sobremesa', categoryLabel: 'Frutas ou Sobremesa', dishName: 'Abacaxi Pérola Fatiado', peopleCount: 140, icon: '🍮' },
    ],
    fruits: [
      { id: 'f-abacaxi', name: 'Abacaxi Pérola Fatiado', quantity: 25, unit: 'kg' },
    ],
    specialDietNotes: 'Idosos no grupo: evitar alimentos com excesso de sódio ou pimenta.',
    status: 'solicitado',
    createdAt: sampleDateToday.createdAt,
  },
];
