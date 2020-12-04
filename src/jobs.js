const auth = require('./auth')
const util = require('./util')
const axios = require('axios')
const cheerio = require('cheerio')
const { Signale } = require('signale')

const logger = new Signale({scope: 'Jobs'})

module.exports = {
    checkCourse: async (course) => {
        logger.info(`Checking course ${course.name}`)
        console.log(`${process.env.MOODLE_URI}/course/view.php?id=${course.id}`)
        const moodleCookies = await auth.getMoodleCookies()
        const response = await axios.get(`${process.env.MOODLE_URI}/course/view.php?id=${course.id}`, {
            headers: { 
                'Cookie': util.cookiesToString(moodleCookies)
            },
            withCredentials: true,
            mode: 'cors'
        })
        const $ = cheerio.load(response.data)
        const assignments = $('li[class*="activity assign"] > div > div > div:not([class="mod-indent"])')
        for (var i=0; i < assignments.length; i++) {
            const assignmentName = $('div[class="activityinstance"] > a > span', assignments[i]).text().replace('Assignment', '')
            const assignmentLink = $('div[class="activityinstance"] > a', assignments[i]).attr('href')
            const assignmentId = assignmentLink.split('mod/assign/view.php?id=')[1]
            const assignmentDescription = $('div[class="contentafterlink"] > div > div > p', assignments[i]).text()
            const assignmentDueDate = (util.isKnown(assignmentId)) ? 0 : await util.getDueDate(assignmentLink)
            logger.debug(`Assignment ${assignmentName} (${assignmentId}) already known, skipping webhook`)
            if (!util.isKnown(assignmentId)) {
                await util.sendAssignmentWebhook({
                    subject: course.name,
                    name: assignmentName,
                    url: assignmentLink,
                    due: assignmentDueDate,
                    description: (assignmentDescription === '') ? 'N/A' : assignmentDescription
                })
                util.setKnown(assignmentId)
            }
        }
    }
}