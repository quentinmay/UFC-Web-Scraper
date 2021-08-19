
class Bet {

    constructor(betType, betAmount, fightEventID, fightEventDate, user1, user2, odds, betResolved) {
        if (!betType) throw new Error("Bet type required to create bet.");
        if (!betAmount) throw new Error("betAmount required to create bet.");
        if (!fightEventID) throw new Error("fightEventID required to create bet.");
        if (!fightEventDate) throw new Error("fightEventDate required to create bet.");
        if (!user1) throw new Error("user1 required to create bet.");
        if (!user2) user2 = null;
        if (!odds && betType == 'classic') throw new Error("Need odds if the betType is classic.");
        if (!betResolved) betResolved = false;

        this.betType = betType; //Classic or 1v1. Classic is for odds vs the UFC website. 1v1 is for straight 1v1 for player to player (Ex. $50 from player1 and $50 from player2)
        this.betAmount = parseInt(betAmount);
        this.fightEventID = fightEventID; //Unique ID assigned from the UFC website for each match..
        this.fightEventDate = fightEventDate; //Date of the fight.
        this.user1 = user1; //Ex. {User 1 UUID, fighterName}. Necessary
        this.user2 = user2; //Ex. {User 2 UUID, fighterName}. Only necessary when 1v1. Should be null for classic type bets   
        this.odds = odds; //The odds formated {user1 odds - user2 odds}
        this.betResolved = betResolved; //false by default. true is the fight finished
    }


}

module.exports = Bet;
