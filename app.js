const browser = require('./browser')
const conf = require("./config.json");
// const conf = require("./config-dev.json");

(async () => {
    for (const user of conf.users) {
        if (user.password !== "" && user.login !== "") {
            await browser.run(user.login, user.password, conf.url)
        }
    }
})()


