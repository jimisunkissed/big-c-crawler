import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonDir = path.join(__dirname, '../storage/datasets/default');

const countMissingFiles = (startNumber = 1, endNumber = 26185) => {
  const totalExpected = endNumber - startNumber + 1;
  const missingFiles = [];
  let existingCount = 0;

  console.log(`Checking for missing files between ${startNumber} and ${endNumber}...`);

  for (let i = startNumber; i <= endNumber; i++) {
    const fileNumber = i.toString().padStart(9, '0');
    const fileName = `${fileNumber}.json`;
    const filePath = path.join(jsonDir, fileName);

    if (!fs.existsSync(filePath)) {
      missingFiles.push(i);
    } else {
      existingCount++;
    }

    if (i % 1000 === 0 || i === endNumber) {
      console.log(`Progress: ${i}/${endNumber} files checked`);
    }
  }

  const missingCount = missingFiles.length;
  const missingPercentage = ((missingCount / totalExpected) * 100).toFixed(2);

  const result = {
    totalExpected,
    existing: existingCount,
    missing: missingCount,
    missingPercentage: `${missingPercentage}%`,
    missingFiles,
  };

  return result;
};

// Execute the function and display results
const result = countMissingFiles();
console.log('result', result);
