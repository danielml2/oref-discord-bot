
import * as dotenv from 'dotenv'
import *  as http from 'http'
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js'
import fetch from 'node-fetch'
dotenv.config()

if(process.env.REPLIT_HOST) {
    logWithTimestamp("Opening HTTP Server")
    http.createServer((req, res) => {
    res.end("HTTP Server for Replit hosting is up!");
  })
  .listen(3000);
}

let lastAlertTime = new Date();
const TOKEN = process.env.DISCORD_TOKEN
const client = new Client({ intents:[GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds]});

logWithTimestamp("Logging in discord client..")
client.login(TOKEN)


let alertChannel;

client.once('ready', () => {
    logWithTimestamp("Bot is online!")
    alertChannel = client.channels.cache.get(process.env.ALERT_CHANNEL)
    setInterval(fetchAlertsAndCheckForUpdates, 1000);
})


function fetchAlertsAndCheckForUpdates() {
    fetch("https://www.oref.org.il/WarningMessages/History/AlertsHistory.json").then((response) => {
        response.json().then(json => {
            let currentLastAlertTime = getDateFromString(json[0]["alertDate"])
           if(lastAlertTime == undefined || lastAlertTime.getTime() < currentLastAlertTime.getTime()) {
            logWithTimestamp("New alerts detected..")
             let newAlerts = json.filter((alert) => {
                let alertTime = getDateFromString(alert["alertDate"])
                return lastAlertTime.getTime() < alertTime.getTime()
             })
            logWithTimestamp(`Total new alerts: ${newAlerts.length}`)
            let alertMessages = splitAlertsToMessages(newAlerts)
            alertMessages.forEach((alertMsg) => {
                alertChannel.send({ embeds: [alertMsg]})
            })
            lastAlertTime = currentLastAlertTime;
           } else {
             logWithTimestamp("No new alerts.")
           }
        })
    })
}

function getDateFromString(string) {
    const splitText = string.split(" ")
    const hhMMss = splitText[1]
    const dayDate = splitText[0];

    let dateSplit = dayDate.split("-")
    dateSplit[1] = dateSplit[1] - 1;
    dateSplit.push(...hhMMss.split(":"))
    return new Date(...dateSplit)
}

function buildEmbed(alerts) {
    let embedFields = alerts.map((alert) => {
        return {
        name: alert["data"],
        value: "" + getDateFromString(alert["alertDate"]).toLocaleString('he-IL') + ""
    }
        
    })

    return new EmbedBuilder()
                .setTitle(":round_pushpin: New alerts")
                .addFields(embedFields)
                .setColor("#fc2b2b")
                .setDescription(`Total of ${alerts.length} alerts`)
                .setTimestamp(getDateFromString(alerts[0]["alertDate"]))
}

function splitAlertsToMessages(alerts) {
    let resultAlertArrays = []
    for (let i = 0; i < alerts.length; i += 25) {
        resultAlertArrays.push(alerts.slice(i, i + 25));
    }
    return resultAlertArrays.map((alertArr) => buildEmbed(alertArr))
}

function logWithTimestamp(msg) {
    console.log(`${new Date().toLocaleString("he-IL")}: ${msg}`)
}

