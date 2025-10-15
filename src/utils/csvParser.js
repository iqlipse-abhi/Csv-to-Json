const fs = require('fs');
const readline = require('readline');

function splitCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function buildNestedObject(obj, keyPath, value) {
  const parts = String(keyPath).split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) {
      cur[p] = value;
    } else {
      if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
      cur = cur[p];
    }
  }
}

async function parseFile(filePath, onRecord) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input, crlfDelay: Infinity });

    let header = null;
    rl.on('line', (line) => {
      if (!line || line.trim() === '') return;
      if (!header) {
        header = splitCSVLine(line).map((h) => h.trim());
        return;
      }
      const values = splitCSVLine(line);
      while (values.length < header.length) values.push('');
      const record = {};
      for (let i = 0; i < header.length; i++) {
        buildNestedObject(record, header[i], values[i] === undefined ? '' : values[i]);
      }
      try {
        onRecord(record);
      } catch (err) {
        rl.close();
        reject(err);
      }
    });

    rl.on('close', () => resolve());
    rl.on('error', (err) => reject(err));
  });
}

module.exports = { parseFile };
