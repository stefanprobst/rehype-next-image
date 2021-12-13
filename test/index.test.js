import { fileURLToPath } from 'url'
import { compile } from '@mdx-js/mdx'
import { VFile } from 'vfile'
import { test } from 'uvu'
import * as assert from 'uvu/assert'
import withNextImage from '../src/index.js'

const toJs = (doc, options) =>
  compile(doc, {
    jsx: true,
    rehypePlugins: [[withNextImage, options]],
  })

test('add image import and Image jsx element', async () => {
  const doc = new VFile({
    value: `![Test](./__fixtures__/test.svg)`,
    path: fileURLToPath(import.meta.url),
  })

  const file = await toJs(doc)

  assert.match(String(file), `import __Image__0 from "./__fixtures__/test.svg"`)
  assert.match(String(file), `<Image alt="Test" src={__Image__0} />`)
})

test('handles multiple images', async () => {
  const doc = new VFile({
    value: `![Test](./__fixtures__/test.svg) ![Test2](./__fixtures__/test2.svg)`,
    path: fileURLToPath(import.meta.url),
  })

  const file = await toJs(doc)

  assert.match(String(file), `import __Image__0 from "./__fixtures__/test.svg"`)
  assert.match(String(file), `import __Image__1 from "./__fixtures__/test2.svg"`)
  assert.match(String(file), `<Image alt="Test" src={__Image__0} />`)
  assert.match(String(file), `<Image alt="Test2" src={__Image__1} />`)
})

test('does not import duplicate images more than once', async () => {
  const doc = new VFile({
    value: `![Test](./__fixtures__/test.svg) ![Test2](./__fixtures__/test.svg)`,
    path: fileURLToPath(import.meta.url),
  })

  const file = await toJs(doc)

  assert.match(String(file), `import __Image__0 from "./__fixtures__/test.svg"`)
  assert.not.match(String(file), `import __Image__1`)
  assert.match(String(file), `<Image alt="Test" src={__Image__0} />`)
  assert.match(String(file), `<Image alt="Test2" src={__Image__0} />`)
})

test('handles relative image paths without leading "./"', async () => {
  const doc = new VFile({
    value: `![Test](__fixtures__/test.svg)`,
    path: fileURLToPath(import.meta.url),
  })

  const file = await toJs(doc)

  assert.match(String(file), `import __Image__0 from "./__fixtures__/test.svg"`)
  assert.match(String(file), `<Image alt="Test" src={__Image__0} />`)
})

test('uses public folder for absolute image paths', async () => {
  const doc = new VFile({
    value: `![Test](/test.svg)`,
    path: fileURLToPath(import.meta.url),
  })

  const file = await toJs(doc)

  assert.match(String(file), `import __Image__0 from "../public/test.svg"`)
  assert.match(String(file), `<Image alt="Test" src={__Image__0} />`)
})

test('skips url in image path', async () => {
  const doc = new VFile({
    value: `![Test](https://example.com/test.svg)`,
    path: fileURLToPath(import.meta.url),
  })

  const file = await toJs(doc)

  assert.not.match(String(file), `import __Image__0`)
  assert.match(String(file), `<_components.img src="https://example.com/test.svg" alt="Test" />`)
})

test.run()
