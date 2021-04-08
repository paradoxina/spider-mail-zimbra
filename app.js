const browser = require('./browser')
const conf = require("./config.json");
// const conf = require("./config-dev.json");

(async () => {
    for (const user of conf.users) {
        if (user.password !== "" && user.login !== "" && conf.url !== "") {
            await browser.run(user.login, user.password, conf.url)
        }else console.log("enter your username, password and url in config.json")
    }
})()


