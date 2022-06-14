const KeyGenerator = require('uuid-key-generator');
const User = require("../model/user");
const Sensor = require("../model/sensor");
const Authentication = require("../utils/authentication");
const Messenger = require("../utils/messenger");
const bcrypt = require('bcryptjs');
const Sequelize = require('sequelize');

exports.login = async (req, res, next) => {
    const email = req.body.email 
    if(email) {
        const password = req.body.password
        if (password) {  
            const user = await User.findOne({ where: { email: email}})
            if(user) {
                try { 
                    const result = await bcrypt.compare(password, user.passwordHash)
                        if(result == true) {
                        return res.status(200).json({"message": "Authorization Succeded",
                                                        "token": Authentication.authentication.getTokenFor(email, password),
                                                    "authMethod": "Basic"});
                    } 
                    return res.status(401).json({"message": "Bad credientials"});
                }  catch(error) {
                    return res.status(500).json({"message":"internal error"});
                } 
                return res.status(403).json({"message": "Bad credientials"});                
            }
            return res.status(403).json({"message": "Bad credientials"});
        }
        return res.status(400).json({"message": "You didn't set password"});
    } 
     res.status(400).json({"message": "You didn't set email"});
     return;
}

exports.registerUser = async (req, res, next) => {
    const email = req.body.email 
    let name = req.body.name
    if(name == null) {
        name = "noname"
    } 

    if(email) {
        if(validateEmail(email)) {
             const password = req.body.password 
             if(password) {
                if(password.length > 3 ) {
                     const user = await User.findOne({ where: { email: email }})
                     if(user) {
                         res.status(409).json({"message": "Email is already taken "});
                         return
                     } else {
                        const hashedPassword = await bcrypt.hash(password, 12)

                        if(hashedPassword != null) {
                            const user = await  User.create({email: email,
                                                             name: name,
                                                     passwordHash: hashedPassword,
                                                           active: false,
                                                          isAdmin: Authentication.authentication.shouldBeAdmin(email)})
                            if(user) {
                                return res.status(201).json({"message": "Account created",
                                                        "token": Authentication.authentication.getTokenFor(email, password)});
                            } 
                            return res.status(500).json({"message": "internal error"});
                        } 
                        return res.status(500).json({"message": "internal error"});
                   }
                 }
                 return res.status(400).json({"message": "Password must contain at least 3 characters"});    
             }
             return res.status(400).json({"message": "You didn't set password"});
         } 
         return res.status(400).json({"message": "email incorrect"});
     } 
    res.status(400).json({"message": "You didn't set email"});
}

exports.remindPassword = async (req, res, next) => {  
    const email = req.body.email 
    const emailTitle = "Whiff - password reset query"
    const keygen = new KeyGenerator()
    if(email) {
        if(validateEmail(email)) {
            const user = await User.findOne({ where: { email: email}})   
            if(user) {
                user.resetPasswordKey = keygen.generateKey();
                const adress = process.env.ADRESS + "/resetPasswordForm?secret=" + user.resetPasswordKey; 
                const emailText = "Hello, \n \n Likely, you requested reset email. \n Link: " + adress + "\n If you didn't requested, ignore this email. \n Regards, \n Whiff Team \n \n Please do not reply this email. "
                await user.save()
                const result = await Messenger.messenger.sendEmail(email, emailTitle, emailText)  
                if(result.accepted.length > 0) {
                    return res.status(200).json({"message": "request succeeded"});
                } 
                return res.status(500).json({ "message": "send email failed"});
            } 
            return res.status(200).json({"message": "request succeeded"});
        } else {
            return res.status(400).json({"message": "did not set correct payload"});
        }
    }
    return res.status(400).json({"message":"missing data"});

        
}

exports.deleteUser = async (req, res, next) => {
    if(req.user.isAdmin) {
        const userId = req.query.userId 
        if(userId) {
            const user = await User.findOne({ where: { id: userId }})
            if(user) {
                await user.destroy()
                return res.status(202).json({"message": "removed object"});
            }
            return res.status(422).json({"message": "Didn't find user you requested"});   
        } 
        return res.status(400).json({"message": "Didn't set userId"});
    }
    res.status(403).json({"message": "No rights to this operation."});
}


exports.userList = async (req, res, next) => {
    if(req.user.isAdmin) {
        const users = await User.findAll({ raw : true, nest : true })
        users.forEach( user => {
            delete user['passwordHash']
        })
        return res.status(200).json({"user":users});
    } 
    res.status(403).json({"message": "No rights to this operation."});
}

