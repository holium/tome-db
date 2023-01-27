import React, { useState, useEffect } from 'react'
import Urbit from '@urbit/http-api'
import Tome from '../pkg/src/index'

const api = new Urbit('', '', window.desk)
api.ship = window.ship

export function App() {
    const [active, setActive] = useState(false)
    
    const updateActive = (_active) => {
        setActive(_active)
    }

    useEffect(() => {
        async function init() { 
            const db = await Tome.init(api)
            const store = await db.keyvalue({
                onActiveChange: updateActive,
            })
        }
        init()     
    }, []);



    return (
        <main className="flex items-center justify-center min-h-screen">
            {active ? <p>active</p> : <p>inactive</p>}
        </main>
    )
}
