import { StorageProvider } from './StorageProvider';
import { getLocalStorageProvider } from './localStorageProvider';
import { S3StorageProvider } from './s3StorageProvider';

export function getStorage(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER || 'local';
  if (driver === 's3') {
    try { return new S3StorageProvider(); } catch { return getLocalStorageProvider(); }
  }
  return getLocalStorageProvider();
}
