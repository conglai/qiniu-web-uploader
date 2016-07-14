const webpack = require('webpack');

module.exports = {
    entry: './example.js',
    output: {
        path: './build',
        filename: 'example.js',
    },
    devtool: 'source-map',
    module: {
        loaders: [{
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
              presets: ['es2015', 'stage-0'],
              plugins: [
                'transform-runtime',
                'transform-class-properties',
                'transform-es2015-object-super'
              ]
            }
        }]
    }
}
