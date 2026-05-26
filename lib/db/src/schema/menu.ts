import { pgTable, text, integer, uuid } from "drizzle-orm/pg-core";

export const menuItemsTable = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  category: text("category").notNull(),

  name: text("name").notNull(),

  price: integer("price").notNull(),
});

export const MENU_SEED = [
  // CERVEJAS
  { category: "Cervejas", name: "Corona", price: 13 },
  { category: "Cervejas", name: "Sem Álcool", price: 13 },
  { category: "Cervejas", name: "Heineken", price: 13 },
  { category: "Cervejas", name: "Stella", price: 13 },
  { category: "Cervejas", name: "Budweiser", price: 13 },

  // DOSES
  { category: "Doses", name: "Jack Daniel's", price: 32 },
  { category: "Doses", name: "Red/White/Bala", price: 24 },
  { category: "Doses", name: "Gin Tanqueray", price: 32 },
  { category: "Doses", name: "Gin Comum", price: 18 },
  { category: "Doses", name: "Tequila", price: 20 },
  { category: "Doses", name: "Tequila José Cuervo", price: 26 },
  { category: "Doses", name: "Amárula", price: 26 },
  { category: "Doses", name: "Absolut", price: 26 },
  { category: "Doses", name: "Vodka Comum", price: 18 },
  { category: "Doses", name: "Campari", price: 18 },
  { category: "Doses", name: "Domeq", price: 12 },
  { category: "Doses", name: "Cachaça + Limão", price: 8 },

  // DRINKS FM 400
  { category: "Drinks FM 400", name: "Caip Limão ou Morango", price: 18 },
  { category: "Drinks FM 400", name: "Caip Vodka Limão ou Morango", price: 24 },
  { category: "Drinks FM 400", name: "Cuba", price: 24 },
  { category: "Drinks FM 400", name: "Campari Tonic", price: 24 },
  { category: "Drinks FM 400", name: "Gin Tônica", price: 26 },
  { category: "Drinks FM 400", name: "Gin Tônica Tanqueray", price: 37 },
  { category: "Drinks FM 400", name: "Gin/Vodka + Sabores", price: 26 },
  { category: "Drinks FM 400", name: "Jack N Coke", price: 36 },
  { category: "Drinks FM 400", name: "Tanqueray Sabores", price: 38 },
  { category: "Drinks FM 400", name: "Special Tanqueray", price: 44 },
  { category: "Drinks FM 400", name: "Drink Sem Álcool", price: 15 },

  // COPÃO FM 700
  { category: "Copão FM 700", name: "Gin Rocks", price: 36 },
  { category: "Copão FM 700", name: "White Horse", price: 36 },
  { category: "Copão FM 700", name: "Red", price: 36 },
  { category: "Copão FM 700", name: "Jack Daniels", price: 46 },
  { category: "Copão FM 700", name: "Tanqueray", price: 46 },

  // BEBIDAS
  { category: "Bebidas", name: "Beats/Ice/GT Long", price: 17 },
  { category: "Bebidas", name: "Beats/Ice/GT Lata", price: 15 },
  { category: "Bebidas", name: "Red Bull", price: 18 },
  { category: "Bebidas", name: "Xeque Mate", price: 18 },
  { category: "Bebidas", name: "Água 500ml", price: 5 },
  { category: "Bebidas", name: "Refri Lata", price: 7 },
  { category: "Bebidas", name: "Suco Tial", price: 7 },
  { category: "Bebidas", name: "H2O", price: 7 },
  { category: "Bebidas", name: "Gatorade", price: 7 },
   
  // DIVERSOS
  { category: "Diversos", name: "Cigarro", price: 2 },
  { category: "Diversos", name: "3 Cigarros", price: 5 },

  { category: "Diversos", name: "Porto", price: 3 },
  { category: "Diversos", name: "2 Portos", price: 5 },

  { category: "Diversos", name: "Pirulito", price: 1 },
  { category: "Diversos", name: "Halls", price: 5 },
  { category: "Diversos", name: "Trident", price: 5 },
  { category: "Diversos", name: "Chiclete", price: 1 },

  { category: "Diversos", name: "Paçoca", price: 2 },
  { category: "Diversos", name: "Chocolate", price: 6 },
  { category: "Diversos", name: "Isqueiro", price: 5 },

  // PORÇÕES
  { category: "Porções", name: "Fritas Simples", price: 35 },
  { category: "Porções", name: "Fritas Plus com Bacon Cheddar", price: 45 },
  { category: "Porções", name: "Batata Rústica Bacon e Barbecue", price: 45 },
  { category: "Porções", name: "Snack Frango Crispy FM", price: 60 },

  // BURGERS
  { category: "Burgers", name: "01 FM Burger", price: 20 },
  { category: "Burgers", name: "02 FM Egg Burger", price: 24 },
  { category: "Burgers", name: "03 FM Bacon Burger", price: 28 },
  { category: "Burgers", name: "04 FM Egg Bacon Burger", price: 32 },
  { category: "Burgers", name: "05 FM Chicken Crispy", price: 28 },
  { category: "Burgers", name: "06 FM Chicken Crisp Bacon", price: 32 },
];