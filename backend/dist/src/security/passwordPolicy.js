"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePassword = evaluatePassword;
const zxcvbn_1 = __importDefault(require("zxcvbn"));
function evaluatePassword(password) {
    const errors = [];
    if (password.length < 12)
        errors.push('Password must be at least 12 characters');
    if (!/[A-Z]/.test(password))
        errors.push('At least one uppercase letter required');
    if (!/[a-z]/.test(password))
        errors.push('At least one lowercase letter required');
    if (!/\d/.test(password))
        errors.push('At least one digit required');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
        errors.push('At least one symbol required');
    const strength = (0, zxcvbn_1.default)(password);
    if (strength.score < 3)
        errors.push('Password too weak (entropy score < 3)');
    return { valid: errors.length === 0, errors, score: strength.score };
}
