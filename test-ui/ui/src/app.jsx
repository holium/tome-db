import React, { useEffect } from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'
// import Tome from 'tome-db'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

export function App() {
    useEffect(() => {
        const testing = async () => {
            const db = await Tome.init(api)
            console.log(db)

            const store = await db.keyvalue({ preload: false })
            await store.set('foo', 'bar')

            console.log(store)
        }
        testing()
    }, [])

    return (
        <main className="flex items-center justify-center min-h-screen"></main>
    )
}
