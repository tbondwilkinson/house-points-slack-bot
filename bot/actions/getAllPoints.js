var db = require('../../models');

module.exports = function(controller) {
  controller.hears(
    [
      'how many points does everyone have',
      'list out points',
      'ls points',
      'what are the point totals'],
    ['direct_message', 'direct_mention', 'mention'],
    function(bot, message) {
      db.models.points.findAll({
        order: 'points DESC'
      }).then(function(pointObjs) {
        var replyMessage = 'Here are the point totals:\n';
        pointObjs.forEach(function(pointObj) {
          replyMessage += pointObj.entity + ': ' + pointObj.points + '\n';
        });
        bot.reply(message, replyMessage);
      });
    });
};
