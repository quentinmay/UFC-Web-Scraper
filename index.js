//const {Builder, By, Key, until} = require('selenium-webdriver');
//const chrome = require('selenium-webdriver/chrome');
//const chromedriver = require('chromedriver');
const axios = require('axios').default;
const cheerio = require('cheerio');
var fs = require('fs');

getAxiousUFC();
//
async function getAxiousUFC() {
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
  
  fs.writeFileSync("matchData.json", JSON.stringify(response.data, null, 2));
  console.log(response.data);

}

//chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

/*
async function example() {

let driver = new webdriver.Builder()
    .forBrowser('chrome')
    .setChromeOptions()
    .build();
    
      await driver.get('http://www.google.com/ncr');
      
      await driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);
      await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
      console.log(driver);
      
      await driver.quit();

  }
    */


/*
const screen = {
  width: 640,
  height: 480
};

let driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().headless().windowSize(screen))
    .build();
    */