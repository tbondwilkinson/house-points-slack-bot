var request = require('request');

var capitalize = require('lodash/capitalize');

var db = require('../../models');

var awardPointsRegExpNoFor =
  '(-?\\d+) point[s]? to ([a-zA-Z\'’(){}/~#$%^&*=+\\-_ ]+)';
var awardPointsRegExpFor =
  '(-?\\d+) points to ([a-zA-Z\'’(){}/~#$%^&*=+\\-_ ]+?)' +
  '(?: for ([a-zA-Z\'’(){}/~#$%^&*=+\\-_,?.:; ]+))';
var awardPointsRegExpForQuotes =
  '(-?\\d+) points to “([a-zA-Z\'’(){}/~#$%^&*=+\\-_ ]+)”' +
  '(?: for ([a-zA-Z\'’(){}/~#$%^&*=+\\-_,?.:; ]+))';
var awardPointsMentionRegExp = '(-?\\d+) points to (<@\\S+>)';
var awardPointsMentionRegExpFor =
  '(-?\\d+) points to (<@\\S+>)' +
  '(?: for ([a-zA-Z\'’(){}/~#$%^&*=+\\-_,?.:; ]+))';

function awardPoints(bot, message) {
  if (message.match.length === 0) {
    matches = message.text.match(new RegExp(awardPointsQuoteRegEx), 'i');
  }
  var pointObject = {};
  if (message.match.length >= 3) {
    pointObject.points = message.match[1];
    pointObject.user = message.match[2];
  }
  if (message.match.length > 3) {
    pointObject.reason = message.match[3];
  }
  console.log(message.match);
  console.log(pointObject);
  if (pointObject.points > 100 || pointObject.points < -100) {
    bot.reply(message,
      'Apologies, but 100 is the maximum number of points anyone ' +
      ' can award at one time.' +
      '  Don\'t get carried away!');
    return;
  }
  db.models.points.findOrCreate({
    where: {
      entity: pointObject.user.toLowerCase()
    },
    defaults: {
      points: pointObject.points
    }
  }).spread(function(point, created) {
    console.log(point.get({
      plain: true
    }));
    console.log(created);
    if (!created) {
      db.sequelize.query('UPDATE points ' +
        'SET points = (@cur_value := points) + ' + pointObject.points +
        ' WHERE entity = "' + pointObject.user.toLowerCase() + '";')
        .spread(function(results, metadata) {
          db.models.points.findById(pointObject.user.toLowerCase())
            .then(function(point) {
              response(bot, message, pointObject, point);
            });
        });
    } else {
      response(bot, message, pointObject, point);
    }
  });
}

module.exports = function(controller) {
  controller.hears(
    [
      awardPointsRegExpFor,
      awardPointsRegExpForQuotes,
      awardPointsRegExpNoFor],
    ['direct_mention' , 'mention', 'ambient'],
    awardPoints
  );
  controller.hears(
    [awardPointsMentionRegExp, awardPointsMentionRegExpFor],
    ['direct_mention', 'mention', 'ambient'],
    function(bot, message) {
      console.log('Heard award points with a @mention');
      var matches = message.text.match(/<@(\S+)>/i);
      if (matches.length > 1) {
        var userId = matches[1];
        request.post({
          url: 'https://slack.com/api/users.info',
          json: true,
          form: {
            token: process.env.SLACK_TOKEN,
            user: userId
          }
        }, function(err, response, body) {
          if (body.user !== undefined && body.user.name !== undefined) {
            message.text  = message.text.replace(
              '<@' + userId + '>', capitalize(body.user.name));
            message.match[2] = capitalize(body.user.name);
            awardPoints(bot, message);
          }
        });
      }
    });
};

function response(bot, message, pointObject, point) {
  bot.reply(message, 'Awarded!  ' + pointObject.user + ' now has ' +
    point.points + ' points');
  if (pointObject.reason !== undefined) {
    bot.reply(message, 'The reason was: ' + pointObject.reason);
  }
}
