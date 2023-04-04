import Tome from '../src'
import Urbit from '@urbit/http-api'
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'

describe('basic local Tome tests', () => {
    test('local Tome is ours', async () => {
        const db = await Tome.init()
        expect(db.isOurStore()).toBe(true)
    })
})

describe('basic remote Tome tests', () => {
    let api: Urbit

    beforeAll(async () => {
        api = await Urbit.authenticate({
            ship: 'zod',
            url: 'http://localhost:8080',
            code: 'lidlut-tabwed-pillex-ridrup',
        })
    })

    test('remote Tome is ours', async () => {
        const db = await Tome.init(api, 'racket', {
            ship: 'zod',
        })
        expect(db.isOurStore()).toBe(true)
    })

    test('realm tome', async () => {
        const db = await Tome.init(api, 'racket', {
            realm: true,
        })
        expect(db.isOurStore()).toBe(true)
    })

    // this doesn't work yet
    afterAll(async () => {
        await api.delete()
    })
})
