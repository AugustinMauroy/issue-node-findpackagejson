> [!NOTE]
> fix in [nodejs/node#56382](https://github.com/nodejs/node/pull/56382) and release in [v23.6.0](https://nodejs.org/en/blog/release/v23.6.0)

#  issue with nodejs `module.findPackageJSON` function

Run code:

```bash
node --run start
```

Output:

```
TypeError: The "path" argument must be of type string or an instance of URL. Received undefined
````

The expected output is that the test pass.
