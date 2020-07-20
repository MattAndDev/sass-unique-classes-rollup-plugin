const { renderSync } = require('node-sass')
const postcss = require('postcss')
const csstree = require('css-tree')
const { join, dirname, basename } = require('path')
const { existsSync } = require('fs')

const prefixAndMinify = async (postcssPlugins, css) => {
  const res = await postcss(postcssPlugins).process(css).then(result => {
    result.warnings().forEach(warn => {
      console.warn(warn.toString())
    })
    return result.css
  })
  return res
}

const addExtname = (path) => path.match('.s(a|c)ss$') ? path : `${path}.scss`

const compileSassSync = async (sass = '', source) => {
  const compiled = await renderSync({
    data: sass,
    importer: function (url, prev, done) {
      let resolved = ''
      if (url.match(/^~.*/)) {
        resolved = join(process.cwd(), url.replace(/~/, './node_modules/'))
        resolved = addExtname(resolved)
        if (existsSync(resolved)) return { file: resolved }
      }
      if (prev === 'stdin') {
        resolved = addExtname(join(dirname(source), url))
        if (existsSync(resolved)) return { file: resolved }
        resolved = addExtname(join(dirname(source), '_' + url))
        if (existsSync(resolved)) return { file: resolved }
        resolved = addExtname(join(dirname(source), dirname(url), `_${basename(url)}`))
        if (existsSync(resolved)) return { file: resolved }
      }
    }
  })
  return compiled.css.toString()
}

const cache = {}

const createUniqueClassNames = async (css, uniqueFn) => {
  const ast = csstree.parse(css)
  const map = {}
  // simple walk and replace
  csstree.walk(ast, function (node) {
    if (node.type === 'ClassSelector') {
      const name = node.name
      const id = uniqueFn(node.name)
      if (cache[name]) {
        node.name = cache[name]
        map[name] = cache[name]
      }
      if (!map[name] && !cache[name]) {
        map[name] = id
        cache[name] = id
        node.name = id
      }
    }
  })
  const raw = await csstree.generate(ast)
  return { map, raw }
}

module.exports = {
  prefixAndMinify,
  createUniqueClassNames,
  compileSassSync
}
