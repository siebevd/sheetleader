import { db, results } from "./index";

const tractorModels = [
  "Fendt 356",
  "Fendt 724",
  "Fendt 939",
  "John Deere 6420",
  "John Deere 8R",
  "John Deere 5090",
  "Case IH Puma 185",
  "Case IH Magnum 340",
  "New Holland T7.270",
  "New Holland T6.180",
  "Massey Ferguson 6713",
  "Massey Ferguson 8S.265",
  "Claas Axion 870",
  "Claas Arion 650",
  "Deutz-Fahr 6165",
];

const firstNames = ["Jan", "Piet", "Klaas", "Henk", "Bert", "Johan", "Willem", "Frank", "Hans", "Tom", "Emma", "Sophie", "Lisa", "Anna", "Sarah"];
const lastNames = ["de Vries", "van der Berg", "Bakker", "Jansen", "Visser", "Smit", "de Jong", "van Dijk", "Mulder", "Bos", "Hendriks", "Vos", "Peters", "van Leeuwen", "Dekker"];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDummyData(count: number) {
  const data = [];
  const baseTime = new Date();
  baseTime.setHours(10, 0, 0, 0); // Start at 10 AM today

  for (let i = 0; i < count; i++) {
    const name = `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
    const tractor = getRandomElement(tractorModels);
    // Generate realistic horsepower between 50-180
    const horsepower = Math.floor(Math.random() * 130) + 50;

    // Spread timestamps throughout the day (every 5-15 minutes)
    const timestamp = new Date(baseTime.getTime() + i * (Math.random() * 10 + 5) * 60 * 1000);

    data.push({
      name,
      tractor,
      horsepower,
      timestamp,
    });
  }

  return data;
}

async function seed() {
  console.log("Seeding database...");

  const dummyData = generateDummyData(50);

  await db.insert(results).values(dummyData);

  console.log(`✓ Seeded ${dummyData.length} results`);
}

seed().catch(console.error);
