import { createPlaywrightRouter } from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, log, pushData, request }) => {
  log.info(`Setting language to English...`);

  await page.context().addCookies([
    {
      name: 'language',
      value: 'en',
      domain: 'www.bigc.co.th',
      path: '/',
    },
    {
      name: 'i18nextLng',
      value: 'en',
      domain: 'www.bigc.co.th',
      path: '/',
    },
  ]);

  await page.goto(request.url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('i18nextLng', 'en');
  });

  await page.reload();

  const categoryMatch = request.url.match(/\/category\/([^?]+)/);
  const category = categoryMatch ? categoryMatch[1] : 'unknown';

  const products = await page.$$eval(
    'div.productCard_container__KXMQK',
    (productCards, category) => {
      return productCards.map((card) => {
        const thumbnailEl = card.querySelector('img[width="256"][height="256"]');
        const titleEl = card.querySelector('div.productCard_title__f1ohZ a');
        const priceEl = card.querySelector('span.productCard_sale_price___gDpF');
        const comingSoonEl = card.querySelector('div.productCard_text__Y6wJP');

        return {
          baseUrl: 'https://www.bigc.co.th/en',
          category,
          thumbnail: thumbnailEl ? thumbnailEl.src : null,
          href: titleEl ? titleEl.getAttribute('href') : null,
          title: titleEl ? titleEl.textContent.trim() : null,
          currency: '฿',
          price: priceEl ? parseFloat(priceEl.textContent.trim().replace(/,/g, '')) : null,
          isAvailable: !comingSoonEl,
        };
      });
    },
    category
  );

  for (const product of products) {
    await pushData(product);
  }

  log.info(`Extracted ${products.length} products from category: ${category}.`);
});
