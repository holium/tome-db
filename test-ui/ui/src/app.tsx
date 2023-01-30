import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import Tome, { FeedStore } from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

export function App() {
    const [ready, setReady] = useState(false)

    const updateReady = (_ready) => {
        setReady(_ready)
    }

    const testStore = async (store) => {
        await store.set('number', 3)
        await store.set('string', 'foo')
        await store.set('array', [1, 2, 3])
        await store.set('object', { a: 1, b: 2, c: 3 })
        await store.set('boolean', true)

        const complexJSON = {
            browsers: {
                firefox: {
                    name: 'Firefox',
                    pref_url: 'about:config',
                    releases: {
                        '1': {
                            release_date: '2004-11-09',
                            status: 'retired',
                            engine: [1, 'two', true],
                            engine_version: 1.7,
                        },
                    },
                },
            },
        }

        await store.set('complex', complexJSON)

        let resp = await store.all()
        console.log(
            'Values currently in the key-value store: ' +
                JSON.stringify(Object.fromEntries(resp))
        )

        console.log("Attempting to retrieve a missing value 'zulu'")
        let value = await store.get('zulu')

        value = await store.get('boolean')
        console.log("Retrieved value for 'boolean': " + value)

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

    const testFeed = async (feed: FeedStore) => {
        // feed.clear()
        const bobId = await feed.post('david')
        //const echoId = await feed.post(3)
        await feed.edit(bobId, 'malevsky')
        //await feed.delete(echoId)
        //await feed.clear()
        // await feed.delete(echoId)
    }

    useEffect(() => {
        async function init() {
            const db = await Tome.init(api)
            // const store = await db.keyvalue({
            //     preload: true,
            //     onReadyChange: updateReady,
            // })
            const feed = await db.feed({
                preload: true,
                onReadyChange: updateReady,
            })
            console.log(feed)
            // testStore(store)
            testFeed(feed)
        }
        init()
    }, [])

    return (
        <main className="flex items-center justify-center min-h-screen">
            {ready ? <p>active</p> : <p>inactive</p>}
        </main>
    )
}
