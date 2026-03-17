const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const OUTPUT_FILE = path.join(ASSETS_DIR, 'index.ts');

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.otf', '.ttf'];
const SKIP_FILES = ['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png'];

const getFilesRecursively = (dir, baseDir = dir) => {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getFilesRecursively(fullPath, baseDir));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext) && !SKIP_FILES.includes(item)) {
        const relativePath = path.relative(baseDir, fullPath);
        const name = path.basename(item, ext);
        files.push({ name, relativePath });
      }
    }
  }

  return files;
};

const generate = () => {
  const files = getFilesRecursively(ASSETS_DIR);

  const entries = files
    .map(({ name, relativePath }) => `  ${name}: require('./${relativePath.replace(/\\/g, '/')}')`)
    .join(',\n');

  const content = `const assets = {
${entries},
}

export default assets
`;

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`Generated ${OUTPUT_FILE} with ${files.length} assets`);
};

generate();
