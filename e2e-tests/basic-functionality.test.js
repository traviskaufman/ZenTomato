const MainPage = require('./pages/main-page');

const ONE_SECOND = 1000;

let mainPage;
beforeAll(async () => {
  await page.goto(process.env.ZT_E2E_TEST_URL);
  mainPage = new MainPage(page);
  await mainPage.waitUntilLoaded();
});

afterEach(async () => {
  await mainPage.reset();
});

test('renders the page correctly', async () => {
  expect(await page.title()).toContain('ZenTomato');
});

test('allows you to start, stop, and pause pomodoros', async () => {
  await mainPage.start();
  await page.waitFor(ONE_SECOND);

  const firstClockTime = await mainPage.getClockTime();
  // Using toContain prevents any direct timing flakiness with having to catch
  // the browser exactly within a given second.
  expect(firstClockTime).toContain('24:5');

  await page.waitFor(ONE_SECOND);
  const secondClockTime = await mainPage.getClockTime();
  const firstTimeSeconds = parseInt(firstClockTime.split(':')[1], 10);
  const secondTimeSeconds = parseInt(secondClockTime.split(':')[1], 10);
  expect(secondTimeSeconds).toBeLessThan(firstTimeSeconds);

  await mainPage.pause();
  const clockTimeRightAfterPause = await mainPage.getClockTime();
  await page.waitFor(ONE_SECOND);
  expect(await mainPage.getClockTime()).toEqual(clockTimeRightAfterPause);

  await mainPage.stop();
  expect(await mainPage.getClockTime()).toEqual('25:00');
});

test('allows you to switch between different methods', async () => {
  await mainPage.selectCycle('Short break');
  expect(await mainPage.getClockTime()).toEqual('05:00');

  await mainPage.selectCycle('Long break');
  expect(await mainPage.getClockTime()).toEqual('15:00');

  await mainPage.selectCycle('Pomodoro');
  expect(await mainPage.getClockTime()).toEqual('25:00');
});

test('stops the timer if a different cycle is switched to while running', async () => {
  await mainPage.start();
  await page.waitFor(500);
  await mainPage.selectCycle('Short break');
  await page.waitFor(1000);

  expect(await mainPage.getClockTime()).toEqual('05:00');
});
