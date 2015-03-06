var Request = require('request');

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
  MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
    assert.equal(null, err);
    console.log("connected correctly to server");
    db.close();
  });

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.get('/mongo-test', function(request, response) {
  MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
    assert.equal(null, err);
    console.log('Slack successfully triggered a database connection');
    db.close();
  })
})

app.get('/test', function(request, response) {

  var payload = '{"text": \"Your text: ' + request.query.text + '\"}'
  var options = {
    uri: process.env.TEST_WEBHOOK,
    form: payload
  };
  Request.post(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body.name);
    } else {
      console.log('error: '+ response.statusCode + body);
    } 
  });

  response.send('you reached the test endpoint: ' + request.query.text);
});

app.get('/echo', function(request, response) {

  /*
  request.post(
    process.env.TEST_WEBHOOK,
    { form: { key: 'value' } },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
  );
  */

  response.send('text: ' + request.query.text +
        ' and url is: ' + process.env.TEST_WEBHOOK);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
