import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import { Button, Flex, MemeBlock } from '@holium/design-system'
import Tome, { FeedStore } from '../pkg/src/index'
import { v4 as uuid } from 'uuid'

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
            // const kv = await db.keyvalue({
            //     preload: true,
            //     permissions: { read: 'space', write: 'space', admin: 'our' },
            //     onReadyChange: setReady,
            //     onDataChange: (data) => {
            //         console.log(data)
            //         // newest records first.
            //         // if you want a different order, you can sort the data here.
            //         // need to spread array to trigger re-render
            //         setData([...data])
            //     },
            // })
            const feed = await db.feed({
                preload: false,
                permissions: { read: 'space', write: 'space', admin: 'our' },
                onReadyChange: setReady,
                onDataChange: (data) => {
                    // newest records first.
                    // if you want a different order, you can sort the data here.
                    // need to spread array to trigger re-render
                    setData([...data])
                },
            })
            // setFeed(feed)
            // console.log(feed)
            //await kv.set('test', 'hello world!')
            // console.log(await kv.get('test'))
            //console.log()
            //console.log('hello world!')
            const id = await feed.post(
                'https://pbs.twimg.com/media/FmHxG_UX0AACbZY?format=png&name=900x900'
            )
            await feed.setLink(id, ':zodzodzod:')
            await feed.blockShip('zod')
            // const result = await kv.set('key', 4)
            // await kv.setPermissions({
            //     read: 'space',
            //     write: 'our',
            //     admin: 'our',
            // })
            //console.log(result)
            //testFeed(feed)
        }
        init()
    }, [])
    const ListItems = data.map((item: any, index: number) => {
        // console.log(item, index)
        return (
            <MemeBlock
                zIndex={data.length - index}
                key={item.id}
                id={item.id}
                image={item.content}
                by={item.ship}
                date={new Date(item.createdAt).toUTCString()}
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
                    <p>loading...</p>
                )}
                {ListItems}
            </Flex>
        </main>
    )
}
