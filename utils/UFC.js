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
    File name: UFC.js
    Description: This is the main class for the Discord bot that allows back-end capabilities.
*/
var axios = require("axios");
var Bet = require("./Bet.js");
var User = require("./User.js");
var fs = require("fs").promises;
const MongoClient = require('mongodb').MongoClient;

const { EventEmitter } = require('events');


class UFC extends EventEmitter {
    constructor(databaseURI, users, upComingMatches, previousMatches, outstandingBets, lastRefreshed, usersPath = `${__dirname}/../../../users.json`, betsPath = `${__dirname}/../../../bets.json`, matchDataPath = `${__dirname}/../../../matchData.json`, previousMatchesPath = `${__dirname}/../../../previousMatches.json`, resolvedBetsPath = `${__dirname}/../../../resolvedBets.json`) {
        super();
        this.usersPath = usersPath;
        this.betsPath = betsPath;
        this.matchDataPath = matchDataPath;
        this.previousMatchesPath = previousMatchesPath;
        this.resolvedBetsPath = resolvedBetsPath;
        if (!lastRefreshed) lastRefreshed = 0;
        this.users = users; //List of users
        this.upComingMatches = upComingMatches; //List of upcoming matches
        this.previousMatches = previousMatches; //List of previous matches
        this.outstandingBets = outstandingBets; //List of previous matches
        this.lastRefreshed = lastRefreshed; //Ex. Last time the upComingMatches was refreshed.  
        this.databaseURI = databaseURI;
        this.mongoDB;
    }

    async loadMongoDB(uri) {
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await client.connect();
        this.mongoDB = await client.db();
        return this.mongoDB;
    }

    async writeDatabase(document, data) {
        const collection = await this.mongoDB.collection('userData');
        const updateResult = await collection.updateOne({
            _id: document
        }, {
            $set: {
                users: JSON.stringify(data)
            }
        });
        return updateResult;
    }

    async readDatabase(document) {
        const collection = await this.mongoDB.collection('userData');
        let data = await collection.find({
            _id: document
        }
        )
        let dataAr = await data.toArray()
        let dataJson = JSON.parse(dataAr[0].users);
        return dataJson;
    }

    async initialize() {
        if (this.databaseURI) {
            await this.loadMongoDB(this.databaseURI)
        }
        if (!this.users) {
            try {
                // "./node_modules/ufc-betting-game/utils/"
                // var jsonUsers = JSON.parse(file.readFileSync(this.usersPath));
                let jsonUsers;
                if (this.databaseURI) {
                    jsonUsers = await this.readDatabase("users.json");
                } else {
                    jsonUsers = JSON.parse(await fs.readFile(this.usersPath, "utf-8"));

                }
                this.users = jsonUsers;
                console.log(`Successfully read users data from ${this.usersPath} for user data.`);
            } catch (err) {
                console.log(err);
                this.users = [];
            }
        }
        if (!this.upComingMatches) {
            this.upComingMatches = [];
        }
        if (!this.outstandingBets) {
            try {
                let jsonBets;
                if (this.databaseURI) {
                    jsonBets = await this.readDatabase("bets.json");
                } else {
                    jsonBets = JSON.parse(await fs.readFile(this.betsPath, "utf-8"));
                }
                this.outstandingBets = jsonBets;
                console.log(`Successfully read bets data from ${this.betsPath} for outstandingBets.`);
            } catch (err) {
                console.log(err);
                this.outstandingBets = [];
            }
        }


        this.checkFiles(); //Just checks to see if all the necessary json files are made.
        return true;
    }


