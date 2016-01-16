'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(
  'points', process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialict: 'mysql'
  });
var db = {
  models: {}
};

fs.readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db.models[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db.models[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
