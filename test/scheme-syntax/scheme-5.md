

# Scheme 3

## ts interface

```ts
interface scheme {
  date: Date[]
}
```



## scheme

```js
const scheme = {
  date: [
    (value) => {
      const number = +value
      
      if (isNaN(number)) {
        return {
          ok: false,
          value: null
        }
      }
      return {
        ok: true,
        value: new Date(number)
      }
    }
  ]
}
```



## tests



### json

Trues:

```js
const input = {
  date: [1651076544028]
}
const schemeMode = {
  date: ['2022-04-27T16:22:24.028Z']
}
const parseMode = schemeMode
```

```js
const input = {
  date: []
}
const schemeMode = {
  date: []
}
const parseMode = schemeMode
```

```js
const input ={
  date: [1651076544028, 1351122579028]
}
const schemeMode ={
  date: ['2022-04-27T16:22:24.028Z', '2012-10-24T23:49:39.028Z']
}
const parseMode = schemeMode
```

Falsies:

```js
const input = {
  date: ['word']
}
const schemeMode = {
  date: []
}
const parseMode = schemeMode
```

```js
const input = {
  date: 'word'
}
const parseMode = {}
```

```js
const input = {}
const parseMode = {}
```



### query params

Trues:

```js
const url = '/path?date=1651076544028'
const schemeMode = {
  date: ['2022-04-27T16:22:24.028Z']
}
const parseMode = schemeMode
```

```js
const url = '/path?date=1651076544028&date=1351122579028'
const schemeMode = {
  date: ['2022-04-27T16:22:24.028Z', '2012-10-24T23:49:39.028Z']
}
const parseMode = schemeMode
```

```js
const url = '/path?date=1651076544028&date=word&date=1351122579028'
const schemeMode = {
  date: ['2022-04-27T16:22:24.028Z', '2012-10-24T23:49:39.028Z']
}
const parseMode = schemeMode
```

```js
const url = '/path'
const schemeMode = {
  date: []
}
const parseMode = schemeMode
```

```js
const url = '/path?date=word'
const schemeMode = {
  date: []
}
const parseMode = schemeMode
```



### form

Trues:

```js
const input = {
  date: 1651076544028
}
const schemeMode = {
  date: ['2022-04-27T16:22:24.028Z']
}
const parseMode = schemeMode
```

```js
const input = {}
const schemeMode = {
  date: []
}
const parseMode = schemeMode
```

```js
const input ={
  date: [1651076544028, 1351122579028]
}
const schemeMode ={
  date: ['2022-04-27T16:22:24.028Z', '2012-10-24T23:49:39.028Z']
}
const parseMode = schemeMode
```

```js
const input ={
  date: [1651076544028, 'word', 1351122579028]
}
const schemeMode = {
  date: ['2022-04-27T16:22:24.028Z', '2012-10-24T23:49:39.028Z']
}
const parseMode = schemeMode
```

```js
const input ={
  date: 'word'
}
const schemeMode = {
  date: []
}
const parseMode = schemeMode
```