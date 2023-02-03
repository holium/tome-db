import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import { Button, Flex, MemeBlock } from '@holium/design-system'
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
    const ListItems = data.map((item: any, index: number) => {
        return (
            <MemeBlock
                zIndex={data.length - index}
                key={item.id}
                id={item.id}
                image={item.content}
                by={item.ship}
                date={new Date(item.time).toUTCString()}
                reactions={item.reactions || []}
                onReaction={(payload) => {
                    console.log(payload)
                }}
            />
        )
    })

    return (
        <main className="flex items-center justify-center">
            <Flex position="relative" my={2} flexDirection="column" gap={8}>
                {ready && feed ? (
                    <Button.Primary
                        px={1}
                        onClick={() =>
                            feed.post(
                                'https://pbs.twimg.com/media/FmHxG_UX0AACbZY?format=png&name=900x900'
                            )
                        }
                    >
                        Add new
                    </Button.Primary>
                ) : (
                    <p>welcome...</p>
                )}
                {ListItems}
            </Flex>
        </main>
    )
}
