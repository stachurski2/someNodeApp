const Sequelize = require('sequelize');

const database = require('../utils/database');

const User = database.sequelize.define('User', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    passwordHash: {
        type: Sequelize.STRING,
        allowNull: false
    },
    active: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    isAdmin: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    resetPasswordKey: {
        type: Sequelize.STRING,
        allowNull: true
    },
    mainSensorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
});

module.exports = User;