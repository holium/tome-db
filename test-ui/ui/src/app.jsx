import React from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

const db = await Tome.init(api)
// const local_db = await Tome.init()

// const test = await api.subscribe({
//     app: 'spaces',
//     path: '/current',
//     event: (data) => {
//         console.log('Received event: ' + JSON.stringify(data))
//     },
// })

const testStore = async () => {
    const store = await db.keyvalue()
    await store.set('monkey', 'brain')
    await store.set('charlie', 'echo')

    let resp = await store.all()
    console.log(
        'Values currently in the key-value store: ' +
            JSON.stringify(Object.fromEntries(resp))
    )
    // await store.clear()

    // console.log("Attempting to retrieve a missing value 'zulu'")
    // let value = await store.get('zulu')

    // value = await store.get('alice')
    // console.log("Retrieved value for 'alice': " + value)

    // await store.remove('alice')
    // resp = await store.all()
    // console.log(
    //     "Removed 'alice' and check all again: " +
    //         JSON.stringify(Object.fromEntries(resp))
    // )

    // await store.clear()
    // resp = await store.all()
    // console.log(
    //     'Cleared store and check all again: ' +
    //         JSON.stringify(Object.fromEntries(resp))
    // )
}

console.warn('Using an Urbit Backend: \n\n')
await testStore()

// console.warn('Using Local Storage: \n\n')
// await testStore(local_db)

export function App() {
    return (
        <main className="flex items-center justify-center min-h-screen"></main>
    )
}
