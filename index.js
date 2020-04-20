const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const path = require("path");
const mongo = require("mongodb");
const schedule = require('node-schedule');
const util = require('util')
const exec = util.promisify(require('child_process').exec);

const app = express();

// Set static path
app.use(express.static(path.join(__dirname, "client")));
const router = express.Router();
app.use(bodyParser.json());
var db;

var vapidKeys;
mongo.MongoClient('mongodb://notify-db:y6v4k6c0@172.18.0.3:27017/?authSource=admin&readPreference=primary&ssl=false').connect((err,client) => {
    if(err) console.log(err);
    db = client.db('notification');
   
    db.collection('vapid').findOne({_id:0}).then((res,err) => {
    if(res!=null){
        vapidKeys = res;
    }else{
        vapidKeys = webpush.generateVAPIDKeys();
        db.collection('vapid').insertOne({_id:0,'privateKey':vapidKeys.privateKey,'publicKey':vapidKeys.publicKey});
    }
    }).finally(() => webpush.setVapidDetails('mailto:vishesh.bhardwaj.94@gmail.com',vapidKeys.publicKey,vapidKeys.privateKey));

});

app.post('/subscribe',(subreq,subres) => {
  var subscription = subreq.body;
  var payload = JSON.stringify({ title: "Subscription Success" });
  var query = {'endpoint':subscription.endpoint};
  db.collection('subscription').updateOne(query,{ $set : subscription },{ upsert: true }).finally(() =>webpush.sendNotification(subscription, payload).catch(err => console.error(err)));
});

app.post('/notification',(notreq,notres) =>
    db.collection('subscription').find({}).each((err,result) => {if(result!=null) {delete result['_id']; webpush.sendNotification(result, JSON.stringify(notreq.body)).catch(err => console.error(err)).finally(() => notres.sendStatus(200)) }})
);

router.get('/vapidPublic',(server_req,server_resp) => {
    server_resp.json({'vapidPublicKey':vapidKeys.publicKey});
});

/* schedule.scheduleJob('59 * * * *',() => {
    
    exec('vcgencmd measure_temp | cut -b 6-11').then((out,err) => {
        var json = {'title': 'Raspberry Pi Temprature','icon':'https://assets.ubuntu.com/v1/29985a98-ubuntu-logo32.png','timestamp':Date.now(),'body': 'Pi Temperature is '+out};
        db.collection('subscription').find({}).each((err,result) => {
            if(result!=null){
                delete result['_id'];
                webpush.sendNotification(result, JSON.stringify(json)).catch(err => console.error(err)) 
            }
        })
    });   
}
); */

const port = 9040;
app.use(router);
app.listen(port, () => console.log(`Server started on port ${port}`));
