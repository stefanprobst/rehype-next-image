import type { Plugin } from 'unified'
import type { Root } from 'hast'

export interface Options {
  publicFolder?: string
}

const withNextImage: Plugin<[Options?], Root>

export default withNextImage
