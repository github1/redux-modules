# @github1/redux-modules

An implementation of the [redux modules](https://github.com/erikras/ducks-modular-redux) pattern to modularize redux reducers, middleware and action creators

This package provides a class, called `Module`, which encapsulates redux 
elements such as `reducer`, `middleware`, `actions`, `preloadedState` in a 
cohesive structure which makes it easier to build, configure and reuse logic 
in a redux store.

[![build status](https://img.shields.io/travis/github1/redux-modules/master.svg?style=flat-square)](https://travis-ci.org/github1/redux-modules)
[![npm version](https://img.shields.io/npm/v/@github1/redux-modules.svg?style=flat-square)](https://www.npmjs.com/package/@github1/redux-modules)
[![npm downloads](https://img.shields.io/npm/dm/@github1/redux-modules.svg?style=flat-square)](https://www.npmjs.com/package/@github1/redux-modules)

## Install
```shell
npm install @github1/redux-modules --save-dev
```

## Usage
```javascript
import { Module } from '@github1/redux-modules';

const store = Module.create({
  name: 'myModule',
  preloadedState: {
    count: 0
  },
  reducer: (state = {}, action) => {
    if ('INCREMENT' === action.type) {
        return {
          ...state,
          count: state.count + 1
        };
    }
    return state;
  }
}).inStore();
store.dispatch({ type: 'INCREMENT' });
```

## Examples

See [@github1/react-redux-common-modules](https://github.com/github1/react-redux-common-modules) for actual modules written with this package.

_Define a module from middleware_
```javascript
const module = Module.fromMiddleware(() => next => action => {
                          // behavior
                          next(action);
                      });
```

_Define preloaded/initial state_
```javascript
const module = Module.create({
  name: 'myModule',
  preloadedState: {
    something: 12345
  }
});
```

_Dispatch actions when the module is registered_
```javascript
const module = Module.create({
  postConfigure: store => {
    store.dispatch({ ... });
  }
});
```

_Enforce immutable state_
```javascript
const immutableModule = Module.create({...}).enforceImmutableState();
```

_Create a redux store with multiple modules_
```javascript
const store = Module.createStore(module1, module2);
```

## License
[MIT](LICENSE.md)