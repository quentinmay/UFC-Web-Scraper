var webdriver = require('selenium-webdriver');

var By = webdriver.By;

var until = webdriver.until;

var driver = new webdriver.Builder().forBrowser('chrome').build();

driver.get('https://www.google.com');