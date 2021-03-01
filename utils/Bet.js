
class Bet {
    
    constructor(betType, fightEventID, fightEventDate, user1, user2, odds, betResolved) {
        if (!betType) throw new Exception("Bet type required to create bet."); 
        if (!fightEventID) throw new Exception("fightEventID required to create bet."); 
        if (!fightEventDate) throw new Exception("fightEventDate required to create bet."); 
        if (!user1) throw new Exception("user1 required to create bet."); 
        if (!user2) user2 = null;
        if (!odds && betType == 'classic') throw new Exception("Need odds if the betType is classic."); 
        if (!betResolved) betResolved = false; 

        this.betType = betType; //Classic or 1v1. Classic is for odds vs the UFC website. 1v1 is for straight 1v1 for player to player (Ex. $50 from player1 and $50 from player2)
        this.fightEventID = fightEventID; //Unique ID assigned from the UFC website for each match..
        this.fightEventDate = fightEventDate; //Date of the fight.
        this.user1 = user1; //Ex. User 1. Necessary
        this.user2 = user2; //Ex. User 2. Only necessary when 1v1. Should be null for classic type bets   
        this.odds = odds; //The odds formated {user1 odds - user2 odds}
        this.betResolved = betResolved; //false by default. true is the fight finished
    }
    

}

module.exports = Bet;
