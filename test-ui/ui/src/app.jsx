import React, { useEffect, useState } from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'
// import Tome from 'tome-db'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

export function App() {
    useEffect(() => {
        const testing = async () => {
            const db = await Tome.init(api)
            const store = await db.keyvalue({
                preload: false,
            })
            await store.set('key', 'value')
            console.log(store)

            const res = await store.get('foo')
            console.log(res)

            const all = await store.all()
            console.log(all)
        }
        testing()
    }, [])

    return (
        <main className="flex items-center justify-center min-h-screen"></main>
    )
}
