# typle-core

Programmatic way of scanning `package.json` for missing __@types__ libraries.\
You probably want to use [typle](https://npm.im/typle) instead.

## API

This package exports a few functions that can help you find libraries with missing types.

#### `filterTypes(pkg, cwd?)`

Filter libraries that don't have types built-in or types installed.

```ts
function filterTypes(pkg: PackageJson, cwd?: string): Promise<{
    name: string;
    version: string | undefined;
}[]>;
```

#### `hasOwnTypes(lib, cwd?)`

Does a library provide built-in type definitions.\
Note that it has to be installed locally first.

```ts
function hasOwnTypes(lib: string, cwd?: string): Promise<boolean>;
```

#### `fetchPackage(lib)`

Fetch package [Packument](https://npm.im/@npm/types#types) in NPM registry.\
Returns `undefined` if it was not found.

```ts
function fetchPackage(lib: string): Promise<Packument | undefined>;
```

## License

MIT 💖