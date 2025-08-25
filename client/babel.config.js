module.exports = {
    presets: [
        "@babel/preset-env",
        "@babel/preset-react"
    ],
    plugins: [
        [
            //  antd V5 已不再支持
            "import",
            {
                libraryName: "antd",
                libraryDirectory: "es",
                style: true
            }
        ],
        [
            "@babel/plugin-transform-runtime",
            {
                "regenerator": true
            }
        ]
    ]
};
