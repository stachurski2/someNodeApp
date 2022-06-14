const Sequelize = require('sequelize');

const database = require('../utils/database');

const SessionItem = database.sequelize.define('SessionItem', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    }
});

module.exports = SessionItem;