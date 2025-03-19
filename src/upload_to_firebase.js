import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, '../firebase_service.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const collectionName = 'products';

const jsonDir = path.join(__dirname, '../storage/datasets/default');

const totalLength = 26185;
const batchSize = 50;
const numberOfBatches = Math.ceil(totalLength / batchSize);
console.log({ totalLength, batchSize, numberOfBatches });

const uploadBatch = async (batchOrder) => {
  try {
    const start = (batchOrder - 1) * batchSize + 1;
    const end = batchOrder * batchSize;

    const batch = db.batch();

    const batchFiles = [];
    let validFilesCount = 0;
    let missingFilesCount = 0;

    for (let i = start; i <= end; i++) {
      const fileNumber = i.toString().padStart(9, '0');
      const fileName = `${fileNumber}.json`;
      const filePath = path.join(jsonDir, fileName);

      if (fs.existsSync(filePath)) {
        try {
          const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          const id = jsonData.href.split('.')[1];
          const domain = jsonData.baseUrl.replaceAll('https://', '') ?? '';

          const format = {
            id,
            category: jsonData.category ?? '',
            createdAt: FieldValue.serverTimestamp(),
            currency: 'THB',
            date: Date.now(),
            domain,
            from: 'crawler',
            image: jsonData?.thumbnail ?? '',
            lastUpdatedAt: FieldValue.serverTimestamp(),
            link: jsonData?.href ? domain + jsonData.href : '',
            price: jsonData?.price ?? 0,
            prices: jsonData?.price ? jsonData.price.toString() : '',
            sold: '-',
            title: jsonData?.title ?? '',
            'title-en': { en: jsonData?.title ?? '' },
          };

          const docRef = db.collection(collectionName).doc(id);
          batch.set(docRef, format);

          batchFiles.push(fileName);
          validFilesCount++;
        } catch (parseErr) {
          console.error(`Error parsing JSON in file ${fileName}:`, parseErr);
          throw new Error(`JSON parse error in batch ${batchOrder}: ${parseErr.message}`);
        }
      } else {
        console.log(`File ${fileName} does not exist, skipping`);
        missingFilesCount++;
      }
    }

    if (validFilesCount > 0) {
      await batch.commit();
      console.log(`Batch ${batchOrder} committed successfully`);
    } else {
      console.log(`Batch ${batchOrder} had no valid files to upload.`);
    }

    console.log(`Batch ${batchOrder} summary: Valid: ${validFilesCount}, Missing: ${missingFilesCount}`);

    return {
      batchOrder,
      validFiles: validFilesCount,
      missingFiles: missingFilesCount,
      success: true,
    };
  } catch (err) {
    console.error(`Error processing batch ${batchOrder}:`, err);
    return {
      batchOrder,
      error: err.message,
      success: false,
    };
  }
};

(async () => {
  await uploadBatch(496);
})();

// const uploadMultipleBatches = async (startBatch, endBatch) => {
//   const results = [];

//   for (let batch = startBatch; batch <= endBatch; batch++) {
//     console.log(`### Starting batch ${batch} of ${endBatch}`);
//     const result = await uploadBatch(batch);
//     results.push(result);
//     console.log(`### Finished batch ${batch} of ${endBatch}\n`);

//     // Optional: add a small delay between batches to avoid rate limiting
//     await new Promise((resolve) => setTimeout(resolve, 500));
//   }

//   console.log('All batches completed!');
//   console.log('Summary:', {
//     totalBatches: results.length,
//     successful: results.filter((r) => r.success).length,
//     failed: results.filter((r) => !r.success).length,
//   });
// };

// uploadMultipleBatches(1, numberOfBatches);
