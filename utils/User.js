class User {
    
    constructor(uuid, userName, balance, currentBets, lastRefreshed) {
        if (!uuid) throw new Error("UUID needed to create user account."); 
        if (!userName) userName = "Blank Name";
        if (!balance) balance = 0; 
        if (!currentBets) currentBets = []; 
        if (!lastRefreshed) lastRefreshed = Date.now(); 
        this.uuid = uuid; //Some kind of unique ID given to every user
        this.userName = userName; //Some kind of username the user can have. Not necessarily unique.
        this.balance = parseInt(balance); //Money left on users account
        this.currentBets = currentBets; //Ex. Array of outstanding bets
        this.lastRefreshed = lastRefreshed; //Ex. Last time the account was refreshed.   
    }
    

}

module.exports = User;
