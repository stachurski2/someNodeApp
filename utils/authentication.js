const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
 
class Authentication {

    static getTokenFor(email, password) {
        return Buffer.from(`${email}:${password}`).toString("base64");
    }

    static authorize(req, res, next) {
        const User = require('../model/user');
        try {
        if(req.path == "/registerUser" || req.path == "/loginUser" || req.path == "/resetPassword" || req.path == "/resetPasswordForm" ||  req.path == "/saveNewPassword" || req.path == "/favicon.ico" ||  req.path.split("/")[1] == "public") {
            next();
            return;
        } else {
            if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
                res.status(401).json({ message: 'Missing Authorization Header' });
            }
            const base64Credentials = req.headers.authorization.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [username, password] = credentials.split(':');
             bcrypt.hash(password, 12).then( hashedPassword => {
                return User.findOne({ where: { email: username }}).then( user => {
                    if(user.passwordHash == password) {
                        req.user = user
                        next();
                    } else {
                        return bcrypt.compare(password, user.passwordHash).then( result => {
                            if(result == true) {
                                req.user = user
                                next();
                            } else {
                                res.status(401).json({"message": "Bad credientials"});
                            }
                        })
                    }
                })
             })
  
        }
        } catch(error) {
            return res.status(500).json({"message":"Not authetincated"});
        } 
    } 

    static shouldBeAdmin(email) {
        if(email == process.env.ADMIN_EMAIL) {
            return true; 
        }
        return false;
    }
}


exports.authentication = Authentication;

