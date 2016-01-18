var capitalize = require('lodash/capitalize');
var trim = require('lodash/trim');
var request = require('request');

var db = require('../../models');

var userOrMention = '(?:<@(\\S+)>|([a-zA-Z\'(){}~#$%^&*=+\\-_ ]+))';

function replyWithPoints(bot, message, user) {
  db.models.points.findById(user.toLowerCase())
    .then(function(point) {
      if (point !== null) {
        bot.reply(
          message, capitalize(user) + ' has ' + point.points + ' points!');
      }
    });
}

module.exports = function(controller) {
  controller.hears(
    [
      'how many points for: ' + userOrMention,
      'points for: ' + userOrMention],
    ['direct_message', 'direct_mention', 'mention'],
    function(bot, message) {
      var names = message.text.substring(
        message.text.lastIndexOf(': ') + 2).split(' ');
      names.forEach(function(name) {
        if (name.startsWith('<@') && name.endsWith('>')) {
          var userId = trim(name, '<@>');
          request.post({
            url: 'https://slack.com/api/users.info',
            json: true,
            form: {
              token: process.env.SLACK_TOKEN,
              user: userId
            }
          }, function(err, response, body) {
            if (body.user !== undefined && body.user.name !== undefined) {
              replyWithPoints(bot, message, body.user.name);
            }
          });
        } else {
          replyWithPoints(bot, message, name);
        }
      });
    });
};
