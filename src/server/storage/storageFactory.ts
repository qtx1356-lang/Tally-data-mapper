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
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  if (explicitStorageMode === 'local') {
    return 'local';
  }
  if (explicitStorageMode === 'postgres') {
    return hasDatabaseUrl ? 'postgres' : 'local';
  }

  // If DATABASE_URL is available, use postgres; otherwise gracefully default to local storage
  if (hasDatabaseUrl) {
    return 'postgres';
  }

  return 'local';
}

export function getStorageProvider(): IStorageProvider {
  const mode = resolveStorageMode();

  if (activeProvider && activeProvider.modeName === mode) {
    return activeProvider;
  }

  if (mode === 'postgres' && process.env.DATABASE_URL) {
    console.log('[StorageFactory] Initializing PostgreSQL Storage Provider...');
    activeProvider = new PostgresStorageProvider();
  } else {
    console.log('[StorageFactory] Initializing Local Disk Storage Provider (Local / Resilient Mode)...');
    activeProvider = new LocalStorageProvider();
  }

  return activeProvider;
}

export async function initStorageProvider(): Promise<IStorageProvider> {
  const provider = getStorageProvider();

  try {
    await provider.init();
    console.log(`[StorageFactory] Storage Provider (${provider.modeName}) initialized successfully.`);
  } catch (err: any) {
    console.warn(`[StorageFactory] Storage Provider (${provider.modeName}) initialization warning:`, err.message);

    if (provider.modeName === 'postgres') {
      console.log('[StorageFactory] Falling back to Local Disk Storage Provider for resilient server availability.');
      activeProvider = new LocalStorageProvider();
      await activeProvider.init();
    } else {
      throw err;
    }
  }
  return activeProvider!;
}

