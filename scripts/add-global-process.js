const fs = require('fs');
const path = require('path');

const filesToModify = [
  path.resolve(__dirname, '../node_modules/@polkadot/util/detectPackage.js'),
  path.resolve(__dirname, '../node_modules/@reef-chain/ui-kit/dist/index.es.js'),
];

const contentToAdd = `
globalThis.process = {};
globalThis.process.env = {
  'POLKADOTJS_DISABLE_ESM_CJS_WARNING':'1'
};
`;

const modifyFile = (filePath) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file: ${filePath}`, err);
      return;
    }

    const updatedContent = contentToAdd + data;

    fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
      if (err) {
        console.error(`❌ Error writing to file: ${filePath}`, err);
      } else {
        console.log(`✅ Globals added successfully: ${filePath}`);
      }
    });
  });
};

filesToModify.forEach(modifyFile);
console.log(`⚠️ Disabling @polkadot/X warnings!`);
