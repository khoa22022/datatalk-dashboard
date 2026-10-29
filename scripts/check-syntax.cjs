const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let files = 0; const diagnostics = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['node_modules','.next','.git','public'].includes(entry.name)) continue;
    const filename = path.join(dir,entry.name);
    if (entry.isDirectory()) { walk(filename); continue; }
    if (!/\.(ts|tsx|mts)$/.test(filename) || /\.d\.(ts|mts)$/.test(filename)) continue;
    files++;
    const source = fs.readFileSync(filename,'utf8');
    const parsed = ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,filename.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    diagnostics.push(...parsed.parseDiagnostics.map(d=>({file:path.relative(root,filename),message:ts.flattenDiagnosticMessageText(d.messageText,' '),position:d.start})));
    for (const item of parsed.statements) {
      if (!ts.isImportDeclaration(item) || !ts.isStringLiteral(item.moduleSpecifier)) continue;
      const spec = item.moduleSpecifier.text;
      if (!(spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('@/'))) continue;
      const target = spec.startsWith('@/')?path.join(root,spec.slice(2)):path.resolve(path.dirname(filename),spec);
      if (![target,...['.ts','.tsx','.js','.mjs','.json','/index.ts','/index.tsx'].map(ext=>target+ext)].some(p=>fs.existsSync(p))) diagnostics.push({file:path.relative(root,filename),message:`Missing local import: ${spec}`});
    }
  }
}
walk(root);
console.log(JSON.stringify({check:'TypeScript/TSX parsing and local-import resolution (NOT a typecheck or Next build)',files,diagnostics},null,2));
process.exitCode = diagnostics.length ? 1 : 0;
