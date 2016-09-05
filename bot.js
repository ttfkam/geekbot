"use strict";

const CLIENT = require('@slack/client'),
      RtmClient = CLIENT.RtmClient,
      MemoryDataStore = CLIENT.MemoryDataStore,
      CLIENT_EVENTS = CLIENT.CLIENT_EVENTS,
      RTM_EVENTS = CLIENT.RTM_EVENTS;

class Bot {
  constructor(opts) {
    this.slack = new RtmClient(opts.token, {
      logLevel: 'error',
      dataStore: new MemoryDataStore(),
      autoReconnect: opt.autoReconnect || true,
      autoMark: opt.autoMark || true
    });
    
    this.keywords = new Map();
    
    this.slack.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
      let dataStore = this.slack.dataStore,
          user = dataStore.getUserById(this.slack.activeUserId),
          team = dataStore.getTeamById(this.slack.activeTeamId);
          
      this.name = user.name;
      console.log(`Connected to ${team.name} as ${user.name}`);
    });
    
    this.slack.on(RTM_EVENTS.MESSAGE, (message) => {
      if (!message.text) {
        return;
      }
      
      let dataStore = this.slack.dataStore,
          channel = dataStore.getChannelGroupOrDMById(message.channel),
          user = dataStore.getUserById(message.user);
      
      for (let regex of this.keywords.keys()) {
        if (regex.test(message.text)) {
          let callback = this.keywords.get(regex);
          callback(message, channel, user);
        }
      }
    });
    
    this.slack.start();
  }
  
  respondTo(keywords, callback, start) {
    if (start) {
      keywords = '^' + keywords;
    }
    
    let regex = new RegExp(keywords, 'i');
    
    this.keywords.set(regex, callback);
  }
  
  send(message, channel, cb) {
    this.slack.sendMessage(message, channel.id, () => cb && cb());
  }
}

module.exports = Bot;

