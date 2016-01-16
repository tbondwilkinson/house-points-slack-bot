'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  var Points = sequelize.define('points', {
    entity: {
      type: Sequelize.STRING,
      paranoid: true,
      primaryKey: true
    },
    points: {
      type: Sequelize.INTEGER
    }
  });
  return Points;
};
