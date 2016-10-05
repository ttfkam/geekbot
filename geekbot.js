"use strict";

const Bot = require('./bot'),
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
bot.respondTo(/^roll (\d*)d(\d+)$/i, (message, channel, user, numDice, maxVal) => {
  let result = _.sum(_.times(numDice >> 0, () => _.random(1, maxVal >> 0)))
  bot.send(`${user.name} roles ${result}`, channel);
});

// Pick a number between x and y
bot.respondTo(/^random (\d+)-(\d+)$/i, (message, channel, user, min, max) => {
  bot.send(`${user.name} gets ${_random(min >> 0,max >> 0)}`, channel);
});

// Someone asked a question
// Trigger natural language processing
bot.respondTo(/\?$/, (message, channel, user) => {
});
