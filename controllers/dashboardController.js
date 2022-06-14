const User = require("../model/user");
const bcrypt = require('bcryptjs');
const Session = require("../model/session");

exports.loginForm = (req, res, next) => {
    
    console.log(req.headers["user-agent"]);
    console.log(req.headers["accept"]);
    console.log(req.headers["accept-language"]);
    if(req.cookies["session-identifier"]) {
        let sessionIdentifier = req.cookies["session-identifier"];
        return Session.findOne({ where: { identifier: sessionIdentifier}}).then(session => {
            if(session) {
            return session.getUsers().then( users => {
                if(users[0] != null) {
                    let user = users[0];
                    res.status(200).render('dashboard', {sessionIdentfier: session.identifier, email: user.email});  
                } else {
                    res.status(200).render('loginForm');    
                }             
            })
            } else {
                res.status(200).render('loginForm');    
            }
        })

        
    } else {
        res.status(200).render('loginForm');    
    }
    
};

exports.loginRequest = (req, res, next) => {
    var login = req.body.login;
    var password = req.body.password;
 
    if(login) {
        if (password) {  
            return User.findOne({ where: { email: login}}).then( user => {
                if(user) {
                    bcrypt.hash(password, 12).then (hashedPassword => {
                        if(hashedPassword) {
                            if(user.passwordHash == password) {
                                        let sessionIdentifier = bcrypt.genSaltSync(1);
                                        let userAgent = req.headers["user-agent"];
                                        let accept = req.headers["accept"];
                                        let acceptLanguage = req.headers["accept-language"]; 
                                       return user.getSessions().then( sessions => {
                                        sessions.forEach( session => { 
                                            session.destroy();
                                        })
                                            return Session.create( {
                                                identifier: sessionIdentifier,
                                                userAgent: userAgent,
                                                acceptedLanguage: acceptLanguage}).then ( session => {
                                                return user.addSession(session).then (data => {
                                                        return user.save().then( user => { 
                                                            if(user != null) {
                                                                res.cookie("session-identifier", sessionIdentifier);
                                                                res.redirect('/public/dashboard');
                                                            } else {
                                                                res.status(500).json({"message": "server internal error"});
                                                            }
                                                        })
                                                    })
                                                });
                                        })                 
                              
        
                            } else {
                                return bcrypt.compare(password, user.passwordHash).then( result => {
                                    if(result == true) {
                                        let sessionIdentifier = bcrypt.genSaltSync(1);
                                        let userAgent = req.headers["user-agent"];
                                        let accept = req.headers["accept"];
                                        let acceptLanguage = req.headers["accept-language"];                  
                                        return Session.create( {
                                            identifier: sessionIdentifier,
                                            userAgent: userAgent,
                                            acceptedLanguage: acceptLanguage}).then ( session => {
                                               return user.addSession(session).then (data => {
                                                    return user.save().then( user => { 
                                                        if(user != null) {
                                                            res.cookie("session-identifier", sessionIdentifier);
                                                            res.redirect('/public/dashboard');
                                                        } else {
                                                            res.status(500).json({"message": "server internal error"});
                                                        }
                                                    })
                                                })
                                            });
                                    } else {
                                        res.status(401).json({"message": "Bad credientials"});
                                    }
                                })
                            }
                        } else {
                            res.status(500).json({"message": "Internal error"})
                        }})
                } else {
                   res.status(403).json({"message": "Bad credientials"});
                }
            })
        } else {
            res.status(403).json({"message": "Bad credientials"});
        }
    } else {
        res.status(403).json({"message": "Bad credientials"});
    }
};

exports.logoutRequest = (req, res, next) => {
    let email = req.body.email;
    let sessionIdentfier = req.body.sessionIdentfier;
 
    if(email) {
        if (sessionIdentfier) {  
            return User.findOne({ where: { email: email}}).then( user => {
                if(user) {
                    return user.getSessions({where: {identifier: sessionIdentfier} }).then(sessions => {
                        if(sessions[0]) {
                            return user.removeSession(sessions[0]).then(result => {
                                res.clearCookie("session-identifier");
                                res.redirect('/public/dashboard');
                            });
                        } else {
                            res.status(403).json({"message": "Bad credientials"});
                        }
                    })
                } else {
                   res.status(403).json({"message": "Bad credientials"});
                }
            })
        } else {
            res.status(403).json({"message": "Bad credientials"});
        }
    } else {
        res.status(403).json({"message": "Bad credientials"});
    }
};