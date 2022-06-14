
const User = require("../model/user");

exports.getResetPasswordForm = async (req, res, next) => {
    if(req.query.secret) {
        const user = await User.findOne({ where: {resetPasswordKey: req.query.secret }})
        if(user) {
            res.status(200).render('resetPassword', {secret: req.query.secret, email: user.email});
            return
        }
        res.status(403).json({"message": "Didn't find requested user"});
        return
    } 
    res.status(401).json({"message": "No rights to this operation"});
}

