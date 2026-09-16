/**
 * EXFIN Tally Audit Platform - Storage Factory
 * Resolves the appropriate IStorageProvider based on EXFIN_MODE, STORAGE_MODE, and DATABASE_URL.
 */

import { IStorageProvider } from './storageTypes';
import { LocalStorageProvider } from './localStorageProvider';
import { PostgresStorageProvider } from './postgresStorageProvider';

let activeProvider: IStorageProvider | null = null;

export function resetStorageProvider(): void {
  activeProvider = null;
}

export function resolveStorageMode(): 'local' | 'postgres' {
  const explicitStorageMode = (process.env.STORAGE_MODE || '').toLowerCase().trim();
  const exfinMode = (process.env.EXFIN_MODE || '').toLowerCase().trim();
  const isProduction = process.env.NODE_ENV === 'production';
  const isWebProduction = exfinMode === 'web' && isProduction;

  // WEB + PRODUCTION ENFORCEMENT:
  // Must strictly resolve to PostgreSQL. STORAGE_MODE=local is a fatal configuration violation.
  if (isWebProduction) {
    if (explicitStorageMode === 'local') {
      throw new Error('[StorageFactory Fatal] STORAGE_MODE=local is strictly prohibited in WEB + production mode. PostgreSQL is required for production Web Mode.');
    }
    return 'postgres';
  }

  if (explicitStorageMode === 'postgres') {
    return 'postgres';
  }
  if (explicitStorageMode === 'local') {
    return 'local';
  }

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  if (exfinMode === 'web' && hasDatabaseUrl) {
    return 'postgres';
  }

  return 'local';
}

export function getStorageProvider(): IStorageProvider {
  const mode = resolveStorageMode();

  if (activeProvider && activeProvider.modeName === mode) {
    return activeProvider;
  }

  const exfinMode = (process.env.EXFIN_MODE || '').toLowerCase().trim();
  const isProduction = process.env.NODE_ENV === 'production';
  const isWebProduction = exfinMode === 'web' && isProduction;

  if (mode === 'postgres') {
    if (isWebProduction && !process.env.DATABASE_URL) {
      throw new Error('[StorageFactory Fatal] DATABASE_URL environment variable is strictly required in WEB + production mode. Local storage is prohibited in production web deployments.');
    }
    console.log('[StorageFactory] Initializing PostgreSQL Storage Provider (Web Mode)...');
    activeProvider = new PostgresStorageProvider();
  } else {
    if (isWebProduction) {
      throw new Error('[StorageFactory Fatal] LocalStorageProvider cannot be initialized in WEB + production mode. PostgreSQL is required.');
    }
    console.log('[StorageFactory] Initializing Local Disk Storage Provider (Desktop / Local Mode)...');
    activeProvider = new LocalStorageProvider();
  }

  return activeProvider;
}

export async function initStorageProvider(): Promise<IStorageProvider> {
  const exfinMode = (process.env.EXFIN_MODE || '').toLowerCase().trim();
  const isProduction = process.env.NODE_ENV === 'production';
  const isWebProduction = exfinMode === 'web' && isProduction;

  const provider = getStorageProvider();

  try {
    await provider.init();
    console.log(`[StorageFactory] Storage Provider (${provider.modeName}) initialized successfully.`);
  } catch (err: any) {
    console.error(`[StorageFactory] Storage Provider (${provider.modeName}) initialization error:`, err.message);
    if (isWebProduction) {
      // In WEB + production mode, PostgreSQL failure must be a hard failure. Never fall back to LocalStorageProvider.
      throw new Error(`[StorageFactory Fatal] PostgreSQL initialization failed in WEB + production mode: ${err.message}. Local storage fallback is prohibited in production web deployments.`);
    }

    if (provider.modeName === 'postgres') {
      // Local storage fallback is permitted only for EXFIN_MODE=desktop or explicit local development.
      console.log('[StorageFactory] Falling back to Local Disk Storage Provider (permitted for desktop or local development).');
      activeProvider = new LocalStorageProvider();
      await activeProvider.init();
    } else {
      throw err;
    }
  }
  return activeProvider!;
}

