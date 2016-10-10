"use strict";

let fs = require('fs'),
    readline = require('readline'),
    google = require('googleapis'),
    googleAuth = require('google-auth-library'),
    authorization,
    queryParams = {
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    };


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'],
      TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE)
          + '/.credentials/',
      TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-geekspeak.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.error('Error loading client secret file: ' + err);
    return;
  }
  authorization = JSON.parse(content);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  return new Promise((resolve, reject) => {
    let clientSecret = credentials.installed.client_secret,
        clientId = credentials.installed.client_id,
        redirectUrl = credentials.installed.redirect_uris[0],
        auth = new googleAuth(),
        oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        getNewToken(oauth2Client, callback, resolve, reject);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client, resolve, reject);
      }
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback, resolve, reject) {
  let authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', code => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('Error while trying to retrieve access token', err);
        resolve(null);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, resolve, reject);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
}

function queryNextEvent(auth, resolve, reject) {
  var calendar = google.calendar('v3');
  queryParams.auth = auth;
  calendar.events.list(queryParams, (err, response) => {
    if (err) {
      console.error('The API returned an error: ' + err);
      resolve(null);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.warning('No upcoming events found.');
      resolve(null);
      return;
    } else {
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.summary === "GeekSpeak - Prep and Record") {
          resolve(event);
          return;
        }
      }
    }
  });
}

// Authorize a client with the loaded credentials, then call the
// Google Calendar API.
module.exports = function() {
  return authorize(authorization, queryNextEvent);
};
