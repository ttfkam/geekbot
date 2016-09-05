"use strict";

const Bot = require('./bot'),
      bot = new Bot({
        token: process.env.SLACK_TOKEN,
        autoReconnect: true,
        autoMark: true
      });

bot.respondTo('hello', (message, channel, user) => {
  bot.send(`Hello to you too, ${user.name}!`, channel);
}, true);
