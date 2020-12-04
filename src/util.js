const fs = require('fs')
const { Signale } = require('signale')
const { Webhook, MessageBuilder } = require('discord-webhook-node')
const axios = require('axios')
const cheerio = require('cheerio')

const auth = require('./auth')

const logger = new Signale({scope: 'Util'})

const hook = new Webhook({
    url: process.env.DISCORD_WEBHOOK,
    throwErrors: true,
    retryOnLimit: true
})
hook.setUsername(process.env.DISCORD_WEBHOOK_NAME)
hook.setAvatar(process.env.DISCORD_WEBHOOK_AVATAR)

const getKnown = () => {
    var knownJson = {
        knownAssignments: []
    }

    if (fs.existsSync('./known.json')) {
        try {
            knownJson = JSON.parse(fs.readFileSync('./known.json'))
        } catch {
            logger.error({ prefix: 'getKnown', message: 'known.json file is corrupt'})
        }
    }

    return knownJson
}

module.exports = {
    cookiesToString: (cookies) => {
        let cookieString = ''
        cookies.forEach(cookie => {
            cookieString += `${cookie.name}=${cookie.value}; `
        })
        return cookieString
    },
    getDueDate: async (assignmentLink) => {
        const moodleCookies = await auth.getMoodleCookies()
        const response = await axios.get(assignmentLink, {
            headers: { 
                'Cookie': module.exports.cookiesToString(moodleCookies)
            },
            withCredentials: true,
            mode: 'cors'
        })
        const $ = cheerio.load(response.data)
        return $('td', $('tbody > tr th:contains("Due date")').parent()).text()
    },
    getCourses: () => {
        if (fs.existsSync('./courses.json')) {
            try {
                const courses = JSON.parse(fs.readFileSync('./courses.json'))
                return courses.courses
            } catch {
                logger.error({ prefix: 'getCourses', message: 'courses.json file is corrupt'})
            }
        }
        const courses = {
            courses: []
        }
        return courses.courses
    },
    isKnown: (assignmentId) => {
        const knownJson = getKnown()
        return knownJson.knownAssignments.some(val => val == assignmentId)
    },
    setKnown: (assignmentId) => {
        const knownJson = getKnown()
        knownJson.knownAssignments.push(assignmentId)
        fs.writeFileSync('./known.json', JSON.stringify(knownJson))
    },
    sendAssignmentWebhook: async (assignmentData) => {
        logger.debug({ prefix: 'sendAssignmentWebhook', message: assignmentData})
        const embed = new MessageBuilder()
            .setTitle(assignmentData.name)
            .setURL(assignmentData.url)
            .setColor(4886754)
            .setTimestamp()
            .setThumbnail('https://i.imgur.com/13T8XHA.png')
            .addField('Subject', assignmentData.subject, true)
            .addField('Due', assignmentData.due, true)
            .addField('Description', `\`\`${assignmentData.description}\`\``)
        try {
            await hook.send(embed)
            logger.success({ prefix: 'sendAssignmentWebhook', message: `Successfully sent webhook for assignment "${assignmentData.name}"`})
        } catch(e) {
            logger.error({ prefix: 'sendAssignmentWebhook', message: `Failure sending webhook for assignment "${assignmentData.name}": ${e}`})
        }
    },
    isMoodleReachable: async () => {
        try {
            const response = await axios.get(process.env.MOODLE_URI, {
                timeout: 10000
            })
            if (response.status === 200) {
                return true
            } 
            const failMsg = `Moodle instance returned ${response.status} instead of 200`
            logger.error({ prefix: 'isMoodleReachable', message: failMsg})
            return false
        } catch(e) {
            const failMsg = `Unable to reach Moodle instance: ${e}`
            logger.error({ prefix: 'isMoodleReachable', message: failMsg})
            return false
        }
    }
}