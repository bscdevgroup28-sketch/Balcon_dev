"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageProvider = void 0;
exports.getLocalStorageProvider = getLocalStorageProvider;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class LocalStorageProvider {
    constructor(baseDir) {
        // process.cwd() already at repo root; ensure single backend segment only if not already in path
        const root = process.cwd();
        const exportsPath = root.endsWith(path_1.default.sep + 'backend') ? path_1.default.join(root, 'exports') : path_1.default.join(root, 'backend', 'exports');
        this.baseDir = baseDir || exportsPath;
        if (!fs_1.default.existsSync(this.baseDir))
            fs_1.default.mkdirSync(this.baseDir, { recursive: true });
    }
    driver() { return 'local'; }
    async putObject(key, filePath, mimeType) {
        const dest = path_1.default.join(this.baseDir, key);
        const dir = path_1.default.dirname(dest);
        if (!fs_1.default.existsSync(dir))
            await fs_1.default.promises.mkdir(dir, { recursive: true });
        await fs_1.default.promises.copyFile(filePath, dest);
        const stat = await fs_1.default.promises.stat(dest);
        return { key, size: stat.size, mimeType, path: dest };
    }
    async getDownloadUrl(key) {
        // For local driver we just expose a pseudo path; actual download handled by route reading file.
        return `/api/exports/download/${encodeURIComponent(key)}`;
    }
}
exports.LocalStorageProvider = LocalStorageProvider;
let _instance = null;
function getLocalStorageProvider() {
    if (!_instance)
        _instance = new LocalStorageProvider();
    return _instance;
}
