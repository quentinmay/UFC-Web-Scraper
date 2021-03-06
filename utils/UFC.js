var axios = require("axios");
var Bet = require("./Bet.js");
var User = require("./User.js");
var fs = require("fs").promises;
var file = require("fs");


class UFC {

    constructor(users, upComingMatches, previousMatches, outstandingBets, lastRefreshed) {
        if (!users) {
            try {
                var jsonUsers = JSON.parse(file.readFileSync("../users.json"));
                users = jsonUsers;
                console.log("Successfully read users.json for user data.");
            } catch(err) {
                users = [];
            }
        }
        if (!upComingMatches) {
        }
        if (!outstandingBets) {
            try {
                var jsonBets = JSON.parse(file.readFileSync("../bets.json"));
                outstandingBets = jsonBets;
                console.log("Successfully read bets.json for outstandingBets.");
            } catch(err) {
                outstandingBets = [];
            }
        }
        
        if (!lastRefreshed) lastRefreshed = 0;
        this.users = users; //List of users
        this.upComingMatches = upComingMatches; //List of upcoming matches
        this.previousMatches = previousMatches; //List of previous matches
        this.outstandingBets = outstandingBets; //List of previous matches
        this.lastRefreshed = lastRefreshed; //Ex. Last time the upComingMatches was refreshed.   
        this.checkFiles(); //Just checks to see if all the necessary json files are made.
    }

