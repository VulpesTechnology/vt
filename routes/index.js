var express = require('express');
var router = express.Router();
var rest_client = require('node-rest-client').Client;
var transactions = require('../models/dbTransactions');


rest_client = new rest_client();

var pg = require('pg');

var client = new pg.Client({
    user: "imzyqdkhwhmmly",
    password: "N_vtZuYXu_HblK2M7nG0vflupd",
    database: "d8dje8d8vfe1dp",
    port: 5432,
    host: "ec2-54-83-36-90.compute-1.amazonaws.com",
    ssl: true
});

client.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



// TODO: Refactor and make more readable
router.get('/api/test/getAllBySession/:userId', function(req, res) {
    // curl localhost:3000/api/test/getAllBySession/1
    var query = client.query('SELECT * from waterusage_by_session where userId=($1)', [req.params.userId]);
    var retValue = [];
    query.on('row', function(row) {
        retValue.push(row);
    });

    query.on('end', function() {
        console.log('Completed Query');
        return res.json(retValue);
    });
});

router.post('/api/test/insertSession', function(req, res) {
    // curl --data "userId=1&faucetId=1&usage=210" localhost:3000/api/test/insertSession
    var date = new Date();
    console.log('inserting session');

    var insertQuery = client.query('INSERT INTO waterusage_by_session(userId, faucetId, usage, date) values($1, $2, $3, $4)',
        [req.body.userId, req.body.faucetId, req.body.usage, date]);

    insertQuery.on('end', function() {
        console.log('Completed Insert to WaterUsage_by_session');
    });

    // Find or Update Water usage by date
    var selectWaterByDate = client.query('SELECT * FROM waterusage_by_day where userId=($1) AND date=($2)',
        [req.body.userId, date /* formatted */]);


    var dayIsEmpty = false;

    selectWaterByDate.on('end', function(result) {

        if(result.rowCount == 0) {
            console.log('isEmpty');
            dayIsEmpty = true;
        } else {
            console.log('isNotEmpty');
            dayIsEmpty = false;
        }
        console.log('isEmpty?' + dayIsEmpty);
        console.log('Finished Select from UsageByDay');
    });
    console.log('outside of block isEmpty?' + dayIsEmpty);



    // Insert or update water usage by month

    res.redirect('/api/test/getAllBySession/' + req.body.userId);

});

router.get('/api/v1/getxive', function(req, res) {
    console.log('get from endpoint /api/v1/getxive');
    var args = {
        headers:{
            "X-ApiKey":"7piMM7npQnuLUxBDsDGl3b3yjosgOdZaiWM53KeTivIPV5zj",
            "Content-Length":"30",
            "Host":"api.xively.com"
        }
    };

    var max_value = 0;
    var adjustment = .98;
    var adjusted_value = 0;
    var color;
    var color_range;
    rest_client.get('https://api.xively.com/v2/feeds/866813937.json?datastreams=meter_reading', args, function(data, response) {
        var jsonString = JSON.parse(data);
        for(var i = 0; i < jsonString.datastreams.length; i++) {
            max_value += jsonString.datastreams[i].max_value;
        }

        adjusted_value = max_value * adjustment;
        color_range = 100/7;
        var range = 0;

        if(0 < adjusted_value < range + color_range) {
            color = 'GREEN';
        } else if (range < adjusted_value < range + color_range) {
            color = 'TEAL';
        }
        else if (range < adjusted_value < range + color_range) {
            color = 'BLUE';
        }
        else if (range < adjusted_value < range + color_range) {
            color = 'PURPLE';
        }
        else if (range < adjusted_value < range + color_range) {
            color = 'WHITE';
        }
        else if (range < adjusted_value < range + color_range) {
            color = 'ORANGE';
        }
        else if (range < adjusted_value < range + color_range) {
            color = 'RED';
        }

        var jsonString = {
            'adjusted_value': '<' + adjusted_value + '>',
            //'color': color,
            'total_usage': max_value
            //'how_many_times_did_i_turn_on_the_faucet': jsonString.datastreams.length,
            //'timestamp': new Date()
        };
        return res.json(jsonString);
    });



});

router.post('/api/v1/postdata', function(req, res) {
    console.log('post at endpoint /api/v1/postdata');

    var results = [];

    // Grab data from http request
    var data = {userId: req.body.userId, usage: req.body.usage};

    // Get a Postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        var date = new Date();


        // SQL Query > Insert Data
        client.query("INSERT INTO waterusage_by_session(userId, milliliter, date) values($1, $2, $3)", [data.userId, data.usage, pgFormatDate(date)]);

        console.log('receivingPost');
        var query = client.query("SELECT * from waterusage_by_month where userId=($1)", [data.userId]);

        query.on('row', function(row) {
            results.push(row);
            if(row.length == 0) {
                console.log('Do Insert');
                client.query('INSERT INTO waterusage_by_month(userId, month, milliliter, lastUpdate) values($1, $2, $3, $4)', [data.userId, 'June', data.usage, pgFormatDate(date)]);
                console.log('done');
            } else {
                console.log('Do update');
                client.query('UPDATE waterusage_by_month SET milliliter = milliliter + ($1), lastUpdate = ($2) where userId=($3)', [data.usage, pgFormatDate(date), data.userId]);
            }
        });
        /*
        var query = client.query("SELECT * FROM waterusage_by_month ORDER BY userId ASC");

        console.log(query);
        // Stream results back one row at a time
        query.on('row', function(row) {
            console.log('Test');
            results.push(row);
            console.log('Test2');

        });
        */

        // SQL Query > Select Data
        /*var query = client.query("SELECT * FROM waterusage_by_session ORDER BY sessionId ASC");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });
        */

        // After all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // Handle Errors
        if(err) {
            console.log(err);
        }

    });
});

router.get('/api/v1/sessionUsage', function(req, res) {

    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM waterusage_by_session ORDER BY userId ASC;");


        console.log(query);
        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // Handle Errors
        if(err) {
            console.log(err);
        }

    });

});

module.exports = router;
