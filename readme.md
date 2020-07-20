# sass-unique-classes-rollup-plugin

This plugin is entirely focused on doing exactly three things:

- compiles `.s(c|a)ss)` imports
- create unique class names
- run postcss  plugins

it will always export an object with two properties:

`raw` the compiled, transformed, minimized source
`map` object where keys are original classNames, values the unique ids


## options

### `generateUniqueName`

Function to manipulate css classes after compilation for unique css-module-alike name mapping. 

### `prependData`

String, pre-pended to every scss file compiled  

### `postcssPlugins`

Array, array of plugins  to  be passed to postcss