/**
 * EXFIN Tally Audit Platform - Storage Factory
 * Resolves the appropriate IStorageProvider based on EXFIN_MODE, STORAGE_MODE, and DATABASE_URL.
 */

import { IStorageProvider } from './storageTypes';
import { LocalStorageProvider } from './localStorageProvider';
import { PostgresStorageProvider } from './postgresStorageProvider';

let activeProvider: IStorageProvider | null = null;

export function resolveStorageMode(): 'local' | 'postgres' {
  const explicitStorageMode = (process.env.STORAGE_MODE || '').toLowerCase().trim();
  if (explicitStorageMode === 'postgres') {
    return 'postgres';
  }
  if (explicitStorageMode === 'local') {
    return 'local';
  }

  const exfinMode = (process.env.EXFIN_MODE || '').toLowerCase().trim();
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  if (exfinMode === 'web' && hasDatabaseUrl) {
    return 'postgres';
  }

  return 'local';
}

export function getStorageProvider(): IStorageProvider {
  if (activeProvider) {
    return activeProvider;
  }

  const mode = resolveStorageMode();

  if (mode === 'postgres') {
    console.log('[StorageFactory] Initializing PostgreSQL Storage Provider (Web Mode)...');
    activeProvider = new PostgresStorageProvider();
  } else {
    console.log('[StorageFactory] Initializing Local Disk Storage Provider (Desktop / Local Mode)...');
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
      console.log('[StorageFactory] Falling back to Local Disk Storage Provider due to database connectivity issue.');
      activeProvider = new LocalStorageProvider();
      await activeProvider.init();
    }
  }
  return activeProvider!;
}
