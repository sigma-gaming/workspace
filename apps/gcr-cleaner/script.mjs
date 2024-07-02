import { ArtifactRegistryClient } from '@google-cloud/artifact-registry'
import semver from 'semver'
import 'zx/globals'

const REQUESTS_PER_MINUTE = 30
const GCLOUD_PROJECT_ID = process.env.GCLOUD_PROJECT_ID
const GCLOUD_REGISTRY_REGION = process.env.GCLOUD_REGISTRY_REGION
const GCLOUD_SERVICE_ACCOUNT_KEY = process.env.GCLOUD_SERVICE_ACCOUNT_KEY
const AUTH_KEYS = JSON.parse(GCLOUD_SERVICE_ACCOUNT_KEY)

const client = new ArtifactRegistryClient({
  credentials: AUTH_KEYS
})

const images = await client.listDockerImages({
  parent: `projects/${GCLOUD_PROJECT_ID}/locations/${GCLOUD_REGISTRY_REGION}/repositories/docker`
})

const entries = []
const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)

for (const image of images) {
  if (!image) continue

  for (const tag of image) {
    if (!tag) continue

    const path = tag.uri.split('@')[0]
    const uploadedAt = new Date(Number(tag.uploadTime.seconds) * 1000)

    const isLatest = tag.tags.includes('latest')
    const hasVersion = tag.tags.some(tag => Boolean(semver.valid(tag)))
    const isDev = tag.tags.some(tag => tag.startsWith('dev-'))

    if (isLatest) continue

    entries.push({
      path,
      name: tag.name,
      url: tag.uri,
      uploadedAt,
      tags: tag.tags,
      hasVersion,
      isLatest,
      isDev,
    })
  }
}

/*
 * Recently uploaded images first
 */
entries.sort((a, b) => b.uploadedAt - a.uploadedAt)

const exceptions = new Set()

const semverCountByPath = {}
const devCountByPath = {}

for (const entry of entries) {
  /*
   * Always keep the latest image
   */
  if (entry.isLatest) {
    exceptions.add(entry)
    continue
  }

  /**
   * Keep recently uploaded images
   */
  if (entry.uploadedAt > sixHoursAgo) {
    exceptions.add(entry)
    continue
  }

  const semverCount = semverCountByPath[entry.path] || 0
  const devCount = devCountByPath[entry.path] || 0

  /*
   * Keep the latest 2 semver tags of each image
   */
  if (semverCount < 2) {
    semverCountByPath[entry.path] = semverCount + 1
    exceptions.add(entry)
    continue
  }

  /*
   * Keep the latest 2 dev tags of each image
   */
  if (devCount < 2) {
    devCountByPath[entry.path] = devCount + 1
    exceptions.add(entry)
  }
}

fs.writeFileSync('./key.json', GCLOUD_SERVICE_ACCOUNT_KEY)
await $`gcloud auth activate-service-account ${AUTH_KEYS.client_email} --key-file=./key.json`

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

for (const entry of entries) {
  if (exceptions.has(entry)) continue
  await $`gcloud artifacts docker images delete ${entry.url} --async --delete-tags --quiet`
  await sleep(60 / REQUESTS_PER_MINUTE * 1000)
}

// Exit with success
process.exit(0)