import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import { Button, Flex, MemeBlock } from '@holium/design-system'
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
            const kv = await db.keyvalue()
            const feed = await db.feed({
                preload: true,
                permissions: { read: 'space', write: 'space', admin: 'our' },
                onReadyChange: setReady,
                onDataChange: (data) => {
                    console.log(data)
                    // newest records first.
                    // if you want a different order, you can sort the data here.
                    // need to spread array to trigger re-render
                    setData([...data])
                },
            })
            setFeed(feed)
            //console.log(await feed.clear())
            //console.log(feed)
        }
        init()
    }, [])

    const ListItems = data.map((item: any, index: number) => {
        const reactions = []
        Object.entries(item.links).map(([author, emoji]) => {
            const reaction = {}
            Object.assign(reaction, { author, emoji })
            reactions.push(reaction)
        })
        return (
            <MemeBlock
                zIndex={data.length - index}
                key={item.id}
                id={item.id}
                image={item.content}
                by={item.createdBy}
                date={new Date(item.createdAt).toUTCString()}
                reactions={reactions}
                onReaction={(payload) => {
                    feed?.setLink(item.id, payload.emoji)
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
                    <p>loading...</p>
                )}
                {ListItems}
            </Flex>
        </main>
    )
}
