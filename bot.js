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
      autoReconnect: opts.autoReconnect || true,
      autoMark: opts.autoMark || true
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
        let match = message.text.match(regex);
        if (match) {
          let callback = this.keywords.get(regex);
          match.shift();
          callback(message, channel, user, ...match);
        }
      }
    });
    
    this.slack.start();
  }
  
  respondTo(keyword_regex, callback) {    
    this.keywords.set(keyword_regex, callback);
  }
  
  send(message, channel, cb) {
    this.slack.sendMessage(message, channel.id, () => cb && cb());
  }
  
  sendDirect(message, user, cb) {
    if (user && user.is_bot) {
      return;
    }
    let dm = this.slack.dataStore.getDMByName(user.name);
    this.slack.sendMessage(message, dm.id, () => cb && cb());
  }
  
  getChannel(name) {
    return this.slack.dataStore.getChannelByName(name);
  }
  
  getUser(userInfo) {
    let ds = this.slack.dataStore;
    return ds.getUserByName(userInfo) || ds.getUserByEmail(userInfo);
  }
  
  getUserById(user) {
    return this.slack.dataStore.getUserBuId(user);
  }
  
  debug(propPath, channel) {
    this.send("Debugging...", channel);
    let val = propPath ? propPath.split(".").reduce((obj, prop) => (obj || {})[prop], this.slack)
                       : this.slack;
    this.send("Keys: " + Object.keys(val || {}), channel);
    this.send("Value: " + val, channel);
  }
}

module.exports = Bot;

