import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

mkdirSync(join(root, 'public/icons'), { recursive: true })

const svg = readFileSync(join(root, 'public/icons/icon.svg'))

const sizes = [
  { name: 'icon-192.png',        size: 192 },
  { name: 'icon-512.png',        size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  const out = join(root, 'public/icons', name)
  await sharp(svg).resize(size, size).png().toFile(out)
  console.log(`✓ ${name} (${size}×${size})`)
}

console.log('Done.')
