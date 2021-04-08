const puppeteer = require('puppeteer');
const moment = require('moment');
const fs = require("fs");
const mkdirp = require('mkdirp');


async function browserStart(user, password, url) {
    await (async () => {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        let date = moment().format('MM-DD-YYYY-h-mm-ss')
        let addr = `https://${url}/`

        try {
            await page.goto(addr, {waitUntil: 'networkidle0'});
            console.log(`Открываю страницу: ${addr}`);
        } catch (error) {
            console.log(`Не удалось открыть страницу: ${addr} ошибка: ${error}`);
        }

        await page.waitForSelector('input[name="username"]');
        await page.focus('input[name="username"]');
        await page.keyboard.type(user);
        await page.focus('input[name="password"]');
        await page.keyboard.type(password);
        await page.click('input[type="submit"]');
        console.log("вход...")
        await page.waitForNavigation({waitUntil: 'networkidle0'});

        let arrFolders = [2, 3, 4, 5, 6] //1??
        // 6 черновики// 5 отправленные// 4 спам// 3 корзина// 2 входящие

        let arr = []

        for (const id of arrFolders) {
            let a;
            switch (id) {
                case 2:
                    a = "inbox";
                    break;
                case 3:
                    a = "basket";
                    break;
                case 4:
                    a = "spam";
                    break;
                case 5:
                    a = "outbox";
                    break;
                case 6:
                    a = "draft";
                    break;
                default:
                    a = "null"
            }

            await page.goto(addr + `h/search?sfi=${id}`)
            const t = await page.$$eval(".CB", rows => rows.map(it => it.outerHTML));
            let i = Array.from(t.toString().matchAll(/value="(.*?)"/g)).map(it => it[1])
            arr.push({id: id, dirname: a, isd: i})
        }
        //console.log(arr)

        for (const obj of arr) {
            for (const id of obj.isd) {
                let dir = `./${user}@${url}/${date}/${obj.dirname}/id${id}`
                await mkdirp(dir).then()
            }
        }

        for (const obj of arr) {
            for (const id of obj.isd) {
                let dir = `./${user}@${url}/${date}/${obj.dirname}/id${id}`
                let addrLetter = `https://${url}/service/home/~/?auth=co&view=text&id=${Math.abs(id)}`
                let addrMail = addr + `h/search?sfi=${obj.id}&cid=${id}`
                console.log(addrMail)
                try {
                    await page.goto(addrMail);
                    await page.pdf({path: `${dir}/screenshot.pdf`, printBackground: true});
                    await page.goto(addrLetter)
                    let letter = await page.content();
                    fs.writeFileSync(`${dir}/letter.txt`, letter);

                } catch (error) {
                    console.log(`Не удалось открыть страницу: ${addrMail} ошибка: ${error}`);
                }
            }
        }

        // await page.screenshot({path: `screenshots/png/${date}.png`});
        // await page.pdf({path: `screenshots/pdf/${date}.pdf`, printBackground: true});

        await browser.close();
    })();
}

module.exports.run = browserStart