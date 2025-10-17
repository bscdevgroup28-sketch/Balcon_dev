export interface StoredObject {
  key: string;
  size: number;
  mimeType: string;
  path?: string; // local path if applicable
}

export interface StorageProvider {
  putObject(key: string, filePath: string, mimeType: string): Promise<StoredObject>;
  getDownloadUrl(key: string): Promise<string>; // may return signed URL or path reference
  driver(): string;
}
