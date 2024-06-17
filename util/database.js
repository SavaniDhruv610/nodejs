const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db; 

const mongoConnect = (callback) => {
  MongoClient.connect(
    "mongodb+srv://dhruvsavani610:OnpKEyb6R4liBAfY@shop.js2sfd0.mongodb.net/shop?retryWrites=true&w=majority&appName=shop"
  )
    .then((client) => {
      console.log("connected");
      _db = client.db();
      callback(client);
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb =()=>{
    if(_db){
        return _db;
    }
    throw 'no Db Connect'
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;