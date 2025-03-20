<div align="center">
<img src="./public/images/logo.svg" width="50" height="50" />

# **Prostore**

</div>

## General info

A real-world e-commerce website

## Tech stack:

Project is created with:

- Next.js
- React
- Typescript
- PostgreSQL
- Prisma

## Setup

#### 1. Environment variables

Create the `.env` file using the example of the already existing `.env.template` file.

#### 2. Installation and running

To run the project install dependencies locally using npm:

```bash
npm install
```

The assumption is that you have [Docker Desktop](https://www.docker.com/) installed.
It will be needed to run the PostgrSQL database in the container.

1. Run the command:

```bash
docker compose up
```

2. Apply migrations by running:

```bash
npx prisma migrate deploy
```

3. (Optional) Fill the database with test data by runnig this command in the root folder:

```bash
npx tsx ./db/seed
```

4. Run the application:

```bash
npm run dev
```

## Development

### Prisma

After adding or changing models in `schema.prisma` Prisma needs to generate a client (`@prisma/client`)
that will allow Next.js app to interact with the database.

Without this command you will not have access to Prisma Client in code, e.g.:

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

If you try to use Prisma without generating a client first,
you will get an error because `@prisma/client` does not exist yet or is outdated.

**When to run?**

- After every change to `schema.prisma`, if you are not creating a new migration.
- If you have removed the `node_modules` directory and are installing dependencies from scratch (`npm install`).

Generating migrations with `npx prisma migrate dev --name your_migration_name`

**What does this command do?**

- It creates a migration file in the `prisma/migrations/` directory containing `SQL` to create or change the database structure.
- It applies this migration to the database.
- It updates the `_prisma_migrations table`, which tracks what migrations have already been performed.

**Why is this needed?**

- It ensures that the database structure matches the model in `schema.prisma`.
- It tracks the history of changes to the database, which is crucial for teams and production projects.

**When to run?**

- The first time, after creating models in `schema.prisma`, to create the database.
- After each change to the model, if you want Prisma to automatically generate and apply a new migration.

**When to run any of these commands?**

1. `npx prisma migrate dev --name your_migration_name` : if you add/remove fields, tables or change their types in `schema.prisma`, you need to perform a new migration for these changes to be saved to the database.
2. `npx prisma generate` : if you change something that doesn't affect the database
