#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const docsRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sdkRoot = process.env.SDK_REPO_PATH
  ? path.resolve(process.env.SDK_REPO_PATH)
  : path.resolve(docsRoot, '../mtn-drive-sdk');

const docsOverviewFile = path.join(docsRoot, 'sdk', 'overview.md');
const docsInstallFile = path.join(docsRoot, 'sdk', 'install-npm.md');
const docsMethodsHubFile = path.join(docsRoot, 'sdk', 'rn-sdk-methods-reference.md');
const docsQuickstartFile = path.join(docsRoot, 'sdk', 'quickstart-react-native.md');
const docsInterfacesFile = path.join(docsRoot, 'sdk', 'rn-interfaces.md');
const docsManagedUploadsFile = path.join(docsRoot, 'sdk', 'rn-methods-managed-uploads.md');
const docsTroubleshootingFile = path.join(docsRoot, 'sdk', 'rn-troubleshooting.md');
const docsErrorsFile = path.join(docsRoot, 'sdk', 'error-retry-matrix.md');
const docsReleaseFile = path.join(docsRoot, 'sdk', 'release-versioning.md');
const docsSidebarFile = path.join(docsRoot, 'sidebars-sdk.ts');

const methodDocFiles = [
  path.join(docsRoot, 'sdk', 'rn-methods-sessions.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-drive.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-sharing.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-bin.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-photo-backup.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-storage.md'),
  docsManagedUploadsFile,
];

const advancedMethodFiles = [
  path.join(docsRoot, 'sdk', 'rn-methods-sessions.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-drive.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-sharing.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-bin.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-photo-backup.md'),
  path.join(docsRoot, 'sdk', 'rn-methods-storage.md'),
];

const pagesRequiringSetupContext = [
  docsQuickstartFile,
  docsInterfacesFile,
  docsMethodsHubFile,
  ...methodDocFiles,
  docsErrorsFile,
  docsTroubleshootingFile,
];

const supportDocIds = ['common-recipes', 'concepts', 'glossary', 'faq'];

const moduleSpecs = [
  {
    file: path.join(sdkRoot, 'packages', 'sdk-core', 'src', 'modules', 'sessions.ts'),
    iface: 'SessionsModule',
    prefix: 'sessions',
  },
  {
    file: path.join(sdkRoot, 'packages', 'sdk-core', 'src', 'modules', 'drive.ts'),
    iface: 'DriveModule',
    prefix: 'drive',
  },
  {
    file: path.join(sdkRoot, 'packages', 'sdk-core', 'src', 'modules', 'sharing.ts'),
    iface: 'SharingModule',
    prefix: 'sharing',
  },
  {
    file: path.join(sdkRoot, 'packages', 'sdk-core', 'src', 'modules', 'bin.ts'),
    iface: 'BinModule',
    prefix: 'bin',
  },
  {
    file: path.join(sdkRoot, 'packages', 'sdk-core', 'src', 'modules', 'photo-backup.ts'),
    iface: 'PhotoBackupModule',
    prefix: 'photoBackup',
  },
  {
    file: path.join(sdkRoot, 'packages', 'sdk-core', 'src', 'modules', 'storage.ts'),
    iface: 'StorageModule',
    prefix: 'storage',
  },
  {
    file: path.join(sdkRoot, 'packages', 'react-native-sdk', 'src', 'types.ts'),
    iface: 'ManagedUploads',
    prefix: 'uploads',
  },
  {
    file: path.join(sdkRoot, 'packages', 'react-native-sdk', 'src', 'types.ts'),
    iface: 'UploadTask',
    prefix: 'uploadTask',
  },
];

const requiredMethodSections = [
  '#### What this method does',
  '#### When to call it',
  '#### Signature',
  '#### Request fields',
  '#### Response fields',
  '#### Errors and handling',
  '#### Minimal example',
];

const requiredQuickstartHeadings = [
  '## Before You Start',
  '## 1) Install',
  '## 2) Configure',
  '## 3) Initialize',
  '## 4) Verify',
  '## 5) Upload your first file',
  '## 6) Next steps',
];

const requiredErrorClasses = [
  'AuthExchangeError',
  'AuthError',
  'ValidationError',
  'ConflictError',
  'NotFoundError',
  'RateLimitError',
  'NetworkError',
  'SdkError',
];

