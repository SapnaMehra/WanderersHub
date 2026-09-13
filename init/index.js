const mongoose=require ("mongoose");
const initData = require("./data.js");
const Listing = require ("../models/listing.js");

const MONGO_URL ="mongodb+srv://sapnamehra0111_db_user:5i7P4NI1nWgzv2eQ@cluster1.x2lzohp.mongodb.net/?appName=Cluster1";

main()
.then(()=>{
    console.log("connected to DB");
}).catch ((err) => {
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB= async () => {
   await Listing.deleteMany({});
   initData.data= initData.data.map((obj) => ({ ...obj, owner: "6aa0bfa617c06e1607a7584e" }));
   await Listing.insertMany(initData.data);
   console.log("data was initialised");

};

initDB(); 