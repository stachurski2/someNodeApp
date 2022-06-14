const Sequelize = require('sequelize');

const database = require('../utils/database');

const Session = database.sequelize.define('Session', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    identifier: {
        type: Sequelize.STRING,
        allowNull: false
    },
    userAgent: {
        type: Sequelize.STRING,
        allowNull: false
    },
    acceptedLanguage: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Session;