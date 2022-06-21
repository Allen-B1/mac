import typescript from '@rollup/plugin-typescript'

export default {
    input: 'script.ts',
    output: {
        file: 'bundle.js',
        format: 'iife',
    },
    plugins: [typescript()]
};