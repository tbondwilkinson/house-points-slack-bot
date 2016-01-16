var Botkit = require('botkit');
var controller = Botkit.slackbot({
});

if (!process.env.BOT_TOKEN) {
  throw new Error('No BOT_TOKEN environment variable');
}
var botToken = process.env.BOT_TOKEN;
var bot = controller.spawn({
  token: botToken
});
require('./actions')(controller);

module.exports = bot;
