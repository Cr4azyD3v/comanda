import { db, menuItemsTable } from "@workspace/db";

type MenuSeed = { name: string; price: number; category: string };

const MENU: MenuSeed[] = [
  // Cervejas
  { name: "Corona", price: 13, category: "Cervejas" },
  { name: "Sem Álcool", price: 13, category: "Cervejas" },
  { name: "Heineken", price: 13, category: "Cervejas" },
  { name: "Stella", price: 12, category: "Cervejas" },
  { name: "Budweiser", price: 12, category: "Cervejas" },

  // Doses
  { name: "Jack Daniel's", price: 32, category: "Doses" },
  { name: "Red/White/Bala", price: 24, category: "Doses" },
  { name: "Gin Tanqueray", price: 32, category: "Doses" },
  { name: "Gin Comum", price: 18, category: "Doses" },
  { name: "Tequila", price: 20, category: "Doses" },
  { name: "Tequila José Cuervo", price: 26, category: "Doses" },
  { name: "Amarula", price: 26, category: "Doses" },
  { name: "Absolut", price: 26, category: "Doses" },
  { name: "Vodka Comum", price: 18, category: "Doses" },
  { name: "Campari", price: 18, category: "Doses" },
  { name: "Domeq", price: 12, category: "Doses" },
  { name: "Cachaça + Limão", price: 8, category: "Doses" },

  // Drinks FM 400ml
  { name: "Caip Limão ou Morango", price: 18, category: "Drinks FM 400ml" },
  { name: "Caip Vodka Limão ou Morango", price: 24, category: "Drinks FM 400ml" },
  { name: "Cuba", price: 24, category: "Drinks FM 400ml" },
  { name: "Campari Tonic", price: 24, category: "Drinks FM 400ml" },
  { name: "Gin Tônica", price: 26, category: "Drinks FM 400ml" },
  { name: "Gin Tônica Tanqueray", price: 37, category: "Drinks FM 400ml" },
  { name: "Gin/Vodka + Sabores", price: 26, category: "Drinks FM 400ml" },
  { name: "Jack n Coke", price: 36, category: "Drinks FM 400ml" },
  { name: "Tanqueray Sabores", price: 38, category: "Drinks FM 400ml" },
  { name: "Special Tanqueray Taça", price: 44, category: "Drinks FM 400ml" },
  { name: "Choco FM", price: 20, category: "Drinks FM 400ml" },
  { name: "Drink Sem Álcool", price: 15, category: "Drinks FM 400ml" },

  // Copão FM 700ml
  { name: "Gin Rocks", price: 36, category: "Copão FM 700ml" },
  { name: "Red", price: 36, category: "Copão FM 700ml" },
  { name: "Jack Daniels", price: 46, category: "Copão FM 700ml" },
  { name: "Tanqueray", price: 46, category: "Copão FM 700ml" },

  // Outras Bebidas
  { name: "Beats/Ice/GT Long", price: 17, category: "Outras Bebidas" },
  { name: "Beats/Ice/GT Lata", price: 15, category: "Outras Bebidas" },
  { name: "Red Bull", price: 17, category: "Outras Bebidas" },
  { name: "Xeque Mate", price: 17, category: "Outras Bebidas" },
  { name: "Água 500ml", price: 5, category: "Outras Bebidas" },
  { name: "Refri Lata", price: 7, category: "Outras Bebidas" },
  { name: "Suco Tial", price: 7, category: "Outras Bebidas" },
  { name: "H2O", price: 7, category: "Outras Bebidas" },
  { name: "Gatorade", price: 7, category: "Outras Bebidas" },

  // Diversos
  { name: "Cigarro (un)", price: 2, category: "Diversos" },
  { name: "Cigarro (3 un)", price: 5, category: "Diversos" },
  { name: "Porto (un)", price: 3, category: "Diversos" },
  { name: "Porto (2 un)", price: 5, category: "Diversos" },
  { name: "Pirulito", price: 1, category: "Diversos" },
  { name: "Halls", price: 5, category: "Diversos" },
  { name: "Trident", price: 5, category: "Diversos" },
  { name: "Paçoca", price: 2, category: "Diversos" },
  { name: "Chocolate", price: 6, category: "Diversos" },
  { name: "Isqueiro", price: 5, category: "Diversos" },

  // Porções
  { name: "Fritas Simples", price: 35, category: "Porções" },
  { name: "Fritas Plus", price: 45, category: "Porções" },
  { name: "Batata Rústica com Bacon", price: 45, category: "Porções" },
  { name: "Snack Frango Crispy FM", price: 60, category: "Porções" },

  // Burgers
  { name: "01 FM Burger", price: 20, category: "Burgers" },
  { name: "02 FM Egg Burger", price: 24, category: "Burgers" },
  { name: "03 FM Bacon Burger", price: 28, category: "Burgers" },
  { name: "04 FM Egg Bacon Burger", price: 32, category: "Burgers" },
  { name: "05 FM Chicken Crispy", price: 28, category: "Burgers" },
  { name: "06 FM Chicken Crisp Bacon", price: 32, category: "Burgers" },
];

async function main() {
  await db.delete(menuItemsTable);
  await db.insert(menuItemsTable).values(MENU);
  console.log(`Menu replaced with ${MENU.length} items`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
