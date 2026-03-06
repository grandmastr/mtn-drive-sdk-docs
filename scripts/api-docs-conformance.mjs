#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const docsRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const apiOverviewFile = path.join(docsRoot, 'api', 'overview.md');
const apiAuthenticationFile = path.join(docsRoot, 'api', 'authentication.md');
const apiDriveFile = path.join(docsRoot, 'api', 'drive.md');
const apiPhotoBackupFile = path.join(docsRoot, 'api', 'photo-backup.md');
const apiManagedUploadsFile = path.join(docsRoot, 'api', 'managed-uploads.md');
const apiAuthReferenceFile = path.join(docsRoot, 'api', 'api-reference-authentication.md');
const apiDriveReferenceFile = path.join(docsRoot, 'api', 'api-reference-drive.md');
const apiPhotoBackupReferenceFile = path.join(docsRoot, 'api', 'api-reference-photo-backup.md');
const apiManagedReferenceFile = path.join(docsRoot, 'api', 'api-reference-managed-uploads.md');
const apiSidebarFile = path.join(docsRoot, 'sidebars-api.ts');
const homePageFile = path.join(docsRoot, 'src', 'pages', 'index.tsx');

const requiredFiles = [
  apiOverviewFile,
  apiAuthenticationFile,
  apiDriveFile,
  apiPhotoBackupFile,
  apiManagedUploadsFile,
  apiAuthReferenceFile,
  apiDriveReferenceFile,
  apiPhotoBackupReferenceFile,
  apiManagedReferenceFile,
  apiSidebarFile,
  homePageFile,
];

const referenceFiles = [
  apiAuthReferenceFile,
  apiDriveReferenceFile,
  apiPhotoBackupReferenceFile,
  apiManagedReferenceFile,
];

const requiredReferenceSections = [
  '#### What this endpoint does',
  '#### When to call it',
  '#### Headers',
  '#### Request body / params',
  '#### Response body',
  '#### Errors and handling',
  '#### Minimal curl example',
];

const requiredAuthEndpoints = [
  'POST /auth/token-exchange',
  'POST /auth/refresh',
  'POST /auth/logout',
];

const requiredManagedUploadEndpoints = [
  'POST /v2/uploads/sessions',
  'GET /v2/uploads/sessions/:sessionId',
  'POST /v2/uploads/sessions/:sessionId/refresh',
  'POST /v2/uploads/sessions/:sessionId/parts/:partNumber/confirm',
  'POST /v2/uploads/sessions/:sessionId/reconcile',
  'POST /v2/uploads/sessions/:sessionId/complete',
  'POST /v2/uploads/sessions/:sessionId/cancel',
];

const requiredDriveEndpoints = [
  'GET /drive/items',
  'GET /drive/search',
  'GET /drive/stats',
  'POST /drive/folders',
  'GET /drive/items/:id/download-url',
  'GET /drive/items/:id/metadata',
  'PATCH /drive/items/:id',
  'DELETE /drive/items/:id',
  'GET /drive/trash',
  'POST /drive/trash/:id/restore',
];

const requiredPhotoBackupEndpoints = [
  'POST /v1/devices/register',
  'GET /v1/media',
  'GET /v1/media/:mediaAssetId',
  'POST /v1/media/:mediaAssetId/download-url',
  'POST /v1/media/:mediaAssetId/thumbnail-url',
  'POST /v1/media/:mediaAssetId/requeue-thumbnails',
  'DELETE /v1/media/:mediaAssetId',
];

const read = (target) => fs.readFileSync(target, 'utf8');

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};

const ok = (message) => {
  console.log(`✓ ${message}`);
};

