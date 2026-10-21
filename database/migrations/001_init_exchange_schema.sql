-- ============================================================================
-- VALENCE-X: Unlisted Securities Exchange
-- MIGRATION: 001_init_exchange_schema.sql
-- Complete idempotent database migration (Schema, Constraints, Views, Triggers)
-- ============================================================================

USE unlisted_securities_exchange;

-- Execute Phase 1 Schema
SOURCE ../phase1_schema.sql;

-- Execute Phase 3 Triggers
SOURCE ../phase3_triggers.sql;

-- Execute Phase 3 Views
SOURCE ../phase3_views.sql;

-- Execute Demonstration Seed Data
SOURCE ../seed.sql;
