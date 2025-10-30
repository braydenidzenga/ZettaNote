import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const SOURCE_URI = process.env.OLD_DB;
const TARGET_URI = process.env.NEW_DB;

async function migrateDatabase() {
  console.log("🚀 Starting migration...");

  const sourceConn = mongoose.createConnection(SOURCE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const targetConn = mongoose.createConnection(TARGET_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // ✅ Wait until both connections are open before proceeding
  await Promise.all([
    new Promise((resolve) => sourceConn.once("open", resolve)),
    new Promise((resolve) => targetConn.once("open", resolve)),
  ]);

  console.log("✅ Connected to both databases");

  // ✅ Now it's safe to access .db
  const collections = await sourceConn.db.listCollections().toArray();

  for (const { name } of collections) {
    console.log(`\n📦 Migrating collection: ${name}`);

    const sourceCol = sourceConn.collection(name);
    const targetCol = targetConn.collection(name);

    const docs = await sourceCol.find().toArray();

    if (docs.length === 0) {
      console.log(`⚠️ No documents found in ${name}`);
      continue;
    }

    let migratedCount = 0;
    let conflictCount = 0;

    for (const doc of docs) {
      const existing = await targetCol.findOne({ _id: doc._id });

      if (!existing) {
        await targetCol.insertOne(doc);
        migratedCount++;
        continue;
      }

      const merged = { ...existing, ...doc };

      const sourceStr = JSON.stringify(doc);
      const targetStr = JSON.stringify(existing);

      if (sourceStr !== targetStr) {
        conflictCount++;
        await targetConn.collection("migration_conflicts").insertOne({
          collection: name,
          _id: doc._id,
          source: doc,
          target: existing,
          merged,
          timestamp: new Date(),
        });
      }

      await targetCol.updateOne({ _id: doc._id }, { $set: merged });
      migratedCount++;
    }

    console.log(`✅ Migrated ${migratedCount} docs from ${name}`);
    if (conflictCount > 0) {
      console.log(`⚠️ Logged ${conflictCount} conflicts in 'migration_conflicts'`);
    }
  }

  await sourceConn.close();
  await targetConn.close();

  console.log("\n🎉 Migration complete!");
}

migrateDatabase().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});

