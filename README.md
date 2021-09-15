# @github1/redux-modules

An implementation of the [redux modules](https://github.com/erikras/ducks-modular-redux) pattern to modularize redux reducers, middleware and action creators

This package provides utilities for encapsulating redux
components such as `reducer`, `middleware`, `actions`, `preloadedState` in a
strongly types structure which makes it simpler to build, organize and reuse logic.

[![build status](https://img.shields.io/travis/github1/redux-modules/master.svg?style=flat-square)](https://travis-ci.org/github1/redux-modules)
[![npm version](https://img.shields.io/npm/v/@github1/redux-modules.svg?style=flat-square)](https://www.npmjs.com/package/@github1/redux-modules)
[![npm downloads](https://img.shields.io/npm/dm/@github1/redux-modules.svg?style=flat-square)](https://www.npmjs.com/package/@github1/redux-modules)

## Install

```shell
npm install @github1/redux-modules --save
```

## Usage

```javascript
import { createModule } from '@github1/redux-modules';

const store = createModule('myModule')
  .reduce((state: MyState, action: MyActionTypes) => {
    if ('Increment' === action.type) {
      return { ...state, count: state.count + 1 };
    }
    return state;
  })
  .preloadedState({
    count: 0,
  })
  .asStore();
```

## License

[MIT](LICENSE.md)
