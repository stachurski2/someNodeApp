const chai = require("chai");
const express = require('express');
const authentication = require('../utils/authentication');
const UserController = require('../controllers/userController');
const sinon = require("sinon");
const User = require("../model/user");
const Sensor = require("../model/sensor");
const bcrypt = require('bcryptjs');
const Authentication = require("../utils/authentication");
const Sequelize = require('sequelize');
const Messenger = require("../utils/messenger");


    describe('UserController - login', async function()  {
        it('sent nothing', function(done){
            testLogin(null, null, 400, done);
        });

        it('sent email only', function(done){
            testLogin("test@test.com", null, 400, done);
        });

        it('sent email and password, user does not exist', function(done){
            sinon.stub(User, 'findOne')
            User.findOne.resolves(null);
            testLogin("test@test.com", "tester", 403, done);
            User.findOne.restore();
        });

        it('sent email and password, user exists, wrong password', function(done){
            const testEmail = "test@test.com"
            const password = "tester"
            const truePassword = "tester1"

            bcrypt.hash(truePassword, 12).then(function(passwordHash){
                sinon.stub(User, 'findOne')
                User.findOne.resolves({
                    "id":0,
                    "email":testEmail,
                    "passwordHash":passwordHash})
                testLogin(testEmail, password, 401, done);
                User.findOne.restore();
            });  
        });

        it('sent email and password, user exists, good password', function(done){
            const testEmail = "test@test.com"
            const password = "tester"
            const truePassword = "tester"

            bcrypt.hash(truePassword, 12).then(function(passwordHash){
                sinon.stub(User, 'findOne')
                User.findOne.resolves({
                    "id":0,
                    "email":testEmail,
                    "passwordHash":passwordHash})
                testLogin(testEmail, password, 200, done);
                User.findOne.restore();
            });  
        });

        it('sent email and password, user exists, good password, hash compare throws an error ', function(done){
            const testEmail = "test@test.com"
            const password = "tester"      

            const stub1 = sinon.stub(User, 'findOne')
            const stub2 = sinon.stub(bcrypt, 'compare')

            stub1.resolves({
                "id":0,
                "email":testEmail,
                "passwordHash":password})
            stub2.throws(Error("test"));

            testLogin(testEmail, password, 500, () => { 
                done();
                stub1.restore();
                stub2.restore();
            });
        });
    });

    describe('UserController - register', async function()  {
        it('sent nothing', function(done){
            testRegister(null, null, 400, done);
        });

        it('sent email only', function(done){
            testRegister("test@test.com", null, 400, done);
        });


        it('sent email, password shorter than 3 characters', function(done){
            testRegister("test@test.com", "12", 400, done);
        });

        it('sent incorrect email, password ok', function(done){
            testRegister("testest.com", "abcdef", 400, done);
        });

        it('sent correct email, password ok, user already exists', function(done){
            const testEmail = "test@test.com"
            const password = "tester"
            sinon.stub(User, 'findOne')
            User.findOne.resolves({
                    "id":0,
                    "email":testEmail,
                    "passwordHash":password})
            testRegister(testEmail, password, 409, done);
        User.findOne.restore();
        });

        it('sent correct email, password ok, user does not exist',  function(done){
            const testEmail = "test@test.com"
            const password = "tester"
            
            const stub1 = sinon.stub(Sequelize.Model, 'findOne')

            const stub2 = sinon.stub(Sequelize.Model, 'create')

            User.findOne.resolves(null)
            stub2.resolves({"id":0});
            testRegister(testEmail, password, 201, () => {
                done();
                stub1.restore();
                stub2.restore();
            });
        });

        it('sent correct email, password ok, user does not exist but database cannot create new one',  function(done){
            const testEmail = "test@test.com"
            const password = "tester"
            const stub1 = sinon.stub(User, 'findOne')
            const stub2 = sinon.stub(User, 'create')
            stub1.resolves(null)
            stub2.resolves(null);
            testRegister(testEmail, password, 500, () => {
                done();
                stub1.restore();
                stub2.restore();
            });
        });
    });

    describe('UserController - remindPassword', async function()  {
        it('sent nothing', function(done){
            testRemindPassword(null, 400, done);
        });

        it('sent incorrect string', function(done){
            testRegister("testtest.com", null, 400, done);
        });

        it('sent email, user does not exist', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves(null)
            testRemindPassword('test@test.com', 200, () => {
                done();
                stub1.restore();
            });
        });

        it('sent email, user exists, email sent success', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                            save: function(){}})
            const stub2 = sinon.stub(Messenger.messenger, 'sendEmail')
            stub2.resolves({"accepted": {
                "length":1
            }});

            testRemindPassword('test@test.com', 200, () => {
                done();
                stub1.restore();
                stub2.restore();
            });
        });

        it('sent email, user exists, email sent failed', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                            save: function(){}})
            const stub2 = sinon.stub(Messenger.messenger, 'sendEmail')
            stub2.resolves({"accepted": {
                "length":0
            }});

            testRemindPassword('test@test.com', 500, () => {
                done();
                stub1.restore();
                stub2.restore();
            });
        });
    });

    describe('UserController - userDelete', async function() {
        it('attempted deleted user if user is not admin', function(done){
            testDeleteUser(false, null, 403, done);
        });

        it('attempted deleted user if user is not admin', function(done){
            testDeleteUser(false, "someId", 403, done);
        });

        it('attempted deleted some user if user is admin, did not set userId', function(done){
            testDeleteUser(true, null, 400, done);
        });

        it('attempted deleted some user if user is admin, set userId, did not found specified user', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves(null);
            testDeleteUser(true, "someUserId", 422, () => {
                done();
                stub1.restore();
            }); 
        });

        it('attempted deleted some user if user is admin, set userId, found specified user', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                            destroy: function(){},
                            save: function(){}})
            testDeleteUser(true, "someUserId", 202, () => {
                done();
                stub1.restore();
            }); 
        });
    });

    describe('UserController - userList', async function() {
        it('attempted get list if user is not admin', function(done){
            testUserList(false, 403, done);
        });
    
        it('attempted get list  if user is admin', function(done){
            const stub1 = sinon.stub(User, 'findAll')
            stub1.resolves([{"id":0,
                            destroy: function(){},
                            save: function(){}}])

            testUserList(true, 200, () => {
                done();
                stub1.restore();
            });
        });
    });


    describe('UserController - save new password', async function() {
        it('attempted save new password, without secret key', function(done){
            testSaveNewPassword(null, null, null, 401, done);
        });

        it('attempted save new password, with secret key, but user not found', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves(null)
            testSaveNewPassword("testKey", null, null, 403, () => {
                done();
                stub1.restore();
            });
        });

        it('attempted save new password, with secret key,  user found, no passwords', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                    destroy: function(){},
                    save: function(){}})
            testSaveNewPassword("testKey", null, null, 400, () => {
                done();
                stub1.restore();
            });
        });

        it('attempted save new password, with secret key,  user found, one password', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                    destroy: function(){},
                    save: function(){}})
            testSaveNewPassword("testKey", "testPassword", null, 400, () => {
                done();
                stub1.restore();
            });
        });

        it('attempted save new password, with secret key,  user found, two diffrent passwords', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                    destroy: function(){},
                    save: function(){}})
            testSaveNewPassword("testKey", "testPassword", "testPassword1", 400, () => {
                done();
                stub1.restore();
            });
        });

        it('attempted save new password, with secret key,  user found, two same passwords, short ones', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                    destroy: function(){},
                    save: function(){}})
            testSaveNewPassword("testKey", "ab", "ab", 400, () => {
                done();
                stub1.restore();
            });
        });

        it('attempted save new password, with secret key,  user found, two same passwords, long ones', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                    destroy: function(){},
                    save: function(){}})
            testSaveNewPassword("testKey", "testPassword", "testPassword", 202, () => {
                done();
                stub1.restore();
            });
    });

    it('attempted save new password, with secret key,  user found, two same passwords, long ones, encoding failed', function(done){
        const stub1 = sinon.stub(User, 'findOne')
        stub1.resolves({"id":0,
                destroy: function(){},
                save: function(){}})
        const stub2 = sinon.stub(bcrypt, 'hash')
        stub2.resolves(null);
        testSaveNewPassword("testKey", "testPassword", "testPassword", 500, () => {
            done();
            stub1.restore();
            stub2.restore();
        });
        });
    });

    describe('UserController - change password', async function() {
        it('attempted change password, no password and userId', function(done){
            testChangePassword(null, null, 403, done)
        });

        it('attempted change password, only userID set', function(done){
            testChangePassword("testId", null, 400, done)
        });

        it('attempted change password, short password set', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                    destroy: function(){},
                    save: function(){}})
            testChangePassword("testId", "ab", 400, () => {
                done();
                stub1.restore();
            })
        });

        it('attempted change password, password set', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                    destroy: function(){},
                    save: function(){}})
                testChangePassword("testId", "testPassword", 202, () => {
                done();
                stub1.restore();
            })
        });

        it('attempted change password, password set, encoding failed', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                    destroy: function(){},
                    save: function(){}})
            const stub2 = sinon.stub(bcrypt, 'hash')
            stub2.resolves(null);
            testSaveNewPassword("testKey", "testPassword", "testPassword", 500, () => {
                done();
                stub1.restore();
                stub2.restore();
            });
        });
    });

    describe('UserController - add sensor to user', async function() {
        it('attempted to add user, no data sent', function(done){
            testAddSensorToUser(null, null, null, 400, done)
        });

        it('attempted to add user, sent user id', function(done){
            testAddSensorToUser("testUserId", null, null, 400, done)
        });

        it('attempted to add user, sent user id, sensor id', function(done){
            testAddSensorToUser("testUserId", "testSensorId", null, 400, done)
        });

        it('attempted to add user, sent user id, sensor id, did not find user', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves(null)
            testAddSensorToUser("testUserId", "testSensorId", "testSensorKey", 400, () => { 
                done();
                stub1.restore();
            })
        });

        it('attempted to add user, sent user id, sensor id, found user, did not find sensor', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                         destroy: function(){},
                           save: function(){}})
            const stub2 = sinon.stub(Sensor, 'findOne')
            stub2.resolves(null);
            testAddSensorToUser("testUserId", "testSensorId", "testSensorKey", 400, () => { 
                done();
                stub1.restore();
                stub2.restore();
            })
        });

        it('attempted to add user, sent user id, sensor id, found user, found sensor, key is invalid', function(done){
            const sensorId = "testSensorId"
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                         destroy: function(){},
                           save: function(){}})
            const stub2 = sinon.stub(Sensor, 'findOne')
            stub2.resolves({"externalIdentifier":sensorId,
                             "key":"otherKey"});
            testAddSensorToUser("testUserId", sensorId, "testSensorKey", 400, () => { 
                done();
                stub1.restore();
                stub2.restore();
            })
        });

        it('attempted to add user, sent user id, sensor id, found user, found sensor, key is valid', function(done){
            const sensorId = "testSensorId"
            const sensorKey = "testSensorKey"

            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                         addSensor: function(){},
                           save: function(){}})
            const stub2 = sinon.stub(Sensor, 'findOne')
            stub2.resolves({"externalIdentifier":sensorId,
                                           "key":sensorKey});
            testAddSensorToUser("testUserId", sensorId, sensorKey, 201, () => { 
                done();
                stub1.restore();
                stub2.restore();
            })
        });

        it('attempted to add user, sent user id, sensor id, found user, found sensor, key is valid', function(done){
            const sensorId = "testSensorId"
            const sensorKey = "testSensorKey"

            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                         addSensor: function(){},
                           save: function(){}})
            const stub2 = sinon.stub(Sensor, 'findOne')
            stub2.resolves({"externalIdentifier":sensorId,
                                           "key":sensorKey});
            testAddSensorToUser("testUserId", sensorId, sensorKey, 201, () => { 
                done();
                stub1.restore();
                stub2.restore();
            })
        });
    });

    describe('UserController - delete sensor from user', async function() {
        it('attempted to add user, no data sent', function(done){
            testDeleteSensorFromUser(null, null, null, 400, done)
        });

        it('attempted to add user, assigned user id', function(done){
            testDeleteSensorFromUser("testUserId", null, null, 400, done)
        });

        it('attempted to add user, assigned user id, assigned sensor id, but user does not have any sensor', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                         getSensors: function(){
                             return []
                         },
                           save: function(){}})
            testDeleteSensorFromUser("testUserId", "testSensorId", null, 400, () => {
                stub1.restore();
                done();
            })
        });


        it('attempted to add user, assigned user id, assigned sensor id, but user has other sensors', function(done){
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                         getSensors: function(){
                             return [{
                                 externalIdentifier: "testSensorId1"
                             }]
                         },
                           save: function(){}})
            testDeleteSensorFromUser("testUserId", "testSensorId2", null, 400, () => {
                stub1.restore();
                done();
            })
        });

        it('attempted to add user, assigned user id, assigned sensor id, user has other the sensor', function(done){
            const sensorId = "testSensorId"
            const stub1 = sinon.stub(User, 'findOne')
            stub1.resolves({"id":0,
                         getSensors: function(){
                             return [{
                                 externalIdentifier: sensorId
                             }]
                         },
                         removeSensor: function(){},
                           save: function(){}})
            testDeleteSensorFromUser("testUserId", sensorId, null, 202, () => {
                stub1.restore();
                done();
            })
        });

        it('attempted to add user, assigned user id, assigned sensor id, user has other main sensor', function(done){
            const sensorId = "testSensorId"
            const defaultSensorId = "otherSensorId"
            const stub1 = sinon.stub(User, 'findOne')
            var user = {"id":0,
            getSensors: function(){
                return [{
                    externalIdentifier: sensorId
                }]
            },
            removeSensor: function(){},
              save: function(){
                  if(this.mainSensorId == "otherSensorId") {
                        done();
                        stub1.restore();
                  }
                 
              },
              mainSensorId: "otherSensorId"}
            stub1.resolves(user)
            testDeleteSensorFromUser("testUserId", sensorId, true, 202, null)
        });

        it('attempted to add user, assigned user id, assigned sensor id, user has this main sensor', function(done){
            const sensorId = "testSensorId"
            const stub1 = sinon.stub(User, 'findOne')
            var user = {"id":0,
            getSensors: function(){
                return [{
                    externalIdentifier: sensorId
                }]
            },
            removeSensor: function(){},
              save: function(){
                  if(this.mainSensorId == null) {
                        done();
                        stub1.restore();
                  }
                 
              },
              mainSensorId: sensorId}
            stub1.resolves(user)
            testDeleteSensorFromUser("testUserId", sensorId, true, 202, null)
        });
    });

