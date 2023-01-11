import { describe, expect, test } from '@jest/globals'
import { Tome } from '../src/classes'

describe('sum module', () => {
    test('adds 1 + 2 to equal 3', () => {
        const db = new Tome()
        expect(db.desk).toBe(undefined)
        expect(db.api).toBe(undefined)
    })
})
