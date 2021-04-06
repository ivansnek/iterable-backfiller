const csvParser = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const badPNWriter = createCsvWriter({
  path: 'assets/badPNEmails.csv',
  header: [
    {id: 'email', title: 'Email'},
    {id: 'platform', title: 'Platform'},
    {id: 'token', title: 'Token'},
    {id: 'applicationName', title: 'Application'},
    {id: 'endpointEnabled', title: 'Enabled PN'},
  ]
});

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

const writeBadPNFile = (data = []) => badPNWriter
  .writeRecords(data)
  .then(()=> console.log('[csv.writeFile] The CSV file was written successfully'))
  .catch(error => console.log('[csv.writeFile] Error', error)) 

module.exports = { readFileContents, writeBadPNFile }
