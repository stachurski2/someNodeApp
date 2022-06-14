const Sequelize = require('sequelize');

const database = require('../utils/database');

const Sensor = database.sequelize.define('Sensor', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    externalIdentifier: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    key: {
        type: Sequelize.STRING,
        allowNull: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    locationName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    locationLat: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },
    locationLon: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },
    locationTimeZone: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },
    isInsideBuilding: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    }
});

module.exports = Sensor;