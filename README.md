# Fourst

Fourst (Fourier Stencil Generator) is a project developed ANONYMIZED. Fourst is deployable as a web application, and is hosted at ANONYMIZED. It has been tested with many platforms, and relies only on a modern web browser with a modern JavaScript engine and [WASM](https://webassembly.org/) support.

## Building

You should install the [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html). Before you run any commands below, you'll probably have to activate it:

```shell
$ source "/path/to/emsdk/emsdk_env.sh"
```

(replacing `/path/to` with the path to your Emscripten SDK)

Now, to build everything, run:

```shell
$ make
```

## Running

Upon using the `make` command, a static webpage will be created in the `web/` folder. You can host this site as you would any other static site -- for example, `python3 -m http.server` in the `web/` folder.
