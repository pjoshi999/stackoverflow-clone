#!/usr/bin/env ts-node
import { MigrationRunner } from "./migration-runner";

const runner = new MigrationRunner();

const command = process.argv[2];
const target = process.argv[3];

async function main() {
  try {
    switch (command) {
      case "up":
        await runner.up(target);
        break;

      case "down":
        await runner.down(target);
        break;

      case "status":
        await runner.status();
        break;

      case "reset":
        await runner.reset();
        break;

      default:
        console.log(`
📦 Database Migration CLI

Usage:
  npm run migrate <command> [target]

Commands:
  up [target]     Run pending migrations (optionally up to target)
  down [target]   Rollback last migration (or down to target)
  status          Show migration status
  reset           Rollback all migrations

Examples:
  npm run migrate up
  npm run migrate up 003_create_questions_table
  npm run migrate down
  npm run migrate status
  npm run migrate reset
        `);
    }

    process.exit(0);
  } catch (error: any) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

main();
