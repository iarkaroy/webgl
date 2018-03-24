var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        main: './src/js/main.js'
    },
    output: {
        path: __dirname,
        filename: './dist/[name].js'
    },
    devtool: 'source-map',
    plugins: [
        new ExtractTextPlugin('./dist/main.css')
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['env']
                }
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        'css-loader',
                        'postcss-loader',
                        'sass-loader'
                    ]
                })
            },
            {
                test: /\.(glsl|vs|fs)$/,
                use: 'raw-loader'
            }
        ]
    }
}