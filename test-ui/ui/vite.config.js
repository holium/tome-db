import { loadEnv, defineConfig } from 'vite'
import path from 'path'
import reactRefresh from '@vitejs/plugin-react-refresh'
import { urbitPlugin } from '@urbit/vite-plugin-urbit'

// https://vitejs.dev/config/
export default ({ mode }) => {
    Object.assign(process.env, loadEnv(mode, process.cwd()))
    const SHIP_URL =
        process.env.SHIP_URL ||
        process.env.VITE_SHIP_URL ||
        'http://localhost:8080'
    console.log(SHIP_URL)

    return defineConfig({
        mode: process.env.NODE_ENV,
        build: {
            target: 'esnext',
            minify: true,
            sourcemap: false,
            manifest: false,
        },
        resolve: {
            alias: {
                react: path.resolve('./node_modules/react'),
                'react-dom': path.resolve('./node_modules/react-dom'),
                'styled-components': path.resolve(
                    './node_modules/styled-components'
                ),
                'styled-system': path.resolve('./node_modules/styled-system'),
            },
        },
        server: {
            port: process.env.VITE_PORT
                ? parseInt(process.env.VITE_PORT)
                : 3000,
            fs: {
                allow: [
                    '../../../realm/lib/design-system/',
                    '../',
                ],
            },
        },
        plugins: [
            urbitPlugin({ base: 'tome-db', target: SHIP_URL, secure: false }),
            reactRefresh(),
        ],
    })
}
