// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { router } from './routes.js';

const categories = [
  { name: 'snacks-and-desserts', length: 129 },
  { name: 'beauty-personal-care', length: 232 },
  { name: 'mom-baby', length: 82 },
  { name: 'household-essentials', length: 198 },
  { name: 'home-lifestyle', length: 91 },
  { name: 'home-appliances-electronic-products', length: 83 },
  { name: 'fashion-and-accessories', length: 80 },
  { name: 'pet-food-and-pet-supplies', length: 34 },
];
const totalLength = categories.reduce((sum, category) => sum + category.length, 0);
const batchSize = 20;
const numberOfBatches = Math.ceil(totalLength / batchSize);
console.log({ totalLength, batchSize, numberOfBatches });

const currentPage = (index) => {
  index = index + 1;

  if (index > totalLength) return null;
  for (const cat of categories) {
    if (index <= cat.length) return { name: cat.name, index };
    else index = index - cat.length;
  }
};

const getBatch = (batchOrder) => {
  const indexes = Array.from({ length: batchSize }).map((_, i) => (batchOrder - 1) * batchSize + i);
  const batch = indexes.map((x) => {
    const pageConfig = currentPage(x);
    if (!pageConfig) return null;
    return `https://www.bigc.co.th/en/category/${pageConfig.name}?page=${pageConfig.index}?limit=30`;
  });

  return batch.filter((x) => !!x);
};

const crawler = new PlaywrightCrawler({
  requestHandler: router,
  maxRequestsPerCrawl: 20,
  launchContext: {
    launchOptions: {
      headless: true,
    },
  },
  preNavigationHooks: [
    async ({ request, page }) => {
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });
    },
  ],
});

for (let i = 1; i <= numberOfBatches; i++) {
  console.log('STARTING BATCH ', i);
  await crawler.run(getBatch(i));
  console.log('FINISHED BATCH ', i);
}
