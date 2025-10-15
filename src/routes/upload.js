const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config");
const { parseFile } = require("../csvParser");
const db = require("../db");

const router = express.Router();
const upload = multer({ dest: config.CSV_INPUT_FOLDER });

function extractMapped(record) {
  const firstName = record?.name?.firstName || "";
  const lastName = record?.name?.lastName || "";
  const ageRaw = record?.age || "";
  const age = ageRaw === "" ? null : parseInt(ageRaw, 10);

  const address = record.address || null;

  const additional = {};

  function copyExcluding(src, target, prefix = []) {
    for (const k of Object.keys(src)) {
      if (
        typeof src[k] === "object" &&
        src[k] !== null &&
        !Array.isArray(src[k])
      ) {
        // nested
        const nested = {};
        copyExcluding(src[k], nested, prefix.concat(k));
        if (Object.keys(nested).length > 0) target[k] = nested;
      } else {
        const fullKey = prefix.concat(k).join(".");
        if (
          fullKey === "name.firstName" ||
          fullKey === "name.lastName" ||
          fullKey === "age"
        ) {
        } else if (prefix[0] === "address") {
        } else {
          target[k] = src[k];
        }
      }
    }
  }

  copyExcluding(record, additional);

  return {
    name: `${firstName} ${lastName}`.trim(),
    age,
    address: address && Object.keys(address).length ? address : null,
    additional_info: Object.keys(additional).length ? additional : null,
  };
}

// Inserting batch to DB
async function insertBatch(rows) {
  if (!rows.length) return;
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const insertText = `INSERT INTO public.users (name, age, address, additional_info) VALUES `;
    const values = [];
    const placeholders = rows
      .map((r, idx) => {
        const base = idx * 4;
        values.push(
          r.name,
          r.age,
          r.address ? JSON.stringify(r.address) : null,
          r.additional_info ? JSON.stringify(r.additional_info) : null
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}::jsonb, $${
          base + 4
        }::jsonb)`;
      })
      .join(",");
    const fullQuery = insertText + placeholders + " RETURNING id";
    await client.query(fullQuery, values);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function printAgeDistribution(total, buckets) {
  console.log("\nAge-Group % Distribution\n");
  const groups = [
    { name: "< 20", cnt: buckets.lt20 || 0 },
    { name: "20 to 40", cnt: buckets.b20_40 || 0 },
    { name: "40 to 60", cnt: buckets.b40_60 || 0 },
    { name: "> 60", cnt: buckets.gt60 || 0 },
  ];
  for (const g of groups) {
    const pct = total === 0 ? 0 : Math.round((g.cnt / total) * 100);
    console.log(`${g.name} ${pct}`);
  }
}

router.post("/file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "CSV file required" });
    const filePath = path.resolve(req.file.path);

    const batchSize = config.BATCH_SIZE;
    let buffer = [];
    let totalCount = 0;
    const buckets = { lt20: 0, b20_40: 0, b40_60: 0, gt60: 0 };

    await parseFile(filePath, (record) => {
      const mapped = extractMapped(record);
      if (!mapped.name || mapped.age === null || isNaN(mapped.age)) {
        return;
      }
      // updating distribution
      const age = mapped.age;
      if (age < 20) buckets.lt20++;
      else if (age <= 40) buckets.b20_40++;
      else if (age <= 60) buckets.b40_60++;
      else buckets.gt60++;

      buffer.push(mapped);
      totalCount++;
      if (buffer.length >= batchSize) {
        // Assumption: inserting synchronously (could make it async with queue)
        insertBatch(buffer.slice()).catch((err) => {
          throw err;
        });
        buffer = [];
      }
    });

    if (buffer.length) await insertBatch(buffer);

    printAgeDistribution(totalCount, buckets);

    try {
      fs.unlinkSync(filePath);
    } catch (e) {}

    res.json({ message: "File processed", total: totalCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
