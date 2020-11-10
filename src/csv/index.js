const csvParser = require('csv-parse');
const fs = require('fs');

const readFileContents = (filepath) => {
  const data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .on('error', (e) => reject(e))
      .pipe(csvParser())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        resolve(data);
      });
  });
};

module.exports = { readFileContents }
