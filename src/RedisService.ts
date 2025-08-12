import { createClient } from 'redis'
import { JSONDeserialize, JSONSerialize } from './JSONSerializer'

export type RedisClient = ReturnType<typeof createClient>

class RedisService {

  private client: RedisClient
  private dbIndex: number

  constructor(url: string, dbIndex: number) {
    this.dbIndex = dbIndex
    this.client = createClient({
      url: url
    })
  }

  async connectOrThrow() {
    await this.client.connect()
    await this.client.select(this.dbIndex)
  }

  async disconnectOrThrow() {
    if (this.client && this.client.isOpen) {
      const status = await this.client.quit()
      if (status !== 'OK') {
        throw new Error('Redis disconnect failed.')
      }
    }
  }

  async setJSONObject<T>(
    key: string,
    obj: T,
    expiredSeconds?: number,
    ignoreKeyCaseSensitivity: boolean = true
  ) {
    await this.setString(key, JSONSerialize(obj), expiredSeconds, ignoreKeyCaseSensitivity)
  }

  async getJSONObject<T>(key: string, ignoreKeyCaseSensitivity: boolean = true) {
    const obj = await this.getString(key, ignoreKeyCaseSensitivity)
    if (obj) {
      return JSONDeserialize(obj) as T
    }
    return null
  }

  async setString(
    key: string,
    value: string,
    expiredSeconds: number | undefined,
    ignoreKeyCaseSensitivity: boolean
  ) {
    await this.client.set(ignoreKeyCaseSensitivity ? key.toLowerCase() : key, value, { EX: expiredSeconds });
  }

  async getString(
    key: string,
    ignoreKeyCaseSensitivity: boolean
  ) {
    return await this.client.get(ignoreKeyCaseSensitivity ? key.toLowerCase() : key)
  }

  async setNumber(
    key: string,
    value: number,
    expiredSeconds?: number,
    ignoreKeyCaseSensitivity: boolean = true
  ) {
    await this.setString(key, `${value}`, expiredSeconds, ignoreKeyCaseSensitivity);
  }

  async getNumber(key: string, ignoreKeyCaseSensitivity: boolean = true) {
    const value = await this.getString(key, ignoreKeyCaseSensitivity)
    const number = Number(value)
    if (value && !isNaN(number)) {
      return number
    }
    return null
  }

  async setBigInt(
    key: string,
    value: bigint,
    expiredSeconds?: number,
    ignoreKeyCaseSensitivity: boolean = true
  ) {
    await this.setString(key, `${value}`, expiredSeconds, ignoreKeyCaseSensitivity);
  }

  async getBigInt(key: string, ignoreKeyCaseSensitivity: boolean = true) {
    const value = await this.getString(key, ignoreKeyCaseSensitivity)
    if (value) {
      return BigInt(value)
    }
    return null
  }

  async deleteByKeys(keys: string[], ignoreKeyCaseSensitivity: boolean = true) {
    if (ignoreKeyCaseSensitivity) {
      keys = keys.map(k => k.toLowerCase())
    }
    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  async batchSet(
    value: Record<string, string>,
    expiredSeconds: number | undefined,
    ignoreKeyCaseSensitivity: boolean
  ) {
    if (Object.values(value).length > 0) {
      const pipeline = await this.client.multi()
      Object.keys(value).forEach(key => {
        pipeline.set(ignoreKeyCaseSensitivity ? key.toLowerCase() : key, value[key], { EX: expiredSeconds });
      })
      await pipeline.exec()
    }
  }

  async batchGet(
    keys: string[],
    ignoreKeyCaseSensitivity: boolean
  ) {
    if (ignoreKeyCaseSensitivity) {
      keys = keys.map(k => k.toLowerCase())
    }
    const result: Record<string, string | null> = {}
    if (keys.length > 0) {
      const values = await this.client.mGet(keys)
      keys.forEach((key, index) => {
        result[key] = values[index] ? values[index] : null
      })
    }
    return result
  }

  async batchSetJSONObject<T>(
    value: Record<string, T>,
    expiredSeconds?: number | undefined,
    ignoreKeyCaseSensitivity: boolean = true
  ) {
    if (Object.values(value).length > 0) {
      const pipeline = await this.client.multi()
      Object.keys(value).forEach(key => {
        pipeline.set(ignoreKeyCaseSensitivity ? key.toLowerCase() : key, JSONSerialize(value[key]), { EX: expiredSeconds });
      })
      await pipeline.exec()
    }
  }

  async batchGetJSONObject<T>(
    keys: string[],
    ignoreKeyCaseSensitivity: boolean = true
  ) {
    const result = await this.batchGet(keys, ignoreKeyCaseSensitivity)
    const finalResult: Record<string, T | null> = {}
    Object.keys(result).forEach((key) => {
      finalResult[key] = result[key] ? (JSONDeserialize(result[key]) as T) : null
    })
    return finalResult
  }

  async isExist(key: string) {
    const exists = await this.client.exists(key)
    return exists === 1
  }

  async deleteKeysByPattern(pattern: string, pageSize: number = 100) {
    let cursor = '0'
    do {
      const reply = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: pageSize,
      });
      cursor = reply.cursor
      const keys = reply.keys
      if (keys.length > 0) {
        await this.client.del(keys)
      }
    } while (cursor !== '0')
  }

  async batchUpdateTTL(keys: string[], ttlInSeconds: number, ignoreKeyCaseSensitivity: boolean): Promise<void> {
    if (ignoreKeyCaseSensitivity) {
      keys = keys.map(k => k.toLowerCase())
    }
    const multi = this.client.multi()
    for (const key of keys) {
      multi.exists(key)
      multi.expire(key, ttlInSeconds)
    }
    await multi.exec()
  }
}

export { JSONSerialize, JSONDeserialize }

export default RedisService