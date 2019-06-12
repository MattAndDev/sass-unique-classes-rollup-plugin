# sass-unique-classes-rollup-plugin

This plugin is entirely focused on doing exactly three things:

- compiles `.s(c|a)ss)` imports
- create unique class names
- run autoprefixer & minifier

it will always export an object with two properties:

`raw` the compiled, transformed, minimized source
`map` object where keys are original classNames, values the unique ids
