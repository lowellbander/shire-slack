var request = require('request');

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.get('/echo', function(request, response) {

  request.post(
    process.env.TEST_WEBHOOK,
    { payload: { text: 'look at this text' } },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
        }
    }
  );

  response.send('text: ' + request.query.text +
        ' and url is: ' + process.env.TEST_WEBHOOK);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
