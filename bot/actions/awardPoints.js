var db = require('../../models');

var awardPointsRegEx = '(\\d+) points to [@]?([a-zA-Z\'(){}/~#$%^&*=+-_ ]+)';

module.exports = function(controller) {
  controller.hears(
    [awardPointsRegEx],
    ['direct_message', 'direct_mention' , 'mention', 'ambient'],
    function(bot, message) {
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
      if (pointObject.points > 100) {
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
  });
};

function response(bot, message, pointObject, point) {
  bot.reply(message, 'Awarded!  ' + pointObject.user + ' now has ' +
    point.points + ' points');
}
