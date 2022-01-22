const mongoose = require("mongoose");
const fs = require("fs");
const mongoEventfiles = fs.readdirSync("./mongEvents").filter(file => file.endWith(".js"));

module.exports = {client} => {
  client.dbLogin = async () => {
    for (file of mongoEventfiles){
      const event = require(`../mongoEvents/${file}`)
      if(event.once){
        mongoose.connection.once(event.name, (...args) => event.execute(...args));
      } else{
        mongoose.connection.on(event.name, (...args) => event.execute(...args));
      };
    };
    mongoose.Promise = global.Promise;
    await mongoose.connect(process.env.dbtoken, {
        useFindAndModify: false,
        useUnifiedTopology: true,
        useNewUrlParser: true
    });
  }
};
