const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const authentication = require('./utils/authentication');
const database = require('./utils/database');
const sensorsRoutes = require('./routes/sensors');
const userRoutes = require('./routes/user');
const dasboardRoutes = require('./routes/dashboard');
const cookieParser = require('cookie-parser')

const resetPasswordRoutes = require('./routes/resetPassword');

const app = express();

app.use((req, res, next) =>  {
    return authentication.authentication.authorize(req, res, next)
})

app.use(bodyParser.urlencoded({extended: true}));
app.use('/public', express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(sensorsRoutes.routes);
app.use(userRoutes.routes);
app.use(dasboardRoutes.routes);

app.set('view engine', 'ejs');
app.set('views','views');

app.use(resetPasswordRoutes.routes);

app.use((req, res, next) => {
    res.status(400).json({"message": "Bad request"});
 });

 app.listen(process.env.PORT || 3000);

 database.database.startRun( () => {
    process.env.TZ = 'UTC'
    app.listen(process.env.PORT || 3000);
}, (error) => {
    console.log(error);
})

