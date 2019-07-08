const request = require('request');
const WebSocket = require('ws');
const fs = require('fs');

//Authenticate with IBM Cloud using the Watson STT apikey to get an access_token
const authURL = 'https://iam.cloud.ibm.com/identity/token';
const apikey = '<API_KEY_HERE>';

//POST Request to authenticate and receive an access_token
request.post({
        url: authURL,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            "Accept": "application/json"
        },
        form: {
            apikey: apikey,
            grant_type: 'urn:ibm:params:oauth:grant-type:apikey'
        }
    },
    function(error,response,body){
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the body

        //Store the access_token returned from the auth request
        var access_token = JSON.parse(body).access_token;

        //Use this access_token to open WebSocket
        openWebSocketAndSendSampleData(access_token);

} );

//Function demonstrating the opening of a WebSocket, sending audio data to Watson STT, and receiving a transcription back
function openWebSocketAndSendSampleData(access_token){
    var IAM_access_token = access_token;
    
    // URL for the WebScoket, including the access_token received above
    var wsURI = 'wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize'
      + '?access_token=' + IAM_access_token;
      + '&model=en-US_BroadbandModel';

    // Create a Websocket with this URL
    // Doc: https://cloud.ibm.com/docs/services/speech-to-text?topic=speech-to-text-websockets#WSopen
    const ws = new WebSocket(wsURI);
    
    //Actions on "open" of the websocket
    ws.on('open', function open() {
        
        console.log("WebSocket opened.");

        //Send the "START" action message to Watson STT to initiate a recognition request. Tells Watson audio is coming.
        //Doc: https://cloud.ibm.com/docs/services/speech-to-text?topic=speech-to-text-websockets#WSstart
        var message = {
            action: 'start',
            keywords: ['hello', 'speech'],
            keywords_threshold: 0.5,
            max_alternatives: 3,
        }
        ws.send(JSON.stringify(message));

        //Send Audio Data and recieve recognition request results. 
        //For this example, audio is read from an MP3 file and send as a binary buffer
        //Doc: https://cloud.ibm.com/docs/services/speech-to-text?topic=speech-to-text-websockets#WSaudio
        var file = fs.readFile("speech_sample.mp3",function(err,data){
            console.log(err);
            console.log(data);
            ws.send(data);

            //End the recognition request by sending the "stop" action
            //This tells Watson to send final results
            //Doc: https://cloud.ibm.com/docs/services/speech-to-text?topic=speech-to-text-websockets#WSstop
            ws.send(JSON.stringify({action: 'stop'}));
        });
      });

      //Handler for receiving data from the websocket (transcription from Watson STT)
      ws.on('message', function incoming(data) {

        console.log("Received data from Watson STT:");

        console.log(data);

      });

}