

# Scheme 2

## ts interface

```ts
interface scheme {
  name: string,
  surname: string,
  age?: number
}
```



## scheme

```js
const scheme = {
  name: 'string',
  surname: 'string',
  'age?': 'number'
}
```



## tests



### json

Trues:

```js
const input = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 20
}
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 20
}
const parseMode = schemeMode
```

```js
const input = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 20,
  param: 'value'
}
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 20
}
const parseMode = schemeMode
```

```js
const input = {
  name: 'Nikita',
  surname: 'Ziuzin'
}
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin'
}
const parseMode = schemeMode
```

```js
const input = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: '20',
}
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin'
}
const parseMode = schemeMode
```

Falsies:

```js
const input = {
  name: 'Nikita',
  surname: 10,
  age: 20,
}
const parseMode = {
  name: 'Nikita',
  age: 20
}
```

```js
const input = {
  name: 'Nikita',
  surname: 10,
  age: [20, 19],
}
const parseMode = {
  name: 'Nikita'
}
```



### query params

Trues:

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=20'
// output
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 20
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=20&param=value'
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 20
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=20.5'
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 20.5
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=0.5'
// output
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 0.5
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin'
// output
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin'
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=word'
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin'
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=20.'
const schemeMode =  {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 20
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=.3'
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin',
  age: 0.3
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=.'
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin'
}
const parseMode = schemeMode
```

```js
const url = '/path?name=Nikita&surname=Ziuzin&age=20.5.5'
const schemeMode = {
  name: 'Nikita',
  surname: 'Ziuzin'
}
const parseMode = schemeMode
```

Falsies:

```js
const url = '/path?name=Nikita&Surname=Ziuzin&age=20'
const parseMode = {
  name: 'Nikita',
  age: 20
}
```

```js
const url = '/path?name=Nikita'
const parseMode = {
  name: 'Nikita'
}
```