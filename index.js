'use strict';
//Initialize libraries
const {dialogflow} = require('actions-on-google');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
//var serviceAccount = require("path/to/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://chatbot-e90dd.firebaseio.com"
});
const db = admin.firestore();
const {WebhookClient} = require('dialogflow-fulfillment');
var Make,Model,Year,VIN;
//const Datastore = require('@google-cloud/datastore');
const {
  SimpleResponse,
  BasicCard,
  Image,
  Suggestions,
  Button
} = require('actions-on-google');
// Instantiate a datastore client
//const datastore = Datastore();

  const app = dialogflow({debug: true});
app.middleware((conv) => {

  });

//app.intent('Welcome',(conv)=>{
	//conv.close("Motherfucker");
	//});
//WebhookResponse("hi");

//app.intent('Add_Vehicle_Make',(conv)=>{
	//Make = conv.arguments.get('Make');
	//conv.close("You said " + Make);
	//var Make = conv.parameters['Make'];
	//var Model = conv.parameters['Model'];
	//conv.close("You'd like to add a " + Make + " " + Model + "?");

//});

  //exports.Welcome = functions.https.onRequest(app);
  //exports.Add_Vehicle_Make = functions.https.onRequest(app);
  //dialogflowFirebaseFulfillment
    exports.Chatbot = functions.https.onRequest((request, response)=>{
	  const agent = new WebhookClient({request, response});
	  let conv = agent.conv();
	  function welcome(agent){
		  //agent.add('Welcome message');
	  }
	  /*function fallback_general(agent){
		  agent.add("I'm sorry, but I didn\'t understand you. Remember, you can ask me about adding a vehicle, or [...]");
	  }*/
	  function Add_Vehicle(agent){
			//Make = agent.parameters.Make;
			//Model = agent.parameters.Model;
			//agent.add("It's a " + Make + Model + ", right?");
			//agent.add("I hope this works");
			//const original = request.query.text;
			//return admin.databasw().ref('/info').push(
			/*return admin.database().ref('carInfo').transaction((carInfo)=>{
				if(carInfo !== null){
					carInfo.Make = Make;
				}
				return makeInfo;
			});	*/
	  }

	  function AskVIN(agent){}

	function CheckVIN(agent){
		VIN = agent.parameters['number-sequence'];
		var VINvalid = ((VIN !== null) && (VIN.length === 3)); //3 for testing
		if(!VINvalid){
      VIN_Fallback(agent);
		}
		else {
      agent.add("Okay! Let me use VIN #" + VIN + " to find your vehicle information...");
    }
	}

  function verifyMMY(agent){
    Make = agent.parameters['Make'];
    Model = agent.parameters['Model'];
    Year = agent.parameters['Year'];
    var MakeValid = (Make.length > 0);
    var ModelValid = (Model.length > 0);
    var YearValid = ((Year.length > 0) && ((Year.length === 2) || (Year.length === 4)));
    if((!MakeValid)||(!ModelValid)||(!YearValid)){
      if(!MakeValid){
        agent.add("Please make sure you enter a valid Make.");
      }
      else if(!ModelValid){
        agent.add("Please make sure you enter a valid Model.");
      }
      if(!YearValid){
        agent.add("Please make sure you enter a valid Year.");
      }
    } else {
        agent.add("Okay! Let me use Make: " + Make + ", Model: " + Model + ", and Year: " + Year + ", to find your vehicle information...");
      }
  }

	function VIN_Fallback(agent){
		agent.add("Please make sure that you're entering a valid VIN. Need help finding your VIN? Try to stand outside the vehicle on the driver's side and look at the corner of the dashboard where it meets the windshield. If the VIN cannot be found there, open the driver's side door and look at the door post (where the door latches when it is closed).");
    // The below code is an attempt to reset the contexts manually, still a work in progress
    //let responseJson = {};
    //var contextStr = '[{"name":"Add_Vehicle_Enter", "lifespan":0, "parameters":{}},{"name":"Add_Vehicle_Enter","lifespan":1,"parameters":{}}]';
    //var contextObj = JSON.parse(contextStr);
    //responseJson.contextOut = contextObj;
    //console.log('Response:'+JSON.stringify(responseJson));
    //response.json(responseJson);

   //dialogflow.contexts.create("projects/chatbot-e90dd/agent/sessions/"+request.body.sessionId,"Add_Vehicle-yes",1);
	}//This exists due to testing, but should clean this up later. also forget that previous line

	  function ForDB(agent){

		var cMake = agent.parameters.Make;
		agent.add("Uploading " + cMake);
		return admin.database().ref('carInfo').transaction((carInfo)=>{
			carInfo.Make = cMake;
			console.log(carInfo);
			return carInfo;
		});
	  }

	  	  function Write(agent){
		  var carMake = agent.parameters.Make;
		  const dialogflowAgentRef = db.collection('Vehicle').doc('Car');
		  return db.runTransaction(t=>{
			  t.set(dialogflowAgentRef,{Make: carMake});
			  return Promise.resolve('Write complete');
		  });
	  }


	  let intentMap = new Map();
	  //intentMap.set('Welcome', welcome);
	  //intentMap.set('Default Fallback Intent',fallback_general);
	  //intentMap.set('Add_Vehicle',Add_Vehicle);
	  intentMap.set('ForDatabase',Write); //test for writing to db
	  //intentMap.set('Add_Vehicle-yes',AskVIN);
	  intentMap.set('Add_Vehicle-yes-VIN',CheckVIN);
	  //intentMap.set('VIN_Fallback',VIN_Fallback);
    intentMap.set('Add_Vehicle-askMMY',verifyMMY);

	  agent.handleRequest(intentMap);
  });
