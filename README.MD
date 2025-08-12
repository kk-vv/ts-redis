# RedisService 

## Install

```
npm i @move.box/redis-service
```

## Usage 

- setString
- getString
- setNumber
- getNumber
- setBigInt
- getBigInt
- setJSONObject
- getJSONObject
- batchSet
- batchGet
- batchSetJSONObject
- batchGetJSONObject
- batchUpdateTTL
- deleteByKeys
- deleteKeysByPattern
- isExist

#### Example

```
export async function main() {
  const redisService = new RedisService('redis://localhost:6379', 7)
  try {
    await redisService.connectOrThrow()
  } catch (error) {
    console.error(error)
  }

  try {
    const model = {
      name: 'Move',
      address: 'Online',
      balance: 12345678914789464989755456555556566n
    }
    await redisService.setJSONObject('aKeY', model, 20, false)   // expired at 20 seconds, if none would never expired
    await redisService.setJSONObject('bKeY', model, 20, true)   // expired at 20 seconds, if none would never expired
    const jsonObjectNull = await redisService.getJSONObject('akey', false) // null
    const jsonObject1 = await redisService.getJSONObject('akey', true) // null
    const jsonObject2 = await redisService.getJSONObject('aKeY', false) // model

    const jsonObjectNullB = await redisService.getJSONObject('bKeY', false) // null
    const jsonObjectB1 = await redisService.getJSONObject('bKeY', true) // model
    const jsonObjectB2 = await redisService.getJSONObject('bkey', false) // model
    const jsonObjectB3 = await redisService.getJSONObject('bKeY', false) // null

    await redisService.batchUpdateTTL(['bKeY'], 100, true) // update new expired time to 100 seconds

    console.dir(jsonObjectNull, { depth: 10 })
    console.dir(jsonObject1, { depth: 10 })
    console.dir(jsonObject2, { depth: 10 })

    console.dir(jsonObjectNullB, { depth: 10 })
    console.dir(jsonObjectB1, { depth: 10 })
    console.dir(jsonObjectB2, { depth: 10 })
    console.dir(jsonObjectB3, { depth: 10 })

    //
    const item1 = 12345
    const item2 = 'abcdef'
    const item3 = 123456789213456789123456789123456789123456789456123456789456123456789456123456789456123456789n
    const item4 = {
      'title': 'Box',
      'items': [
        '1',
        '2',
        '3',
        '4',
        '5',
      ]
    }

    await redisService.batchSetJSONObject({ 'key1': item1, 'kEy2': item2, 'Key3': item3, 'keY4': item4 })
    const records = await redisService.batchGetJSONObject(['key1', 'key2', 'key3', 'key4', 'key5'])
    console.log(records['key1'])//12345
    console.log(records['key2'])//abcdef
    console.log(records['key3'])//123456789213456789123456789123456789123456789456123456789456123456789456123456789456123456789n
    console.log(records['key4'])//{ title: 'Box', items: [ '1', '2', '3', '4', '5' ] }
    console.log(records['key5'])//null

    await redisService.deleteByKeys(['key1', 'key2', 'Key3', 'key4', 'key5'], false)// delete key1 key2 key4
  } catch (error) {
    console.error(error)
  }

  await redisService.disconnectOrThrow()
}

main()
```