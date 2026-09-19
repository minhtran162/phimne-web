const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');

const common = require('./webpack.common');

module.exports = merge(common, {
    mode: 'production',
    entry: {
        ...common.entry,
        'serviceworker': './serviceworker.js'
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                        pure_funcs: ['console.log', 'console.info', 'console.debug']
                    },
                    mangle: {
                        toplevel: true,
                        reserved: ['__NGINX_ENCRYPTED_DATA__', '__NGINX_IV__', '__NGINX_TAG__', '__NGINX_SECRET_KEY__', '__NGINX_JELLYFIN_DOMAIN__']
                    },
                    format: {
                        comments: false
                    }
                },
                extractComments: false
            })
        ]
    }
});