/**
 * Created by jonathan on 7/5/15.
 */

var pg = require('pg');

// Make initial connection when this application is loaded for the first time
var client = new pg.Client({
    user: "imzyqdkhwhmmly",
    password: "N_vtZuYXu_HblK2M7nG0vflupd",
    database: "d8dje8d8vfe1dp",
    port: 5432,
    host: "ec2-54-83-36-90.compute-1.amazonaws.com",
    ssl: true
});
client.connect();
console.log('SYS: established connection to pgDatabase');

module.exports = {
    getSessionByUser : function (data) {
        client.query('SELECT * from waterusage_by_session where userId=($1)', [data.userId], function(err, results) {
                console.log('do something!');

                if(err) {
                    return console.error('error running query', err);
                }
                console.log(results.rows[0]);
            }
        );
    },

    getDayByUser: function () {
        console.log('do DayByUser');

    },

    getMonthByUser: function() {
        console.log('do MonthByUser');

    }

};

/*
var client = new pg.Client({
    user: "imzyqdkhwhmmly",
    password: "N_vtZuYXu_HblK2M7nG0vflupd",
    database: "d8dje8d8vfe1dp",
    port: 5432,
    host: "ec2-54-83-36-90.compute-1.amazonaws.com",
    ssl: true
});
client.connect();

var getAllBySession = client.query('SELECT * from waterusage_per_session', function(err, results) {
    done();
        console.log('do something!');

    if(err) {
        return console.error('error running query', err);
    }
    console.log(result.rows[0]);
    }
);

    */