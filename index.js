const { name } = require('./package.json')
const { join, dirname } = require('path')
const { renderSync } = require('node-sass')
const csstree = require('css-tree')

module.exports = function myExample () {
  return {
    name,
    // always consider the importer as source of truth for resolving
    resolveId (source, importer) {
      if (source.match(/.*\.scss/)) {
        const path = join(dirname(importer), source)
        return path
      }
      return null
    },
    // most things happen here
    async transform (code, id) {
      // if matches scss:
      if (id.match(/.*\.scss/)) {
        // compiles sass sync
        // the importer is used to try and guess better what to include
        // might be still buggy
        const compiled = await renderSync({
          data: code,
          includePaths: [process.cwd()],
          importer: function (url, prev, done) {
            // assume ~ is for process.cwd()/node_modules
            if (url.match(/^~.*/)) {
              const dep = url.replace(/~/, './node_modules/')
              const file = join(process.cwd(), dep)
              return { file }
            }
            // stdin is passed directly by rollup
            // falling back to the original id passed by the transform
            if (prev === 'stdin') {
              const file = join(dirname(id), url)
              return { file }
            }
          }
        })
        // get css
        const css = compiled.css.toString()
        // p.o.c. generate unique id
        const ast = csstree.parse(css)
        const map = {}
        // simple walk and replace
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
        // ugly but fastes way to escape quotes
        return 'export default {\nraw: `' + csstree.generate(ast) + '`,\nmap:' + JSON.stringify(map) + '}'
      }
    }
  }
}
