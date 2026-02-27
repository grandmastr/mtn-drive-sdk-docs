#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const docsRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sdkRoot = process.env.SDK_REPO_PATH
  ? path.resolve(process.env.SDK_REPO_PATH)
  : path.resolve(docsRoot, '../mtn-drive-sdk');

const docsMethodsHubFile = path.join(docsRoot, 'docs', 'rn-sdk-methods-reference.md');
const docsQuickstartFile = path.join(docsRoot, 'docs', 'quickstart-react-native.md');
const docsErrorsFile = path.join(docsRoot, 'docs', 'error-retry-matrix.md');

const methodDocFiles = [
  path.join(docsRoot, 'docs', 'rn-methods-sessions.md'),
  path.join(docsRoot, 'docs', 'rn-methods-drive.md'),
  path.join(docsRoot, 'docs', 'rn-methods-sharing.md'),
  path.join(docsRoot, 'docs', 'rn-methods-bin.md'),
  path.join(docsRoot, 'docs', 'rn-methods-photo-backup.md'),
  path.join(docsRoot, 'docs', 'rn-methods-storage.md'),
  path.join(docsRoot, 'docs', 'rn-methods-upload-manager.md'),
];

const pagesRequiringPrereqs = [
  docsQuickstartFile,
  path.join(docsRoot, 'docs', 'rn-interfaces.md'),
  docsMethodsHubFile,
  ...methodDocFiles,
  docsErrorsFile,
  path.join(docsRoot, 'docs', 'rn-troubleshooting.md'),
];

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
  '## 1) Install',
  '## 2) Configure',
  '## 3) Initialize',
  '## 4) Verify',
  '## 5) Next steps',
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
  '/docs/rn-methods-sessions',
  '/docs/rn-methods-drive',
  '/docs/rn-methods-sharing',
  '/docs/rn-methods-bin',
  '/docs/rn-methods-photo-backup',
  '/docs/rn-methods-storage',
  '/docs/rn-methods-upload-manager',
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
  const sourceFile = ts.createSourceFile(spec.file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

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

const collectUploadManagerMethod = () => {
  const file = path.join(sdkRoot, 'packages', 'react-native-sdk', 'src', 'upload-manager.ts');
  const source = read(file);
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const methods = [];

  const visit = (node) => {
    if (ts.isClassDeclaration(node) && node.name?.text === 'ReactNativePhotoBackupUploadManager') {
      for (const member of node.members) {
        if (!ts.isMethodDeclaration(member) || !member.name) continue;
        const methodName = member.name.getText(sourceFile);
        if (methodName !== 'backupAsset') continue;
        const params = member.parameters.map((param) => {
          const pName = param.name.getText(sourceFile);
          const optional = param.questionToken ? '?' : '';
          return `${pName}${optional}`;
        });
        methods.push(normalizeHeading(`photoBackupUploadManager.${methodName}(${params.join(', ')})`));
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return methods;
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

for (const file of [docsMethodsHubFile, docsQuickstartFile, docsErrorsFile, ...methodDocFiles]) {
  if (!fs.existsSync(file)) {
    fail(`Missing docs file: ${file}`);
  }
}

for (const file of pagesRequiringPrereqs) {
  if (!fs.existsSync(file)) {
    fail(`Missing required page for prerequisites check: ${file}`);
    continue;
  }
  const content = read(file);
  if (!content.includes('## Prerequisites')) {
    fail(`Missing prerequisites section: ${path.basename(file)}`);
  }
  if (!hasSubtitle(content)) {
    fail(`Missing subtitle sentence before first H2: ${path.basename(file)}`);
  }
}
ok('Prerequisites and subtitle checks passed.');

const expected = [
  ...moduleSpecs.flatMap(collectInterfaceMethods),
  ...collectUploadManagerMethod(),
].sort();

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
      fail(`Method \`${method}\` is missing subsection \`${subsection}\` in ${path.basename(file)}.`);
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
ok('Quickstart numbered flow check passed.');

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

const languageFiles = [
  docsMethodsHubFile,
  docsQuickstartFile,
  path.join(docsRoot, 'docs', 'rn-interfaces.md'),
  docsErrorsFile,
  ...methodDocFiles,
  path.join(docsRoot, 'docs', 'rn-troubleshooting.md'),
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
