# Ecommerce Website

A modern ecommerce website built with Next.js, Prisma, and PostgreSQL.

## Features

- User authentication
- Product listing
- Shopping cart
- Order management
- Admin dashboard
- Responsive design

## Prerequisites

- Node.js 18 or later
- Docker
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce-website
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the PostgreSQL database using Docker:
```bash
docker-compose up -d
```

4. Set up environment variables:
```bash
cp .env.example .env
```
Then edit the `.env` file with your configuration.

5. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

6. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

The database schema includes the following models:
- User
- Product
- Category
- Cart
- CartItem
- Order
- OrderItem

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/products` - Product management
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order management

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 