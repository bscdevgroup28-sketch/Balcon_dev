import { StorageProvider, StoredObject } from './StorageProvider';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import { createCircuit } from '../../utils/circuitBreaker';
import { metrics } from '../../monitoring/metrics';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  constructor() {
    if (!process.env.S3_BUCKET) throw new Error('S3_BUCKET not set');
    this.bucket = process.env.S3_BUCKET;
    this.client = new S3Client({ region: process.env.S3_REGION || 'us-east-1' });
    // Initialize (or reuse) a circuit breaker for S3 operations with environment overrides
    const threshold = parseInt(process.env.S3_CIRCUIT_FAILURE_THRESHOLD || '5', 10);
    const halfOpenMs = parseInt(process.env.S3_CIRCUIT_HALF_OPEN_MS || '30000', 10);
    (this as any)._circuit = createCircuit('s3', { failureThreshold: threshold, halfOpenAfterMs: halfOpenMs });
  }
  driver() { return 's3'; }
  async putObject(key: string, filePath: string, mimeType: string): Promise<StoredObject> {
    const breaker = (this as any)._circuit;
    return breaker.exec(async () => {
      const body = await fs.promises.readFile(filePath);
      await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mimeType }));
      metrics.increment('s3.put.success');
      return { key, size: body.length, mimeType };
    }).catch((e: any) => {
      metrics.increment('s3.put.failure');
      throw e;
    });
  }
  async getDownloadUrl(key: string): Promise<string> {
    const breaker = (this as any)._circuit;
    return breaker.exec(async () => {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const getCmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      metrics.increment('s3.get_url.success');
      return getSignedUrl(this.client, getCmd, { expiresIn: 3600 });
    }).catch((e: any) => {
      metrics.increment('s3.get_url.failure');
      throw e;
    });
  }
}

export async function maybeCreateS3Provider(): Promise<S3StorageProvider | null> {
  if ((process.env.STORAGE_DRIVER || '').toLowerCase() !== 's3') return null;
  try { return new S3StorageProvider(); } catch { return null; }
}
