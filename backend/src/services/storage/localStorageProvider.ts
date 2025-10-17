import path from 'path';
import fs from 'fs';
import { StorageProvider, StoredObject } from './StorageProvider';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  constructor(baseDir?: string) {
  // process.cwd() already at repo root; ensure single backend segment only if not already in path
  const root = process.cwd();
  const exportsPath = root.endsWith(path.sep + 'backend') ? path.join(root, 'exports') : path.join(root, 'backend', 'exports');
  this.baseDir = baseDir || exportsPath;
    if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir, { recursive: true });
  }
  driver() { return 'local'; }
  async putObject(key: string, filePath: string, mimeType: string): Promise<StoredObject> {
    const dest = path.join(this.baseDir, key);
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.copyFile(filePath, dest);
    const stat = await fs.promises.stat(dest);
    return { key, size: stat.size, mimeType, path: dest };
  }
  async getDownloadUrl(key: string): Promise<string> {
    // For local driver we just expose a pseudo path; actual download handled by route reading file.
    return `/api/exports/download/${encodeURIComponent(key)}`;
  }
}

let _instance: LocalStorageProvider | null = null;
export function getLocalStorageProvider() {
  if (!_instance) _instance = new LocalStorageProvider();
  return _instance;
}
