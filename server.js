'use strict'
 
const Hapi = require('hapi');
const Request = require('request');
const Vision = require('vision');
const Handlebars = require('handlebars');
const LodashFilter = require('lodash.filter');
const LodashTake = require('lodash.take');

const server = new Hapi.Server();

var crypto_currency = '';
var fiat_currency = '';

server.connection({
    port: 8080
});

 
// Register vision for our views
server.register(Vision, (err) => {
    server.views({
        engines: {
            html: Handlebars
        },
        relativeTo: __dirname,
        path: './views',
    });
});


server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {


	var bitstampUrl = '';
	var cexUrl = '';
	var lunoUrl = '';

	if(typeof request.query.crypto_currency !== 'undefined' && request.query.crypto_currency ){
		crypto_currency = request.query.crypto_currency;
	}
	else{
		crypto_currency = 'BTC';
	}

	if(typeof request.query.fiat_currency !== 'undefined' && request.query.fiat_currency ){
		fiat_currency = request.query.fiat_currency;
	}
	else{
		fiat_currency = 'EUR';
	}
	console.log('Fiat Currency = ', fiat_currency);
	console.log('Crypto Currency = ', crypto_currency);

	if(crypto_currency == 'BTC' && fiat_currency == 'USD'){
		bitstampUrl = 'https://www.bitstamp.net/api/v2/ticker/btcusd';
		lunoUrl = 'https://api.mybitx.com/api/1/ticker?pair=XBTZAR';
		cexUrl = 'https://cex.io/api/ticker/BTC/USD'; 
	}else if(crypto_currency == 'BTC' && fiat_currency == 'EUR'){
	   	bitstampUrl = 'https://www.bitstamp.net/api/v2/ticker/btceur';
		lunoUrl = 'https://api.mybitx.com/api/1/ticker?pair=XBTZAR';
		cexUrl = 'https://cex.io/api/ticker/BTC/EUR';  
	}
	else if(crypto_currency == 'ETH' && fiat_currency == 'USD'){
		bitstampUrl = 'https://www.bitstamp.net/api/v2/ticker/ethusd';
		lunoUrl = 'https://api.mybitx.com/api/1/ticker?pair=ETHXBT';
		cexUrl = 'https://cex.io/api/ticker/ETH/USD';
	}else if(crypto_currency == 'ETH' && fiat_currency == 'EUR'){
		bitstampUrl = 'https://www.bitstamp.net/api/v2/ticker/etheur';
		lunoUrl = 'https://api.mybitx.com/api/1/ticker?pair=ETHXBT';
		cexUrl = 'https://cex.io/api/ticker/ETH/EUR';
	}
	else if(crypto_currency == 'XRP' && fiat_currency == 'USD'){
		bitstampUrl = 'https://www.bitstamp.net/api/v2/ticker/xrpusd';
		cexUrl = 'https://cex.io/api/ticker/XRP/USD';
		lunoUrl = 'https://api.mybitx.com/api/1/ticker?pair=ETHXBT';
	}else if(crypto_currency == 'XRP' && fiat_currency == 'EUR'){
		bitstampUrl = 'https://www.bitstamp.net/api/v2/ticker/xrpeur';
		cexUrl = 'https://cex.io/api/ticker/XRP/EUR';
		lunoUrl = 'https://api.mybitx.com/api/1/ticker?pair=ETHXBT';
	}


	var lunoAsk = '';
	var bitstampAsk = '';        
	var exchangeRate = 0;
	var cexAsk = '';

	Request.get(bitstampUrl, function (error, response, body) {
            if (error) {
                throw error;
            }
 
            var data = JSON.parse(body);
	    bitstampAsk = data.ask;
	
		var exchangeUrl = '';
		if(fiat_currency == 'USD'){
			exchangeUrl = 'https://openexchangerates.org/api/latest.json?app_id=e62644a0a16e42d2902de30f4fd253de&symbols=ZAR&base=USD';
		}
		else if(fiat_currency == 'EUR'){
			exchangeUrl = 'https://openexchangerates.org/api/latest.json?app_id=e62644a0a16e42d2902de30f4fd253de&symbols=ZAR&base=EUR';
		}

		Request.get(exchangeUrl, function (error, response, body2) {
            		if (error) {
                		throw error;
            		}

            		var data2 = JSON.parse(body2);
            		exchangeRate = parseFloat(data2.rates.ZAR).toFixed(2);
            		console.log('ER: ',exchangeRate);

			 Request.get(lunoUrl, function (error, response, body3) {
           			 if (error) {
                			throw error;
            			}

            			var data3 = JSON.parse(body3);
            			lunoAsk = data3.ask;
				console.log("Luno done...");

					Request.get(cexUrl, function (error, response, body4) {
                        		         if (error) {
                                        		throw error;
                                		}

                                	var data4 = JSON.parse(body4);
                                	cexAsk = data4.ask;
					console.log("CEX done...");

						var BS_LUNO_fees = 0;
						var BS_LUNO_arbitrage = 0;
						var BS_LUNO_percentage = 0;

						BS_LUNO_fees = parseFloat((parseFloat(lunoAsk) * 0.01) + ((parseFloat(bitstampAsk) * exchangeRate) * 0.0025)).toFixed(2);
						BS_LUNO_arbitrage = parseFloat(parseFloat(lunoAsk) - (parseFloat(bitstampAsk) * exchangeRate) - BS_LUNO_fees).toFixed(2);
						BS_LUNO_percentage = parseFloat(100*(BS_LUNO_arbitrage / (parseFloat(bitstampAsk) * exchangeRate))).toFixed(2);
				
						console.log('BS_LUNO fees = ', BS_LUNO_fees);	
						console.log('BS_LUNO Arbitrage = ', BS_LUNO_arbitrage);
						console.log('BS_LUNO Percentage = ', BS_LUNO_percentage);

						var BS_CEX_fees = 0;
						var BS_CEX_arbitrage = 0;
						var BS_CEX_percentage = 0;

						BS_CEX_fees = parseFloat((parseFloat(cexAsk) * 0.0025)+(parseFloat(bitstampAsk) * 0.0025)).toFixed(10);
                                        	BS_CEX_arbitrage = parseFloat(parseFloat(cexAsk) - parseFloat(bitstampAsk) - BS_CEX_fees).toFixed(10);
                                        	BS_CEX_percentage = parseFloat(100*(BS_CEX_arbitrage / parseFloat(cexAsk))).toFixed(2);

                                        	console.log('BS_CEX_fees = ', BS_CEX_fees);
                                        	console.log('BS_CEX Arbitrage = ', BS_CEX_arbitrage);
                                        	console.log('BS_CEX Percentage = ', BS_CEX_percentage);

						var LUNO_CEX_fees = 0;
						var LUNO_CEX_arbitrage = 0;
						var LUNO_CEX_percentage = 0;

						LUNO_CEX_fees = parseFloat((parseFloat(lunoAsk/exchangeRate)*0.01)+(parseFloat(cexAsk) * 0.0025)).toFixed(2);
						LUNO_CEX_arbitrage = parseFloat(parseFloat(cexAsk) - (parseFloat(lunoAsk)/exchangeRate) - LUNO_CEX_fees).toFixed(2);
						LUNO_CEX_percentage = parseFloat(100*(LUNO_CEX_arbitrage / (parseFloat(lunoAsk)/exchangeRate))).toFixed(2);
					
                                        	console.log('LUNO_CEX_fees = ', BS_CEX_fees);
                                        	console.log('LUNO_CEX Arbitrage = ', LUNO_CEX_arbitrage);
                                        	console.log('LUNO_CEX Percentage = ', LUNO_CEX_percentage);					

						var LUNO_BS_percentage = -1 * BS_LUNO_percentage;
						var CEX_BS_percentage = -1 * BS_CEX_percentage;
						var CEX_LUNO_percentage = -1 * LUNO_CEX_percentage;
					

					const output = { bitstamp: bitstampAsk, luno: lunoAsk, cex: cexAsk, exchange: exchangeRate, BS_LUNO_percentage: BS_LUNO_percentage, BS_CEX_percentage: BS_CEX_percentage, LUNO_CEX_percentage: LUNO_CEX_percentage, LUNO_BS_percentage: LUNO_BS_percentage, CEX_LUNO_percentage: CEX_LUNO_percentage, CEX_BS_percentage: CEX_BS_percentage };
            				console.log('Output: %j', output);
            				reply.view('index', { result: output });
        				});
				});
			
		});		
	  });
      }
});


server.route({
	method: 'POST',
      	path: '/',
     	handler: function(request, response){

	 
		console.log(request);
		

      	}
});



 
// A simple helper function that extracts price from bitstamp API
Handlebars.registerHelper('ifIsZero', function(value, options){
	if(value > 0) {
		return options.fn(this);
	}
	return options.inverse(this);
});

Handlebars.registerHelper('ifLunoCurrency', function(options){
	if(crypto_currency == 'BTC') {
		return options.fn(this);
	}
	return options.inverse(this);
});

Handlebars.registerHelper('ifDsxCurrency', function(options){
	if(crypto_currency == 'BTC' || crypto_currency == 'ETH') {
		return options.fn(this);
	}
	return options.inverse(this);
});


server.start((err) => {
    if (err) {
        throw err;
    }
 
    console.log(`Server running at: ${server.info.uri}`);
});
