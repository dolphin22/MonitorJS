var express = require('express');

var app = express();

app.set('port', process.env.PORT || 3000);

var credentials = require('./credentials.js');

var mongoose = require('mongoose');
var opts = {
	server: {
		socketOptions: { keepAlive: 1 }
	}
};

switch(app.get('env')) {
	case 'development':
		mongoose.connect(credentials.mongo.development.connectionString, opts);
		break;
	case 'production':
		mongoose.connect(credential.mongo.production.connectionString, opts);
		break;
	default:
		throw new Error('Unknown execution environment: ' + app.get('env'));
}

var handlebars = require('express-handlebars')
		.create({ 
			defaultLayout: 'main',
			helpers: {
				section: function(name, options) {
					if (!this._sections) this._sections = {};
					this._sections[name] = options.fn(this);
					return null;
				}
			}
		});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

var fortune = require('./lib/fortune.js');

// logging
switch(app.get('env')) {
	case 'development':
		app.use(require('morgan')('dev'));
		break;
	case 'production':
		app.use(require('express-logger')({
			path: __dirname + 'log/requests.log'
		}));
		break;
}


// static middleware
app.use(express.static(__dirname + '/public'));

// body-parser middleware
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

// weather widget
function getWeatherData() {
	return {
		locations: [
			{
			name: 'Portland',
			forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
			iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
			weather: 'Overcast',
			temp: '54.2 F (12.4 C)',
			},
			{
			name: 'Bend',
			forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
			iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
			weather: 'Partly Cloudy',
			temp: '55.0 F (12.8 C)',
			},
		],
	};
};

app.use(function(req, res, next) {
	if (!res.locals.partials) res.locals.partials = {};
	res.locals.partials.weather = getWeatherData();
	next();
});

// home page
app.get('/', function(req, res) {
	res.render('home', {
		fortune: fortune.getFortune(),
	});
});

// jQuery test
app.get('/jquery', function(req, res) {
	res.render('jquery-test');
});

app.get('/nursery-rhyme', function(req, res) {
	res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res) {
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
});

// newsletter
app.get('/newsletter', function(req, res) {
	res.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.post('/process', function(req, res) {
	if (req.xhr || req.accepts('json,html') === 'json') {
		res.send({ success: true });
	} else {
		res.redirect(303, '/thank-you');
	}
});

var Vacation = require('./models/vacation.js');
Vacation.find(function(err, vacations) {
	if (vacations.length) return;

	new Vacation({
		name: 'Hood River Day Trip',
		slug: 'hood-river-day-trip',
		category: 'Day Trip',
		sku: 'HR199',
		description: 'Spend a day sailing on the Columbia and ' + 
				'enjoying craft beers in Hood River',
		priceInCents: 9995,
		tags: ['day trip', 'hood river', 'sailing', 'windsurfing'],
		inSeason: true,
		maximumGuests: 16,
		available: true,
		packagesSold: 0,
	}).save();
});

app.get('/vacations', function(req, res) {
	Vacation.find({ available: true }, function(err, vacations) {
		var context = {
			vacations: vacations.map(function(vacation) {
				return {
					sku: vacation.sku,
					name: vacation.name,
					description: vacation.description,
					price: vacation.getDisplayPrice(),
					inSeason: vacation.inSeason,
				}
			})
		};
		res.render('vacations', context);
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
