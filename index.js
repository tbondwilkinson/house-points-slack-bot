'use-strict';
var bot = require('./bot');
var db = require('./models');

db.sequelize.sync().then(function() {
  bot.startRTM(function(err, bot, payload) {
    if (err) {
      console.log(err);
      throw new Error('Could not connect to Slack');
    }
  });
});
