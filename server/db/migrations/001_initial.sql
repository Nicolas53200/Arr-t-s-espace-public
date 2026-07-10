-- =============================================================
-- Migration 001 : Schéma initial
-- Arrêtés & Espace Public — Multi-tenant avec RLS
-- =============================================================

BEGIN;

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------
-- Tenants (collectivités)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  code_postal VARCHAR(10) NOT NULL,
  siren       VARCHAR(14) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- Users
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'redacteur', 'lecteur')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -----------------------------------------------------------
-- Arrêtés
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS arretes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero              TEXT NOT NULL,
  type_code           VARCHAR(50) NOT NULL,
  type_label          TEXT NOT NULL,
  titre               TEXT NOT NULL,
  statut              VARCHAR(20) NOT NULL DEFAULT 'brouillon'
                      CHECK (statut IN ('brouillon', 'publie', 'modifie', 'abroge')),
  cree_par            TEXT NOT NULL,
  date_creation       DATE NOT NULL DEFAULT CURRENT_DATE,
  date_debut          DATE,
  date_fin            DATE,
  voies               JSONB NOT NULL DEFAULT '[]'::jsonb,
  troncons            JSONB NOT NULL DEFAULT '[]'::jsonb,
  versions            JSONB NOT NULL DEFAULT '[]'::jsonb,
  arrete_abrogation   JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arretes_tenant_id ON arretes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_arretes_statut ON arretes(statut);
CREATE INDEX IF NOT EXISTS idx_arretes_type_code ON arretes(type_code);
CREATE INDEX IF NOT EXISTS idx_arretes_numero ON arretes(numero);

-- -----------------------------------------------------------
-- Références permanentes
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS references_permanentes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code                VARCHAR(50) NOT NULL,
  categorie           VARCHAR(50) NOT NULL
                      CHECK (categorie IN ('delegation', 'circulation', 'stationnement')),
  label               TEXT NOT NULL,
  titulaire           TEXT,
  numero              TEXT,
  date                DATE,
  actif               BOOLEAN NOT NULL DEFAULT true,
  date_debut_validite DATE,
  date_fin_validite   DATE,
  historique          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_references_tenant_id ON references_permanentes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_references_categorie ON references_permanentes(categorie);

-- -----------------------------------------------------------
-- Journal d'audit
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- -----------------------------------------------------------
-- Row-Level Security
-- -----------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE arretes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_arretes ON arretes
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE references_permanentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_references ON references_permanentes
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit ON audit_log
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- -----------------------------------------------------------
-- Trigger updated_at
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_arretes_updated_at
  BEFORE UPDATE ON arretes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_references_updated_at
  BEFORE UPDATE ON references_permanentes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
