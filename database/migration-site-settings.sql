-- Tabla de configuración del sitio (clave-valor, extensible)
-- Correr en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Valor inicial: ventas habilitadas
INSERT INTO site_settings (key, value)
VALUES ('sales_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
