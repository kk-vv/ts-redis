"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONDeserialize = exports.JSONSerialize = void 0;
const redis_1 = require("redis");
const JSONSerializer_1 = require("./JSONSerializer");
Object.defineProperty(exports, "JSONDeserialize", { enumerable: true, get: function () { return JSONSerializer_1.JSONDeserialize; } });
Object.defineProperty(exports, "JSONSerialize", { enumerable: true, get: function () { return JSONSerializer_1.JSONSerialize; } });
class RedisService {
    client;
    dbIndex;
    constructor(url, dbIndex) {
        this.dbIndex = dbIndex;
        this.client = (0, redis_1.createClient)({
            url: url
        });
    }
    async connectOrThrow() {
        await this.client.connect();
        await this.client.select(this.dbIndex);
    }
    async disconnectOrThrow() {
        if (this.client && this.client.isOpen) {
            const status = await this.client.quit();
            if (status !== 'OK') {
                throw new Error('Redis disconnect failed.');
            }
        }
    }
    async setJSONObject(key, obj, expiredSeconds, ignoreKeyCaseSensitivity = true) {
        await this.setString(key, (0, JSONSerializer_1.JSONSerialize)(obj), expiredSeconds, ignoreKeyCaseSensitivity);
    }
    async getJSONObject(key, ignoreKeyCaseSensitivity = true) {
        const obj = await this.getString(key, ignoreKeyCaseSensitivity);
        if (obj) {
            return (0, JSONSerializer_1.JSONDeserialize)(obj);
        }
        return null;
    }
    async setString(key, value, expiredSeconds, ignoreKeyCaseSensitivity) {
        await this.client.set(ignoreKeyCaseSensitivity ? key.toLowerCase() : key, value, { EX: expiredSeconds });
    }
    async getString(key, ignoreKeyCaseSensitivity) {
        return await this.client.get(ignoreKeyCaseSensitivity ? key.toLowerCase() : key);
    }
    async setNumber(key, value, expiredSeconds, ignoreKeyCaseSensitivity = true) {
        await this.setString(key, `${value}`, expiredSeconds, ignoreKeyCaseSensitivity);
    }
    async getNumber(key, ignoreKeyCaseSensitivity = true) {
        const value = await this.getString(key, ignoreKeyCaseSensitivity);
        const number = Number(value);
        if (value && !isNaN(number)) {
            return number;
        }
        return null;
    }
    async setBigInt(key, value, expiredSeconds, ignoreKeyCaseSensitivity = true) {
        await this.setString(key, `${value}`, expiredSeconds, ignoreKeyCaseSensitivity);
    }
    async getBigInt(key, ignoreKeyCaseSensitivity = true) {
        const value = await this.getString(key, ignoreKeyCaseSensitivity);
        if (value) {
            return BigInt(value);
        }
        return null;
    }
    async deleteByKeys(keys, ignoreKeyCaseSensitivity = true) {
        if (ignoreKeyCaseSensitivity) {
            keys = keys.map(k => k.toLowerCase());
        }
        if (keys.length > 0) {
            await this.client.del(keys);
        }
    }
    async batchSet(value, expiredSeconds, ignoreKeyCaseSensitivity) {
        if (Object.values(value).length > 0) {
            const pipeline = await this.client.multi();
            Object.keys(value).forEach(key => {
                pipeline.set(ignoreKeyCaseSensitivity ? key.toLowerCase() : key, value[key], { EX: expiredSeconds });
            });
            await pipeline.exec();
        }
    }
    async batchGet(keys, ignoreKeyCaseSensitivity) {
        if (ignoreKeyCaseSensitivity) {
            keys = keys.map(k => k.toLowerCase());
        }
        const result = {};
        if (keys.length > 0) {
            const values = await this.client.mGet(keys);
            keys.forEach((key, index) => {
                result[key] = values[index] ? values[index] : null;
            });
        }
        return result;
    }
    async batchSetJSONObject(value, expiredSeconds, ignoreKeyCaseSensitivity = true) {
        if (Object.values(value).length > 0) {
            const pipeline = await this.client.multi();
            Object.keys(value).forEach(key => {
                pipeline.set(ignoreKeyCaseSensitivity ? key.toLowerCase() : key, (0, JSONSerializer_1.JSONSerialize)(value[key]), { EX: expiredSeconds });
            });
            await pipeline.exec();
        }
    }
    async batchGetJSONObject(keys, ignoreKeyCaseSensitivity = true) {
        const result = await this.batchGet(keys, ignoreKeyCaseSensitivity);
        const finalResult = {};
        Object.keys(result).forEach((key) => {
            finalResult[key] = result[key] ? (0, JSONSerializer_1.JSONDeserialize)(result[key]) : null;
        });
        return finalResult;
    }
    async isExist(key) {
        const exists = await this.client.exists(key);
        return exists === 1;
    }
    async deleteKeysByPattern(pattern, pageSize = 100) {
        let cursor = '0';
        do {
            const reply = await this.client.scan(cursor, {
                MATCH: pattern,
                COUNT: pageSize,
            });
            cursor = reply.cursor;
            const keys = reply.keys;
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } while (cursor !== '0');
    }
    async batchUpdateTTL(keys, ttlInSeconds, ignoreKeyCaseSensitivity) {
        if (ignoreKeyCaseSensitivity) {
            keys = keys.map(k => k.toLowerCase());
        }
        const multi = this.client.multi();
        for (const key of keys) {
            multi.exists(key);
            multi.expire(key, ttlInSeconds);
        }
        await multi.exec();
    }
}
exports.default = RedisService;
