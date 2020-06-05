# Recoil

[![Node.js CI](https://github.com/facebookexperimental/Recoil/workflows/Node.js%20CI/badge.svg)](https://github.com/facebookexperimental/Recoil/actions)

Recoil is an experimental set of utilities for state management with React.

Recoil lets you create a data-flow graph that flows from atoms (shared state) through selectors (pure functions) and down into your React components. Atoms are units of state that components can subscribe to. Selectors transform this state either synchronously or asynchronously.

## Installation

The Recoil package lives in <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>. To install the latest stable version, run the following command:

```shell
npm install recoil
```

Or if you're using  <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>:

```shell
yarn add recoil
```

## Documentation

You can find the Recoil documentation [on the website](https://recoiljs.org/docs/introduction/installation/).  

Check out the [Core Concepts](https://recoiljs.org/docs/introduction/core-concepts) page for a quick overview.

The documentation is divided into several sections:

* Introduction
* Basic Tutorial
   - [Intro](https://recoiljs.org/docs/basic-tutorial/intro)
   - [Atoms](https://recoiljs.org/docs/basic-tutorial/atoms)
   - [Selectors](https://recoiljs.org/docs/basic-tutorial/selectors)
* Guides  
   - [Asynchronous Data Queries](https://recoiljs.org/docs/guides/asynchronous-data-queries)  
   - [Asynchronous State Sync](https://recoiljs.org/docs/guides/asynchronous-state-sync)  
   - [State Persistence](https://recoiljs.org/docs/guides/persistence)
* API Reference



## Contributing

The main purpose of this repository is to continue to evolve Recoil, making it faster and easier to use.  Read below to learn how you can take part in improving Recoil.

### [Code of Conduct](./CODE_OF_CONDUCT.md)

 Please read our [code of conduct](./CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

### [Contributing Guide](./CONTRIBUTING.md)

Read our [contributing guide](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to Recoil.


### License

Recoil is [MIT licensed](./LICENSE).

