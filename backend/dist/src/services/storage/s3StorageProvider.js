"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
exports.maybeCreateS3Provider = maybeCreateS3Provider;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs_1 = __importDefault(require("fs"));
const circuitBreaker_1 = require("../../utils/circuitBreaker");
const metrics_1 = require("../../monitoring/metrics");
class S3StorageProvider {
    constructor() {
        if (!process.env.S3_BUCKET)
            throw new Error('S3_BUCKET not set');
        this.bucket = process.env.S3_BUCKET;
        this.client = new client_s3_1.S3Client({ region: process.env.S3_REGION || 'us-east-1' });
        // Initialize (or reuse) a circuit breaker for S3 operations with environment overrides
        const threshold = parseInt(process.env.S3_CIRCUIT_FAILURE_THRESHOLD || '5', 10);
        const halfOpenMs = parseInt(process.env.S3_CIRCUIT_HALF_OPEN_MS || '30000', 10);
        this._circuit = (0, circuitBreaker_1.createCircuit)('s3', { failureThreshold: threshold, halfOpenAfterMs: halfOpenMs });
    }
    driver() { return 's3'; }
    async putObject(key, filePath, mimeType) {
        const breaker = this._circuit;
        return breaker.exec(async () => {
            const body = await fs_1.default.promises.readFile(filePath);
            await this.client.send(new client_s3_1.PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mimeType }));
            metrics_1.metrics.increment('s3.put.success');
            return { key, size: body.length, mimeType };
        }).catch((e) => {
            metrics_1.metrics.increment('s3.put.failure');
            throw e;
        });
    }
    async getDownloadUrl(key) {
        const breaker = this._circuit;
        return breaker.exec(async () => {
            const { GetObjectCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-s3')));
            const getCmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
            metrics_1.metrics.increment('s3.get_url.success');
            return (0, s3_request_presigner_1.getSignedUrl)(this.client, getCmd, { expiresIn: 3600 });
        }).catch((e) => {
            metrics_1.metrics.increment('s3.get_url.failure');
            throw e;
        });
    }
}
exports.S3StorageProvider = S3StorageProvider;
async function maybeCreateS3Provider() {
    if ((process.env.STORAGE_DRIVER || '').toLowerCase() !== 's3')
        return null;
    try {
        return new S3StorageProvider();
    }
    catch {
        return null;
    }
}
