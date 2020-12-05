require('dotenv').config()
const logger = require('signale')
const CronJob = require('cron').CronJob

const jobs = require('./jobs')
const { getCourses } = require('./util')
const util = require('./util')

const requiredEnvs = [
    "MOODLE_URI",
    "O365_EMAIL",
    "O365_PASSWORD",
    "DISCORD_WEBHOOK",
    "DISCORD_WEBHOOK_NAME",
    "DISCORD_WEBHOOK_AVATAR"
]

requiredEnvs.forEach(evar => {
    if (process.env[evar] === undefined) {
        logger.fatal(`Missing required environment variable "${evar}"`)
        process.exit(1)
    }
})

if (util.getCourses().length === 0) {
    logger.fatal('No courses configured')
    process.exit(1)
}

logger.info('Scheduling assignment discovery job')

new CronJob(process.env.CRONTIME || '0 */2 * * *', async () => {
    if (await util.isMoodleReachable()) {
        const courses = getCourses()
        for (const course in courses) {
            await jobs.checkCourse(courses[course])
        }
    }
}, null, true, null, null, true)

