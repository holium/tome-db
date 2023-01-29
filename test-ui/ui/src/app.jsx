import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

export function App() {
    const [ready, setReady] = useState(false)

    const updateReady = (_ready) => {
        setReady(_ready)
    }

    const testStore = async (store) => {
        await store.set('alice', 'bob')
        await store.set('charlie', 'echo')

        let resp = await store.all()
        console.log(
            'Values currently in the key-value store: ' +
                JSON.stringify(Object.fromEntries(resp))
        )

        console.log("Attempting to retrieve a missing value 'zulu'")
        let value = await store.get('zulu')

        value = await store.get('alice')
        console.log("Retrieved value for 'alice': " + value)

        await store.remove('alice')
        resp = await store.all()
        console.log(
            "Removed 'alice' and check all again: " +
                JSON.stringify(Object.fromEntries(resp))
        )

        await store.clear()
        resp = await store.all()
        console.log(
            'Cleared store and check all again: ' +
                JSON.stringify(Object.fromEntries(resp))
        )
    }

    useEffect(() => {
        async function init() {
            const db = await Tome.init(api)
            const store = await db.keyvalue({
                preload: true,
            })
            testStore(store)
        }
        init()
    }, [])

    return (
        <main className="flex items-center justify-center min-h-screen">
            {ready ? <p>active</p> : <p>inactive</p>}
        </main>
    )
}
