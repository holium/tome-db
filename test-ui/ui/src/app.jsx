import React from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

const db = await Tome.init(api,
    {
    ship: 'bus',
})
const store = await db.keyvalue({
    preload: false,
})

const result = await store.set('foo', 'bar')
console.log(result)

export function App() {
    return (
        <main className="flex items-center justify-center min-h-screen"></main>
    )
}