function testLogin(email, password, expectedStatusCode, done) {
    const req = {
        body: {
            "email":email,
            "password":password
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.login(req, res, () => {}).then( function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })
}

function testRegister(email, password, expectedStatusCode, done) {
    const req = {
        body: {
            "email":email,
            "password":password
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }
    UserController.registerUser(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    }) 
}

function testRemindPassword(email, expectedStatusCode, done) {
    const req = {
        body: {
            "email":email,
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.remindPassword(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    }) 
}

function testDeleteUser(isAdmin, userId, expectedStatusCode, done) {

    const req = {
        query:{
            "userId":userId
        },
        user: {
            isAdmin: isAdmin
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.deleteUser(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    }) 
}

function testUserList(isAdmin, expectedStatusCode, done) {

    const req = {
        user: {
            isAdmin: isAdmin
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.userList(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })
}

function testSaveNewPassword(secretKey, password, repeatPassword, expectedStatusCode, done) {

    const req = {
        body: {
            secret: secretKey,
            password: password,
            repeatPassword: repeatPassword
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.saveNewPassword(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })
}

function testChangePassword(userId, password, expectedStatusCode, done) {

    const req = {
        body: {
            password: password
        },
        user: {
            id:userId
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.changePassword(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })
}

function testAddSensorToUser(userId, sensorId, sensorKey, expectedStatusCode, done) {
    const req = {
        body: {
            sensorId: sensorId,
            sensorKey: sensorKey
        },
        user: {
            id:userId
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.addSensor(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })
}

function testDeleteSensorFromUser(userId, sensorId, isMainSensor, expectedStatusCode, done) {
    const req = {
        body: {
            sensorId: sensorId,
        },
        user: {
            id:userId,
            mainSensorId: isMainSensor ? sensorId : null
        }
    }

    const res = {
        send: function(){},
        json: function(d) {},
        status: function(s) {
            this.statusCode = s;
            return this;
        }
    }

    UserController.deleteSensor(req, res, () => {}).then(function(result) {
        chai.expect(res.statusCode).to.equal(expectedStatusCode);
        done();
    })
}