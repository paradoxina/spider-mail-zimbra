const puppeteer = require('puppeteer');
const moment = require('moment');
const fs = require("fs");
const mkdirp = require('mkdirp');
const path = require("path");
const unzipper = require("unzipper");
const extract = require('extract-zip')


async function browserStart(user, password, url) {
    await (async () => {
        const browser = await puppeteer.launch({
            // headless: false
        });
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

        let fileName
        page.on('response', response => {
            const contentType = response.headers()['content-type'];
            if (contentType === "application/zip") {
                let res = response.headers()['content-disposition']
                // let regexp = /("[^"]*")/g
                let regexp = /(["'])(.+?)\1/
                let filename = res.match(regexp)[2]
                console.log("получили файл " + filename)
                fileName = filename
            }
        });

        let allLinc = `https://${url}/service/home/~/?auth=co&fmt=zip`
        console.log(allLinc)
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.resolve(`./${user}@${url}/${date}/`)
        });
        try {
            await page.goto(allLinc)
        } catch (e) {
        }

        for (const obj of arr) {
            for (const id of obj.isd) {
                let dir = `./${user}@${url}/${date}/${obj.dirname}/id${id}`
                let addrLetter = `https://${url}/service/home/~/?auth=co&view=text&id=${Math.abs(id)}`
                let addrMail = addr + `h/search?sfi=${obj.id}&cid=${id}`
                let addrFile = `https://${url}/service/home/~/?auth=co&id=${Math.abs(id)}&fmt=zip`
                console.log(addrMail)
                try {
                    await mkdirp(dir).then()
                    await page.goto(addrMail);
                    await page.pdf({path: `${dir}/screenshot.pdf`, printBackground: true});
                    await page.goto(addrLetter)
                    await fs.writeFileSync(`${dir}/letter.txt`, await page.content());
                } catch (error) {
                    console.log(`Не удалось открыть страницу: ${addrMail} ошибка: ${error}`);
                }
                try {
                    await page._client.send('Page.setDownloadBehavior', {
                        behavior: 'allow',
                        downloadPath: path.resolve(dir)
                    });
                    await page.goto(addrFile)
                } catch (e) {
                }

                await page.waitForTimeout(5000)

                try {
                    let zip = dir + "/" + fileName
                    console.log("распаковка файла " + zip)
                    //await extract(path.resolve(dir + "/" + fileName), {dir: path.resolve(dir+"/eml/")})
                    fs.createReadStream(path.resolve(dir + "/" + fileName))
                        .pipe(unzipper.Extract({path: path.resolve(dir + "/eml/"), forceStream: true}));
                } catch (e) {
                    console.log(e)
                }
            }
        }
        await browser.close();
    })();
}

module.exports.run = browserStart