-- =====================================================
-- PRODUCTS MODULE - Ürün ve Satış Yönetimi
-- =====================================================
-- Bu modül, Super Admin panelinde satılabilir ürünlerin
-- yönetimi için gerekli tabloları ve RLS politikalarını içerir.

-- =====================================================
-- 1. PRODUCTS TABLE (Satılabilir Ürünler)
-- =====================================================

-- Check if products table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    CREATE TABLE public.products (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      type TEXT NOT NULL CHECK (type IN ('hardware', 'subscription', 'service', 'addon')),
      billing_cycle TEXT CHECK (billing_cycle IN ('one_time', 'monthly', 'yearly')),
      base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      min_sales_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
      stock_track BOOLEAN NOT NULL DEFAULT false,
      current_stock INTEGER DEFAULT 0,
      is_public BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );
  ELSE
    -- Table exists, add missing columns if they don't exist
    -- Add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'type') THEN
      ALTER TABLE public.products ADD COLUMN type TEXT CHECK (type IN ('hardware', 'subscription', 'service', 'addon'));
      -- Set default for existing rows
      UPDATE public.products SET type = 'hardware' WHERE type IS NULL;
      ALTER TABLE public.products ALTER COLUMN type SET NOT NULL;
    END IF;
    
    -- Add billing_cycle column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'billing_cycle') THEN
      ALTER TABLE public.products ADD COLUMN billing_cycle TEXT CHECK (billing_cycle IN ('one_time', 'monthly', 'yearly'));
    END IF;
    
    -- Add base_price column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'base_price') THEN
      ALTER TABLE public.products ADD COLUMN base_price DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;
    
    -- Add min_sales_price column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'min_sales_price') THEN
      ALTER TABLE public.products ADD COLUMN min_sales_price DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;
    
    -- Add tax_rate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'tax_rate') THEN
      ALTER TABLE public.products ADD COLUMN tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0;
    END IF;
    
    -- Add stock_track column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'stock_track') THEN
      ALTER TABLE public.products ADD COLUMN stock_track BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add current_stock column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'current_stock') THEN
      ALTER TABLE public.products ADD COLUMN current_stock INTEGER DEFAULT 0;
    END IF;
    
    -- Add is_public column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_public') THEN
      ALTER TABLE public.products ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_active') THEN
      ALTER TABLE public.products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'updated_at') THEN
      ALTER TABLE public.products ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
    END IF;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_public ON public.products(is_public);

-- =====================================================
-- 2. PRODUCT_OPTIONS TABLE (Ürün İlişkileri/Bundle)
-- =====================================================

-- Check if product_options table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_options') THEN
    CREATE TABLE public.product_options (
      id BIGSERIAL PRIMARY KEY,
      parent_product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      child_product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      is_required BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      UNIQUE(parent_product_id, child_product_id)
    );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_options_parent ON public.product_options(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_product_options_child ON public.product_options(child_product_id);

-- =====================================================
-- 3. PRODUCT_SALES TABLE (Satış Kayıtları - İstatistikler için)
-- =====================================================

-- Check if product_sales table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_sales') THEN
    CREATE TABLE public.product_sales (
      id BIGSERIAL PRIMARY KEY,
      product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
      tenant_id BIGINT REFERENCES public.tenants(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      sold_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      sale_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      notes TEXT
    );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_sales_product ON public.product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_tenant ON public.product_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_date ON public.product_sales(sale_date);

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Updated_at trigger for products
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_products_updated_at();

-- =====================================================
-- 5. VALIDATION FUNCTIONS
-- =====================================================

-- Min sales price validation
CREATE OR REPLACE FUNCTION public.validate_min_sales_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.min_sales_price > NEW.base_price THEN
    RAISE EXCEPTION 'min_sales_price cannot be greater than base_price';
  END IF;
  
  -- Stock validation for hardware
  IF NEW.type = 'hardware' AND NEW.stock_track = true AND NEW.current_stock < 0 THEN
    RAISE EXCEPTION 'current_stock cannot be negative';
  END IF;
  
  -- Subscription cannot have stock
  IF NEW.type = 'subscription' AND NEW.stock_track = true THEN
    RAISE EXCEPTION 'subscription products cannot track stock';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_products_price_stock ON public.products;
CREATE TRIGGER validate_products_price_stock
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_min_sales_price();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

-- Products: Only super_admin can manage
DROP POLICY IF EXISTS "super_admin_all_products" ON public.products;
CREATE POLICY "super_admin_all_products"
  ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Product Options: Only super_admin can manage
DROP POLICY IF EXISTS "super_admin_all_product_options" ON public.product_options;
CREATE POLICY "super_admin_all_product_options"
  ON public.product_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Product Sales: Super admin can view all, others can view their own
DROP POLICY IF EXISTS "super_admin_all_sales" ON public.product_sales;
CREATE POLICY "super_admin_all_sales"
  ON public.product_sales
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "users_view_own_sales" ON public.product_sales;
CREATE POLICY "users_view_own_sales"
  ON public.product_sales
  FOR SELECT
  USING (sold_by = auth.uid());

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Get product sales count
CREATE OR REPLACE FUNCTION public.get_product_sales_count(product_id_param BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(quantity), 0)
    FROM public.product_sales
    WHERE product_id = product_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if product has sales (for deletion check)
CREATE OR REPLACE FUNCTION public.product_has_sales(product_id_param BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.product_sales
    WHERE product_id = product_id_param
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON TABLE public.products IS 'Satılabilir ürünler kataloğu';
COMMENT ON TABLE public.product_options IS 'Ürün ilişkileri ve bundle yapısı';
COMMENT ON TABLE public.product_sales IS 'Ürün satış kayıtları ve istatistikler';

COMMENT ON COLUMN public.products.type IS 'Ürün tipi: hardware, subscription, service, addon';
COMMENT ON COLUMN public.products.billing_cycle IS 'Faturalama döngüsü: one_time, monthly, yearly';
COMMENT ON COLUMN public.products.min_sales_price IS 'Personelin inebileceği en düşük fiyat (base_price dan küçük veya eşit olmalı)';
COMMENT ON COLUMN public.products.stock_track IS 'Stok takibi yapılsın mı? (hardware için true olabilir)';
COMMENT ON COLUMN public.product_options.is_required IS 'Bu ürün ana ürünle birlikte zorunlu mu?';
