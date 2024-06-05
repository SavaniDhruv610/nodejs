const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db; 

const mongoConnect = (callback) => {
  MongoClient.connect(
    "mongodb+srv://dhruvsavani610:NfJ43W0fj17bFuFz@cluster0.yalwpwp.mongodb.net/Cluster0?retryWrites=true&w=majority&appName=Cluster0"
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