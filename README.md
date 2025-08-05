This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🛠️ Database Setup with Prisma & MySQL (Docker)

This project uses **Prisma ORM** with a **MySQL database running inside Docker**.

### 📦 1. Install Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

This sets up:
- `prisma/schema.prisma` for your DB models
- `.env` file with your `DATABASE_URL`

---

### 🐳 2. Set Up MySQL with Docker

Add a `docker-compose.yml` file to the root of your project:

```yaml
services:
  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: manuel_db
      MYSQL_USER: manuel
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Then start the container:

```bash
docker-compose up -d
```

---

### ⚙️ 3. Update `.env`

To avoid permission issues with Prisma migrations, use the MySQL root user:

```env
DATABASE_URL="mysql://root:password@localhost:3306/manuel_db"
```

---

### ✏️ 4. Define Your Schema

Example: edit `prisma/schema.prisma`

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

---

### 🔄 5. Migrate & Generate Client

Run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

> 💡 **Note:** If you prefer using a non-root MySQL user, Prisma may throw a `P3014` error due to lack of permission to create a shadow database. You can work around this by running:
>
> ```bash
> npx prisma migrate dev --name init --create-only
> npx prisma db push
> ```
