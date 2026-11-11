/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RecipeUnit = 'g' | 'ml' | 'un' | 'colher sopa' | 'pitada' | 'dente';

export interface RecipeIngredient {
  id: string;
  name: string;
  perCapitaAmount: number; // Quantidade inicial per capita por pessoa (ex: 180 para 180g)
  initialUnit: RecipeUnit; // Unidade inicial ('g', 'ml', 'un')
  correctionFactor: number; // Fator de Correção / Limpeza (FC: ex 1.15 para carne, 1.25 para legumes com casca)
  category?: 'carnes' | 'hortifruti' | 'laticinios' | 'graos_cereais' | 'temperos_oleos' | 'outros';
  specification?: string; // Especificação técnica (ex: 'Corte em cubos médios', 'Picado fino', 'Primeira linha')
}

export interface CalculatedIngredient extends RecipeIngredient {
  totalNetQuantity: number; // Quantidade líquida total para N pessoas
  totalGrossQuantity: number; // Quantidade bruta com FC para requisição ao estoque
  formattedNet: string; // Ex: "72.0 kg" ou "450 g"
  formattedGross: string; // Ex: "82.8 kg" ou "520 g"
}

export interface DishRecipe {
  id: string;
  dishName: string;
  category: string;
  categoryLabel: string;
  servingPortionGrams: number; // Peso da porção servida no prato (ex: 140g)
  servingTemperature: string; // Ex: "> 65°C (Pista Quente)" ou "< 10°C (Pista Fria)"
  prepTimeMinutes: number; // Tempo de preparo em minutos
  difficulty: 'Fácil' | 'Médio' | 'Avançado';
  kitchenStation: 'Açougue / Carnes' | 'Cozinha Quente' | 'Legumaria' | 'Saladeiro' | 'Confeitaria / Sobremesa' | 'Artesanal';
  ingredients: RecipeIngredient[];
  preparationSteps: string[];
  equipment: string[]; // Ex: ['Caldeirão a vapor', 'GN 1/1 65mm', 'Forno combinado']
  allergens: string[];
  chefNotes?: string;
  updatedAt?: string;
}
