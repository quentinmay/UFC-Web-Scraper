var configFile = __dirname + "/../users.json";
var axios = require("axios")
var fs = require("fs")
var datefns = require("date-fns")

try {
   // var config = require(configFile);

  } catch (err) {
     // console.log(err)
  }

class UFC {

    constructor(upComingMatches, previousMatches, lastRefreshed) {
        if (!upComingMatches) {
            //search txt file for upComingMatches.
            //then if text file not found, refresh on its own.
        }
        // if (!previousMatches) throw new Exception("lastMatches needed"); 
        if (!lastRefreshed) lastRefreshed = 0;
        this.upComingMatches = upComingMatches; //List of upcoming matches
        this.previousMatches = previousMatches; //List of previous matches
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
            console.log(data.upComingMatches);
            this.upComingMatches = data.upComingMatches;
            this.previousMatches = data.previousMatches;
            fs.writeFileSync("../matchData.json", JSON.stringify(response.data, null, 2));
        } catch(err) {
            console.log(err);
        }
    }

    static async parseMatchDataJson(data) {
        var upComingMatches = [];
        var previousMatches = [];
        // console.log(data);
        for (var fight of data.matchups) {
            try {
                if (fight.type == "matchup") {
                    if (fight.status == "") {
                        if (!isNaN(fight.away_odds) && !isNaN(fight.home_odds)){
                            fight.event_date = Date.parse(fight.event_date);
                            upComingMatches.push(fight);
                        }
                    } else {
                        previousMatches.push(fight);
                    }
                }
        } catch (err) {
            console.log(err);
            continue;
            }
        }
        return {upComingMatches: upComingMatches, previousMatches: previousMatches}
    }
}
var swag = new UFC();
swag.refreshUpComingMatches();

module.exports = UFC;