    /*
    Webscrapes oddshark UFC website for match data.
    Refreshes the match data. Gets all upComingMatches and populates the datasection with those. Then gets all previousMatches and updates the json as well as data section
    */
    async refreshUpComingMatches() {
        try {
            const time = Date.now();
            const options = {
                headers: {'authority': "io.oddsshark.com",
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
                'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36"}
            }
            var response = await axios.get(`https://io.oddsshark.com/ticker/ufc?_=${time}`, options)
            var data = await UFC.parseMatchDataJson(response.data)
            this.upComingMatches = data.upComingMatches;
            this.previousMatches = data.previousMatches;
            this.lastRefreshed = Date.now();
            await fs.writeFile("../matchData.json", JSON.stringify(response.data, null, 2));
            await fs.writeFile("../previousMatches.json", JSON.stringify(this.previousMatches, null, 2));
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    }

    /*
    Uses hardcoded text file paths and checks to see if they exist then creates those files if they dont
    */
    async checkFiles() {
        var files = ["../resolvedBets.json", "../matchData.json", "../users.json", "../previousMatches.json", "../bets.json"];
        for (var file of files) {
            try {
                await fs.readFile(file);
            } catch(err) {
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
        //Checks to see if there are any bets of the same type between the SAME 1 or 2 people
        var foundBet = await this.findOutstandingBet(bet.betType, bet.user1, bet.user2);
        if (foundBet) {
            console.log("Error: bet of this type already exists with this player/s");
            return false;
        } else if (this.previousMatches.find(match => match.event_id == bet.fightEventID)) {
            console.log("Error: tried to make bet on a fight that is already over");
            return false;
            } else
            {
                try {
                    this.outstandingBets.push(bet);
                    console.log("Adding new bet")
                    await this.writeBetsToFile();
                    return true;
                } catch(err) {
                    console.log(err);
                    console.log("Failed to add to outstandingBets")
                    return false;
                }
                
            }
        }

    /*
    Finds the outstanding bet that you want and deletes that bet then writes it to file to ensure its definitely gone.
    */
    async cancelBet(betType, user1, user2) {
        try {
            var bet = await this.findOutstandingBet(betType, user1, user2);
            if (bet) {
                console.log("Cancelling bet");
                this.outstandingBets.splice(this.outstandingBets.indexOf(bet), 1);
                await this.writeBetsToFile();
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
    async findOutstandingBet(betType, user1, user2) {
        var foundBet = null;
        if (betType == "classic") {
            foundBet = this.outstandingBets.find(b => (b.betType == betType && b.user1.user.uuid == user1.user.uuid));
        } else if (betType == "1v1") {
            foundBet = this.outstandingBets.find(b => b.betType == betType && ((b.user1.user.uuid == user1.user.uuid && b.user2.user.uuid == user2.user.uuid) || b.user1.user.uuid == user2.user.uuid && b.user2.user.uuid == user1.user.uuid));
        }
        if (foundBet) {
            return foundBet;
        }else
            return null;
    }

    /*
    Loops through all existing bets within outstandingBets file to find all the bets that SHOULD be ready to be completed. If the fight is within previousMatches (over
    and decision exists), resolves the bet from there. If not, doesnt do anything.
    */
    async resolveBets() {
        var resolvedBets = [];
        console.log('resolve bets');
        for (var bet of this.outstandingBets) {
            if (Date.now() > bet.fightEventDate) { //If we passed the bets fight date. Then we want to check the completion of the fight
                var fight = this.previousMatches.find(m => m.event_id == bet.fightEventID);
                if (fight) {
                    var winner = null;
                    var loser = null; 
                    switch (bet.betType) {
                        case "classic":

                            //If the user won. Reference https://www.gamingtoday.com/tools/moneyline/ for calculating winnings
                            if (bet.user1.fighterName == fight.winner) {
                                var cashWon = 0;
                                winner = bet.user1.user;
                                //Must use odds saved in the bet data. Sometimes, odds will change, so if we scrape website again, it will have different odds.
                                if (bet.odds.user1 > 0) cashWon = (bet.betAmount * bet.odds.user1 / 100);
                                else if (bet.odds.user1 < 0) cashWon = (bet.betAmount / (-1 * bet.odds.user1 / 100));

                                //now add cashWon + betAmount to the users account.
                                console.log("classic won: " + cashWon);
                                this.addMoney(winner.uuid, (cashWon + bet.betAmount));

                            //If the user lost. Don't give any money. We've already taken money from their account
                            } else if (fight.winner != "") { 
                                loser = bet.user1.user;
                                console.log("classic lose");

                            //Match was a draw. No one wins. Give back money
                            } else {
                                //Give back betAmount to the user.
                                console.log("classic draw");
                                this.addMoney(bet.user1.user.uuid, bet.betAmount);
                            }

                            break;
                        case "1v1":
                            //If there was a winner
                            if (fight.winner != "") {
                                winner = [bet.user1, bet.user2].find(user => user.fighterName == fight.winner);
                                loser = [bet.user1, bet.user2].find(user => user != winner);

                                //Give winner bet.betAmount * 2;
                                this.addMoney(winner.user.uuid, (bet.betAmount * 2))

                            //Otherwise, its a draw. No one wins. Give back both their money
                            } else {
                                this.addMoney(bet.user1.user.uuid, bet.betAmount)
                                this.addMoney(bet.user2.user.uuid, bet.betAmount)
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
                }

            }
        }
        //Want to write all this to file since weve updated and resolved alot of bets;
        try {
            // console.log(resolvedBets.length);
            if (resolvedBets.length > 0) {
                var jsonResolvedBets = JSON.parse(await fs.readFile("../resolvedBets.json"));
                jsonResolvedBets = jsonResolvedBets.concat(resolvedBets);
                await fs.writeFile("../resolvedBets.json", JSON.stringify(jsonResolvedBets, null, 2))
                await this.writeBetsToFile();
                await this.writeUsersToFile();
            }
            return true;
        } catch(err) {
            console.log(err);
            console.log("Error saving jsonResolvedBets/Users to the json file.")
            return false;

        }
    }

    async addMoney(uuid, moneyGiven) {
        try {
            var user = this.users.find(user => user.uuid == uuid);
            user.balance = user.balance + moneyGiven;
            await this.writeUsersToFile();
            return true;
        } catch(err) {
            console.log(err)
            return false;
        }
    }


    async loadFromFile() {
        try {
            var matchData = JSON.parse(file.readFileSync("../matchData.json"));
            var data = await UFC.parseMatchDataJson(matchData);
            this.upComingMatches = data.upComingMatches;
            this.previousMatches = data.previousMatches;
            this.lastRefreshed = Date.now();
            console.log("Successfully read matchData.json for upComingMatches and previousMatches.");
            await fs.writeFile("../previousMatches.json", JSON.stringify(this.previousMatches, null, 2));
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    }

    /*
    Simple function to remove money from a Users account and write that to file.
    */
    async takeMoney(uuid, moneyTaken) {
        try {
            var user = this.users.find(user => user.uuid == uuid);
            if (user.balance - moneyTaken < 0) throw new Error("User balance can't fall below 0");
            user.balance = user.balance - moneyTaken;
            await this.writeUsersToFile();
            return true;
        } catch(err) {
            console.log(err)
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
            await fs.writeFile("../bets.json", JSON.stringify(this.outstandingBets, null, 2));
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    }

    async writeUsersToFile() {
        console.log("Write Users To File");
        try {
            await fs.writeFile("../users.json", JSON.stringify(this.users, null, 2));
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    }

    async findUser(uuid) {
        try {
            return this.users.find(user => user.uuid == uuid);
        } catch(err) {
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
        } catch(err) {
            console.log(err);
            return null;
        }
    }

    /*
    Parses the matchData from the UFC json data that we receive. return it as {upcomingMatches, previousMatches} but previousMatches has ALL past saved matches.
    */
    static async parseMatchDataJson(data) {
        try {
        var upComingMatches = [];
        var previousMatches = JSON.parse(await fs.readFile("../previousMatches.json"));
        for (var fight of data.matchups) {
            try {


                if (fight.type == "matchup") {
                    //Starts by fixing unformated dates. Puts them in milliseconds form for easier use.
                    var date = Date.parse(fight.event_date);
                    if (isNaN(date)) date = Date.now();
                    fight.event_date = date;
                    if (fight.status == "") {
                        if (!isNaN(fight.away_odds) && !isNaN(fight.home_odds)){
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
        return {upComingMatches: upComingMatches, previousMatches: previousMatches}
    }catch(err) {
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
    var test = new UFC();
    await test.loadFromFile();
    // console.log(test.previousMatches)
    // console.log(test.upComingMatches.length);
    // console.log(test.previousMatches.length);
    var john = await test.findUser(1234);
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
    await test.resolveBets();
    // await test.cancelBet("classic", john, null);
    // console.log(test.outstandingBets);
}


module.exports = UFC;