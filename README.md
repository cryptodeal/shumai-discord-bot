# Shumai discord bot

Official serverless discord bot for [shumai](https://github.com/facebookresearch/shumai) [discord server](https://discord.gg/ZYxe8dQE)

## Contributing tags

To create a new tag, you need to fork this repository and edit `tags.toml` file

Format:

```toml
[example-tag]
keywords = ["example", "tag"]
content = """
I love bun ❤️
"""
```

Informations:

- The bot uses interactions so you can use emoji from all discord servers. However, please only use ours as we can't control the others.
- You can use hyperlink `[bun.sh](<https://bun.sh>)`
- Keywords need to include the tag name
- Use `+++` for codeblock (https://canary.discord.com/channels/876711213126520882/887787428973281300/997045766411530281)

## Building FFI Bindings

FFI uses CGo, which provides the flexibility of a GC lang like Go, w access to C generated code. This + bun is really easy to work with imo.

To build the bindings, from root dir, run:

```sh
go build --buildmode c-shared -o ./src/utils/ffi/goTwi.dylib ./src/utils/ffi/goTwi.go
```

To run the FFI Twitter streams demo that currently segfaults, run the following:

```sh
bun examples/twitter.ts
```

(The ptr callback has to be called from the inlined `C` function as `CGo` doesn't support executing `C` ptr functions, necessitating the workaround)
