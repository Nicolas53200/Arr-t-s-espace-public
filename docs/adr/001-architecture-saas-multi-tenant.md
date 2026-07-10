# ADR-001 : Architecture SaaS multi-tenant

**Date** : 2026-07-10
**Statut** : Accepté
**Décideur** : CTO

## Contexte

La plateforme doit supporter des centaines de collectivités (communes, intercommunalités, métropoles). Chaque collectivité gère ses propres arrêtés, références, et utilisateurs. Les données d'une collectivité ne doivent jamais être accessibles à une autre.

## Décision

Nous adoptons un modèle **multi-tenant avec isolation logique** (shared database, tenant-scoped queries).

### Pourquoi pas une base par tenant ?

- Coût opérationnel : des centaines de bases = des centaines de migrations à orchestrer
- Scaling : le provisioning d'une nouvelle collectivité doit se faire en secondes, pas en minutes
- Requêtes cross-tenant : un administrateur SaaS doit pouvoir obtenir des métriques globales

### Pourquoi pas des schémas séparés ?

- Même problème de migration que les bases séparées
- Complexité PostgreSQL inutile à cette échelle

### Architecture retenue

1. **Chaque table porte une colonne `tenant_id`** (UUID, NOT NULL, indexé)
2. **Row-Level Security (RLS)** PostgreSQL activée sur chaque table
3. **Le `tenant_id` est extrait du JWT** à chaque requête API
4. **Aucune requête applicative ne peut omettre le filtre tenant** — garanti par l'ORM et les policies RLS
5. **Côté frontend** : le tenant est stocké dans un `TenantContext` React et envoyé en header `X-Tenant-ID`

### Garanties de sécurité

- Double filtrage : applicatif (ORM) + base de données (RLS)
- Tests d'intrusion cross-tenant automatisés dans la CI
- Audit trail par tenant

## Conséquences

- Toutes les migrations s'appliquent à toutes les collectivités simultanément
- Le provisioning est instantané : insérer une ligne dans la table `tenants`
- Pas d'isolation de performance entre tenants → prévoir du rate limiting par tenant