const requiredHubLinks = [
  '/sdk/rn-methods-sessions',
  '/sdk/rn-methods-drive',
  '/sdk/rn-methods-sharing',
  '/sdk/rn-methods-bin',
  '/sdk/rn-methods-photo-backup',
  '/sdk/rn-methods-storage',
  '/sdk/rn-methods-managed-uploads',
];

const bannedPatterns = [
  /\bbackend\b/i,
  /\bendpoint\b/i,
  /implementation-defined/i,
  /implementation-specific/i,
  /intentionally documented as sdk-opaque/i,
];

const read = (p) => fs.readFileSync(p, 'utf8');

const normalizeHeading = (value) => value.trim().replace(/\s+/g, ' ');

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};

const ok = (message) => {
  console.log(`✓ ${message}`);
};

const collectInterfaceMethods = (spec) => {
  const source = read(spec.file);
  const sourceFile = ts.createSourceFile(
    spec.file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const results = [];

  const visit = (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === spec.iface) {
      for (const member of node.members) {
        if (!ts.isMethodSignature(member) || !member.name) continue;
        const methodName = member.name.getText(sourceFile);
        const params = member.parameters.map((param) => {
          const pName = param.name.getText(sourceFile);
          const optional = param.questionToken ? '?' : '';
          return `${pName}${optional}`;
        });
        results.push(normalizeHeading(`${spec.prefix}.${methodName}(${params.join(', ')})`));
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return results;
};

const parseMethodSections = (content) => {
  const matches = [...content.matchAll(/^#{3,4}\s+`([^`]+)`\s*$/gm)];
  const sections = [];

  for (let i = 0; i < matches.length; i += 1) {
    const heading = normalizeHeading(matches[i][1]);
    if (!/^[A-Za-z][A-Za-z0-9]*\.[A-Za-z0-9]+\([^)]*\)$/.test(heading)) continue;

    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    sections.push({ heading, section: content.slice(start, end) });
  }

  return sections;
};

const hasSubtitle = (content) => {
  const stripped = content.replace(/^---[\s\S]*?---\n?/, '').trim();
  const firstHeadingIndex = stripped.search(/^##\s+/m);
  if (firstHeadingIndex <= 0) return false;
  const intro = stripped.slice(0, firstHeadingIndex).trim();
  return intro.length > 0;
};

const requiredFiles = [
  docsOverviewFile,
  docsInstallFile,
  docsMethodsHubFile,
  docsQuickstartFile,
  docsInterfacesFile,
  docsManagedUploadsFile,
  docsTroubleshootingFile,
  docsErrorsFile,
  docsReleaseFile,
  docsSidebarFile,
  ...methodDocFiles,
  ...supportDocIds.map((docId) => path.join(docsRoot, 'sdk', `${docId}.md`)),
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    fail(`Missing docs file: ${file}`);
  }
}

for (const file of pagesRequiringSetupContext) {
  const content = read(file);
  if (!content.includes('## Prerequisites') && !content.includes('## Before You Start')) {
    fail(`Missing setup-context section: ${path.basename(file)}`);
  }
  if (!hasSubtitle(content)) {
    fail(`Missing subtitle sentence before first H2: ${path.basename(file)}`);
  }
}
ok('Setup-context and subtitle checks passed.');

const expected = moduleSpecs.flatMap(collectInterfaceMethods).sort();

const seen = new Map();
for (const file of methodDocFiles) {
  const content = read(file);
  const methodSections = parseMethodSections(content);
  for (const item of methodSections) {
    if (!seen.has(item.heading)) {
      seen.set(item.heading, []);
    }
    seen.get(item.heading).push({ file, section: item.section });
  }
}

const actual = [...seen.keys()].sort();
const missing = expected.filter((m) => !actual.includes(m));
const extra = actual.filter((m) => !expected.includes(m));

if (missing.length) {
  fail(`Missing method headings in module docs (${missing.length}):\n- ${missing.join('\n- ')}`);
}

if (extra.length) {
  fail(`Extra method headings not found in SDK interfaces (${extra.length}):\n- ${extra.join('\n- ')}`);
}

for (const method of actual) {
  const entries = seen.get(method) ?? [];
  if (entries.length !== 1) {
    fail(`Method must be documented exactly once: ${method} (found ${entries.length})`);
  }
}

if (!missing.length && !extra.length) {
  ok(`Method coverage matches SDK interfaces (${expected.length} methods).`);
}

for (const method of expected) {
  const entries = seen.get(method) ?? [];
  if (entries.length !== 1) continue;

  const { section, file } = entries[0];

  for (const subsection of requiredMethodSections) {
    if (!section.includes(subsection)) {
      fail(
        `Method \`${method}\` is missing subsection \`${subsection}\` in ${path.basename(file)}.`,
      );
    }
  }

  const methodName = method.split('(')[0].split('.').pop();
  const signatureMatch = /```ts([\s\S]*?)```/.exec(section);
  if (!signatureMatch) {
    fail(`Method \`${method}\` is missing TypeScript signature block.`);
  } else if (methodName && !signatureMatch[1].includes(methodName)) {
    fail(`Method \`${method}\` signature block does not include method name \`${methodName}\`.`);
  }

  if (!section.includes('| Field | Type | Required | Default | Format/Constraints | Meaning |')) {
    fail(`Method \`${method}\` is missing required request fields table header.`);
  }

  if (!section.includes('| Field | Type | Required/Conditional | Format/Constraints | Meaning |')) {
    fail(`Method \`${method}\` is missing required response fields table header.`);
  }
}
ok('Method template checks passed.');

const quickstartContent = read(docsQuickstartFile);
for (const heading of requiredQuickstartHeadings) {
  if (!quickstartContent.includes(heading)) {
    fail(`Quickstart is missing required heading: ${heading}`);
  }
}
if (!/How to verify this worked/i.test(quickstartContent)) {
  fail('Quickstart is missing a "How to verify this worked" checkpoint.');
}
ok('Quickstart numbered flow check passed.');

const overviewContent = read(docsOverviewFile);
if (!/Start here/i.test(overviewContent)) {
  fail('Overview is missing a start-path section.');
}
if (!/first upload/i.test(overviewContent)) {
  fail('Overview is missing a first-upload section.');
}
ok('Overview onboarding check passed.');

const interfacesContent = read(docsInterfacesFile);
if (!/Do I need this page\?/i.test(interfacesContent)) {
  fail('React Native Required Interfaces is missing a "Do I need this page?" section.');
}
ok('Interfaces framing check passed.');

const managedUploadsContent = read(docsManagedUploadsFile);
if (!/Most common tasks/i.test(managedUploadsContent)) {
  fail('Managed uploads page is missing a "Most common tasks" jump list.');
}
ok('Managed uploads framing check passed.');

const errorContent = read(docsErrorsFile);
for (const errorName of requiredErrorClasses) {
  if (!errorContent.includes(errorName)) {
    fail(`Error playbook is missing SDK error class: ${errorName}`);
  }
}
ok('Error playbook class coverage check passed.');

const hubContent = read(docsMethodsHubFile);
for (const link of requiredHubLinks) {
  if (!hubContent.includes(link)) {
    fail(`Methods hub is missing required module link: ${link}`);
  }
}
ok('Methods hub link check passed.');

const installContent = read(docsInstallFile);
const releaseContent = read(docsReleaseFile);
if (installContent.includes('1.0.0') || releaseContent.includes('1.0.0')) {
  fail('Stale hardcoded 1.0.0 version text found in install or release docs.');
}
ok('Release metadata check passed.');

for (const file of advancedMethodFiles) {
  const content = read(file);
  if (!/Advanced page/i.test(content)) {
    fail(`${path.basename(file)} is missing advanced framing.`);
  }
}
ok('Advanced-page framing check passed.');

const sidebarContent = read(docsSidebarFile);
for (const docId of supportDocIds) {
  if (!sidebarContent.includes(`'${docId}'`)) {
    fail(`Sidebar is missing required support doc: ${docId}`);
  }
}
ok('Support-doc sidebar check passed.');

const languageFiles = [
  docsOverviewFile,
  docsMethodsHubFile,
  docsQuickstartFile,
  docsInterfacesFile,
  docsErrorsFile,
  ...methodDocFiles,
  docsTroubleshootingFile,
];

for (const file of languageFiles) {
  const content = read(file);
  for (const pattern of bannedPatterns) {
    if (pattern.test(content)) {
      fail(`Banned language pattern ${pattern} found in ${path.basename(file)}.`);
    }
  }
}
ok('Language guardrail checks passed.');

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

ok('RN docs conformance checks passed.');
