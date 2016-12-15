"use strict";

const Bot = require('./bot'),
      gsEvent = require('./gs-schedule'),
      bot = new Bot({
        token: process.env.SLACK_TOKEN,
        autoReconnect: true,
        autoMark: true
      }),
      TS_FORMAT = {  // Format: 2016-10-24T17:30:00-07:00
        timeZoneName: 'short',
        timeZone: 'America/Los_Angeles',
        hour12: true,
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      },
      MAX_RAND = 1000000;

let storiesChannel;

bot.respondTo(/^hello/i, (message, channel, user) => {
  bot.send(`Hello to you too, ${user.name}!`, channel);
});

// Roll D&D-style
bot.respondTo(/roll (\d*)d(\d+)/i, (message, channel, user, numDice, maxVal) => {
  let result = 0;
  numDice = (numDice || 1) >> 0;
  maxVal >>= 0;
  if (maxVal > MAX_RAND || numDice > MAX_RAND) {
    bot.send(`C'mon, ${user.name}! Ain't nobody got time for that!`, channel);
    return;
  }
  for (let i = 0; i < numDice; ++i) {
    result += Math.ceil(Math.random() * maxVal);
  }
  bot.send(`${user.name} rolls ${result}`, channel);
});

// Pick a number between x and y
bot.respondTo(/random (\d+)-(\d+)/i, (message, channel, user, min, max) => {
  let tmp = min|0;
  min = Math.min(tmp,max|0);
  max = Math.max(tmp,max|0);
  let diff = max - min;
  if (min < -MAX_RAND || max > MAX_RAND) {
    throw { message: "Values are too large" };
  }
  bot.send(`${user.name} gets ${Math.floor(Math.random() * diff) + min}`, channel);
});

// Show who's coming to the show
bot.respondTo(/^who(?:'s| (?:all )?is) coming/i,
              (message, channel, user) => {
  gsEvent().then(event => {
    if (event == null) {
      bot.send("Wups! Can't see the Google calendar!", channel);
      return;
    }  
    let time = (new Date(event.originalStartTime.dateTime)).toLocaleString("en-US", TS_FORMAT),
        confirmed = event.attendees.filter(e => e.responseStatus === "accepted")
                                   .map(e => (e.displayName || e.email).match(/^\w+/)[0]),
        lagging = event.attendees.filter(e => e.responseStatus === "needsAction"
                                          || e.responseStatus === "tentative")
                                 .map(e => (e.displayName || e.email).match(/^\w+/)[0]);
    bot.send(`For the recording at ${event.location} at ${time}:`, channel);
    bot.send(confirmed.join(', ') + " so far.", channel);
    bot.send("Haven't heard back yet from " + lagging.join(', '), channel);
  });
});

// Show where we're recording next
bot.respondTo(/^(?:where|when)(?:'re| are) we recording/i,
              (message, channel, user) => {
  gsEvent().then(event => {
    if (event == null) {
      bot.send("Wups! Can't see the Google calendar!", channel);
      return;
    }  
    let time = (new Date(event.originalStartTime.dateTime)).toLocaleString("en-US", TS_FORMAT);
    bot.send(`We're recording at ${event.location} at ${time}`, channel);
  });
});

bot.respondTo(/\b(https?:\/\/.+)$/, (message, channel, user, url) => {
  let stories = storiesChannel || (storiesChannel = bot.getChannel("stories"));
  // if (channel === stories) {
    console.log("Loading " + url);
    // bot.sendDirect("Loading " + url, bot.getUser("miles"));
    // Get URL info
  // }
});

bot.respondTo(/^debug(?: (\S+))?/i, (message, channel, user, propPath) => {
  bot.debug(propPath, channel);
});

// Someone asked a question
// Trigger natural language processing
//bot.respondTo(/\?$/, (message, channel, user) => {
//});
