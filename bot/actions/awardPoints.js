var request = require('request');

var capitalize = require('lodash/capitalize');

var db = require('../../models');

var awardPointsRegEx =
  '(-?\\d+) points (?:to|for) ([a-zA-Z\'(){}/~#$%^&*=+\\-_ ]+)';
var awardPointsMentionRegEx =
  '(-?\\d+) points (?:to|for) (<@\\S+>)';

function awardPoints(bot, message) {
  var matches = message.text.match(new RegExp(
    awardPointsRegEx, 'i'
  ));
  var pointObjects = [];
  if (matches.length >= 3) {
    for (var i = 0; i + 2 < matches.length; i += 3) {
      pointObjects.push({
        points: matches[i + 1],
        user: matches[i + 2]
      });
    }
  }
  console.log(matches);
  console.log(pointObjects);
  pointObjects.forEach(function(pointObject) {
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
  });
}

module.exports = function(controller) {
  controller.hears(
    [awardPointsRegEx],
    ['direct_message', 'direct_mention' , 'mention', 'ambient'],
    awardPoints
  );
  controller.hears(
    [awardPointsMentionRegEx],
    ['direct_message', 'direct_mention', 'mention', 'ambient'],
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
            awardPoints(bot, message);
          }
        });
      }
    });
};

function response(bot, message, pointObject, point) {
  bot.reply(message, 'Awarded!  ' + pointObject.user + ' now has ' +
    point.points + ' points');
}
