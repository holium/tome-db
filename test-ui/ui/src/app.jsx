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

    useEffect(() => {
        async function init() {
            const db = await Tome.init(api)
            const store = await db.keyvalue({
                onReadyChange: updateReady,
            })
        }
        init()
    }, [])

    return (
        <main className="flex items-center justify-center min-h-screen">
            {ready ? <p>active</p> : <p>inactive</p>}
        </main>
    )
}
