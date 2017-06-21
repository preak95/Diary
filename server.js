var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var app = express();
var session = require('express-session');
var cool = require('cool-ascii-faces');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('view engine', 'ejs');
//1. Connect to database
mongoose.connect('mongodb://pratik:pratikas@ds141108.mlab.com:41108/diary', function(err){

	if(err){	
		console.log('Could not connect to the server! Try again');
		throw err;
	}
});

var users = new mongoose.Schema({
	user_name : String,
	name      : String,
	email     : String,
	password  : String,
	diaries	  : [],
});

var diaries = new mongoose.Schema({
	uniqName    : String,
	diary_entry : String,
	date 	    : Date,
	tags		: [],
	uName       : String,
});

var user_doc = mongoose.model('users', users);
var diary_doc = mongoose.model('diaries', diaries);

app.use(express.static(__dirname + '/Styles'));
app.use(express.static(__dirname + '/pages'));
app.use('/register', express.static(__dirname + '/Styles'));
app.use('/', express.static(__dirname + '/images'));
app.use('/register', express.static(__dirname + '/images'));
app.use(session({secret: "d3h5j3g5h6k6l32lljj", resave: false, saveUninitialized:true}));
var urlencodedParser = bodyParser.urlencoded({ extended: false});

app.get('/',function(req, res) {
	console.log('Delivering Homepage'+ req.url);
	res.writeHead(200,{'content-Type' : 'text/html'});
	var readStream = fs.createReadStream(__dirname + '/index.html', 'utf8');
	readStream.pipe(res);
});

app.get('/register', function(req, res){
	res.writeHead(200,{'content-Type' : 'text/html'});
	var readStream = fs.createReadStream(__dirname +'/pages/userregister.html', 'utf8');
	readStream.pipe(res);
});

app.post('/register', function(req, res){
	user_doc.find({'user_name' : req.body.user_name}, function(err, data){
		if(err) throw err;
		if(data.length === 0){
			var newClass = user_doc(req.body).save(function(err){
				if(err) throw err;
				res.writeHead(200,{'content-Type' : 'text/html'});
				var readStream = fs.createReadStream(__dirname +'/index.html', 'utf8');
				readStream.pipe(res);
			});	
		}
		else{
			console.log(data);
			res.render('message', {'message' : "User already exists!"})
		}
	});
});

app.get('/login', function(req, res){
	if(req.session.user){
		console.log("Already logged in");
		res.writeHead(200,{'content-Type' : 'text/html'});
		var readStream = fs.createReadStream('pages/bootdiary.html', 'utf8');
		readStream.pipe(res);
	}
	else{
		res.writeHead(200, {'content-Type' : 'text/html'});
		var readStream = fs.createReadStream(__dirname +'/pages/loginpage.html', 'utf8');
		readStream.pipe(res);
	}	
});

//Logging in from the login page using POST method
app.post('/login', function(req, res){
	//Now create a model by this name	
	user_doc.find({'user_name' : req.body.user_name}, function(err, data){
		if(err) throw err;
		//console.log(data);
		if(data.length !=0){
			if(data[0].password === req.body.password){
				//	console.log(data);
				req.session.user = req.body;
				res.writeHead(200,{'content-Type' : 'text/html'});
				var readStream = fs.createReadStream(__dirname +'/pages/bootdiary.html', 'utf8');
				readStream.pipe(res);
			}
			else
				res.render('message', {message : "Wrong Credentials"});
		}
		else{
				res.render('message', {message : "It seems that you aren't signed up"});
		}
	});
	
});

app.post('/logout',function(req, res){
	req.session.destroy();
	res.writeHead(200, {'content-Type' : 'text/html'});
	var readStream = fs.createReadStream(__dirname +'/index.html', 'utf8');
	readStream.pipe(res);
});


app.post('/save', function(req, res){
	if(req.session.user){
		//Lets create a unique name for our diary entry
		var date = new Date();
		var mins = date.getMinutes();
		var hours = date.getHours();
		var day = date.getDate();
		var year = date.getFullYear();
		var user = req.session.user.user_name;

		var fullDate = Date(day + '/' + (date.getMonth()+1) + '/' + year);

		var uniqueDiaryName = String(user+mins+hours+day+year);

		var diary_one = req.body;
		diary_one.uniqName = uniqueDiaryName;
		diary_one.uName = user;
		var newClass = diary_doc(diary_one).save(function(err){
			if(err) throw err;

			user_doc.update({ 'user_name' : user }, { $push : { diaries : {fullDate : uniqueDiaryName}}}, function(err, data){
				res.writeHead(200,{'content-Type' : 'text/html'});
				var readStream = fs.createReadStream(__dirname +'/pages/bootdiary.html', 'utf8');
				readStream.pipe(res);
		});
	});	
	}
	else{
		res.writeHead(200, {'content-Type' : 'text/html'});
		var readStream = fs.createReadStream(__dirname +'/pages/loginpage.html', 'utf8');
		readStream.pipe(res);
	}	
});

function callThemAll(dia){
	console.log("happpened!");
	res.render('viewall', {dia : dia});
}

app.post('/viewall', function(req, res){
	var user = req.session.user.user_name;
	diary_doc.find({ 'uName' : user }, function(err1, data1){
			if(err1) throw err1;
			console.log(data1);
			res.render('viewall', {dia : data1});
	});
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.listen(process.env.PORT || 5000, function(err){
	if(err) throw err;
	console.log("I'm listening");
});