    /*
    Webscrapes oddshark UFC website for match data.
    Refreshes the match data. Gets all upComingMatches and populates the datasection with those. Then gets all previousMatches and updates the json as well as data section
    */
    async refreshUpComingMatches() {
        try {
            const time = Date.now();
            const options = {
                headers: {
                    'authority': "io.oddsshark.com",
                    'method': "GET",
                    'path': `/ticker/ufc?_=${time}`,
                    'scheme': "https",
                    'accept': "*/*",
                    'accept-encoding': "gzip, deflate, br",
                    'accept-language': "en-US,en;q=0.9,ja;q=0.8",
                    'dnt': "1",
                    'origin': "https://www.oddsshark.com",
                    'referer': "https://www.oddsshark.com/",
                    'sec-fetch-dest': "empty",
                    'sec-fetch-mode': "cors",
                    'sec-fetch-site': "same-site",
                    'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36"
                }
            }
            var response = await axios.get(`https://io.oddsshark.com/ticker/ufc?_=${time}`, options)
            var data = await this.parseMatchDataJson(response.data)
            this.upComingMatches = data.upComingMatches;
            this.previousMatches = data.previousMatches;
            this.lastRefreshed = Date.now();
            if (this.databaseURI) {
                await this.writeDatabase("matchData.json", response.data);
                await this.writeDatabase("previousMatches.json", this.previousMatches);
            } else {
                await fs.writeFile(this.matchDataPath, JSON.stringify(response.data, null, 2));
                await fs.writeFile(this.previousMatchesPath, JSON.stringify(this.previousMatches, null, 2));
            }

            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    /*
    Uses hardcoded text file paths and checks to see if they exist then creates those files if they dont
    */
    async checkFiles() {
        var files = [this.resolvedBetsPath, this.matchDataPath, this.usersPath, this.previousMatchesPath, this.betsPath];
        for (var file of files) {
            try {
                await fs.readFile(file);
            } catch (err) {
                console.log(`${file} not found. Generating new blank file.`)
                fs.writeFile(file, "[]")
            }
        }
    }

    async addUser(uuid, name) {
        //If there is a user that exists with this UUID
        if (this.users.find(user => user.uuid == uuid)) {
            console.log("User already exists with this UUID.");
            return false;
        } else {
            this.users.push(new User(uuid, name)); //The rest will be autofilled from the constructor.
            console.log("Adding new user.");
            await this.writeUsersToFile();
            return true;
        }
    }

    async addBet(bet) {
        //------Checks to see if there are any bets of the same type between the SAME 1 or 2 people
        //Checks to see if there are any bets on the same fight between the SAME 1 or 2 people
        let foundBet;
        if (bet.betType == "classic") {
            foundBet = this.outstandingBets.find(b => (b.betType == bet.betType && b.user1.uuid == bet.user1.uuid && b.fightEventID == bet.fightEventID));
            // foundBet = await this.findOutstandingBet(bet.betType, bet.user1.uuid, null);
            // foundBet = await this.findOutstandingBet(bet.betType, bet.user1.uuid, null);
        } else {
            // foundBet = await this.findOutstandingBet(bet.betType, bet.user1.uuid, bet.user2.uuid);
            foundBet = this.outstandingBets.find(b => (b.betType == bet.betType && ((b.user1.uuid == bet.user1.uuid && b.user2.uuid == bet.user2.uuid) || (b.user1.uuid == bet.user2.uuid && b.user2.uuid == bet.user1.uuid)) && b.fightEventID == bet.fightEventID));
        }

        if (foundBet) {
            console.log("Error: bet of this type with these users on this fight already exists.");
            return false;
        } else if (this.previousMatches.find(match => match.event_id == bet.fightEventID)) {
            console.log("Error: tried to make bet on a fight that is already over");
            return false;
        } else {
            try {
                // console.log(bet);
                let user1 = await this.findUser(bet.user1.uuid);
                console.log("Adding new bet")
                user1.currentBets.push(bet);
                if (bet.user2) {
                    let user2 = await this.findUser(bet.user2.uuid);
                    if (user2) {
                        user2.currentBets.push(bet);
                    }
                }

                this.outstandingBets.push(bet);
                await this.writeBetsToFile();
                await this.writeUsersToFile();
                return true;
            } catch (err) {
                console.log(err);
                console.log("Failed to add to outstandingBets")
                return false;
            }

        }
    }

    /*
    Finds the outstanding bet that you want and deletes that bet then writes it to file to ensure its definitely gone.
    */
    async cancelBet(betType, fightID, user1ID, user2ID) {
        try {
            let bet = await this.findOutstandingBetWithFightID(betType, fightID, user1ID, user2ID);
            if (bet) {
                this.outstandingBets.splice(this.outstandingBets.indexOf(bet), 1);
                let user1 = await this.findUser(bet.user1.uuid);
                user1.currentBets.splice(user1.currentBets.findIndex(b => b.betType == bet.betType && b.fightEventID == bet.fightEventID && b.user1.uuid == bet.user1.uuid), 1);
                try {
                    let user2 = await this.findUser(bet.user2.uuid);
                    user2.currentBets.splice(user2.currentBets.findIndex(b => b.betType == bet.betType && b.fightEventID == bet.fightEventID && b.user1.uuid == bet.user1.uuid), 1);
                } catch (err) {
                }
                await this.writeBetsToFile();
                await this.writeUsersToFile();
                return true;
            } else {
                console.log("Bet to delete wasn't found.");
                return false;
            }
        } catch (err) {
            console.log(err)
            return false;
        }

    }

    /* 
    Utility function to find certain outstanding bets.
    */
    async findOutstandingBet(betType, user1ID, user2ID) {
        var foundBet = null;
        if (betType == "classic") {
            foundBet = this.outstandingBets.find(b => (b.betType == betType && b.user1.uuid == user1ID));
        } else if (betType == "1v1") {
            foundBet = this.outstandingBets.find(b => b.betType == betType && ((b.user1.uuid == user1ID && b.user2.uuid == user2ID) || b.user1.uuid == user2ID && b.user2.uuid == user1ID));
        }
        if (foundBet) {
            return foundBet;
        } else
            return null;
    }


    /* 
    Utility function to find certain outstanding bets.
    */
    async findOutstandingBetWithFightID(betType, fightID, user1ID, user2ID) {
        var foundBet = null;
        if (betType == "classic") {
            foundBet = this.outstandingBets.find(b => (b.betType == betType && b.user1.uuid == user1ID) && b.fightEventID == fightID);
        } else if (betType == "1v1" || betType == "1v1odds") {
            foundBet = this.outstandingBets.find(b => b.betType == betType && ((b.user1.uuid == user1ID && b.user2.uuid == user2ID) || b.user1.uuid == user2ID && b.user2.uuid == user1ID) && b.fightEventID == fightID);
        }
        if (foundBet) {
            return foundBet;
        } else
            return null;
    }


    async verify1v1Bet(betType, fightID, user1ID, user2ID) {
        try {
            let bet = await this.findOutstandingBetWithFightID(betType, fightID, user1ID, user2ID);
            if (bet && (betType == "1v1" || betType == "1v1odds")) {
                let user1 = await this.findUser(user1ID);
                let user2 = await this.findUser(user2ID);
                let user1Bet = user1.currentBets.find(b => b.betType == bet.betType && b.fightEventID == bet.fightEventID && b.user1.uuid == bet.user1.uuid && b.user2.uuid == bet.user2.uuid);
                let user2Bet = user2.currentBets.find(b => b.betType == bet.betType && b.fightEventID == bet.fightEventID && b.user1.uuid == bet.user1.uuid && b.user2.uuid == bet.user2.uuid);
                user1Bet.accepted = true;
                user2Bet.accepted = true;
                bet.accepted = true;
                await this.writeBetsToFile();
                await this.writeUsersToFile();
                return bet;
            }
        } catch (err) {
            console.log(err);
            return false
        }
        return false;
    }

    async calcMoneyWon(odds, money) {
        if (odds > 0) return (money * odds / 100);
        else if (odds < 0) return (money / (-1 * odds / 100));
    }

    /*
    Loops through all existing bets within outstandingBets file to find all the bets that SHOULD be ready to be completed. If the fight is within previousMatches (over
    and decision exists), resolves the bet from there. If not, doesnt do anything.
    */
    async resolveBets() {
        var resolvedBets = [];
        for (var bet of this.outstandingBets) {
            if (Date.now() > bet.fightEventDate) { //If we passed the bets fight date. Then we want to check the completion of the fight
                var fight = this.previousMatches.find(m => m.event_id == bet.fightEventID);
                if (fight) {
                    var winnerID = null;
                    var loserID = null;
                    switch (bet.betType) {
                        case "classic":

                            //If the user won. Reference https://www.gamingtoday.com/tools/moneyline/ for calculating winnings
                            if (bet.user1.fighterName == fight.winner) {
                                var cashWon = 0;
                                winnerID = bet.user1.uuid;
                                //Must use odds saved in the bet data. Sometimes, odds will change, so if we scrape website again, it will have different odds.
                                if (bet.odds.user1 > 0) cashWon = (bet.betAmount * bet.odds.user1 / 100);
                                else if (bet.odds.user1 < 0) cashWon = (bet.betAmount / (-1 * bet.odds.user1 / 100));

                                //now add cashWon + betAmount to the users account.
                                // console.log("classic won: " + cashWon);
                                await this.addMoney(winnerID, parseInt(cashWon + bet.betAmount));
                                this.emit('betResolved', bet, "WON", winnerID, cashWon + bet.betAmount);
                                //If the user lost. Don't give any money. We've already taken money from their account
                            } else if (fight.winner != "") {
                                loserID = bet.user1.uuid;
                                // console.log("classic lose");
                                this.emit('betResolved', bet, "LOST", null, 0);

                                //Match was a draw. No one wins. Give back money
                            } else {
                                //Give back betAmount to the user.
                                // console.log("classic draw");
                                await this.addMoney(bet.user1.uuid, bet.betAmount);
                                this.emit('betResolved', bet, "DRAW", null, bet.betAmount);
                            }

                            break;
                        case "1v1":
                            //If there was a winner
                            if (fight.winner != "") {
                                winnerID = [bet.user1, bet.user2].find(user => user.fighterName == fight.winner);
                                loserID = [bet.user1, bet.user2].find(user => user != winnerID);

                                //Give winner bet.betAmount * 2;
                                if (!isNaN(bet.betAmount)) {
                                    await this.addMoney(winnerID.uuid, (bet.betAmount * 2))
                                    this.emit('betResolved', bet, "WON", winnerID.uuid, bet.betAmount * 2);
                                } else { //This is a 1v1 dare bet.

                                    this.emit('betResolved', bet, "WON", winnerID.uuid, bet.betAmount);
                                }

                                //Otherwise, its a draw. No one wins. Give back both their money
                            } else {
                                if (!isNaN(bet.betAmount)) {
                                    await this.addMoney(bet.user1.uuid, bet.betAmount)
                                    await this.addMoney(bet.user2.uuid, bet.betAmount)
                                    this.emit('betResolved', bet, "DRAW", null, 0);
                                } else {
                                    this.emit('betResolved', bet, "DRAW", null, bet.betAmount); //bet.betAmount is a dare.

                                }
                            }

                            break;
                        case "1v1odds":
                            //If there was a winner
                            winnerID = [bet.user1, bet.user2].find(user => user.fighterName == fight.winner);
                            loserID = [bet.user1, bet.user2].find(user => user != winnerID);
                            let winnerPos = [bet.user1, bet.user2].indexOf(winnerID)
                            let winnerOdds = [bet.odds.user1, bet.odds.user2][winnerPos];
                            let loserOdds = [bet.odds.user1, bet.odds.user2][[bet.user1, bet.user2].indexOf(loserID)];
                            let user1MoneyInput = bet.betAmount;
                            let user2MoneyInput = await this.calcMoneyWon(bet.odds.user1, bet.betAmount);
                            if (fight.winner != "") {
                                // await test.addBet(new Bet("1v1odds", 200, 1646096, 61270400000, {uuid: user1.uuid, fighterName:"R Font"}, {uuid: user2.uuid, fighterName:"M Vera"}, {user1: "-138", user2: "110"} ))



                                let winnerMoneyInput = (winnerPos == 0) ? bet.betAmount : user2MoneyInput;

                                let winnerMoney = await this.calcMoneyWon(winnerOdds, winnerMoneyInput);
                                //Give winner money
                                await this.addMoney(winnerID.uuid, winnerMoneyInput + winnerMoney)
                                this.emit('betResolved', bet, "WON", winnerID.uuid, winnerMoney);


                                //Otherwise, its a draw. No one wins. Give back both their money
                            } else {
                                await this.addMoney(bet.user1.uuid, user1MoneyInput)
                                await this.addMoney(bet.user2.uuid, user2MoneyInput)
                                this.emit('betResolved', bet, "DRAW", null, 0);
                            }
                            break;
                        default:
                            break;
                    }
                    //After all betting is done and over, remove the bet from the list and add it to resolvedBets json.
                    bet.betResolved = true;
                    resolvedBets.push(bet);
                    //Removes bet from outstandingBets
                    this.outstandingBets.splice(this.outstandingBets.indexOf(bet), 1);
                    let user1 = await this.findUser(bet.user1.uuid);
                    user1.currentBets.splice(user1.currentBets.findIndex(b => b.betType == bet.betType && b.fightEventID == bet.fightEventID && b.user1.uuid == bet.user1.uuid), 1);
                    try {
                        let user2 = await this.findUser(bet.user2.uuid);
                        user2.currentBets.splice(user2.currentBets.findIndex(b => b.betType == bet.betType && b.fightEventID == bet.fightEventID && b.user1.uuid == bet.user1.uuid), 1);
                    } catch (err) {
                    }


                }

            }
        }
        //Want to write all this to file since weve updated and resolved alot of bets;
        try {
            // console.log(resolvedBets.length);
            if (resolvedBets.length > 0) {
                let jsonResolvedBets;

                if (this.databaseURI) {
                    jsonResolvedBets = await this.readDatabase("resolvedBets.json");
                } else {
                    jsonResolvedBets = JSON.parse(await fs.readFile(this.resolvedBetsPath, "utf-8"));
                }
                jsonResolvedBets = jsonResolvedBets.concat(resolvedBets);
                if (this.databaseURI) {
                    await this.writeDatabase("resolvedBets.json", jsonResolvedBets);
                } else {
                    await fs.writeFile(this.resolvedBetsPath, JSON.stringify(jsonResolvedBets, null, 2))
                }
                await this.writeBetsToFile();
                await this.writeUsersToFile();
            }
            return true;
        } catch (err) {
            console.log(err);
            console.log("Error saving jsonResolvedBets/Users to the json file.")
            return false;

        }
    }

    async addMoney(uuid, moneyGiven) {
        try {
            moneyGiven = parseInt(moneyGiven);
            let user = await this.findUser(uuid);
            let newBalance = parseInt(user.balance) + moneyGiven;
            if (isNaN(newBalance)) throw new Error("New balance wasn't a real number")
            user.balance = newBalance;
            await this.writeUsersToFile();
            return true;

        } catch (err) {
            console.log(err)
            return false;
        }
    }


    async loadFromFile(filePath) {
        try {
            if (!filePath) filePath = this.matchDataPath;
            var matchData = JSON.parse(await fs.readFile(filePath));
            var data = await this.parseMatchDataJson(matchData);
            this.upComingMatches = data.upComingMatches;
            this.previousMatches = data.previousMatches;
            this.lastRefreshed = Date.now();
            console.log("Successfully read matchData.json for upComingMatches and previousMatches.");
            if (this.databaseURI) {
                await this.writeDatabase("previousMatches.json", this.previousMatches);
            } else {
                await fs.writeFile(this.previousMatchesPath, JSON.stringify(this.previousMatches, null, 2));
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    /*
    Simple function to remove money from a Users account and write that to file.
    */
    async takeMoney(uuid, moneyTaken) {
        try {
            moneyTaken = parseInt(moneyTaken);
            var user = this.users.find(user => user.uuid == uuid);
            let newBalance = parseInt(user.balance) - moneyTaken;
            if (parseInt(user.balance) - moneyTaken < 0) throw new Error("User balance can't fall below 0");
            if (isNaN(newBalance)) throw new Error("User balance is not a real number.")
            user.balance = newBalance
            await this.writeUsersToFile();
            return true;
        } catch (err) {
            // console.log(err)
            return false;
        }
    }


    /*
    Function that saves our outstandingBets datasection to file so that we can read from file anytime we boot.
    This function should get called anytime we make changes to the outstandingBets.
    */
    async writeBetsToFile() {
        console.log("Write Bets To File");
        try {
            if (this.databaseURI) {
                await this.writeDatabase("bets.json", this.outstandingBets);
            } else {
                await fs.writeFile(this.betsPath, JSON.stringify(this.outstandingBets, null, 2));
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    async writeUsersToFile() {
        console.log("Write Users To File");
        try {
            if (this.databaseURI) {
                await this.writeDatabase("users.json", this.users);
            } else {
                await fs.writeFile(this.usersPath, JSON.stringify(this.users, null, 2));
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    async findUser(uuid) {
        try {
            return this.users.find(user => user.uuid == uuid);
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    /*
    Retrieves a fight depending the fightEventID, which is the unique ID given to every fight.
    */
    async getFight(fightEventID) {
        try {
            return this.upComingMatches.find(match => match.event_id == fightEventID);
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    /*
    Parses the matchData from the UFC json data that we receive. return it as {upcomingMatches, previousMatches} but previousMatches has ALL past saved matches.
    */
    async parseMatchDataJson(data) {
        try {
            var upComingMatches = [];

            let previousMatches;
            if (this.databaseURI) {
                previousMatches = await this.readDatabase("previousMatches.json");
            } else {
                previousMatches = JSON.parse(await fs.readFile(this.previousMatchesPath));
            }

            if (data.matchups) {
                for (var fight of data.matchups) {
                    try {


                        if (fight.type == "matchup") {
                            //Starts by fixing unformated dates. Puts them in milliseconds form for easier use.
                            var date = Date.parse(fight.event_date);
                            if (isNaN(date)) date = Date.now();
                            fight.event_date = date;
                            if (fight.status == "") {
                                if (!isNaN(fight.away_odds) && !isNaN(fight.home_odds)) {
                                    upComingMatches.push(fight);
                                }
                            } else {
                                if (!previousMatches.find(match => match.event_id == fight.event_id))
                                    previousMatches.push(fight);

                            }
                        }
                    } catch (err) {
                        console.log(err);
                        continue;
                    }
                }
            }
            return { upComingMatches: upComingMatches, previousMatches: previousMatches }
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}
main();
/*
Test function
*/



async function main() {
    // var test = new UFC();
    // await test.loadFromFile();
    // await test.refreshUpComingMatches();
    // await test.resolveBets();
    // console.log(test.previousMatches)
    // console.log(test.upComingMatches.length);
    // console.log(test.previousMatches.length);
    // var john = await test.findUser(1234);
    // var bob = await test.findUser(456);
    // var fight = test.getFight()
    // test.addUser(123, "john");
    // test.addUser(456, "bob");
    // console.log(test.outstandingBets);
    // test.takeMoney(456, 777)
    // test.addMoney(123, 4);
    // await test.refreshUpComingMatches();
    // console.log(test.upComingMatches);
    // console.log(test.previousMatches);
    // await test.addBet(new Bet("1v1", 200, 1382448, 1615694400000, {user: john, fighterName:"M Nicolau"}, {user: bob, fighterName:"T Ulanbekov"}, {user1: "125", user2: "-145"} ))
    // await test.addBet(new Bet("classic", 300, 1370716, 1615096800000, {user: john, fighterName:"I Adesanya"}, null, {user1: "-250", user2: null} ))
    // await test.resolveBets();
    // await test.cancelBet("classic", john, null);
    // console.log(test.outstandingBets);
    // console.log(await testAddUser());
}



module.exports = UFC;