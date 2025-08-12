import { createClient } from 'redis';
import { JSONDeserialize, JSONSerialize } from './JSONSerializer';
export type RedisClient = ReturnType<typeof createClient>;
declare class RedisService {
    private client;
    private dbIndex;
    constructor(url: string, dbIndex: number);
    connectOrThrow(): Promise<void>;
    disconnectOrThrow(): Promise<void>;
    setJSONObject<T>(key: string, obj: T, expiredSeconds?: number, ignoreKeyCaseSensitivity?: boolean): Promise<void>;
    getJSONObject<T>(key: string, ignoreKeyCaseSensitivity?: boolean): Promise<T | null>;
    setString(key: string, value: string, expiredSeconds: number | undefined, ignoreKeyCaseSensitivity: boolean): Promise<void>;
    getString(key: string, ignoreKeyCaseSensitivity: boolean): Promise<string | null>;
    setNumber(key: string, value: number, expiredSeconds?: number, ignoreKeyCaseSensitivity?: boolean): Promise<void>;
    getNumber(key: string, ignoreKeyCaseSensitivity?: boolean): Promise<number | null>;
    setBigInt(key: string, value: bigint, expiredSeconds?: number, ignoreKeyCaseSensitivity?: boolean): Promise<void>;
    getBigInt(key: string, ignoreKeyCaseSensitivity?: boolean): Promise<bigint | null>;
    deleteByKeys(keys: string[], ignoreKeyCaseSensitivity?: boolean): Promise<void>;
    batchSet(value: Record<string, string>, expiredSeconds: number | undefined, ignoreKeyCaseSensitivity: boolean): Promise<void>;
    batchGet(keys: string[], ignoreKeyCaseSensitivity: boolean): Promise<Record<string, string | null>>;
    batchSetJSONObject<T>(value: Record<string, T>, expiredSeconds?: number | undefined, ignoreKeyCaseSensitivity?: boolean): Promise<void>;
    batchGetJSONObject<T>(keys: string[], ignoreKeyCaseSensitivity?: boolean): Promise<Record<string, T | null>>;
    isExist(key: string): Promise<boolean>;
    deleteKeysByPattern(pattern: string, pageSize?: number): Promise<void>;
    batchUpdateTTL(keys: string[], ttlInSeconds: number, ignoreKeyCaseSensitivity: boolean): Promise<void>;
}
export { JSONSerialize, JSONDeserialize };
export default RedisService;
