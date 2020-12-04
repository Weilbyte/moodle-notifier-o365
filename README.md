# moodle-notifier-o365

Automatically checks a Moodle instance for new assignments. As of right now it only supports Office 365 authentication. 

The resulting Docker image is a ~800-900 MB because of the use of `Puppeteer` (for the o365 authentication flow).    
A cron job (`0 */2 * * *`, every 2 hrs) is performed to check for new assignments.   
Moodle session cookies are cached for 5 hours after a successful login.    

## Installation

### Docker
Use the docker image, and just mount the `.env` and `courses.json` files to `/srv/`
```bash
docker pull docker.pkg.github.com/weilbyte/moodle-notifier-o365/moodle-notifier-o365:latest
```

### Non-docker
Don't forget to create `.env` and `courses.json` files
```bash
git clone https://github.com/Weilbyte/moodle-notifier-o365
cd moodle-notifier-o365
yarn install
yarn run
```

## Usage

### courses.json
This file is required, it contains all the courses you want to check

Structure:
```json
{
    "courses": [
        {
            "name": "Course A",
            "id": "256"
        }
    ]
}
```

`name` does not have to match the course name in Moodle itself.
`id` is the id of the course. It can be found in the course URL (`https://moodleinstance/course/view.php?id=**164693**`)

### known.json
This file is not required, it is created and modified as needed. All it does is contain an array with the IDs of known assignments. 

Structure: 
```json
{
    "knownAssignments": ["346261", "326562"]
}
```
The numbers in the strings refer to the assignment id (`https://noodleinstance/mod/assign/view.php?id=**326562**`)
Do not question why I am using strings. 


## Contributing
Pull requests are welcome. 
## License
[MIT](https://choosealicense.com/licenses/mit/)
