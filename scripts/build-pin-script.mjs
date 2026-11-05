// 배포 사이트에 넣는 핀 스크립트(`public/respec-pin.js`)를 만듭니다.
// 새 의존성 없이 이미 있는 `typescript`로 각 파일을 CommonJS로 바꾸고, 작은 require 함수와 함께 IIFE 하나로 묶습니다.
// 상대 경로 import만 따라갑니다. 사용법: `pnpm build:pin-script` (변경 여부만 확인: `--check`)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = join(ROOT, 'src/shared/lib/pin-script/entry.ts');
export const OUTPUT = join(ROOT, 'public/respec-pin.js');

const COMPILER_OPTIONS = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2017,
  newLine: ts.NewLineKind.LineFeed,
  removeComments: true,
  esModuleInterop: false,
};

const toPosix = (path) => path.split('\\').join('/');

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) {
    throw new Error(
      `${toPosix(relative(ROOT, fromFile))}: 상대 경로만 묶을 수 있어요 (${specifier})`,
    );
  }
  const base = resolve(dirname(fromFile), specifier);
  for (const candidate of [`${base}.ts`, join(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`${toPosix(relative(ROOT, fromFile))}: ${specifier}를 찾지 못했어요`);
}

/** 핀 스크립트 소스를 만듭니다. 파일은 쓰지 않습니다. */
export function buildPinScript() {
  const ids = new Map();
  const modules = [];

  const load = (file) => {
    if (ids.has(file)) return ids.get(file);
    const id = modules.length;
    ids.set(file, id);
    modules.push(null);

    const source = readFileSync(file, 'utf8');
    const { outputText, diagnostics } = ts.transpileModule(source, {
      compilerOptions: COMPILER_OPTIONS,
      fileName: file,
      reportDiagnostics: true,
    });
    if (diagnostics?.length) {
      throw new Error(ts.formatDiagnostics(diagnostics, ts.createCompilerHost({})));
    }
    const code = outputText
      .replace(
        /require\("([^"]+)"\)/g,
        (_, specifier) => `__require(${load(resolveImport(file, specifier))})`,
      )
      .trimEnd();
    modules[id] =
      `// ${toPosix(relative(ROOT, file))}\nfunction (module, exports, __require) {\n${code}\n}`;
    return id;
  };

  load(ENTRY);

  return `/*! respec-pin.js - RE:SPEC 핀 스크립트. scripts/build-pin-script.mjs로 만든 파일이라 직접 고치지 마세요. */
(function () {
  'use strict';
  var modules = [
${modules.join(',\n')}
  ];
  var cache = [];
  function __require(id) {
    if (cache[id]) return cache[id].exports;
    var module = (cache[id] = { exports: {} });
    modules[id](module, module.exports, __require);
    return module.exports;
  }
  __require(0);
})();
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = buildPinScript();
  if (process.argv.includes('--check')) {
    const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n') : '';
    if (current !== output) {
      console.error(
        'public/respec-pin.js가 최신이 아니에요. pnpm build:pin-script를 실행해 주세요.',
      );
      process.exit(1);
    }
  } else {
    writeFileSync(OUTPUT, output);
    console.log(`${toPosix(relative(ROOT, OUTPUT))} (${output.length} bytes)`);
  }
}
