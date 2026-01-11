import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// --- SÜPER ADMIN TABLOLARI ---

// Müşteriler (Restoranlar)
export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // Örn: Sandwich XL
  slug: text('slug').unique().notNull(), // Örn: sandwichxl (subdomain için)
  status: text('status').default('active'), // active, passive, suspended
  plan: text('plan').default('standard'), // trial, standard, pro
  contactEmail: text('contact_email'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// --- RESTORAN İÇİ TABLOLAR (Her restoranın kendi verisi) ---

// Kategoriler
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id), // Hangi restorana ait?
  name: text('name').notNull(),
  order: integer('order').default(0),
});

// Ürünler
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id),
  categoryId: integer('category_id').references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // Kuruş cinsinden
  image: text('image'),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true),
});