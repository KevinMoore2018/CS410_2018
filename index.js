const functions = require("firebase-functions");
const {WebhookClient} = require('dialogflow-fulfillment');
const admin = require('firebase-admin');
const serviceAccount = require('./chatbot-e90dd-firebase-adminsdk-y4r0g-5381b4d375');
const vindec = require('vindec');

process.env.DEBUG = 'dialogflow:debug';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://chatbot-e90dd.firebaseio.com'
});

const db = admin.database();
const ref = db.ref();
const refUser = ref.child('users');
const refVehicle = ref.child('vehicles');
let count = 0;

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({request, response});
    const prefix = 'projects/chatbot-e90dd/agent/sessions/' + agent.session;

    if(count === 0){
        agent.add("Welcome");
        count++;
    }

    function addVehicleVIN(agent) {
        let vin = agent.parameters['VIN_Number'];

        if(vindec.validate(vin)) {
            agent.context.set({name: 'Add_Vehicle-merge', lifespan: 1, parameters: {VIN: vin}}); //now setting context straight to total miles
            agent.context.set({name: 'Add_Vehicle_Enter', lifespan: 0});
            agent.add("Great! Now this vin: " + vin + " will be added. How many miles are on your vehicle currently?"); //matching output to totalmiles
        } else {
            agent.context.set({name: 'Add_Vehicle_Enter', lifespan: 1});
            agent.context.set({name: 'Add_Vehicle_merge', lifespan: 0}); //now setting context straight to total miles
            agent.add('Not a valid VIN! Please try again.');
        }
    }

    function confirmVIN(agent) {
        let vin = agent.parameters['VIN'];
        let conf = agent.parameters['boolean'];
        let refKey = "-1";

        if(conf) {
            let vehData = vindec.decode(vin);
            refKey = pushToDb('jhsmith', refVehicle, {vehicle: vehData});
            agent.add('The vehicle was added!');
            agent.add("Let's move on. How many miles are on the car currently?");
        } else{
            agent.context.set({name: 'Add_Vehicle_Enter', lifespan: 1});
            agent.add('Please enter the VIN number for the vehicle you would like to add.')
        }
    }

    function addVehicleMMY(agent) {
        let make = agent.parameters['make'];
        let model = agent.parameters['model'];
        let year = agent.parameters['year'];

        if(year.length < 4 || year > 2019) {
            agent.add("Please make sure you enter a valid Make");
        } else if(model.length <= 0) {
            agent.add("Please make sure you enter a valid Model.");
        } else if(make.length <= 0){
            agent.add("Please make sure you enter a valid Make.");
        } else {
            agent.add("Okay! Let me add your " + year + " " + make + " " + model + ".");
            agent.add("Let's move on. How many miles are on the car currently?");
        }
    }

    let intentMap = new Map();
    intentMap.set('Add_Vehicle-yes-VIN', addVehicleVIN);
    //intentMap.set('', confirmVIN);
    intentMap.set('Add_Vehicle-askMMY',addVehicleMMY);
    agent.handleRequest(intentMap);
});

function pushToDb(user, ref, data) {
    let newRef = ref.push();
    newRef.set(data);
    writeToDb(user, {vehicle: newRef.key});
    return newRef.key;
}

function writeToDb(user, ref, data) {
    refUser.child(user).update(data);
}
