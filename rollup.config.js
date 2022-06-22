import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
    input: 'script.ts',
    output: {
        file: 'bundle.js',
        format: 'iife',
    },
    plugins: [typescript(), resolve(), commonjs()],
};