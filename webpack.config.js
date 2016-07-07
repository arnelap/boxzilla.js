module.exports = {
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ]
    },
    output: {
        filename: "boxzilla.js",
        libraryTarget: "commonjs"
    }
};