export type PlanId = 'veg' | 'nonveg' | 'bites' | 'monthly';
export type MealFrequency = '1meal' | '2meals' | 'breakfast2meals';

export interface CookingPlan {
  id: PlanId;
  name: string;
  tagline: string;
  included: string[];
  notIncluded: string[];
  badge?: string;
}

export const COOKING_PLANS: CookingPlan[] = [
  {
    id: 'veg',
    name: 'Homitra Homestyle Veg Plan',
    tagline: 'Fresh home-style veg meals',
    included: [
      'Roti — Fulka / Paratha / Puri (quantity based on headcount)',
      '1 Vegetable dish of your choice',
      'Dal — Fry / Tadka / Sambhar / Plain',
      'Rice — Jeera / Lemon / Tomato / Veg Pulav / Plain',
      'Fresh Salad',
    ],
    notIncluded: [
      'Grocery shopping or ingredient procurement',
      'Deep kitchen cleaning or serving arrangements',
      'Utensils cleaning',
    ],
  },
  {
    id: 'nonveg',
    name: 'Homitra Signature Non-Veg Plan',
    tagline: 'Rich non-veg flavours, made home-style',
    included: [
      'Roti — Fulka / Paratha / Puri (quantity based on headcount)',
      'Non-veg Dish : Chicken / Mutton / Fish / Egg',
      'Rice — Jeera / Lemon / Tomato / Veg Pulav / Plain',
      'Fresh Salad',
      'Variety of Dals — available as an add on',
    ],
    notIncluded: [
      'Grocery shopping or ingredient procurement',
      'Deep kitchen cleaning or serving arrangements',
      'Utensils cleaning',
    ],
  },
  {
    id: 'bites',
    name: 'Homitra Anytime Bites & Brews',
    tagline: 'Light bites or your perfect breakfast',
    included: [
      'Your choice of one breakfast dish or snacks, expertly prepared from our chef\'s diverse repertoire.\nOne Dish from our curated menu : Idli-sambhar / Poori Saag / Dosa-Chutney / Cafe-Style Veggie Maggi / Home-style Peanut Poha / Upma / Vegetable Sandwich / Paneer Chilli with Chapati / Paneer Roll / Paneer Bhuji with Chapati / Egg Bhuji with Chapati / Egg Roll\nOne Dish from Street Food : Vada Paav or Paav Bhaji or Veg Pulav',
      '1 Beverage — Tea / Cold Coffee / Hot Coffee',
    ],
    notIncluded: [
      'Grocery shopping or ingredient procurement',
      'Utensils cleaning',
    ],
  },
  {
    id: 'monthly',
    name: 'Homitra Monthly Care Subscription',
    tagline: 'Complete monthly kitchen, done right',
    included: [
      'Roti + 1 Veg + Dal + Rice — every day',
      'Non-veg (Chicken / Mutton / Fish / Egg) — twice a week as an add on',
      'Fresh Salad daily',
      'Flexible meal frequency: 1 meal / 2 meals / Breakfast + 2 meals',
      'Deep kitchen cleaning once a month as an add on',
    ],
    notIncluded: [
      'Grocery shopping or ingredient procurement',
      'Utensils cleaning',
    ],
    badge: 'Best Value',
  },
];

export const VEG_OPTIONS = {
  rotiTypes: ['Fulka', 'Paratha', 'Puri'],
  vegetables: ['Any green veg', 'Chole', 'Rajma'],
  dals: ['Dal Fry', 'Dal Tadka', 'Sambhar', 'Plain Dal'],
  riceTypes: ['Jeera Rice', 'Lemon Rice', 'Tomato Rice', 'Veg Pulav', 'Plain Rice'],
};

export const NON_VEG_OPTIONS = {
  rotiTypes: ['Fulka', 'Paratha', 'Puri'],
  nonVegItems: ['Chicken Curry', 'Mutton Curry', 'Fish Curry', 'Egg Curry'],
  dals: ['Dal Fry', 'Dal Tadka', 'Sambhar', 'Plain Dal'],
  riceTypes: ['Jeera Rice', 'Lemon Rice', 'Tomato Rice', 'Veg Pulav', 'Plain Rice'],
};

export const BITES_OPTIONS = {
  curatedDishes: [
    'Idli-sambhar',
    'Poori Saag',
    'Dosa-Chutney',
    'Cafe-Style Veggie Maggi',
    'Home-style Peanut Poha',
    'Upma',
    'Vegetable Sandwich',
    'Paneer Chilli with Chapati',
    'Paneer Roll',
    'Paneer Bhuji with Chapati',
    'Egg Bhuji with Chapati',
    'Egg Roll',
  ],
  streetFoods: ['Vada Paav', 'Paav Bhaji', 'Veg Pulav'],
  beverages: ['Tea', 'Cold Coffee', 'Hot Coffee'],
};

export const MEAL_FREQUENCY_LABELS: Record<MealFrequency, string> = {
  '1meal': '1 Meal / Day',
  '2meals': '2 Meals / Day',
  'breakfast2meals': 'Breakfast + 2 Meals',
};

export const getRotiQty = (people: number): number => {
  if (people >= 5) return 25;
  return people * 5;
};

export const getVegPrice = (people: number): number => {
  if (people <= 2) return 299;
  if (people <= 4) return 349;
  if (people <= 6) return 449;
  return 549;
};

export const getNonVegPrice = (people: number): number => {
  if (people <= 2) return 349;
  if (people <= 4) return 399;
  if (people <= 6) return 449;
  return 599;
};

export const getBitesPrice = (people: number): number => {
  if (people <= 4) return 399;
  if (people <= 6) return 499;
  return 599;
};

export const getMonthlyBasePrice = (people: number, frequency: MealFrequency): number => {
  const matrix: Record<MealFrequency, number[]> = {
    '1meal':           [4000, 4000, 5000, 5000, 6000, 6000],
    '2meals':          [7000, 7000, 8000, 8000, 10000, 10000],
    'breakfast2meals': [8000, 8000, 9000, 9000, 11000, 11000],
  };
  const idx = Math.min(people - 1, 5);
  return matrix[frequency][idx];
};

export const getMonthlyDiscount = (months: number): number => {
  if (months === 1) return 0;
  if (months === 2) return 0.05;
  return 0.10;
};
