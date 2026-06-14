// Ingredient category reference table. Add a new category here, then create a
// matching <id>.mjs segment file and register it in index.mjs.
export const categories = [
  { id: 'vegetables', name: 'Grönsaker', emoji: '🥬', sortOrder: 10 },
  { id: 'fruit', name: 'Frukt & bär', emoji: '🍎', sortOrder: 20 },
  { id: 'herbs', name: 'Örter & kryddor', emoji: '🌿', sortOrder: 30 },
  { id: 'meat', name: 'Kött & chark', emoji: '🥩', sortOrder: 40 },
  { id: 'poultry', name: 'Fågel', emoji: '🍗', sortOrder: 50 },
  { id: 'seafood', name: 'Fisk & skaldjur', emoji: '🦐', sortOrder: 60 },
  { id: 'dairy', name: 'Mejeri, ost & ägg', emoji: '🧀', sortOrder: 70 },
  { id: 'bread', name: 'Bröd & bageri', emoji: '🍞', sortOrder: 80 },
  { id: 'grains', name: 'Spannmål & pasta', emoji: '🌾', sortOrder: 90 },
  { id: 'legumes', name: 'Baljväxter & vegoprotein', emoji: '🫘', sortOrder: 100 },
  { id: 'nuts', name: 'Nötter & frön', emoji: '🥜', sortOrder: 110 },
  { id: 'mushrooms', name: 'Svamp', emoji: '🍄', sortOrder: 120 },
  { id: 'sauces', name: 'Såser & dressing', emoji: '🥫', sortOrder: 130 },
  { id: 'condiments', name: 'Smaksättare & skafferi', emoji: '🧂', sortOrder: 140 },
  { id: 'oils', name: 'Oljor & fetter', emoji: '🫒', sortOrder: 150 },
  { id: 'baking', name: 'Bak & sötning', emoji: '🍯', sortOrder: 160 },
  { id: 'beverages', name: 'Dryck', emoji: '🥤', sortOrder: 170 },
  { id: 'other', name: 'Övrigt', emoji: '🍽️', sortOrder: 999 },
];
