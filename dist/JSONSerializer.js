"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONSerialize = JSONSerialize;
exports.JSONDeserialize = JSONDeserialize;
function JSONSerialize(obj) {
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString() + 'n';
        }
        return value;
    });
}
function JSONDeserialize(json) {
    return JSON.parse(json, (key, value) => {
        if (typeof value === 'string' && /^\d+n$/.test(value)) {
            return BigInt(value.slice(0, -1));
        }
        return value;
    });
}
