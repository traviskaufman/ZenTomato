module.exports = class MainPage {
  constructor(page) {
    this.page = page;
  }

  async waitUntilLoaded() {
    await this.page.waitForSelector('time');
  }

  async start() {
    await this._clickControlWithLabel('Start');
  }

  async pause() {
    await this._clickControlWithLabel('Pause');
  }

  async stop() {
    await this._clickControlWithLabel('Stop');
  }

  async getClockTime() {
    const clockEl = await page.$('time');
    const text = await clockEl.evaluate(e => e.textContent, clockEl);
    return text.trim()
  }

  async reset() {
    await this.stop();
    await this.selectCycle('Pomodoro');
  }

  async selectCycle(cycle) {
    const results = await page.$x(`//button[text() = "${cycle}"]`);
    if (results.length == 0) {
      throw new Error(`Cycle ${cycle} not found`);
    }
    await results[0].click();
  }

  async _clickControlWithLabel(label) {
    const controlBtn = await this.page.$(`[aria-label=${label}]`);
    await controlBtn.click();
  }
};
