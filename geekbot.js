"use strict";

const Bot = require('./bot'),
      gsEvent = require('./gs-schedule'),
      bot = new Bot({
        token: process.env.SLACK_TOKEN,
        autoReconnect: true,
        autoMark: true
      }),
      _ = require('lodash');

bot.respondTo(/^hello/i, (message, channel, user) => {
  bot.send(`Hello to you too, ${user.name}!`, channel);
});

// Roll D&D-style
bot.respondTo(/roll (\d*)d(\d+)/i, (message, channel, user, numDice, maxVal) => {
  let result = _.sum(_.times((numDice || 1) >> 0, () => _.random(1, maxVal >> 0)))
  bot.send(`${user.name} rolls ${result}`, channel);
});

// Pick a number between x and y
bot.respondTo(/random (\d+)-(\d+)/i, (message, channel, user, min, max) => {
  bot.send(`${user.name} gets ${_.random(min >> 0,max >> 0)}`, channel);
});

// Show who's coming to the show
bot.respondTo(/^who(?:'s| (?:all )?is) coming/i,
              (message, channel, user) => {
  gsEvent().then(event => {
    if (event == null) {
      bot.send("Wups! Can't see the Google calendar!", channel);
      return;
    }  
    let confirmed = event.attendees.filter(e => e.responseStatus === "accepted")
                                   .map(e => (e.displayName || e.email).match(/^\w+/)[0]),
        lagging = event.attendees.filter(e => e.responseStatus === "needsAction"
                                          || e.responseStatus === "tentative")
                                 .map(e => (e.displayName || e.email).match(/^\w+/)[0]);
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
        // Format: 2016-10-24T17:30:00-07:00
    let time = (new Date(event.originalStartTime.dateTime)).toLocaleString("en-US", {
                  timeZoneName: 'short',
                  hour12: true,
                  weekday: 'long',
                  hour: 'numeric',
                  minute: 'numeric'
                });
    bot.send(`We're recording at ${event.location} on ${time}`, channel);
  });
});

// Someone asked a question
// Trigger natural language processing
//bot.respondTo(/\?$/, (message, channel, user) => {
//});
