const { name } = require('./package.json')
const { join, dirname } = require('path')
const { renderSync } = require('node-sass')
const csstree = require('css-tree')

module.exports = function myExample () {
  return {
    name,
    async transform (code, id) {
      if (id.match(/.*\.scss/)) {
        const compiled = await renderSync({
          data: code,
          includePaths: [process.cwd()],
          importer: function (url, prev, done) {
            if (url.match(/^~.*/)) {
              const dep = url.replace(/~/, './node_modules/')
              const file = join(process.cwd(), dep)
              return { file }
            }
            if (prev === 'stdin') {
              const file = join(dirname(id), url)
              return { file }
            }
          }
        })
        const css = compiled.css.toString()
        const ast = csstree.parse(css)
        const map = {}
        csstree.walk(ast, function (node) {
          if (node.type === 'ClassSelector') {
            // do replace
            const id = Math.random().toString(36).substring(7)
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
        // ninja css string escaping
        return 'export default {\nraw: `' + csstree.generate(ast) + '`,\nmap:' + JSON.stringify(map) + '}'
      }
    },
    resolveId (source, importer) {
      if (source.match(/.*\.scss/)) {
        const path = join(dirname(importer), source)
        return path
      }
      return null
    }
  }
}
