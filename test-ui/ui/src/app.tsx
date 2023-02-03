import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import Tome, { FeedStore } from '../pkg/src/index'
// import { MemeBlock } from '@holium/design-system'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

export function App() {
    const [ready, setReady] = useState(false)
    const [data, setData] = useState([])
    const [feed, setFeed] = useState<FeedStore>()

    const testFeed = async (feed: FeedStore) => {
        const id = await feed.post(
            'https://pbs.twimg.com/media/FmHxG_UX0AACbZY?format=png&name=900x900'
        )
        await feed.edit(id, 'helloworld!')
        await feed.setLink(
            id,
            'https://twitter.com/urbit/status/1380000000000000000'
        )
        console.log(feed)
    }

    useEffect(() => {
        async function init() {
            const db = await Tome.init(api)
            const feed = await db.feed({
                preload: true,
                permissions: { read: 'space', write: 'space', admin: 'our' },
                onReadyChange: setReady,
                onDataChange: (data) => {
                    // newest records first.
                    // if you want a different order, you can sort the data here.
                    // need to spread array to trigger re-render
                    setData([...data])
                },
            })
            setFeed(feed)
            testFeed(feed)
        }
        init()
    }, [])

    // const ListItems = data.map((item) => (
    //     // item.date * 1000
    //     <MemeBlock
    //         id={item.id}
    //         image={item.content}
    //         by={item.ship}
    //         date={item.date}
    //         onReaction={(payload) => {
    //             console.log(payload)
    //         }}
    //     />
    // ))

    return (
        <main className="flex items-center justify-center">
            {ready && feed ? (
                <div>
                    <button
                        onClick={() =>
                            feed.post(
                                'https://pbs.twimg.com/media/FmHxG_UX0AACbZY?format=png&name=900x900'
                            )
                        }
                    >
                        Add new
                    </button>
                </div>
            ) : (
                <p>welcome...</p>
            )}
        </main>
    )
}
