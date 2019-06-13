const { renderSync } = require('node-sass')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const postcss = require('postcss')
const csstree = require('css-tree')
const { join, dirname } = require('path')
const { existsSync } = require('fs')
const crypto = require('crypto')

const prefixAndMinify = async (css) => {
  const res = await postcss([ autoprefixer, cssnano ]).process(css).then(result => {
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
      }
    }
  })
  return compiled.css.toString()
}

const createUniqueClassNames = async (css) => {
  const ast = csstree.parse(css)
  const map = {}
  // simple walk and replace
  csstree.walk(ast, function (node) {
    if (node.type === 'ClassSelector') {
      // do replace
      const id = String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
        crypto.randomBytes(3).toString('hex')
      const name = node.name
      if (map[name]) {
        node.name = id
      }
      if (!map[name]) {
        map[node.name] = id
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
