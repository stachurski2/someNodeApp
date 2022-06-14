const Sensor = require('../model/sensor');
const User = require("../model/user");
const Request = require('request');

var dayjs = require('dayjs');


exports.getSensorListForUser = async (req, res, next) => {
    const userId = req.user.id 
    if(userId != null) {
        const user = await User.findOne({ where: { id: userId }})
            if(user) {
                let sensors = await user.getSensors()
                if(sensors){
                    let sensorsJson = sensors.map( sensor => { return sensor.toJSON()})
                    sensorsJson.forEach( sensor => {
                        delete sensor['id']
                        delete sensor['createdAt']
                        delete sensor['updatedAt']
                        delete sensor['SensorItem']
                        delete sensor['key']
                    })
                    return res.status(200).json({"sensors":sensorsJson});
                }
                return res.status(500).json({"message": "internal error"});
            }
            return res.status(400).json({"message": "Didn't find user with requested id."});
        }
    res.status(400).json({"message": "You didn't set userId parameter in body."});
};

exports.getAllSensors = async (req, res, next) => {
    if(req.user.isAdmin == true) {
        const sensors = await Sensor.findAll({ raw : true, nest : true })
        sensors.forEach( sensor => {
            delete sensor['id']
            delete sensor['createdAt']
            delete sensor['updatedAt']
        })
        return res.status(200).json({"sensors":sensors});
    } 
    res.status(403).json({"message": "No rights to this operation."});
};

exports.addSensor = async (req, res, next) => {
    if(req.user.isAdmin) {
        const sensorId = req.body.sensorId 
        const sensorName = req.body.sensorName
        const locationName = req.body.locationName
        const locationLat = req.body.locationLat
        const locationLon = req.body.locationLon
        const locationTimeZone = req.body.locationTimeZone
        const userKey = req.body.userKey
        const insideBuilding = req.body.insideBuilding
     
        if(sensorId != null) {
            if(insideBuilding == null) {
                return res.status(400).json({"message": "Didn't set sensor insideBuilding parameter"});
                
             } else {
                const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
                if(sensor != null) {
                    return res.status(409).json({"message": "Sensor already exists"});
                } else {
                    const product = await Sensor.create({ externalIdentifier: sensorId, name: sensorName, locationName: locationName, locationLat: locationLat, locationLon:locationLon, locationTimeZone: locationTimeZone, isInsideBuilding: insideBuilding, key: userKey })        
                    if(product) {
                        return res.status(201).json({"message": "Sensor created"});
                    } 
                    return res.status(500).json({"message": "Database error"});
                }
            } 
        }       
        return res.status(400).json({"message": "Didn't set external sensorId"});
    }
    res.status(403).json({"message": "No rights to this operation."});
}

exports.addSensorToUser = async (req, res, next) => {
    if(req.user.isAdmin) {
        const sensorId = req.body.sensorId 
        const userId = req.body.userId
        const defaultSensor = req.body.defaultSensor
        if(sensorId) {
            if(userId) {
                const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
                    if(sensor) {
                        const user = await User.findOne({ where: { id: userId }})
                            if(user != null) {
                                await user.addSensor(sensor)
                                if(defaultSensor == true){
                                    user.mainSensorId = sensor.externalIdentifier; 
                                }
                                await user.save()
                                if(user != null) {
                                    return res.status(201).json({"message": "success"});
                                } 
                                return res.status(500).json({"message": "server internal error"});
                            }
                        return res.status(400).json({"message": "Didn't find requested user"});
                    }
                    return res.status(400).json({"message": "Didn't find requested sensor"});
                } 
                return res.status(400).json({"message": "Didn't set userId"});
            }
        return res.status(400).json({"message": "Didn't set external sensorId"});
    }
    res.status(403).json({"message": "No rights to this operation."});
}

exports.removeSensorFromUser = async (req, res, next) => {
    if(req.user.isAdmin) {
        const userId = req.body.userId 
        const sensorId = req.body.sensorId 
        if(userId) {
            const user = await User.findOne({ where: { id: userId }})
            if(user) {
                const sensors = await user.getSensors({ where:  { externalIdentifier: sensorId }})
                if(sensors[0]) {
                    await user.removeSensor(sensors[0])
                    if(user.mainSensorId == sensors[0].externalIdentifier) {
                        user.mainSensorId = null
                        await user.save()
                        return res.status(201).json({"message": "Sensor deleted"});
                    }
                    return res.status(201).json({"message": "Sensor deleted"});
                }
                return res.status(400).json({"message": "Didn't find sensor with requested id."});
            } 
            return res.status(400).json({"message": "Didn't find user with requested id."});
        } 
        return res.status(400).json({"message": "You didn't set userId parameter in body."});
    } 
    res.status(403).json({"message": "No rights to this operation."});
}

exports.removeSensor = async (req, res, next) => {
    if(req.user.isAdmin) {
        const sensorId = req.query.sensorId 
        if(sensorId != null) {
            const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
            if(sensor != null) {
                await sensor.destroy()
                return res.status(202).json({"message": "removed  object"});
            } 
            return res.status(422).json({"message": "Didn't find sensor you requested"});
        } 
        return res.status(400).json({"message": "Didn't set external sensorId"});
    } 
    res.status(403).json({"message": "No rights to this operation."});
}

exports.setSensorAsMain = async (req, res, next) => {
    const userId = req.user.id 
    if(userId != null) {
        const sensorId = req.body.sensorId 
        if(sensorId != null) {
            const sensor = await Sensor.findOne({ where: { externalIdentifier: sensorId }})
            if(sensor != null) {
                const user = await User.findOne({ where: { id: userId }})
                if(user != null) {
                    user.mainSensorId = sensorId
                    const user = await user.save()
                    return res.status(201).json({"message": "Main sensor has been set"});      
                } 
                return res.status(500).json({"message": "Internal error"});
            } 
            return res.status(422).json({"message": "Didn't find sensor you requested"});
        } 
        return res.status(400).json({"message": "Didn't set external sensorId"});
    } 
    res.status(500).json({"message": "internal error"});
}
