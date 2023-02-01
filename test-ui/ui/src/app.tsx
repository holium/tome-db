import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import Tome, { FeedStore } from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

export function App() {
    const [ready, setReady] = useState(false)
    const [data, setData] = useState([])
    const [feed, setFeed] = useState<FeedStore>()


    useEffect(() => {
        async function init() {
            const db = await Tome.init(api)
            const feed = await db.feed({
                preload: true,
                permissions: {read: 'space', write: 'space', admin: 'our'},
                onReadyChange: setReady,
                onDataChange: (data) => {
                    setData([...data])
                },
            })
            setFeed(feed)
        }
        init()
    }, [])

    const listItems = data.map((item) => <li key={item.id}>{item.id}</li>)

    return (
        <main className="flex items-center justify-center min-h-screen">
            {ready && feed ? (
                <div>
                    <ul>{listItems}</ul>
                    <button onClick={() => feed.post('~lomder-librun!')}>Add new</button>
                </div>
            ) : (
                <p>loading...</p>
            )}
        </main>
    )
}
