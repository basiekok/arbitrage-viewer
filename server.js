'use strict'
 
const Hapi = require('hapi');
const Request = require('request');
const Vision = require('vision');
const Handlebars = require('handlebars');
const LodashFilter = require('lodash.filter');
const LodashTake = require('lodash.take');

const server = new Hapi.Server();
 
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

	console.log(request.query.currency);

	var tmp = '';
	if(request.query.currency == 'BTC'){
		tmp = 'https://www.bitstamp.net/api/v2/ticker/btcusd';
	}else if(request.query.currency == 'ETH'){
		tmp = 'https://www.bitstamp.net/api/v2/ticker/ethusd';
	}else if(request.query.currency == 'XRP'){
		tmp = 'https://www.bitstamp.net/api/v2/ticker/xrpusd';
	}

	var lunoAsk = '';
	var bitstampAsk = '';        
	var exchangeRate = 0;
	var cexAsk = '';

	Request.get(tmp, function (error, response, body) {
            if (error) {
                throw error;
            }
 
            var data = JSON.parse(body);
	    bitstampAsk = data.ask;
		

		Request.get('https://openexchangerates.org/api/latest.json?app_id=e62644a0a16e42d2902de30f4fd253de&symbols=ZAR', function (error, response, body2) {
            		if (error) {
                		throw error;
            		}

            		var data2 = JSON.parse(body2);
            		exchangeRate = parseFloat(data2.rates.ZAR * 1.035).toFixed(2);
            		console.log('ER: ',exchangeRate);

			 Request.get('https://api.mybitx.com/api/1/ticker?pair=XBTZAR', function (error, response, body3) {
           			 if (error) {
                			throw error;
            			}

            			var data3 = JSON.parse(body3);
            			lunoAsk = data3.ask;
            		
					Request.get('https://cex.io/api/ticker/BTC/USD', function (error, response, body4) {
                        		         if (error) {
                                        		throw error;
                                		}

                                	var data4 = JSON.parse(body4);
                                	cexAsk = data4.ask;


					var BS_LUNO_fees = parseFloat((parseFloat(lunoAsk) * 0.01) + ((parseFloat(bitstampAsk) * exchangeRate) * 0.003)).toFixed(2);
					var BS_LUNO_arbitrage = parseFloat(parseFloat(lunoAsk) - (parseFloat(bitstampAsk) * exchangeRate) - BS_LUNO_fees).toFixed(2);
                	                console.log('BS_LUNO Arbitrage = ', BS_LUNO_arbitrage);
					var BS_LUNO_percentage = parseFloat(100*(BS_LUNO_arbitrage / (parseFloat(bitstampAsk) * exchangeRate))).toFixed(2);
					console.log('BS_LUNO Percentage = ', BS_LUNO_percentage);



					console.log('Cex ask = ', cexAsk);
					var BS_CEX_fees = parseFloat((parseFloat(cexAsk) * 0.0025) + 50).toFixed(2);
                                        console.log('BS_CEX_fees = ', BS_CEX_fees);
					var BS_CEX_arbitrage = parseFloat(parseFloat(cexAsk) - parseFloat(bitstampAsk) - BS_CEX_fees).toFixed(2);
                                        console.log('BS_CEX Arbitrage = ', BS_CEX_arbitrage);
                                        var BS_CEX_percentage = parseFloat(100*(BS_CEX_arbitrage / parseFloat(cexAsk))).toFixed(2);
                                        console.log('BS_CEX Percentage = ', BS_CEX_percentage);

					var LUNO_CEX_fees = parseFloat((parseFloat(cexAsk) * 0.0125) + 50).toFixed(2);
                                        console.log('LUNO_CEX_fees = ', BS_CEX_fees);
                                        var LUNO_CEX_arbitrage = parseFloat(parseFloat(cexAsk) - (parseFloat(lunoAsk)/exchangeRate) - LUNO_CEX_fees).toFixed(2);
                                        console.log('LUNO_CEX Arbitrage = ', LUNO_CEX_arbitrage);
                                        var LUNO_CEX_percentage = parseFloat(100*(LUNO_CEX_arbitrage / (parseFloat(lunoAsk)/exchangeRate))).toFixed(2);
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
Handlebars.registerHelper('bitstampPrice', function (teamUrl) {
    return teamUrl.slice(38);
});

server.start((err) => {
    if (err) {
        throw err;
    }
 
    console.log(`Server running at: ${server.info.uri}`);
});
