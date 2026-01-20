import fs from "fs";
import path from "path";
import pool from "./db";

interface Migration {
  name: string;
  path: string;
}

export class MigrationRunner {
  private migrationsDir: string;

  constructor() {
    this.migrationsDir = path.join(__dirname, "migrations");
  }

  private async ensureMigrationsTable(): Promise<void> {
    const migrationTablePath = path.join(
      this.migrationsDir,
      "000_create_migrations_table.up.sql",
    );
    const sql = fs.readFileSync(migrationTablePath, "utf-8");
    await pool.query(sql);
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const result = await pool.query<{ name: string }>(
      "SELECT name FROM migrations ORDER BY id",
    );
    return result.rows.map((row) => row.name);
  }

  private getAllMigrationFiles(): Migration[] {
    const files = fs.readdirSync(this.migrationsDir);
    const upFiles = files
      .filter(
        (f) =>
          f.endsWith(".up.sql") && f !== "000_create_migrations_table.up.sql",
      )
      .sort();

    return upFiles.map((file) => ({
      name: file.replace(".up.sql", ""),
      path: path.join(this.migrationsDir, file),
    }));
  }

  async up(target?: string): Promise<void> {
    console.log("🔄 Running migrations...\n");

    await this.ensureMigrationsTable();
    const executed = await getExecutedMigrations();
    const allMigrations = this.getAllMigrationFiles();

    let toExecute = allMigrations.filter((m) => !executed.includes(m.name));

    if (target) {
      const targetIndex = toExecute.findIndex((m) => m.name === target);
      if (targetIndex === -1) {
        console.log(`❌ Migration ${target} not found or already executed`);
        return;
      }
      toExecute = toExecute.slice(0, targetIndex + 1);
    }

    if (toExecute.length === 0) {
      console.log("✅ No pending migrations\n");
      return;
    }

    for (const migration of toExecute) {
      try {
        console.log(`⏳ Running: ${migration.name}`);
        const sql = fs.readFileSync(migration.path, "utf-8");

        await pool.query("BEGIN");
        await pool.query(sql);
        await pool.query("INSERT INTO migrations (name) VALUES ($1)", [
          migration.name,
        ]);
        await pool.query("COMMIT");

        console.log(`✅ Completed: ${migration.name}\n`);
      } catch (error: any) {
        await pool.query("ROLLBACK");
        console.error(`❌ Failed: ${migration.name}`);
        console.error(`Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log(`🎉 Successfully ran ${toExecute.length} migration(s)\n`);
  }

  async down(target?: string): Promise<void> {
    console.log("🔄 Rolling back migrations...\n");

    const executed = await this.getExecutedMigrations();

    if (executed.length === 0) {
      console.log("✅ No migrations to rollback\n");
      return;
    }

    let toRollback = [...executed].reverse();

    if (target) {
      const targetIndex = executed.indexOf(target);
      if (targetIndex === -1) {
        console.log(`❌ Migration ${target} not found`);
        return;
      }
      toRollback = executed.slice(targetIndex).reverse();
    } else {
      toRollback = [toRollback[0]];
    }

    for (const migrationName of toRollback) {
      try {
        console.log(`⏳ Rolling back: ${migrationName}`);
        const downPath = path.join(
          this.migrationsDir,
          `${migrationName}.down.sql`,
        );
        const sql = fs.readFileSync(downPath, "utf-8");

        await pool.query("BEGIN");
        await pool.query(sql);
        await pool.query("DELETE FROM migrations WHERE name = $1", [
          migrationName,
        ]);
        await pool.query("COMMIT");

        console.log(`✅ Rolled back: ${migrationName}\n`);
      } catch (error: any) {
        await pool.query("ROLLBACK");
        console.error(`❌ Failed to rollback: ${migrationName}`);
        console.error(`Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log(
      `🎉 Successfully rolled back ${toRollback.length} migration(s)\n`,
    );
  }

  async status(): Promise<void> {
    await this.ensureMigrationsTable();
    const executed = await this.getExecutedMigrations();
    const allMigrations = this.getAllMigrationFiles();

    console.log("\n📊 Migration Status:\n");
    console.log("Executed Migrations:");
    if (executed.length === 0) {
      console.log("  (none)");
    } else {
      executed.forEach((name) => console.log(`  ✅ ${name}`));
    }

    const pending = allMigrations.filter((m) => !executed.includes(m.name));
    console.log("\nPending Migrations:");
    if (pending.length === 0) {
      console.log("  (none)");
    } else {
      pending.forEach((m) => console.log(`  ⏳ ${m.name}`));
    }

    console.log(
      `\nTotal: ${allMigrations.length} | Executed: ${executed.length} | Pending: ${pending.length}\n`,
    );
  }

  async reset(): Promise<void> {
    console.log("🔄 Resetting all migrations...\n");

    const executed = await this.getExecutedMigrations();

    for (const migrationName of [...executed].reverse()) {
      try {
        console.log(`⏳ Rolling back: ${migrationName}`);
        const downPath = path.join(
          this.migrationsDir,
          `${migrationName}.down.sql`,
        );
        const sql = fs.readFileSync(downPath, "utf-8");

        await pool.query(sql);
        await pool.query("DELETE FROM migrations WHERE name = $1", [
          migrationName,
        ]);

        console.log(`✅ Rolled back: ${migrationName}\n`);
      } catch (error: any) {
        console.error(`❌ Failed to rollback: ${migrationName}`);
        console.error(`Error: ${error.message}\n`);
      }
    }

    console.log("🎉 Database reset complete\n");
  }
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await pool.query<{ name: string }>(
    "SELECT name FROM migrations ORDER BY id",
  );
  return result.rows.map((row) => row.name);
}
