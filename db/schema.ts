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
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' }).default(false),
  onboardingSteps: text('onboarding_steps'), // JSON string: { businessInfo: boolean, firstCategory: boolean, ... }
  settings: text('settings'), // JSON string: { theme: string, workingHours: {...}, ... }
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

// Menü Kategorileri (Tenant'a özel)
export const menuCategories = sqliteTable('menu_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  image: text('image'),
  order: integer('order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Menü Ürünleri (Tenant'a özel)
export const menuProducts = sqliteTable('menu_products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  categoryId: integer('category_id').references(() => menuCategories.id),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // Kuruş cinsinden
  image: text('image'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  order: integer('order').default(0),
  modifierGroupId: integer('modifier_group_id'), // Opsiyon grubu referansı
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Ürün Modifier'ları (Ekstra peynir, sos vb.)
export const productModifiers = sqliteTable('product_modifiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(), // Örn: "Ekstra Peynir", "Sos Seçimi"
  type: text('type').notNull(), // 'single' veya 'multiple'
  isRequired: integer('is_required', { mode: 'boolean' }).default(false),
  options: text('options'), // JSON string: [{ name: string, price: integer }]
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});