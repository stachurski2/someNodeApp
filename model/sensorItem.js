const Sequelize = require('sequelize');

const database = require('../utils/database');

const SensorItem = database.sequelize.define('SensorItem', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    }
});

module.exports = SensorItem;