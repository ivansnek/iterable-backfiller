const csvParser = require('csv-parser');
const fs = require('fs');

const readFileContents = (filepath) => {
  const data = [];
  console.log('[csv.readFileContents] Reading file', filepath)
  return new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .on('error', (e) => reject(e))
      .pipe(csvParser())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        console.log('[csv.readFileContents] Finish reading CSV content, Row count:', data.length)
        resolve(data);
      });
  });
};

module.exports = { readFileContents }
