const db = require("./db");

async function seed() {
  try {
    console.log("Seeding dashboard menu...");
    await db.query(`
      INSERT INTO menus (key, label) 
      VALUES ('dashboard', 'Tổng quan') 
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding dashboard menu:", error);
    process.exit(1);
  }
}

seed();
