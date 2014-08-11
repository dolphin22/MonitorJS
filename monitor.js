var express = require('express');

var app = express();

app.set('port', process.env.PORT || 3000);

var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

var fortune = require('./lib/fortune.js');

// static middleware
app.use(express.static(__dirname + '/public'));

// home page
app.get('/', function(req, res) {
	res.render('home', {
		fortune: fortune.getFortune(),
	});
});

// custom 404 page
app.use(function(req, res) {
	res.status(404);
	res.render('404');
});

// custom 500 page
app.use(function(req, res) {
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl+C to terminate.');
});
