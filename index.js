var Request = require('request');

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert')
  , ObjectID = require('mongodb').ObjectID;
  MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
    assert.equal(null, err);
    console.log("connected correctly to server");
    db.close();
  });

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var notifyGovernment = function (message) {
  var payload = '{"text": \"' + message + '\"}'
  var options = {
    uri: process.env.GOV_WEBHOOK,
    form: payload
  };
  Request.post(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body.name);
    } else {
      console.log('error: '+ response.statusCode + body);
      console.log(payload);
    } 
  });
};

// propose legislation
app.get('/propose', function (request, response) {
  MongoClient.connect(process.env.MONGOLAB_URI, function (err, db) {
    var collection = db.collection('legislation');
    var legislation = request.query.text;
    var sponsor = request.query.user_name;
    collection.insert([{
      legislation: legislation,
      sponsor: sponsor,
      ayes: [],
      nays: [],
      abstains: []
    }], function (err, result) {
      console.log(sponsor + ': ' + legislation);
      console.log(result);
      // send a message to slack
      var message = sponsor + " proposes bill `" + 
        result[0]['_id'] + "`: _" + legislation + "_";
      notifyGovernment(message);
      console.log(message);
      db.close();
    });
  }); 
});

app.get('/vote', function (request, response) {
  var usage = function () {
    console.log("usage: /vote <bill_ID> <aye|nay|abstain>");
    // TODO: utilize webhook
  };

  var input = request.query.text.split(" ");
  if (input.length != 2) {
    usage();
    return;
  }
  var id = input[0];
  var vote = input[1];
  if (vote != "aye" && vote != "nay" && vote != "abstain") {
    usage(); 
    return;
  }
  vote += "s";
  console.log(vote);

  MongoClient.connect(process.env.MONGOLAB_URI, function (err, db) {
    var query = {$push : {}};
    query['$push'][vote] = request.query.user_name;
    console.log(query);
    console.log(id);

    db.collection('legislation').update({_id : ObjectID(id)}, query, 
    function (err, result) {
      assert.equal(err, null);
      console.log(result);
      console.log("Successfully added vote.");
      db.close();
    });
  });
});

var insertDocuments = function (db, callback) {
    var collection = db.collection('documents');
    collection.insert([
        { a : 1 }, { b : 2}, {c : 3}
    ], function (err, result) {
      // assert.equal(err, null);
      // assert.equal(3, result.result.n);
      // assert.equal(3, result.ops.length);
      // console.log("Inserted 3 documents into the collection");
      callback(result);
    });
}

app.get('/mongo-test', function(request, response) {
  MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
    assert.equal(null, err);
    console.log('Slack successfully triggered a database connection');
    insertDocuments(db, function(){
      db.close();
    });
    //db.close();
  });
});

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
