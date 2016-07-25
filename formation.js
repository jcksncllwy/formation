//Require libs
var argv = require('yargs').argv;
var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var async = require('async');
var _ = require('lodash')

//Set constants
var mongoURI = argv.m || argv.mongouri || "localhost:27017/formation";
var systemCollection = argv.s || argv.sysCollection || 'formationOps';
var formsCollection = argv.f || argv.formsCollection || 'forms';
var responsesCollection = argv.r || argv.responseCollection || 'responses';
var typeformUID = argv.u || argv.typeformUID;
if(!typeformUID){
	console.log("Please specify the UID of your Typeform with -u or --typeformUID");
	process.exit();
}
var typeformKey = argv.k || argv.typeformKey;
if(!typeformKey){
	console.log("Please specify your Typeform key with -k or --typeformKey");
	process.exit();
}
var typeformURI = "https://api.typeform.com/v1/form/"+typeformUID+"?key="+typeformKey;

var dbConnection = null;

//Begin by opening a connection to MongoDB
MongoClient.connect(mongoURI, function(err, db){
	if(err || !db){
		console.log(err, db);
		return process.exit();
	}
	dbConnection = db;

	/*
	async's waterfall will execute each asynchronous function in series,
	supplying each with the output of the previous. This way we can avoid
	messy callbacks.
	*/
	async.waterfall([
		getLastPollTimestamp,
		fetchTypeformData,
		updateMongo
	],
	function(err, finalResult){
		if(err){ console.log(err) }
		process.exit();
	});
	
});

var getLastPollTimestamp = function(callback){
	var coll = dbConnection.collection(systemCollection);
	coll.find({"lastTypeformPollTimestamp":{"$exists":true}}).limit(1).next(function(err, doc){
		if(err){
			return callback(err);
		}
		var timestamp = null;
		if(doc){
			timestamp = doc.lastTypeformPollTimestamp;
			console.log("most recent poll: "+timestamp);
			return callback(null, timestamp);
		} else {
			console.log("inserting initial timestamp");
			coll.insertOne({"lastTypeformPollTimestamp":new Date()}, function(err, result){
				if(err){
					console.log(err);
					return callback(err);
				}				
				return callback(null, timestamp);
			});
		}
	});
}


var fetchTypeformData = function(timestamp, callback){
	timestamp = new Date(timestamp);
	if(timestamp){
		typeformURI+="&since="+Math.round(timestamp.getTime()/1000);
	}
	request(typeformURI, function (err, response, body) {
		if (err || response.statusCode != 200) {
			callback(err);
		}
		var result = JSON.parse(body);
		callback(null, result);
	});
}

var updateMongo = function(typeformData, callback){
	typeformData["UID"] = typeformUID;

	//if there are no new responses, do not insert anything into the db
	if(typeformData.responses.length!=0){
		var responses = typeformData.responses;
		delete typeformData.responses;

		insertForm(typeformData, function(err, formID){
			if(err){callback(err)}
			insertResponses(responses, formID, function(err, result){
				if(err){callback(err)}
				updateTimestamp(callback);			
			});
		})
		
	} else {
		console.log("No new responses");
		return callback(null);
	}	
}

var insertForm = function(formData, callback){
	dbConnection.collection(formsCollection).insertOne(formData, function(err, result){
		if(err){return callback(err);}
		callback(null, result.insertedId)
	});
}

var insertResponses = function(responses, formID, callback){
	_.each(responses, function(response){
		response["formID"] = formID;
	});
	dbConnection.collection(responsesCollection).insertMany(responses, function(err, result){
		if(err){return callback(err);}
		callback(null, result);
	});
}

var updateTimestamp = function(callback){
	var collection = dbConnection.collection(systemCollection)
	collection.updateOne({"lastTypeformPollTimestamp":{"$exists":true}}, {$set:{"lastTypeformPollTimestamp":new Date()}}, {}, function(err, result){
		if(err){return callback(err);}				
		callback(null, result);
	});	
}








