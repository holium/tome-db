import React from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'
// import Tome from 'tome-db'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

const db = await Tome.init(api)
const store = await db.keyvalue({
    preload: false,
})

let success = await store.set('key', 'value')
console.log(success)

success = await store.set('foo', 'bar')
console.log(success)

// success = await store.remove('key')
// console.log(success)

// const res = await store.get('foo', false)
// console.log(res)

// const res2 = await store.clear()
// console.log(res2)
// const res = await store.get('foo')
// console.log(res)

const all = await store.all()
console.log(all)

console.log(store)

export function App() {
    return (
        <main className="flex items-center justify-center min-h-screen"></main>
    )
}
