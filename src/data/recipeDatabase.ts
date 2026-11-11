/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DishRecipe, RecipeIngredient, CalculatedIngredient, RecipeUnit } from '../types/recipeTypes';

/**
 * Formats a raw amount (in initial unit like 'g' or 'ml') into a human-readable
 * kitchen unit, scaling grams to kg and milliliters to Litros when appropriate.
 */
export function formatIngredientQuantity(amount: number, unit: RecipeUnit): string {
  if (unit === 'g') {
    if (amount >= 1000) {
      const kg = amount / 1000;
      return `${kg >= 100 ? kg.toFixed(1) : kg.toFixed(2)} kg`;
    }
    return `${Math.round(amount * 10) / 10} g`;
  }

  if (unit === 'ml') {
    if (amount >= 1000) {
      const liters = amount / 1000;
      return `${liters >= 100 ? liters.toFixed(1) : liters.toFixed(2)} L`;
    }
    return `${Math.round(amount)} ml`;
  }

  if (unit === 'un' || unit === 'dente') {
    const rounded = Math.round(amount * 10) / 10;
    return `${rounded} ${unit === 'dente' ? 'dentes' : 'un'}`;
  }

  return `${Math.round(amount * 10) / 10} ${unit}`;
}

/**
 * Calculates total net and gross ingredient quantities for a specific number of people.
 */
export function calculateRecipeForPax(recipe: DishRecipe, pax: number): {
  ingredients: CalculatedIngredient[];
  totalNetWeightKg: number;
  totalGrossWeightKg: number;
} {
  let totalNetGrams = 0;
  let totalGrossGrams = 0;

  const calculated = recipe.ingredients.map((ing) => {
    const net = ing.perCapitaAmount * pax;
    const gross = net * (ing.correctionFactor || 1.0);

    if (ing.initialUnit === 'g' || ing.initialUnit === 'ml') {
      totalNetGrams += net;
      totalGrossGrams += gross;
    }

    return {
      ...ing,
      totalNetQuantity: net,
      totalGrossQuantity: gross,
      formattedNet: formatIngredientQuantity(net, ing.initialUnit),
      formattedGross: formatIngredientQuantity(gross, ing.initialUnit),
    };
  });

  return {
    ingredients: calculated,
    totalNetWeightKg: Math.round((totalNetGrams / 1000) * 10) / 10,
    totalGrossWeightKg: Math.round((totalGrossGrams / 1000) * 10) / 10,
  };
}

/**
 * Standard authentic culinary technical specifications (Fichas Técnicas)
 * for Canção Nova community kitchen.
 */
