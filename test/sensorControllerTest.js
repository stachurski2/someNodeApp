const chai = require("chai");
const express = require('express');
const authentication = require('../utils/authentication');
const SensorController = require('../controllers/sensorController');
const sinon = require("sinon");
const User = require("../model/user");
const Sensor = require("../model/sensor");
const bcrypt = require('bcryptjs');
const Authentication = require("../utils/authentication");
const Sequelize = require('sequelize');
const Messenger = require("../utils/messenger");
const got = require('got');

before( () => { 
    sinon.reset();
})

describe('SensorController - getSensorList', async function()  {


    it('sent nothing', function(done){
        testGetSensorList(null, 400, done);
    });

    it('sent userId, did not find user', function(done){
        const stub1 = sinon.stub(User, 'findOne')
        stub1.resolves(null)
        testGetSensorList("testUserId", 400, () => {
            done();
            stub1.restore();
        });
    });

    it('sent userId, user found, sensors function returns array with many elements', function(done){
        var sensorArray = [{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"} ]
        const stub1 = sinon.stub(User, 'findOne')
        const stub2 = sinon.stub(sensorArray, 'map')
        stub2.returns({data: sensorArray,
                forEach: () => {}}
            )
        stub1.resolves({"id":"id",
                        getSensors: () => sensorArray })
        testGetSensorList("testUserId", 200, (result) => {
            if(result.jsonData.sensors.data.length == sensorArray.length) {
                done();
            }
            stub1.restore();
            stub2.restore();
        });
    });

    it('sent userId, user found, sensors function returns array with many elements', function(done){
        var sensorArray = [{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"},{sensorId:"sensorId"} ]
        const stub1 = sinon.stub(User, 'findOne')
        const stub2 = sinon.stub(sensorArray, 'map')
        stub2.returns({data: sensorArray,
                forEach: () => {}}
            )
        stub1.resolves({"id":"id",
                        getSensors: () => sensorArray })
        testGetSensorList("testUserId", 200, (result) => {
            if(result.jsonData.sensors.data.length == sensorArray.length) {
                done();
            }
            stub1.restore();
            stub2.restore();
        });
    });
});

function testGetSensorList(userId, expectedStatusCode, done) {
    const req = {
        user: {
            id:userId
        }
    }

    const res = {
        send: function(){},
        json: function(d) {
            this.jsonData = d 
            return this
        },
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    SensorController.getSensorListForUser(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done(result);
    })
}

