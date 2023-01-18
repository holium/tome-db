import React from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

const result = await api.thread({
    inputMark: 'json',
    outputMark: 'json',
    threadName: 'poke-tunnel',
    body: {
        ship: '~bus',
        json: JSON.stringify({
            'set-value': {
                space: 'our',
                app: 'all',
                bucket: 'def',
                key: 'monker',
                value: 'banan',
            },
        }),
    },
}).catch((e) => { 
    return undefined
})
console.log(result === undefined)
console.log(result)

// const db = await Tome.init(api)
// const store = await db.keyvalue({
//     preload: true,
// })

export function App() {
    return (
        <main className="flex items-center justify-center min-h-screen"></main>
    )
}
