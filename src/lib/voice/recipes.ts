import { Recipe } from './types';

export const RECIPES: Recipe[] = [
  {
    name: 'Chicken Biryani',
    nameHindi: 'चिकन बिरयानी',
    nameBengali: 'চিকেন বিরিয়ানি',
    ingredients: [
      { product_name: 'chicken', quantity: '1 kg', alternatives: ['chicken thighs', 'chicken breast'] },
      { product_name: 'basmati rice', quantity: '500 g', alternatives: ['rice'] },
      { product_name: 'onion', quantity: '3 pieces', alternatives: ['onions'] },
      { product_name: 'tomato', quantity: '2 pieces', alternatives: ['tomatoes'] },
      { product_name: 'yogurt', quantity: '200 g', alternatives: ['curd', 'dahi'] },
      { product_name: 'ginger garlic paste', quantity: '2 tbsp', alternatives: ['ginger', 'garlic'] },
      { product_name: 'biryani masala', quantity: '2 tbsp', alternatives: ['garam masala'] },
      { product_name: 'oil', quantity: '100 ml', alternatives: ['cooking oil', 'vegetable oil'] },
      { product_name: 'salt', quantity: '1 tsp' },
      { product_name: 'coriander', quantity: '1 bunch', alternatives: ['fresh coriander', 'cilantro'] },
      { product_name: 'mint', quantity: '1 bunch', alternatives: ['mint leaves'] },
    ],
  },
  {
    name: 'Butter Chicken',
    nameHindi: 'बटर चिकन',
    nameBengali: 'বাটার চিকেন',
    ingredients: [
      { product_name: 'chicken', quantity: '750 g', alternatives: ['chicken breast', 'boneless chicken'] },
      { product_name: 'butter', quantity: '100 g', alternatives: ['unsalted butter'] },
      { product_name: 'cream', quantity: '200 ml', alternatives: ['fresh cream', 'heavy cream'] },
      { product_name: 'tomato', quantity: '500 g', alternatives: ['tomatoes', 'tomato puree'] },
      { product_name: 'onion', quantity: '2 pieces', alternatives: ['onions'] },
      { product_name: 'ginger garlic paste', quantity: '2 tbsp', alternatives: ['ginger', 'garlic'] },
      { product_name: 'kasuri methi', quantity: '1 tbsp', alternatives: ['fenugreek leaves'] },
      { product_name: 'garam masala', quantity: '1 tsp' },
      { product_name: 'red chili powder', quantity: '1 tsp', alternatives: ['chili powder'] },
      { product_name: 'salt', quantity: '1 tsp' },
    ],
  },
  {
    name: 'Paneer Butter Masala',
    nameHindi: 'पनीर बटर मसाला',
    nameBengali: 'পনির বাটার মসলা',
    ingredients: [
      { product_name: 'paneer', quantity: '400 g', alternatives: ['cottage cheese'] },
      { product_name: 'butter', quantity: '50 g', alternatives: ['unsalted butter'] },
      { product_name: 'cream', quantity: '150 ml', alternatives: ['fresh cream'] },
      { product_name: 'tomato', quantity: '400 g', alternatives: ['tomatoes'] },
      { product_name: 'onion', quantity: '2 pieces', alternatives: ['onions'] },
      { product_name: 'cashew', quantity: '50 g', alternatives: ['cashew nuts', 'cashews'] },
      { product_name: 'ginger garlic paste', quantity: '1 tbsp', alternatives: ['ginger', 'garlic'] },
      { product_name: 'garam masala', quantity: '1 tsp' },
      { product_name: 'kasuri methi', quantity: '1 tsp', alternatives: ['fenugreek leaves'] },
      { product_name: 'salt', quantity: '1 tsp' },
    ],
  },
  {
    name: 'Dal Tadka',
    nameHindi: 'दाल तड़का',
    nameBengali: 'ডাল তড়কা',
    ingredients: [
      { product_name: 'toor dal', quantity: '250 g', alternatives: ['yellow dal', 'arhar dal', 'lentils'] },
      { product_name: 'onion', quantity: '2 pieces', alternatives: ['onions'] },
      { product_name: 'tomato', quantity: '2 pieces', alternatives: ['tomatoes'] },
      { product_name: 'ghee', quantity: '3 tbsp', alternatives: ['clarified butter', 'butter'] },
      { product_name: 'cumin seeds', quantity: '1 tsp', alternatives: ['jeera'] },
      { product_name: 'garlic', quantity: '6 cloves', alternatives: ['garlic cloves'] },
      { product_name: 'ginger', quantity: '1 inch', alternatives: ['fresh ginger'] },
      { product_name: 'red chili powder', quantity: '1 tsp', alternatives: ['chili powder'] },
      { product_name: 'turmeric powder', quantity: '1/2 tsp', alternatives: ['haldi'] },
      { product_name: 'coriander', quantity: '1 bunch', alternatives: ['fresh coriander'] },
      { product_name: 'salt', quantity: '1 tsp' },
    ],
  },
  {
    name: 'Egg Curry',
    nameHindi: 'अंडा करी',
    nameBengali: 'ডিম কারি',
    ingredients: [
      { product_name: 'eggs', quantity: '6 pieces', alternatives: ['egg'] },
      { product_name: 'onion', quantity: '2 pieces', alternatives: ['onions'] },
      { product_name: 'tomato', quantity: '3 pieces', alternatives: ['tomatoes'] },
      { product_name: 'ginger garlic paste', quantity: '1 tbsp', alternatives: ['ginger', 'garlic'] },
      { product_name: 'oil', quantity: '3 tbsp', alternatives: ['cooking oil'] },
      { product_name: 'turmeric powder', quantity: '1/2 tsp', alternatives: ['haldi'] },
      { product_name: 'red chili powder', quantity: '1 tsp', alternatives: ['chili powder'] },
      { product_name: 'coriander powder', quantity: '1 tsp', alternatives: ['dhania powder'] },
      { product_name: 'garam masala', quantity: '1 tsp' },
      { product_name: 'salt', quantity: '1 tsp' },
      { product_name: 'coriander', quantity: '1 bunch', alternatives: ['fresh coriander'] },
    ],
  },
];

// Search for recipe by name (handles English, Hindi, Bengali)
export function findRecipe(query: string): Recipe | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  return RECIPES.find(recipe => {
    const englishMatch = recipe.name.toLowerCase().includes(normalizedQuery);
    const hindiMatch = recipe.nameHindi?.includes(query);
    const bengaliMatch = recipe.nameBengali?.includes(query);
    
    return englishMatch || hindiMatch || bengaliMatch;
  }) || null;
}

// Get all recipe names for fuzzy matching
export function getAllRecipeNames(): string[] {
  const names: string[] = [];
  
  RECIPES.forEach(recipe => {
    names.push(recipe.name);
    if (recipe.nameHindi) names.push(recipe.nameHindi);
    if (recipe.nameBengali) names.push(recipe.nameBengali);
  });
  
  return names;
}
