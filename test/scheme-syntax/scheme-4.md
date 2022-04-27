

# Scheme 3

## ts interface

```ts
interface scheme {
  skills: string[]
}
```



## scheme

```js
const scheme = {
  skill: [
    {
      property: 'string'
    }
  ]
}
```



## tests



### json

Trues:

```js

const input = {
  skill: []
}

const schemeMode = {
  skill: []
}
const parseMode = schemeMode
```

```js
const input ={
  skill: [
    'word1',
    'word2',
    'word3'
  ]
}
const schemeMode ={
  skill: [
    'word1',
    'word2',
    'word3'
  ]
}
const parseMode = schemeMode
```

```js
const input = {
  skill: [
    'word1',
    40,
    'word3'
  ]
}
const schemeMode = {
  skill: [
    'word1',
    'word3'
  ]
}
const parseMode = schemeMode
```

Falsies:

```js
const input = {
  skill: 'word'
}
const parseMode = {}
// no output
```

```js
// input
const input = {}
const parseMode = {}
// no output
```



### query params

Trues:

```js
const url = '/path'

const schemeMode = {
  skill: []
}
const parseMode = schemeMode
```

```js
const url = '/path?skill=word1&skill=word2&skill=word3'

const schemeMode = {
  skill: [
    'word1',
    'word2',
    'word3'
  ]
}
const parseMode = schemeMode
```

```js
const url = '/path?skill=word1&skill=20&skill=word3'

const schemeMode = {
  skill: [
    'word1',
    '20',
    'word3'
  ]
}
const parseMode = schemeMode
```

```js
const url = '/path?skill=word'

const schemeMode = {
  skill: [
    'word'
  ]
}
const parseMode = schemeMode
```