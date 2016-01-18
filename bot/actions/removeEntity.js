var capitalize = require('lodash/capitalize');

var db = require('../../models');

module.exports = function(controller) {
  controller.hears(
    [
      'remove [a-zA-Z\'(){}~#$%^&*=+\\-_ ]+'],
    ['direct_message', 'direct_mention', 'mention'],
    function(bot, message) {
      console.log('Heard remove command');
      var matches = message.text.match(
        new RegExp('remove [a-zA-Z\'(){}~#$%^&*=+\\-_ ]+', 'i'));
      console.log(matches);
      if (matches !== null && matches.length > 0) {
        var entity = matches[0].substring(7);
        db.models.points.findById(entity.toLowerCase())
          .then(function(point) {
            if (point !== null) {
              point.destroy();
              bot.reply(
                message, capitalize(entity) + ' has left the game!');
            }
          });
      }
    });
};
