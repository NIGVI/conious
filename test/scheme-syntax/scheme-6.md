

# Scheme 3

## ts interface

```ts
interface scheme {
  [index: number]: {
    title: string,
    price: number,
    images: {
      jpg: string,
      webp: string
    }[]
  }
}
```



## scheme

Scheme working only with json

```js
const scheme = [
  {
    title: 'string',
    price: 'number',
    images: [
      {
        jpg: 'string',
        webp: 'string'
      }
    ]
  }
]
```



## tests



### json

Trues:

```js
const input = [
  {
    title: 'product-1',
    price: 1000,
    images: []
  },
  {
    title: 'product-2',
    price: 2000,
    images: [
      {
        jpg: '/static/path/to.jpg',
        webp: '/static/path/to.webp'
      }
    ]
  }
]
const schemeMode = [
  {
    title: 'product-1',
    price: 1000,
    images: []
  },
  {
    title: 'product-2',
    price: 2000,
    images: [
      {
        jpg: '/static/path/to.jpg',
        webp: '/static/path/to.webp'
      }
    ]
  }
]
const parseMode = schemeMode
```

```js
const input = []
const schemeMode = []
const parseMode = schemeMode
```

```js
const input = [
  {
    title: 1000,
    price: 1000,
    images: []
  }
]
const schemeMode = []
const parseMode = schemeMode
```

```js
const input = [
  {
    title: 'product-1',
    price: '1000',
    images: []
  }
]
const schemeMode = []
const parseMode = schemeMode
```