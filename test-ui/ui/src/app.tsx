import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import { Button, Flex, MemeBlock, InputBox } from '@holium/design-system'
import Tome, { FeedStore } from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

export function App() {
    const [ready, setReady] = useState(false)
    const [data, setData] = useState([])
    const [feed, setFeed] = useState<FeedStore>()
    const [link, setLink] = useState('')

    useEffect(() => {
        async function init() {
            const db = await Tome.init(api)
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
                    console.log(payload)
                    if (payload.action === 'remove') {
                        feed?.removeLink(item.id)
                    } else if (payload.action === 'add') {
                        if (item.createdBy in item.links) {
                            feed?.removeLink(item.id)
                        }
                        feed?.setLink(item.id, payload.emoji)
                    }
                }}
                width={400}
            />
        )
    })

    return (
        <main>
            <Flex position="relative" my={2} flexDirection="column" gap={8}>
                {ListItems}
            </Flex>
            <InputBox
                rightAdornment={
                    <Button.Primary
                        height={32}
                        px={2}
                        fontSize="16px"
                        onClick={async () => {
                            const id = await feed?.post(link)
                            console.log(id)
                            setLink('')
                        }}
                    >
                        Post
                    </Button.Primary>
                }
                inputId="input-2"
            >
                <input
                    id="input-2"
                    tabIndex={1}
                    placeholder="Paste meme link"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                />
            </InputBox>
        </main>
    )
}
