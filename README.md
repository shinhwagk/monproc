## how usage
- install
```sh
npm i -g monproc
```

- create .monproc.json in root directory of project
```json
{
    "bootstrap": "test/index.js",
    "watch": "test", //string or string[]
    "interval": 1000
}
```

- start
```sh
monproc
```
