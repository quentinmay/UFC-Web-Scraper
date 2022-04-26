/*
    Program name: "UFC Betting Game" This is all the back-end for a theoretical UFC betting game. Includes creating user accounts with FAKE currency and necessary functionality for creating and resolving FAKE bets made.
    Copyright (C) 2021  Quentin May
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see https://www.gnu.org/licenses/.
/
/
Author information:
    Authors: Quentin May, Ethan Santos, Brian Lucero
    Emails: quentinemay@csu.fullerton.edu, ethansantos@csu.fullerton.edu, 13rianlucero@csu.fullerton.edu
/

/
Program information:
    Program name: UFC Betting Game
    Programming language: JavaScript
    Files: /utils/UFC.js, /utils/Bet.js, /utils/User.js,
    Date project began: 2022-February-17
    Date of last update: 2022-April-26
    Status: Unfinished
    Purpose: The UFC betting game enables betting game functionality.
    Base test system: Ubuntu 20.04.3 LTS
/
/
This Module:
    File name: Bet.js
    Description: This is the class for bets.
*/
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
        this.betAmount = betAmount;
        this.fightEventID = fightEventID; //Unique ID assigned from the UFC website for each match..
        this.fightEventDate = fightEventDate; //Date of the fight.
        this.user1 = user1; //Ex. {User 1 UUID, fighterName}. Necessary
        this.user2 = user2; //Ex. {User 2 UUID, fighterName}. Only necessary when 1v1. Should be null for classic type bets   
        this.odds = odds; //The odds formated {user1 odds - user2 odds}
        this.accepted = false; //false by default. true means user2 accepted the bet. only valid for 1v1 bets
        this.betResolved = betResolved; //false by default. true is the fight finished
    }


}

module.exports = Bet;
