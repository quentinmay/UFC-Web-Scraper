var configFile = __dirname + "/../users.json";

try {
   // var config = require(configFile);

  } catch (err) {
     // console.log(err)
  }
class Users {
    
    constructor(uuid, userName, balance, currentBets, lastRefreshed) {
        if (!uuid) throw new Exception("UUID needed to create user account."); 
        if (!userName) userName = null;
        if (!balance) balance = 0; 
        if (!currentBets) currentBets = []; 
        if (!lastRefreshed) lastRefreshed = Date.now(); 
        this.uuid = uuid; //Some kind of unique ID given to every user
        this.userName = userName; //Some kind of username the user can have. Not necessarily unique.
        this.balance = balance; //Money left on users account
        this.currentBets = currentBets; //Ex. Array of outstanding bets
        this.lastRefreshed = lastRefreshed; //Ex. Last time the account was refreshed.   
    }
    

}

module.exports = Users;
