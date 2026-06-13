// Assembles the segmented ingredient seed files into the shape the generator and
// tests consume: { categories, ingredients }.
//
// To extend the catalog:
//   - add ingredients to the relevant <category>.mjs segment (one file per category), or
//   - add a whole new category in _categories.mjs + a new <id>.mjs segment, then
//     register it below.
// Multiple files may target the same category (e.g. a future vegetables-asian.mjs) —
// just import and add them to `segments`; items merge by category id.

import { categories } from './_categories.mjs';
import vegetables from './vegetables.mjs';
import fruit from './fruit.mjs';
import herbs from './herbs.mjs';
import meat from './meat.mjs';
import poultry from './poultry.mjs';
import seafood from './seafood.mjs';
import dairy from './dairy.mjs';
import bread from './bread.mjs';
import grains from './grains.mjs';
import legumes from './legumes.mjs';
import nuts from './nuts.mjs';
import mushrooms from './mushrooms.mjs';
import sauces from './sauces.mjs';
import condiments from './condiments.mjs';
import oils from './oils.mjs';
import baking from './baking.mjs';
import beverages from './beverages.mjs';

const segments = [
  vegetables, fruit, herbs, meat, poultry, seafood, dairy, bread, grains,
  legumes, nuts, mushrooms, sauces, condiments, oils, baking, beverages,
];

const ingredients = {};
for (const segment of segments) {
  ingredients[segment.category] = [...(ingredients[segment.category] ?? []), ...segment.items];
}

export { categories, ingredients };