export const CANONICAL_RECIPES: Record<string, DishRecipe> = {
  'alcatra grelhada ao alho e óleo': {
    id: 'rec-alcatra-grelhada',
    dishName: 'Alcatra Grelhada ao Alho e Óleo',
    category: 'principal',
    categoryLabel: 'Prato Principal',
    servingPortionGrams: 140,
    servingTemperature: '≥ 65°C (Pista Quente)',
    prepTimeMinutes: 45,
    difficulty: 'Médio',
    kitchenStation: 'Açougue / Carnes',
    equipment: ['Chapa profissional', 'Cubas GN 1/1 65mm perfuradas', 'Termômetro espeto'],
    allergens: [],
    chefNotes: 'Grelhar em fogo alto para selar os sucos da carne. Adicionar o alho frito apenas na montagem da cuba para preservar a crocância e aroma.',
    ingredients: [
      { id: 'i1', name: 'Alcatra bovina limpa em bifes médios', perCapitaAmount: 180, initialUnit: 'g', correctionFactor: 1.15, category: 'carnes', specification: 'Bifes de ~90g sem excesso de gordura' },
      { id: 'i2', name: 'Alho in natura triturado / laminado', perCapitaAmount: 4, initialUnit: 'g', correctionFactor: 1.10, category: 'temperos_oleos', specification: 'Dourado em óleo quente' },
      { id: 'i3', name: 'Óleo vegetal de soja', perCapitaAmount: 8, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos', specification: 'Para untar a chapa e fritar o alho' },
      { id: 'i4', name: 'Sal refinado iodado', perCapitaAmount: 2.5, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos', specification: 'Adicionar antes de grelhar' },
      { id: 'i5', name: 'Cheiro verde fresco (salsinha e cebolinha)', perCapitaAmount: 2, initialUnit: 'g', correctionFactor: 1.25, category: 'hortifruti', specification: 'Lavado e picado fininho' },
      { id: 'i6', name: 'Pimenta do reino preta moída', perCapitaAmount: 0.3, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos', specification: 'Moagem média' },
    ],
    preparationSteps: [
      'Higienizar as bancadas e utensílios conforme POP de manipulação de carnes cruas.',
      'Porcionar os bifes de alcatra no peso padrão de 90g por unidade (2 unidades per capita).',
      'Temperar a carne com sal, pimenta do reino e um fio de óleo 15 minutos antes da cocção.',
      'Aquecer a chapa a 200°C. Grelhar os bifes de 2 a 3 minutos de cada lado até ponto ideal (temperatura interna mínima de 74°C).',
      'Em panela separada, dourar o alho laminado em óleo até ficar levemente crocante e dourado.',
      'Acomodar os bifes em cubas GN 1/1 aquecidas, regar com o alho dourado e finalizar com cheiro verde fresco.',
      'Transferir imediatamente para o balcão térmico mantendo temperatura superior a 65°C.',
    ],
  },

  'carne de panela com cenoura e batata': {
    id: 'rec-carne-panela',
    dishName: 'Carne de Panela com Cenoura e Batata',
    category: 'principal',
    categoryLabel: 'Prato Principal',
    servingPortionGrams: 160,
    servingTemperature: '≥ 65°C (Pista Quente)',
    prepTimeMinutes: 75,
    difficulty: 'Fácil',
    kitchenStation: 'Cozinha Quente',
    equipment: ['Caldeirão a vapor / Panela de pressão industrial', 'Cubas GN 1/1 100mm'],
    allergens: [],
    chefNotes: 'Carne macia com molho encorpado sem uso de amido comercial. O amido natural da batata engrossa o caldo.',
    ingredients: [
      { id: 'i1', name: 'Músculo ou Acém bovino em cubos', perCapitaAmount: 160, initialUnit: 'g', correctionFactor: 1.18, category: 'carnes', specification: 'Cubos uniformes de 3x3 cm' },
      { id: 'i2', name: 'Batata inglesa média descascada', perCapitaAmount: 60, initialUnit: 'g', correctionFactor: 1.20, category: 'hortifruti', specification: 'Cortada em cubos médios' },
      { id: 'i3', name: 'Cenoura in natura fresca', perCapitaAmount: 40, initialUnit: 'g', correctionFactor: 1.15, category: 'hortifruti', specification: 'Em rodelas de 1 cm' },
      { id: 'i4', name: 'Cebola branca picada', perCapitaAmount: 15, initialUnit: 'g', correctionFactor: 1.12, category: 'hortifruti', specification: 'Brunoise fina' },
      { id: 'i5', name: 'Tomate maduro picado', perCapitaAmount: 20, initialUnit: 'g', correctionFactor: 1.10, category: 'hortifruti', specification: 'Concassé sem pele' },
      { id: 'i6', name: 'Alho triturado', perCapitaAmount: 3, initialUnit: 'g', correctionFactor: 1.10, category: 'temperos_oleos' },
      { id: 'i7', name: 'Óleo de soja', perCapitaAmount: 6, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i8', name: 'Sal e páprica doce', perCapitaAmount: 3, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i9', name: 'Folhas de louro e cheiro verde', perCapitaAmount: 1, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
    ],
    preparationSteps: [
      'Selar os cubos de carne em pequenas porções com óleo quente no caldeirão para caramelizar o fundo.',
      'Refogar a cebola, o alho e o tomate até formarem uma base aromática avermelhada.',
      'Adicionar o sal, a páprica e as folhas de louro. Cobrir com água fervente.',
      'Cozinhar sob pressão ou fervura lenta por cerca de 45 minutos até a carne amaciar.',
      'Adicionar a cenoura e, 10 minutos depois, a batata, para manter a textura firme sem desmanchar.',
      'Ajustar o sal e finalizar com cheiro verde picado antes de envasar nas cubas GN.',
    ],
  },

  'feijoada completa canção nova': {
    id: 'rec-feijoada',
    dishName: 'Feijoada Completa Canção Nova',
    category: 'principal',
    categoryLabel: 'Prato Principal',
    servingPortionGrams: 220,
    servingTemperature: '≥ 70°C (Pista Quente)',
    prepTimeMinutes: 120,
    difficulty: 'Médio',
    kitchenStation: 'Cozinha Quente',
    equipment: ['Caldeirão basculante a vapor', 'Concha industrial de aço inox', 'Cubas GN 1/1 150mm'],
    allergens: [],
    chefNotes: 'Dessalgar carnes salgadas 24 horas antes com 4 trocas de água fria sob refrigeração.',
    ingredients: [
      { id: 'i1', name: 'Feijão preto grãos selecionados', perCapitaAmount: 70, initialUnit: 'g', correctionFactor: 1.02, category: 'graos_cereais', specification: 'Rendimento de cocção: 2.5x' },
      { id: 'i2', name: 'Carne seca bovina (charque dessalgado)', perCapitaAmount: 40, initialUnit: 'g', correctionFactor: 1.15, category: 'carnes', specification: 'Dessalgada e em cubos' },
      { id: 'i3', name: 'Lombo suíno salgado dessalgado', perCapitaAmount: 35, initialUnit: 'g', correctionFactor: 1.12, category: 'carnes' },
      { id: 'i4', name: 'Costelinha suína defumada', perCapitaAmount: 45, initialUnit: 'g', correctionFactor: 1.25, category: 'carnes', specification: 'Cortada ripa a ripa' },
      { id: 'i5', name: 'Linguiça calabresa defumada', perCapitaAmount: 35, initialUnit: 'g', correctionFactor: 1.05, category: 'carnes', specification: 'Em rodelas grossas' },
      { id: 'i6', name: 'Linguiça paio fatiada', perCapitaAmount: 25, initialUnit: 'g', correctionFactor: 1.05, category: 'carnes' },
      { id: 'i7', name: 'Bacon em cubos', perCapitaAmount: 15, initialUnit: 'g', correctionFactor: 1.05, category: 'carnes' },
      { id: 'i8', name: 'Alho, cebola, louro e laranja', perCapitaAmount: 12, initialUnit: 'g', correctionFactor: 1.10, category: 'temperos_oleos' },
    ],
    preparationSteps: [
      'Deixar o feijão preto de molho por 4 horas para hidratação e redução de fitatos.',
      'Ferver as carnes dessalgadas previamente para pré-cozimento e eliminação de gordura excessiva.',
      'No caldeirão, iniciar o cozimento do feijão com as carnes mais duras (carne seca e lombo) e folhas de louro.',
      'Adicionar as costelinhas e em seguida as linguiças e paio.',
      'Em frigideira basculante, dourar o bacon, alho e cebola e juntar à feijoada para apurar o caldo.',
      'Cozinhar até o caldo ficar aveludado e cremoso. Servir acompanhado de couve, arroz, farofa e laranja.',
    ],
  },

  'filé de frango grelhado com limão e ervas': {
    id: 'rec-frango-grelhado',
    dishName: 'Filé de Frango Grelhado com Limão e Ervas',
    category: 'alternativa',
    categoryLabel: 'Opção Alternativa (Ave/Peixe)',
    servingPortionGrams: 130,
    servingTemperature: '≥ 65°C',
    prepTimeMinutes: 40,
    difficulty: 'Fácil',
    kitchenStation: 'Açougue / Carnes',
    equipment: ['Chapa lisa', 'Termômetro espeto'],
    allergens: [],
    chefNotes: 'Marinada com limão e azeite garante maciez e suculência no peito de frango.',
    ingredients: [
      { id: 'i1', name: 'Peito de frango filé limpo', perCapitaAmount: 160, initialUnit: 'g', correctionFactor: 1.10, category: 'carnes', specification: 'Filés espalmados uniformes' },
      { id: 'i2', name: 'Suco de limão taiti fresco', perCapitaAmount: 6, initialUnit: 'ml', correctionFactor: 1.30, category: 'hortifruti' },
      { id: 'i3', name: 'Alho triturado', perCapitaAmount: 3, initialUnit: 'g', correctionFactor: 1.10, category: 'temperos_oleos' },
      { id: 'i4', name: 'Ervas finas (orégano, tomilho e alecrim)', perCapitaAmount: 1, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i5', name: 'Óleo vegetal / Azeite', perCapitaAmount: 6, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i6', name: 'Sal refinado', perCapitaAmount: 2.2, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
    ],
    preparationSteps: [
      'Higienizar os filés e marinar com suco de limão, alho, ervas, sal e azeite por 30 minutos.',
      'Aquecer a chapa a 180°C. Grelhar por 3 a 4 minutos de cada lado até dourar sem ressecar.',
      'Conferir a temperatura interna no centro da peça (mínimo de 75°C).',
      'Armazenar em cuba aquecida para distribuição imediata.',
    ],
  },

  'filé de tilápia grelhada ao molho de ervas': {
    id: 'rec-tilapia',
    dishName: 'Filé de Tilápia Grelhada ao Molho de Ervas',
    category: 'alternativa',
    categoryLabel: 'Opção Alternativa (Peixe)',
    servingPortionGrams: 120,
    servingTemperature: '≥ 65°C',
    prepTimeMinutes: 35,
    difficulty: 'Médio',
    kitchenStation: 'Cozinha Quente',
    equipment: ['Forno combinado ou chapa teflonada', 'GN 1/1 40mm'],
    allergens: ['Peixe'],
    chefNotes: 'Manusear os filés com espátula larga para não quebrar a estrutura delicada do peixe.',
    ingredients: [
      { id: 'i1', name: 'Filé de tilápia fresco ou descongelado', perCapitaAmount: 150, initialUnit: 'g', correctionFactor: 1.08, category: 'carnes', specification: 'Sem espinhas' },
      { id: 'i2', name: 'Azeite de oliva extra virgem', perCapitaAmount: 7, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i3', name: 'Manteiga sem sal', perCapitaAmount: 5, initialUnit: 'g', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i4', name: 'Alcaparras e ervas frescas picadas', perCapitaAmount: 4, initialUnit: 'g', correctionFactor: 1.05, category: 'hortifruti' },
      { id: 'i5', name: 'Suco de limão siciliano', perCapitaAmount: 5, initialUnit: 'ml', correctionFactor: 1.20, category: 'hortifruti' },
      { id: 'i6', name: 'Sal e pimenta branca', perCapitaAmount: 2, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
    ],
    preparationSteps: [
      'Temperar os filés delicadamente com limão, sal e pimenta branca minutos antes de grelhar.',
      'Em forno combinado (modo calor seco a 190°C) ou chapa antiaderente, grelhar por 8 a 10 minutos.',
      'Preparar a emulsão de azeite, manteiga derretida, suco de limão e ervas finas picadas.',
      'Dispor os filés na GN e cobrir com o molho aromático de ervas.',
    ],
  },

  'lasanha de berinjela ao sugo e manjericão': {
    id: 'rec-lasanha-berinjela',
    dishName: 'Lasanha de Berinjela ao Sugo e Manjericão',
    category: 'vegetariano',
    categoryLabel: 'Opção Vegetariana',
    servingPortionGrams: 180,
    servingTemperature: '≥ 65°C',
    prepTimeMinutes: 60,
    difficulty: 'Médio',
    kitchenStation: 'Cozinha Quente',
    equipment: ['Forno combinado', 'GN 1/1 65mm'],
    allergens: ['Leite / Lactose'],
    chefNotes: 'Salgar e drenar as fatias de berinjela antes de montar para não soltar água excessiva na cocção.',
    ingredients: [
      { id: 'i1', name: 'Berinjela fresca em fatias longitudinais', perCapitaAmount: 140, initialUnit: 'g', correctionFactor: 1.20, category: 'hortifruti', specification: 'Fatias de 5mm' },
      { id: 'i2', name: 'Molho de tomate pelado artesanal ao sugo', perCapitaAmount: 80, initialUnit: 'ml', correctionFactor: 1.0, category: 'hortifruti' },
      { id: 'i3', name: 'Queijo mussarela ralado', perCapitaAmount: 35, initialUnit: 'g', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i4', name: 'Queijo parmesão ralado fino', perCapitaAmount: 8, initialUnit: 'g', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i5', name: 'Manjericão fresco e azeite', perCapitaAmount: 4, initialUnit: 'g', correctionFactor: 1.10, category: 'hortifruti' },
      { id: 'i6', name: 'Sal e orégano', perCapitaAmount: 2, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
    ],
    preparationSteps: [
      'Grelhar as fatias de berinjela rapidamente no forno a 200°C por 8 minutos para retirar a umidade.',
      'Na GN 1/1, montar camadas alternadas de molho de tomate ao sugo, fatias de berinjela, queijo mussarela e manjericão.',
      'Cobrir a última camada com molho e salpicar queijo parmesão ralado.',
      'Gratinar em forno combinado a 180°C por 25 minutos até o queijo dourar borbulhante.',
    ],
  },

  'arroz branco agulhinha & feijão carioca': {
    id: 'rec-arroz-feijao',
    dishName: 'Arroz Branco Agulhinha & Feijão Carioca',
    category: 'acompanhamento',
    categoryLabel: 'Acompanhamentos Base',
    servingPortionGrams: 200, // ~120g arroz + 80g feijão
    servingTemperature: '≥ 65°C',
    prepTimeMinutes: 45,
    difficulty: 'Fácil',
    kitchenStation: 'Cozinha Quente',
    equipment: ['Caldeirão a vapor', 'GN 1/1 100mm'],
    allergens: [],
    chefNotes: 'Arroz soltinho e feijão com caldo aveludado, a base nutricional sagrada do restaurante comunitário.',
    ingredients: [
      { id: 'i1', name: 'Arroz agulhinha tipo 1 cru', perCapitaAmount: 55, initialUnit: 'g', correctionFactor: 1.0, category: 'graos_cereais', specification: 'Rende ~130g cozido (fator 2.4x)' },
      { id: 'i2', name: 'Feijão carioca cru grãos novos', perCapitaAmount: 40, initialUnit: 'g', correctionFactor: 1.02, category: 'graos_cereais', specification: 'Rende ~100g com caldo' },
      { id: 'i3', name: 'Alho triturado fresco', perCapitaAmount: 4, initialUnit: 'g', correctionFactor: 1.10, category: 'temperos_oleos' },
      { id: 'i4', name: 'Cebola picada', perCapitaAmount: 6, initialUnit: 'g', correctionFactor: 1.12, category: 'hortifruti' },
      { id: 'i5', name: 'Óleo vegetal de soja', perCapitaAmount: 8, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i6', name: 'Sal refinado', perCapitaAmount: 3.5, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i7', name: 'Folhas de louro selecionadas', perCapitaAmount: 0.2, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
    ],
    preparationSteps: [
      'Arroz: Refogar o alho e cebola no óleo quente, juntar o arroz e fritar até perolizar. Adicionar água fervente (proporção 2:1) e sal. Cozinhar em fogo brando com caldeirão tampado.',
      'Feijão: Deixar o feijão de molho por 3 horas. Cozinhar no caldeirão com água e louro até os grãos amaciarem.',
      'Temperar o feijão com refogado de alho e cebola dourados, amassar uma concha de grãos para espessar o caldo e ferver por mais 15 minutos para apurar o sabor.',
    ],
  },

  'purê de batata com noz-moscada': {
    id: 'rec-pure-batata',
    dishName: 'Purê de Batata com Noz-Moscada',
    category: 'guarnicao',
    categoryLabel: 'Guarnição',
    servingPortionGrams: 120,
    servingTemperature: '≥ 65°C',
    prepTimeMinutes: 45,
    difficulty: 'Fácil',
    kitchenStation: 'Cozinha Quente',
    equipment: ['Espremedor industrial de batatas', 'Caldeirão a vapor', 'GN 1/1 65mm'],
    allergens: ['Leite / Lactose'],
    chefNotes: 'Amassar a batata ainda quente para não desenvolver elasticidade indesejada.',
    ingredients: [
      { id: 'i1', name: 'Batata inglesa descascada', perCapitaAmount: 130, initialUnit: 'g', correctionFactor: 1.25, category: 'hortifruti', specification: 'Cozida no vapor' },
      { id: 'i2', name: 'Manteiga sem sal de primeira', perCapitaAmount: 8, initialUnit: 'g', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i3', name: 'Leite integral padronizado', perCapitaAmount: 20, initialUnit: 'ml', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i4', name: 'Sal refinado', perCapitaAmount: 1.8, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i5', name: 'Noz-moscada ralada na hora', perCapitaAmount: 0.1, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
    ],
    preparationSteps: [
      'Cozinhar as batatas cortadas no vapor até ficarem bem macias.',
      'Passar no espremedor de batata industrial ainda fumegantes.',
      'No caldeirão aquecido, incorporar a manteiga e o leite quente aos poucos, batendo com batedor de arame até emulsão cremosa.',
      'Finalizar com o sal e o toque aromático de noz-moscada ralada na hora.',
    ],
  },

  'farofa rica crocante com bacon e cenoura': {
    id: 'rec-farofa-rica',
    dishName: 'Farofa Rica Crocante com Bacon e Cenoura',
    category: 'guarnicao',
    categoryLabel: 'Guarnição',
    servingPortionGrams: 80,
    servingTemperature: '≥ 60°C ou Ambiente',
    prepTimeMinutes: 30,
    difficulty: 'Fácil',
    kitchenStation: 'Cozinha Quente',
    equipment: ['Frigideira basculante industrial', 'GN 1/1 65mm'],
    allergens: [],
    chefNotes: 'Torrar a farinha em fogo médio até ficar bem crocante e dourada antes de juntar a cenoura.',
    ingredients: [
      { id: 'i1', name: 'Farinha de mandioca torrada biju', perCapitaAmount: 45, initialUnit: 'g', correctionFactor: 1.0, category: 'graos_cereais' },
      { id: 'i2', name: 'Bacon em cubinhos defumado', perCapitaAmount: 18, initialUnit: 'g', correctionFactor: 1.08, category: 'carnes' },
      { id: 'i3', name: 'Cenoura ralada em fios médios', perCapitaAmount: 20, initialUnit: 'g', correctionFactor: 1.15, category: 'hortifruti' },
      { id: 'i4', name: 'Cebola picadinha', perCapitaAmount: 8, initialUnit: 'g', correctionFactor: 1.12, category: 'hortifruti' },
      { id: 'i5', name: 'Manteiga / Margarina culinária', perCapitaAmount: 6, initialUnit: 'g', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i6', name: 'Cheiro verde e sal', perCapitaAmount: 2, initialUnit: 'g', correctionFactor: 1.10, category: 'hortifruti' },
    ],
    preparationSteps: [
      'Na frigideira basculante, fritar o bacon até soltar sua gordura natural e ficar crocante.',
      'Adicionar a cebola picadinha e a manteiga, refogando até dourar.',
      'Juntar a cenoura ralada e saltear rapidamente para manter a cor viva.',
      'Adicionar a farinha de mandioca aos poucos, mexendo sem parar até absorver os sabores e ficar uniforme.',
      'Ajustar o sal e finalizar com cheiro verde fresco bem picado.',
    ],
  },

  'pudim de leite condensado artesanal': {
    id: 'rec-pudim-leite',
    dishName: 'Pudim de Leite Condensado Artesanal',
    category: 'sobremesa',
    categoryLabel: 'Sobremesa',
    servingPortionGrams: 100,
    servingTemperature: '≤ 8°C (Pista Fria / Refrigerado)',
    prepTimeMinutes: 90,
    difficulty: 'Médio',
    kitchenStation: 'Confeitaria / Sobremesa',
    equipment: ['Formas de pudim com furo central / GNs', 'Forno combinado banho-maria'],
    allergens: ['Leite / Lactose', 'Ovos'],
    chefNotes: 'Assar em banho-maria coberto com papel alumínio a 160°C para textura aveludada sem furinhos.',
    ingredients: [
      { id: 'i1', name: 'Leite condensado integral', perCapitaAmount: 40, initialUnit: 'g', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i2', name: 'Leite de vaca integral', perCapitaAmount: 40, initialUnit: 'ml', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i3', name: 'Ovos inteiros pasteurizados', perCapitaAmount: 0.35, initialUnit: 'un', correctionFactor: 1.05, category: 'laticinios', specification: 'Líquido pasteurizado seguro' },
      { id: 'i4', name: 'Açúcar cristal para calda caramelizada', perCapitaAmount: 18, initialUnit: 'g', correctionFactor: 1.0, category: 'graos_cereais' },
      { id: 'i5', name: 'Extrato natural de baunilha', perCapitaAmount: 0.2, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
    ],
    preparationSteps: [
      'Caramelizar as formas com calda de açúcar em ponto de caramelo âmbar.',
      'Bater o leite condensado, o leite integral, os ovos pasteurizados e a baunilha em liquidificador industrial por 2 minutos.',
      'Despejar na forma caramelizada passando por peneira fina para remover bolhas de ar.',
      'Assar em forno combinado a 160°C em banho-maria por aproximadamente 60 minutos.',
      'Resfriar em câmara fria por no mínimo 6 horas antes de fatiar ou desenformar.',
    ],
  },
};

/**
 * Returns a canonical recipe if registered, or intelligently synthesizes a realistic,
 * accurate technical culinary recipe for ANY dish name in the database.
 */
export function getOrGenerateRecipe(dishName: string, category: string): DishRecipe {
  const normKey = dishName.trim().toLowerCase();

  if (CANONICAL_RECIPES[normKey]) {
    return CANONICAL_RECIPES[normKey];
  }

  // Look for partial key matches
  const match = Object.keys(CANONICAL_RECIPES).find((k) => normKey.includes(k) || k.includes(normKey));
  if (match) {
    return {
      ...CANONICAL_RECIPES[match],
      id: `rec-${normKey.replace(/\s+/g, '-')}`,
      dishName,
    };
  }

  // Synthesize realistic technical culinary recipe based on category and dish name
  const cat = category.toLowerCase();
  const isMeat = cat.includes('principal') || cat.includes('grelhado');
  const isPoultryFish = cat.includes('alternativa') || normKey.includes('frango') || normKey.includes('peixe') || normKey.includes('tilápia');
  const isVeg = cat.includes('vegetariano') || normKey.includes('legume') || normKey.includes('berinjela') || normKey.includes('abóbora');
  const isGarnish = cat.includes('guarnicao') || normKey.includes('farofa') || normKey.includes('purê') || normKey.includes('batata');
  const isSalad = cat.includes('salada') || normKey.includes('folhas') || normKey.includes('vinagrete');
  const isDessert = cat.includes('sobremesa') || normKey.includes('doce') || normKey.includes('pudim') || normKey.includes('fruta');

  let defaultPortion = 140;
  let defaultStation: DishRecipe['kitchenStation'] = 'Cozinha Quente';
  let defaultTemp = '≥ 65°C (Pista Quente)';
  const ingredients: RecipeIngredient[] = [];
  const prepSteps: string[] = [];

  if (isDessert) {
    defaultPortion = 100;
    defaultStation = 'Confeitaria / Sobremesa';
    defaultTemp = '≤ 8°C (Pista Fria / Refrigerado)';
    ingredients.push(
      { id: 'i1', name: `Base principal para ${dishName}`, perCapitaAmount: 70, initialUnit: 'g', correctionFactor: 1.05, category: 'hortifruti' },
      { id: 'i2', name: 'Açúcar cristal / calda base', perCapitaAmount: 20, initialUnit: 'g', correctionFactor: 1.0, category: 'graos_cereais' },
      { id: 'i3', name: 'Leite / base láctea culinária', perCapitaAmount: 25, initialUnit: 'ml', correctionFactor: 1.0, category: 'laticinios' },
      { id: 'i4', name: 'Aroma / especiarias (cravo, canela ou baunilha)', perCapitaAmount: 0.5, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' }
    );
    prepSteps.push(
      'Higienizar os insumos e preparar as formas ou travessas de montagem.',
      'Cozinhar a base com açúcar e aromas em fogo brando até atingir ponto de consistência aveludado.',
      'Fracionar nas cubas e resfriar rapidamente na câmara fria abaixo de 8°C antes do serviço.'
    );
  } else if (isSalad) {
    defaultPortion = 70;
    defaultStation = 'Saladeiro';
    defaultTemp = '≤ 10°C (Pista Fria)';
    ingredients.push(
      { id: 'i1', name: `Vegetais base de ${dishName}`, perCapitaAmount: 60, initialUnit: 'g', correctionFactor: 1.25, category: 'hortifruti', specification: 'Sanitizados em solução clorada' },
      { id: 'i2', name: 'Azeite de oliva e vinagre/limão', perCapitaAmount: 6, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i3', name: 'Sal e ervas frescas picadas', perCapitaAmount: 1.5, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' }
    );
    prepSteps.push(
      'Fazer a sanitização obrigatória em solução clorada a 200 ppm por 15 minutos e enxaguar com água potável.',
      'Cortar e centrifugar os vegetais para remoção da água excedente.',
      'Montar nas travessas frias e manter na câmara de saladas até a abertura do buffet.'
    );
  } else if (isGarnish) {
    defaultPortion = 100;
    defaultStation = 'Cozinha Quente';
    ingredients.push(
      { id: 'i1', name: `Insumo principal de ${dishName}`, perCapitaAmount: 90, initialUnit: 'g', correctionFactor: 1.15, category: 'hortifruti' },
      { id: 'i2', name: 'Alho e cebola picados', perCapitaAmount: 6, initialUnit: 'g', correctionFactor: 1.10, category: 'hortifruti' },
      { id: 'i3', name: 'Manteiga / Óleo vegetal', perCapitaAmount: 6, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i4', name: 'Sal refinado e cheiro verde', perCapitaAmount: 2, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' }
    );
    prepSteps.push(
      'Fazer o pré-preparo higienizando e cortando os insumos conforme padrão.',
      'Refogar em frigideira basculante com os temperos aromáticos até atingir cocção e textura ideais.',
      'Acondicionar em cubas GN térmicas mantendo temperatura superior a 65°C.'
    );
  } else if (isVeg) {
    defaultPortion = 140;
    defaultStation = 'Cozinha Quente';
    ingredients.push(
      { id: 'i1', name: `Proteína vegetal / base de ${dishName}`, perCapitaAmount: 110, initialUnit: 'g', correctionFactor: 1.15, category: 'graos_cereais' },
      { id: 'i2', name: 'Legumes aromáticos picados', perCapitaAmount: 30, initialUnit: 'g', correctionFactor: 1.20, category: 'hortifruti' },
      { id: 'i3', name: 'Molho / temperos artesanais', perCapitaAmount: 25, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i4', name: 'Azeite e sal marinho', perCapitaAmount: 5, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' }
    );
    prepSteps.push(
      'Preparar a base de legumes e grãos garantindo tempero rico e equilibrado.',
      'Assar ou cozinhar no forno combinado a 180°C até atingir o ponto ideal de serviço.',
      'Finalizar com ervas frescas e dispor na pista quente do buffet.'
    );
  } else if (isPoultryFish) {
    defaultPortion = 130;
    defaultStation = 'Açougue / Carnes';
    ingredients.push(
      { id: 'i1', name: `Corte de ave/peixe para ${dishName}`, perCapitaAmount: 155, initialUnit: 'g', correctionFactor: 1.12, category: 'carnes', specification: 'Porcionado limpo' },
      { id: 'i2', name: 'Marinada de limão, alho e ervas', perCapitaAmount: 10, initialUnit: 'ml', correctionFactor: 1.05, category: 'temperos_oleos' },
      { id: 'i3', name: 'Óleo de soja / azeite', perCapitaAmount: 6, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i4', name: 'Sal refinado e condimentos', perCapitaAmount: 2.5, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' }
    );
    prepSteps.push(
      'Marinar o corte limpo em tempero de alho, sal e cítricos por 20 minutos.',
      'Grelhar ou assar até atingir temperatura interna de segurança de 75°C.',
      'Transferir para GN aquecida e cobrir para preservar a umidade.'
    );
  } else {
    // Default meat
    defaultPortion = 140;
    defaultStation = 'Açougue / Carnes';
    ingredients.push(
      { id: 'i1', name: `Corte bovino / suíno para ${dishName}`, perCapitaAmount: 170, initialUnit: 'g', correctionFactor: 1.15, category: 'carnes', specification: 'Corte padronizado' },
      { id: 'i2', name: 'Alho triturado e cebola', perCapitaAmount: 7, initialUnit: 'g', correctionFactor: 1.10, category: 'temperos_oleos' },
      { id: 'i3', name: 'Óleo vegetal para selagem', perCapitaAmount: 6, initialUnit: 'ml', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i4', name: 'Sal e especiarias da casa', perCapitaAmount: 2.8, initialUnit: 'g', correctionFactor: 1.0, category: 'temperos_oleos' },
      { id: 'i5', name: 'Cheiro verde fresco', perCapitaAmount: 2, initialUnit: 'g', correctionFactor: 1.20, category: 'hortifruti' }
    );
    prepSteps.push(
      'Temperar a carne com alho, sal e especiarias.',
      'Grelhar ou brasear no caldeirão em alta temperatura para reter o suco.',
      'Cozinhar até atingir ponto de maciez ideal (mínimo 74°C interno).',
      'Finalizar com cheiro verde e manter no pass-through acima de 65°C.'
    );
  }

  return {
    id: `gen-rec-${normKey.replace(/[^a-z0-9]/g, '-')}`,
    dishName,
    category,
    categoryLabel: category,
    servingPortionGrams: defaultPortion,
    servingTemperature: defaultTemp,
    prepTimeMinutes: 45,
    difficulty: 'Médio',
    kitchenStation: defaultStation,
    ingredients,
    preparationSteps: prepSteps,
    equipment: ['Caldeirão / Forno combinado', 'GN 1/1 65mm', 'Termômetro espeto'],
    allergens: [],
    chefNotes: `Ficha técnica padronizada Canção Nova para ${dishName}. Respeitar as unidades iniciais per capita para garantir o custo e gramatura ideal.`,
  };
}
