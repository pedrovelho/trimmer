#!/usr/bin/nodejs
/**
 * Trello API works with rest. Trello is organized in boards, each board has several columns. Each column is called
 * a list, in Trello jargon. A list is a set of cards, cards go from one list to another until they reach the final
 * goal mostly in a pipeline like style. 
 *
 * You need to have a trimmer.conf file properly set. See README.md for more details.
 * 
 * Usage install nodejs, for instance:
 * 
 * ```bash
 * apt get installl nodejs npm
 * ```
 *
 * After install dependencies.
 *
 * ```bash
 * npm install
 * ```
 *
 * Now just run trimmer.js in your terminal.
 *
 * ```bash
 * ./trimmer.js
 * ```
 */
var getJSON = require("get-json")

var GetOpt  = require("node-getopt")

var defaultConfigFile = "trimmer.conf"
var defaultOutputFile = "trimmer.data"

var getopt = new GetOpt([
    ["v" , "verbose"            ,  "if present will log verbose output"],
    ["c" , "config=[ARG]"       , "<filename> configuration file, default is '"+defaultConfigFile+"'"],
    ["o" , "output=[ARG]"       , "<filename> output file, default is '"+defaultOutputFile+"'"],
    ["h" , "help"               , "display this help"]
]).bindHelp()

getopt.setHelp(
  "Usage: trimmer.js [OPTION]\n" +
	"This is the trimmer the Trello timer. To get started do npm install and change\n" +
	defaultConfigFile+" to match your needs, for more information see README.md.\n" +
	"[[OPTIONS]]\n" +
	"\n"
)
var options = getopt.bindHelp().parseSystem().options

logIfVerbose("Verbose mode is ON")

//read configuration from properties file
var fs = require("fs")
var propertiesFile = (options.config) ? options.config : defaultConfigFile
var properties = JSON.parse(fs.readFileSync(propertiesFile, "utf8"))
if(options.verbose){
    console.info(properties)
}
var API_KEY   = properties.trello.API_KEY
var API_TOKEN = properties.trello.API_TOKEN

//specific to Trello API
var urlPrefix = "https://trello.com/1"
var urlPosfix = "key="+API_KEY+"&token="+API_TOKEN

//compute statistics for the cards
computeStatistics(properties.monitorLists,
		  properties.ignoreCards,
		  (options.output)? options.output : defaultOutputFile)

//update statistics on the jenkins board


function urlMaker(target) {
    return urlPrefix+target+urlPosfix
}

function logIfVerbose(msg) {
    if(options.verbose){
	console.log(msg)
    }
}

function computeStatistics(monitorLists, ignoreCards, outputFile){
    var listMove = []
    var outputWriter = fs.createWriteStream(outputFile, { flags: "w" })
    var sep = ";"
    
    outputWriter.write("Card Id"+sep+"Created date")
    for(listId in monitorLists){
	outputWriter.write(sep+monitorLists[listId])
    }
    outputWriter.write(sep+"Card name\n")

    //foreach list being monitored
    for (var listId in monitorLists) {
	var listUrl = urlMaker("/lists/"+listId+ "/cards?")
	getJSON(listUrl, function (error, response){
	    //first check if the listId is valid
	    if(!response){
		console.log("Unknown listId probably due to bad configuration, check configuration file (default is trimmer.conf)!")
		process.exit(1)
	    }
	    
	    //cycle all cards within the list
	    response.forEach( function (card){
		var cardUrl = urlMaker("/cards/"+card.id+"/actions/?")
		getJSON(cardUrl, function(error, response){
		    //if it is in the ignore it, just ignore
		    if(ignoreCards[card.id]){
			return
		    }
		    
		    //will keep track of each time the card moved from a list to another
		    listMove = []
		    
		    logIfVerbose("===================================")
		    logIfVerbose("card id     = "+card.id)
		    logIfVerbose("card name   = "+card.name)
		    logIfVerbose("card listId = "+card.idList)

		    //this is strange and yet work, we use the 8 bytes of the id as the time
		    //see http://help.trello.com/article/759-getting-the-time-a-card-or-board-was-created
		    var createdTime = 1000*parseInt(card.id.substring(0,8),16)

		    //first entry when the list was created
		    listMove.push([Object.keys(monitorLists)[0], new Date(createdTime)])		

		    logIfVerbose("Created in "+new Date(createdTime))

		    response.forEach( function(action){
			if(action.data.listAfter){
			    listMove.push([action.data.listAfter.id, new Date(action.date)])
			}
		    })

		    //sum this difference to the list total time
		    var times = {}
		    
		    logIfVerbose("TIME for card : ")
		    listMove.sort(function (a_, b_) {
			var a = a_[1].getTime();
			var b = b_[1].getTime();
			return a-b
		    })
			.forEach( function(action, i) {
			    var diff;
			    if(i+1 >= listMove.length){
				//this is the last move
				diff = (new Date()).getTime() - action[1].getTime()
			    }else{
				//compute diff (time next - time this)
				diff = listMove[i+1][1].getTime() - action[1].getTime()
			    }
			    
			    //if does not exist yet in the dictionary create it 
			    if(!times[action[0]]){
				times[action[0]] = 0
			    }

			    //sum the differences for each column it moved in
			    times[action[0]] += diff
			    logIfVerbose("    => "+action[0]+"   "+action[1])
			})

 		    outputWriter.write(""+card.id+sep+(new Date(createdTime)))
		    for(listId in monitorLists){
			if(times[listId]){
			    outputWriter.write(sep+(times[listId]/(3600000)))
			}else{
			    outputWriter.write(sep+"NA")
			}
		    }
		    outputWriter.write(sep+"\""+card.name+"\"\n")

		    for(var listId in times) {
			logIfVerbose("    "+listId+"   ===>  "+(times[listId]/(3600000))+" hours");
		    }
		})
	    })
	})
    }
}