exports.saveNewPassword = async (req, res, next) => {
    if(req.body.secret) {
        const user = await User.findOne({ where: { resetPasswordKey: req.body.secret }})
        if(user) {
            if(req.body.password == req.body.repeatPassword && req.body.password != null) {
                if(req.body.password.length > 3 ) {
                    const hashedPassword = await bcrypt.hash(req.body.password,12)
                    if(hashedPassword) {
                        user.passwordHash = hashedPassword
                        user.resetPasswordKey = null
                        await user.save()
                        if(user) {
                            return res.status(202).json("success");
                        } 
                        return res.status(500).json("failure");
                    } 
                    return res.status(500).json("failure");
                } 
                return res.status(400).json({"message": "Password must contain at least 3 characters."});
            } 
            return res.status(400).json({"message": "Passwords don't match."});
        } 
        return res.status(403).json({"message": "Didn't find requested user"});
    } 
    res.status(401).json({"message": "No rights to this operation"});
}

exports.changePassword = async (req, res, next) => {
    const userId = req.user.id 
    const password = req.body.password
    if(userId) {
        if(password) {
            const user = await User.findOne({ where: { id: userId }})
            if(user) {
                if(password.length > 3 ) {
                    const hashedPassword = await bcrypt.hash(password, 12)
                    if(hashedPassword) {
                        user.passwordHash = hashedPassword
                        await user.save()
                        return res.status(202).json({"message": "Password Changed",
                                                "token": Authentication.authentication.getTokenFor(user.email, req.body.password)});
                        
                    } 
                    return res.status(500).json("failure");
                } 
                return res.status(400).json({"message": "Password too short."});
            }
            return res.status(400).json({"message": "Didn't find requested user."});
        }
        return res.status(400).json({"message": "You didn't set password parameter in body."});
    } 
    res.status(403).json({"message": "Unauthorized"}); 
}


exports.requestDemo = async (req, res, next) => {  
    let userId = req.user.id 
    if(userId) {
        const user = await User.findOne({ where: { id: userId }})
        if(user) {
            addDemoSensorsTo(user);
            return res.status(201).json({"message": "demo sensors added"});
        }
        return res.status(400).json({"message": "Didn't find requested user."});
    } 
    res.status(400).json({"message": "You didn't set userId parameter in body."});
}

exports.addSensor = async (req, res, next) => {  
    let userId = req.user.id 
    let sensorId = req.body.sensorId 
    let key = req.body.sensorKey
    if(key) {
        if(sensorId) {
            if(userId) {
                const user = await User.findOne({ where: { id: userId }})
                if(user) {
                    const sensor = await Sensor.findOne({where: { externalIdentifier: sensorId}})
                    if(sensor) {
                        if(sensor.key == key) {
                            user.addSensor(sensor);
                            if(sensor.isInsideBuilding == false) {
                                user.mainSensorId = sensor.externalIdentifier;
                            }
                            await user.save();
                            return res.status(201).json({"message": "sensor added"});
                        } else {
                            return res.status(400).json({"message": "Invalid sensor key"});
                        }
                    } 
                     return res.status(400).json({"message": "Didn't find requested sensor."}); 
                } 
                return res.status(400).json({"message": "Didn't find requested user."});
            } 
            return res.status(400).json({"message": "You didn't set userId parameter in body."});
        } 
        return res.status(400).json({"message": "You didn't set sensorId."});
    } 
   res.status(400).json({"message": "You didn't set sensorKey."});
}

exports.deleteSensor = async (req, res, next) => {  
    let userId = req.user.id 
    let sensorId = req.body.sensorId 
    if(sensorId) {
        if(userId) {
            const user = await User.findOne({ where: { id: userId }})
            if(user) {
                const sensors = await user.getSensors({ where:  { externalIdentifier: sensorId }})
                if(sensors[0] && sensors[0].externalIdentifier == sensorId) {
                    await user.removeSensor(sensors[0])
                    if(user.mainSensorId == sensors[0].externalIdentifier) {
                        user.mainSensorId = null
                        await user.save()
                        return res.status(202).json({"message": "Sensor deleted"});
                    } 
                    await user.save()
                    return res.status(202).json({"message": "Sensor deleted"});
                } 
                return res.status(400).json({"message": "Didn't find sensor with requested id."});
            } 
            return res.status(400).json({"message": "Didn't find requested user."});
        }
        return res.status(400).json({"message": "You didn't set userId parameter in body."});
    }
    res.status(400).json({"message": "You didn't set sensorId."});
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

async function addDemoSensorsTo(user)  { 
    const sensor = await Sensor.findOne({where: { externalIdentifier: 97}})
    if(sensor) {
        user.addSensor(sensor);
        await user.save();
        const secondSensor = await Sensor.findOne({where: { externalIdentifier: 95}})
        if(secondSensor) {
            user.mainSensorId = sensor.externalIdentifier;
            user.addSensor(sensor);
            user.save();
        }
    } 
}
