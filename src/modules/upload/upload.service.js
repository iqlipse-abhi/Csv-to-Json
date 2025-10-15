const db = require('../../db');
const config = require('../../config');
const { parseFile } = require('../../utils/csvParser');

// -------------------------
// Batch insert helper
// -------------------------
async function insertBatch(rows) {
  if (!rows.length) return;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const columns = ['name', 'age', 'address', 'additional_info'];
    const values = [];
    const placeholders = rows.map((r, idx) => {
      const base = idx * columns.length;
      values.push(
        r.name,
        r.age,
        r.address ? JSON.stringify(r.address) : null,
        r.additional_info ? JSON.stringify(r.additional_info) : null
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}::jsonb, $${base + 4}::jsonb)`;
    }).join(',');

    const sql = `INSERT INTO public.users (${columns.join(',')}) VALUES ${placeholders}`;
    await client.query(sql, values);

    await client.query('COMMIT');
    console.log(`Inserted batch of ${rows.length} rows`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting batch', err);
    throw err;
  } finally {
    client.release();
  }
}

// -------------------------
// Mapping CSV record to DB object
// -------------------------
function extractMapped(record) {
  const firstName = record?.name?.firstName || '';
  const lastName = record?.name?.lastName || '';
  const ageRaw = record?.age || '';
  const age = ageRaw === '' ? null : parseInt(ageRaw, 10);

  const address = record.address && Object.keys(record.address).length ? record.address : null;

  const additional = {};
  function copyExcluding(src, target, prefix = []) {
    for (const k of Object.keys(src || {})) {
      const val = src[k];
      const fullKey = prefix.concat(k).join('.');
      if (fullKey === 'name.firstName' || fullKey === 'name.lastName' || fullKey === 'age') continue;
      else if (prefix[0] === 'address') continue;
      else if (val && typeof val === 'object' && !Array.isArray(val)) {
        const nested = {};
        copyExcluding(val, nested, prefix.concat(k));
        if (Object.keys(nested).length) target[k] = nested;
      } else {
        target[k] = val;
      }
    }
  }
  copyExcluding(record, additional);

  return {
    name: `${firstName} ${lastName}`.trim(),
    age,
    address,
    additional_info: Object.keys(additional).length ? additional : null
  };
}

// -------------------------
// CSV processing
// -------------------------
async function processFile(filePath) {
  console.log(`\nProcessing file: ${filePath}\n`);

  const batchSize = config.BATCH_SIZE;
  let buffer = [];
  let totalCount = 0;
  const buckets = { lt20: 0, b20_40: 0, b40_60: 0, gt60: 0 };

  await parseFile(filePath, async (record) => {
    const mapped = extractMapped(record);

    if (!mapped.name || mapped.age === null || Number.isNaN(mapped.age)) return;

    const age = mapped.age;
    if (age < 20) buckets.lt20++;
    else if (age <= 40) buckets.b20_40++;
    else if (age <= 60) buckets.b40_60++;
    else buckets.gt60++;

    buffer.push(mapped);
    totalCount++;

    if (buffer.length >= batchSize) {
      await insertBatch(buffer.slice());
      buffer = [];
    }
  });

  if (buffer.length) await insertBatch(buffer);

  //To print age distribution in console
  console.log('Age-Group % Distribution');
  const groups = [
    { name: '< 20', cnt: buckets.lt20 },
    { name: '20 to 40', cnt: buckets.b20_40 },
    { name: '40 to 60', cnt: buckets.b40_60 },
    { name: '> 60', cnt: buckets.gt60 }
  ];
  for (const g of groups) {
    const pct = totalCount === 0 ? 0 : Math.round((g.cnt / totalCount) * 100);
    console.log(`${g.name} ${pct}`);
  }
  console.log('\n');

  return {
    total: totalCount,
    ageDistribution: groups.map(g => ({
      range: g.name,
      percentage: totalCount === 0 ? 0 : Math.round((g.cnt / totalCount) * 100)
    }))
  };
}

module.exports = { processFile };