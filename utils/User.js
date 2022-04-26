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
    File name: User.js
    Description: This is the class for Users.
*/
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
