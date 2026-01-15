-- TENANT DASHBOARD SETUP - Veritabanı Güncellemeleri
-- Bu migration dosyası Tenant Yönetici Paneli için gerekli tabloları ve sütunları oluşturur

-- 0. Profiles tablosuna tenant_id sütunu ekle (eğer yoksa)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id) ON DELETE SET NULL;

-- Index for tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);

-- 1. Tenants tablosuna onboarding ve settings sütunları ekle
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_steps JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2. Menu Categories tablosu
CREATE TABLE IF NOT EXISTS menu_categories (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Menu Products tablosu
CREATE TABLE IF NOT EXISTS menu_products (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Kuruş cinsinden
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  modifier_group_id BIGINT, -- Opsiyon grubu referansı (product_modifiers tablosuna)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Modifiers tablosu (Opsiyon grupları)
CREATE TABLE IF NOT EXISTS product_modifiers (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Örn: "Ekstra Peynir", "Sos Seçimi"
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple')), -- Tek seçim veya çoklu seçim
  is_required BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]'::jsonb, -- [{ name: string, price: integer }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Foreign key constraint for modifier_group_id
ALTER TABLE menu_products
ADD CONSTRAINT fk_menu_products_modifier_group 
FOREIGN KEY (modifier_group_id) REFERENCES product_modifiers(id) ON DELETE SET NULL;

-- 6. Indexler (Performans için)
CREATE INDEX IF NOT EXISTS idx_menu_categories_tenant_id ON menu_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON menu_categories(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_products_tenant_id ON menu_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_products_category_id ON menu_products(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_products_active ON menu_products(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_modifiers_tenant_id ON product_modifiers(tenant_id);

-- 7. RLS (Row Level Security) Politikaları
-- Menu Categories için RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their own menu categories"
  ON menu_categories FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can insert their own menu categories"
  ON menu_categories FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can update their own menu categories"
  ON menu_categories FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can delete their own menu categories"
  ON menu_categories FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

-- Menu Products için RLS
ALTER TABLE menu_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their own menu products"
  ON menu_products FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can insert their own menu products"
  ON menu_products FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can update their own menu products"
  ON menu_products FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can delete their own menu products"
  ON menu_products FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

-- Product Modifiers için RLS
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their own product modifiers"
  ON product_modifiers FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can insert their own product modifiers"
  ON product_modifiers FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can update their own product modifiers"
  ON product_modifiers FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can delete their own product modifiers"
  ON product_modifiers FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

-- 8. Updated_at trigger fonksiyonu (varsa kullan, yoksa oluştur)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Updated_at trigger'ları
CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_products_updated_at
  BEFORE UPDATE ON menu_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_modifiers_updated_at
  BEFORE UPDATE ON product_modifiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FAZ 2: ORDERS & SETTINGS GÜNCELLEMELERİ
-- ============================================

-- 10. Orders tablosu
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  total_amount INTEGER NOT NULL, -- Kuruş cinsinden
  status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Order Items tablosu
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES menu_products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL, -- Kuruş cinsinden (sipariş anındaki fiyat)
  modifiers JSONB DEFAULT '[]'::jsonb, -- Seçilen modifier'lar
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Orders için indexler
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 13. Orders için RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their own orders"
  ON orders FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can update their own orders"
  ON orders FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

-- 14. Order Items için RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Tenant admins can insert their own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
      )
    )
  );

CREATE POLICY "Tenant admins can update their own order items"
  ON order_items FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM orders WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
      )
    )
  );

-- 15. Orders için updated_at trigger
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FAZ 3: BILLING & STAFF MANAGEMENT
-- ============================================

-- 16. Invoices tablosu
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Kuruş cinsinden
  currency TEXT DEFAULT 'TRY',
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')),
  invoice_url TEXT, -- PDF linki
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Tenant Users tablosu (Personel yönetimi)
CREATE TABLE IF NOT EXISTS tenant_users (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'kitchen', 'courier')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id) -- Bir kullanıcı aynı tenant'a birden fazla kez eklenemez
);

-- 18. Invoices için indexler
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(tenant_id, created_at DESC);

-- 19. Tenant Users için indexler
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_active ON tenant_users(tenant_id, is_active) WHERE is_active = true;

-- 20. Invoices için RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their own invoices"
  ON invoices FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (true); -- Sistem tarafından oluşturulacak

-- 21. Tenant Users için RLS
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their own tenant_users"
  ON tenant_users FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can insert tenant_users"
  ON tenant_users FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can update tenant_users"
  ON tenant_users FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

CREATE POLICY "Tenant admins can delete tenant_users"
  ON tenant_users FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'staff')
    )
  );

-- 22. Tenant Users için updated_at trigger
CREATE TRIGGER update_tenant_users_updated_at
  BEFORE UPDATE ON tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
