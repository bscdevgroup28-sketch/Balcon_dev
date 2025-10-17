"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorage = getStorage;
const localStorageProvider_1 = require("./localStorageProvider");
const s3StorageProvider_1 = require("./s3StorageProvider");
function getStorage() {
    const driver = process.env.STORAGE_DRIVER || 'local';
    if (driver === 's3') {
        try {
            return new s3StorageProvider_1.S3StorageProvider();
        }
        catch {
            return (0, localStorageProvider_1.getLocalStorageProvider)();
        }
    }
    return (0, localStorageProvider_1.getLocalStorageProvider)();
}
