import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const dir = new URL('../public/icons/', import.meta.url)
const svg = readFileSync(new URL('icon.svg', dir))
const masked = readFileSync(new URL('icon-maskable.svg', dir))

const sizes = [192, 256, 384, 512]
await Promise.all(
  sizes.map((s) =>
    sharp(svg, { density: 384 })
      .resize(s, s)
      .png()
      .toFile(new URL(`icon-${s}.png`, dir).pathname.replace(/^\//, ''))
  )
)
await sharp(masked, { density: 384 })
  .resize(512, 512)
  .png()
  .toFile(new URL('icon-maskable-512.png', dir).pathname.replace(/^\//, ''))

console.log('icons written:', [...sizes.map((s) => `icon-${s}.png`), 'icon-maskable-512.png'].join(', '))
