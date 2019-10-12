beforeAll(async () => {
  await page.goto(process.env.ZT_E2E_TEST_URL);
});

test('renders the page correctly', async () => {
  expect(await page.title()).toContain('ZenTomato');
});
