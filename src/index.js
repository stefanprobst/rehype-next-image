// @ts-check

import * as path from 'path'
import { visit } from 'unist-util-visit'
import { isAbsoluteUrl } from '@stefanprobst/is-absolute-url'

/** @typedef {import('.').Options} Options */
/** @typedef {import('hast').Root} Root */
/** @typedef {import('hast').Parent} Parent */
/** @typedef {import('hast').Element} Element */

/** @type {import('unified').Plugin<[Options?], Root>} */
export default function attacher(options) {
  const publicFolder = options?.publicFolder ?? path.join(process.cwd(), 'public')

  /** @type {Transformer<Root>} */
  return function transformer(tree, file) {
    const imageImports = []
    const importedPaths = new Map()

    visit(tree, { type: 'element', tagName: 'img' }, onImage)

    tree.children.unshift(...imageImports)

    /** @type {(node: Element, index: number | null, parent: Parent | null) => void} */
    function onImage(node, index, parent) {
      if (parent == null || index == null) return

      let src = node.properties?.src
      if (typeof src !== 'string') return
      if (isAbsoluteUrl(src)) return
      if (path.isAbsolute(src)) {
        src = path.join(path.relative(file.dirname, publicFolder), src)
      } else if (!src.startsWith('.')) {
        src = './' + src
      }

      let identifier
      if (!importedPaths.has(src)) {
        identifier = '__Image__' + imageImports.length
        importedPaths.set(src, identifier)
        imageImports.push({
          type: 'mdxjsEsm',
          data: {
            estree: {
              type: 'Program',
              sourceType: 'module',
              body: [
                {
                  type: 'ImportDeclaration',
                  specifiers: [
                    {
                      type: 'ImportDefaultSpecifier',
                      local: { type: 'Identifier', name: identifier },
                    },
                  ],
                  source: {
                    type: 'Literal',
                    value: src,
                    raw: JSON.stringify(src),
                  },
                },
              ],
            },
          },
        })
      } else {
        identifier = importedPaths.get(src)
      }

      const { alt = '', title } = node.properties

      const image = {
        type: 'mdxJsxTextElement',
        name: 'Image',
        children: [],
        attributes: [
          { type: 'mdxJsxAttribute', name: 'alt', value: alt },
          {
            type: 'mdxJsxAttribute',
            name: 'src',
            value: {
              type: 'mdxJsxAttributeValueExpression',
              data: {
                estree: {
                  type: 'Program',
                  sourceType: 'module',
                  body: [
                    {
                      type: 'ExpressionStatement',
                      expression: { type: 'Identifier', name: identifier },
                    },
                  ],
                },
              },
            },
          },
        ],
      }

      if (typeof title === 'string' && title.length > 0) {
        image.attributes.push({
          type: 'mdxJsxAttribute',
          name: 'title',
          value: title,
        })
      }

      parent.children.splice(index, 1, image)
    }
  }
}
