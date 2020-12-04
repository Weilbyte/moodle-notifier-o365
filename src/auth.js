const { Signale } = require('signale')
const puppeteer = require('puppeteer')

const logger = new Signale({scope: 'Auth'})

let cache = {
    moodle: {
        cookies: [],
        expiry: 0
    }
}

module.exports = {
    getMoodleCookies: async (useCache = true) => {
        if (useCache === true && cache.moodle.cookies !== null && cache.moodle.expiry > Math.floor(new Date().getTime() / 1000)) {
            logger.debug({ prefix: 'getMoodleCookies', message: 'Sending cached cookies'})
            return cache.moodle.cookies
        } else {
            logger.debug({ prefix: 'getMoodleCookies', message: 'Starting flow'})
            const url = process.env.MOODLE_URI
            const browser = await puppeteer.launch({devtools: process.env.PUPPETEER_DEBUG || false})
            const page = await browser.newPage()
            await page.goto(url, { waitUntil: 'networkidle0'})

            await page.waitForSelector('input[type="email"]')
            await page.type('input[type="email"]', process.env.O365_EMAIL)
            await page.click('input[type="submit"]')
            logger.debug({ prefix: 'getMoodleCookies', message: 'Email stage passed'})

            await page.waitForSelector('input[type="password"]')
            await page.type('input[type="password"]', process.env.O365_PASSWORD)
            await page.waitForTimeout(1000)
            await page.click('input[type="submit"]')
            logger.debug({ prefix: 'getMoodleCookies', message: 'Password stage passed'})

            await page.waitForSelector('input[class="button ext-button secondary ext-secondary"]')
            await page.click('input[class="button ext-button secondary ext-secondary"]')
            
            await page.waitForNavigation()
            const finishUrl = await page.url()
            if (finishUrl === 'https://lms.schools.mk/my/') {
                logger.success({ prefix: 'getMoodleCookies', message: 'Moodle login successful'})
                const cookies = await page._client.send('Network.getAllCookies')
                cache.moodle.expiry = (Math.floor(new Date().getTime() / 1000) + 10800) // 18000 = 5 hours
                cache.moodle.cookies = cookies['cookies'].filter(cookie => (cookie.name === 'SimpleSAMLSessionID' || cookie.name === 'SimpleSAMLAuthToken' || cookie.name === 'MoodleSession'))
                console.log(cache.moodle)
                return cache.moodle.cookies
            } else {
                logger.error({ prefix: 'getMoodleCookies', message: 'Moodle login failed' })
            }
        }
    }
}