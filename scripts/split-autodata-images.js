#!/usr/bin/env node

/**
 * Splits the monolithic autodata-images.json (~4.5 MB) into per-brand files
 * under public/data/images/{brand-slug}.json (~50-100 KB each).
 *
 * Run: node scripts/split-autodata-images.js
 */

const fs = require('fs')
const path = require('path')

const INPUT = path.join(__dirname, '..', 'public', 'data', 'autodata-images.json')
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'images')

function slugify(brand) {
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error('ERROR: autodata-images.json not found at', INPUT)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
  console.log(`Read ${data.length} entries from autodata-images.json`)

  // Group by brand slug (merges case variations like "Audi" and "AUDI")
  const bySlug = new Map()
  for (const entry of data) {
    const slug = slugify(entry.brand)
    if (!bySlug.has(slug)) bySlug.set(slug, [])
    bySlug.get(slug).push(entry)
  }

  console.log(`Found ${bySlug.size} unique brand slugs`)

  // Ensure output dir exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Write per-brand files
  let totalSize = 0
  for (const [slug, entries] of bySlug) {
    const outPath = path.join(OUTPUT_DIR, `${slug}.json`)
    const json = JSON.stringify(entries)
    fs.writeFileSync(outPath, json)
    totalSize += json.length
    if (entries.length > 50) {
      console.log(`  ${slug}.json: ${entries.length} entries (${(json.length / 1024).toFixed(1)} KB)`)
    }
  }

  console.log(`\nDone! ${bySlug.size} brand files written to public/data/images/`)
  console.log(`Total size: ${(totalSize / 1024).toFixed(0)} KB (was ${(fs.statSync(INPUT).size / 1024 / 1024).toFixed(1)} MB)`)
}

main()
