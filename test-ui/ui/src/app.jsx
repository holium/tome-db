import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship


// const local_db = await Tome.init()

// const test = await api.subscribe({
//     app: 'tome-api',
//     path: '/kv/~zod/our/all/def/perm',
//     event: (data) => {
//         console.log('Received event: ' + JSON.stringify(data))
//     },
// })

// const testStore = async () => {
//     await store.set('foo', 'bar')
//     await store.set('charlie', 'echo')

//     let resp = await store.all()
//     console.log(
//         'Values currently in the key-value store: ' +
//             JSON.stringify(Object.fromEntries(resp))
//     )
//     await store.clear()

//     // console.log("Attempting to retrieve a missing value 'zulu'")
//     // let value = await store.get('zulu')

//     // value = await store.get('alice')
//     // console.log("Retrieved value for 'alice': " + value)

//     // await store.remove('alice')
//     // resp = await store.all()
//     // console.log(
//     //     "Removed 'alice' and check all again: " +
//     //         JSON.stringify(Object.fromEntries(resp))
//     // )

//     // await store.clear()
//     // resp = await store.all()
//     // console.log(
//     //     'Cleared store and check all again: ' +
//     //         JSON.stringify(Object.fromEntries(resp))
//     // )
// }

// console.warn('Using an Urbit Backend: \n\n')
// await testStore()
// console.log(await store.all())
// await testStore()

// console.warn('Using Local Storage: \n\n')
// await testStore(local_db)
async function addKV() {
    const rand = Math.random().toString().substring(2, 8)
    await store.set(rand, 'foo')
}

export function App() {
    const [active, setActive] = useState(false)
    
    const updateActive = (_active) => {
        setActive(_active)
    }

    useEffect(() => {
        async function init() { 
            const db = await Tome.init(api)
            const store = await db.keyvalue({
                activeCallback: updateActive,
            })
        }
        init()     
    }, []);



    return (
        <main className="flex items-center justify-center min-h-screen">
            {active ? <button onClick={addKV}>add something!</button> : <p>inactive</p>}
        </main>
    )
}
