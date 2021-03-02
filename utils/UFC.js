var configFile = __dirname + "/../users.json";
var axios = require("axios")
var fs = require("fs").promises;


class UFC {

    constructor(upComingMatches, previousMatches, outstandingBets, lastRefreshed) {
        if (!upComingMatches) {
            try {
                fs.readFile("../matchData.json", function(err, jsonMatchData) {
                    jsonMatchData = JSON.parse(jsonMatchData);
                    UFC.parseMatchDataJson(jsonMatchData).then(function(matchData) {
                        upComingMatches = matchData.upComingMatches;
                        previousMatches = matchData.previousMatches;
                    });

                });

            } catch(err) {
                this.refreshUpComingMatches();
            }
        }
        if (!outstandingBets) {
            try {
                var jsonBets = JSON.parse(fs.readFileSync("../bets.json"));
                
                outstandingBets = jsonBets;
            } catch(err) {
                outstandingBets = [];
            }
        }
        if (!lastRefreshed) lastRefreshed = 0;
        if (upComingMatches) this.upComingMatches = upComingMatches; //List of upcoming matches
        if (previousMatches) this.previousMatches = previousMatches; //List of previous matches
        this.outstandingBets = outstandingBets; //List of previous matches
        this.lastRefreshed = lastRefreshed; //Ex. Last time the upComingMatches was refreshed.   
    }

    
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
            console.log(this.previousMatches);
            await fs.writeFile("../matchData.json", JSON.stringify(response.data, null, 2));
            await fs.writeFile("../previousMatches.json", JSON.stringify(this.previousMatches, null, 2));
            
        } catch(err) {
            console.log(err);
        }
    }

    async resolveBets() {
        var resolvedBets = [];
        for (var bet of this.outstandingBets) {
            if (Date.now() > bet.fightEventDate) {
                var fight = this.previousMatches.find(m => m.event_id == bet.fightEventID);
                if (fight) {
                    var winner = null;
                    var loser = null; 
                    switch (bet.betType) {
                        case "classic":
                            //If the user won. Reference https://www.gamingtoday.com/tools/moneyline/ for calculating winnings
                            if (user1.fighterName == fight.winner) {
                                var cashWon = 0;
                                winner = user1;
                                //Must use odds saved in the bet data. Sometimes, odds will change, so if we scrape website again, it will have different odds.
                                if (bet.odds > 0) cashWon = (bet.betAmount * bet.odds / 100);
                                else if (bet.odds < 0) cashWon = (bet.betAmount / (-1 * bet.odds / 100));

                                //now add cashWon + betAmount to the users account.

                            //If the user lost. Take away his money
                            } else if (fight.winner != "") { 
                                loser = user1;

                            //Match was a draw. No one wins. Give back money
                            } else {
                                //Give back betAmount to the user.
                            }

                            break;
                        case "1v1":
                            //If there was a winner
                            if (fight.winner != "") {
                                winner = [user1, user2].find(user => user.fighterName == fight.winner);
                                loser = [user1, user2].find(user => user != winner);

                                //Give winner bet.betAmount * 2;

                            //Otherwise, its a draw. No one wins
                            } else {
                                
                            }

                            break;
                        default:
                        break;
                    }
                    //After all betting is done and over, remove the bet from the list and add it to resolvedBets json.
                    resolvedBets.push(bet);
                    //Removes bet from outstandingBets
                    this.outstandingBets.splice(this.outstandingBets.indexOf(bet), 1);

                }

            }
        }
        try {
            var jsonResolvedBets = JSON.parse(await fs.readFile("../resolvedBets.json"));
            jsonResolvedBets.concat(resolvedBets);
            await fs.writeFile("../resolvedBets.json", JSON.stringify(jsonResolvedBets, null, 2))
        } catch(err) {
            console.log(err);
            console.log("Error saving jsonResolvedBets to the json file.")
        }
    }


    static async parseMatchDataJson(data) {
        try {
        var upComingMatches = [];
        var previousMatches = JSON.parse(await fs.readFile("../previousMatches.json"));
        console.log(previousMatches);
        for (var fight of data.matchups) {
            try {
                if (fight.type == "matchup") {
                    if (fight.status == "") {
                        if (!isNaN(fight.away_odds) && !isNaN(fight.home_odds)){
                            fight.event_date = Date.parse(fight.event_date);
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
var swag = new UFC();
swag.refreshUpComingMatches();

module.exports = UFC;