const hasSubtitle = (content) => {
  const stripped = content.replace(/^---[\s\S]*?---\n?/, '').trim();
  const firstHeadingIndex = stripped.search(/^##\s+/m);
  if (firstHeadingIndex <= 0) return false;
  return stripped.slice(0, firstHeadingIndex).trim().length > 0;
};

const parseEndpointSections = (content) => {
  const matches = [...content.matchAll(/^###\s+([A-Z]+ \/[^\n]+)$/gm)];
  const sections = [];

  for (let index = 0; index < matches.length; index += 1) {
    const heading = matches[index][1].trim();
    const start = matches[index].index + matches[index][0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : content.length;
    sections.push({ heading, section: content.slice(start, end) });
  }

  return sections;
};

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    fail(`Missing required API docs file: ${file}`);
  }
}

for (const file of [
  apiOverviewFile,
  apiAuthenticationFile,
  apiDriveFile,
  apiPhotoBackupFile,
  apiManagedUploadsFile,
]) {
  const content = read(file);
  if (!hasSubtitle(content)) {
    fail(`Missing subtitle before first H2: ${path.basename(file)}`);
  }
  if (!content.includes('## Before You Start') && !content.includes('## Prerequisites')) {
    fail(`Missing setup-context section: ${path.basename(file)}`);
  }
}
ok('API guide framing checks passed.');

const homePageContent = read(homePageFile);
for (const route of ['/sdk/overview', '/api/overview', '/api/drive', '/api/photo-backup']) {
  if (!homePageContent.includes(route)) {
    fail(`Homepage is missing route link: ${route}`);
  }
}
ok('Homepage split-links check passed.');

const apiSidebarContent = read(apiSidebarFile);
for (const docId of [
  'overview',
  'authentication',
  'drive',
  'photo-backup',
  'managed-uploads',
  'api-reference-authentication',
  'api-reference-drive',
  'api-reference-photo-backup',
  'api-reference-managed-uploads',
]) {
  if (!apiSidebarContent.includes(`'${docId}'`)) {
    fail(`API sidebar is missing doc id: ${docId}`);
  }
}
ok('API sidebar coverage check passed.');

const authConceptContent = read(apiAuthenticationFile);
for (const required of [
  '/auth/token-exchange',
  '/auth/exchange',
  '/auth/refresh',
  '/auth/logout',
  'Authorization: Bearer',
]) {
  if (!authConceptContent.includes(required)) {
    fail(`Authentication guide is missing required auth detail: ${required}`);
  }
}
if (!/How to verify this worked/i.test(authConceptContent)) {
  fail('Authentication guide is missing a verification checkpoint.');
}
ok('Authentication guide content checks passed.');

const driveGuideContent = read(apiDriveFile);
for (const required of [
  '/drive/items',
  '/drive/search',
  '/drive/folders',
  '/drive/items/:id/download-url',
  '/drive/items/:id/metadata',
  '/drive/trash',
  '/v2/uploads',
  '/drive/upload-sessions',
]) {
  if (!driveGuideContent.includes(required)) {
    fail(`Drive guide is missing required detail: ${required}`);
  }
}
if (!/How to verify this worked/i.test(driveGuideContent)) {
  fail('Drive guide is missing a verification checkpoint.');
}
ok('Drive guide content checks passed.');

const photoBackupGuideContent = read(apiPhotoBackupFile);
for (const required of [
  '/v1/devices/register',
  '/v1/media',
  '/v1/media/:mediaAssetId/download-url',
  '/v1/media/:mediaAssetId/thumbnail-url',
  'x-device-id',
  '/v2/uploads',
  '/v1/uploads',
]) {
  if (!photoBackupGuideContent.includes(required)) {
    fail(`Photo backup guide is missing required detail: ${required}`);
  }
}
if (!/How to verify this worked/i.test(photoBackupGuideContent)) {
  fail('Photo backup guide is missing a verification checkpoint.');
}
ok('Photo backup guide content checks passed.');

const managedUploadsContent = read(apiManagedUploadsFile);
for (const required of [
  'deduped',
  'single',
  'multipart',
  'drive',
  'photo_backup',
  'x-device-id',
  '/v2/uploads',
]) {
  if (!managedUploadsContent.includes(required)) {
    fail(`Managed uploads guide is missing required detail: ${required}`);
  }
}
if (!/How to verify this worked/i.test(managedUploadsContent)) {
  fail('Managed uploads guide is missing a verification checkpoint.');
}
ok('Managed uploads guide content checks passed.');

const authSections = parseEndpointSections(read(apiAuthReferenceFile));
const authHeadings = authSections.map((entry) => entry.heading);
for (const endpoint of requiredAuthEndpoints) {
  if (!authHeadings.includes(endpoint)) {
    fail(`Missing auth endpoint section: ${endpoint}`);
  }
}

const managedSections = parseEndpointSections(read(apiManagedReferenceFile));
const managedHeadings = managedSections.map((entry) => entry.heading);
for (const endpoint of requiredManagedUploadEndpoints) {
  if (!managedHeadings.includes(endpoint)) {
    fail(`Missing managed upload endpoint section: ${endpoint}`);
  }
}

const driveSections = parseEndpointSections(read(apiDriveReferenceFile));
const driveHeadings = driveSections.map((entry) => entry.heading);
for (const endpoint of requiredDriveEndpoints) {
  if (!driveHeadings.includes(endpoint)) {
    fail(`Missing drive endpoint section: ${endpoint}`);
  }
}

const photoBackupSections = parseEndpointSections(read(apiPhotoBackupReferenceFile));
const photoBackupHeadings = photoBackupSections.map((entry) => entry.heading);
for (const endpoint of requiredPhotoBackupEndpoints) {
  if (!photoBackupHeadings.includes(endpoint)) {
    fail(`Missing photo backup endpoint section: ${endpoint}`);
  }
}

for (const file of referenceFiles) {
  for (const entry of parseEndpointSections(read(file))) {
    for (const sectionHeading of requiredReferenceSections) {
      if (!entry.section.includes(sectionHeading)) {
        fail(
          `Endpoint \`${entry.heading}\` is missing subsection \`${sectionHeading}\` in ${path.basename(file)}.`,
        );
      }
    }
    if (!entry.section.includes('```bash')) {
      fail(`Endpoint \`${entry.heading}\` is missing a curl code block.`);
    }
  }
}
ok('API reference template checks passed.');

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

ok('API docs conformance checks passed.');
