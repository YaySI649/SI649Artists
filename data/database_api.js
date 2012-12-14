/*
 Importing this script will set up and populate a local WebSQL db based on sql_artists/events/venues.
 Automatically import data source files
 */

var db;

$(document).ready(function() {
    //Web SQL is only supported by chrome and Safari
    //If using unsupported browser, prompt users to switch to Chrome
    if (!window.openDatabase) {
            //$.noConflict();
            $.blockUI({ 
                message: '<h1>Sorry, your browser is not supported.</h1>'
                +'<h3>Please try <a href=\'https://www.google.com/intl/en/chrome/browser/\'>Chrome</a></h3>',
                css: { 
                border: 'none', 
                padding: '15px', 
                backgroundColor: '#000', 
                '-webkit-border-radius': '10px', 
                '-moz-border-radius': '10px', 
                opacity: .5, 
                color: '#fff' 
            } });
    }else {
        // add the blockMessage div with progress bar (invisible now)
        var _body = document.getElementsByTagName('body') [0];
        var _div = document.createElement('div');
        _div.innerHTML = "<h1> Just a minute...</h1>"
                        + "<h3> Preloading Database </h3>"
                        +"<h3> You won't need to wait after this first time:)</h3>"
                        +"<h3 id='logInsert'>Loading Data</h3>"
                        +"<div id='progressbar'></div>  ";
        _div.setAttribute("id", "blockMessage");
        _div.style.display = "none";
        _body.appendChild(_div);
        $("#progressbar").progressbar({ value: 0 });
        
        //Open the web SQL db, create if does not exists
        db = openDatabase("lastfmDB", "1.0", "music events, artists and venues", 50*1024*1024);
        var count = 0;
        //try if table exist, if not, create and populate  
        db.transaction(function(transaction){
            var sql = "SELECT * FROM sqlite_master WHERE type='table' and name='ARTISTS'";
            transaction.executeSql((sql),[], function(transaction, results){
                count = results['rows']['length']
                if (count==0){ 
                    alert("populate db");
                    jQuery.blockUI({ 
                        //show the block div
                        message: $('#blockMessage'),
                        css: { 
                        border: 'none', 
                        padding: '15px', 
                        backgroundColor: '#000', 
                        '-webkit-border-radius': '10px', 
                        '-moz-border-radius': '10px', 
                        opacity: .5, 
                        color: '#fff' 
                    } }); 
                    // import sqls, populateDB on callback
                    load_sql('sql_artists');
                    load_sql('sql_venues');
                    load_sql('sql_events', PopulateDB);
                }
                else {
                    alert("use existing db");
                }
            });             
        });
    }
});

//import datasource json and onload callback (populateDB)
function load_sql(source, callback){
    var head= document.getElementsByTagName('head')[0];
    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.src= source+'.js';
    script.onreadystatechange = callback;
    script.onload = callback;
    head.appendChild(script);
}


//insert function
function insert_sql_block(transaction, sql, insert_index, len, type, successCallBack){
    transaction.executeSql((sql),[], function(transaction, results){
        successCallBack(insert_index, len, type);
    }); 
}

//lightspeed bulk insert based on js file with sql
function BulkInsert(type){
    var sqls;
    if (type=='ARTISTS'){
        sqls = sql_artists;
    } else if (type=='EVENTS'){
        sqls = sql_events;
    } else if (type=='VENUES'){
        sqls = sql_venues;
    }
    db.transaction(function(transaction){
       for (sql in sqls){
           insert_sql_block(transaction, sqls[sql], sql, sqls.length, type,
               //success callback - log progress bar
               function(insert_index, len, type){
                   //console.log(insert_index);
                   document.getElementById('logInsert').innerHTML='Processing '+type;
                   if (insert_index%10==0 || insert_index == len-1){
                       $( "#progressbar" ).progressbar("value", Math.round(insert_index/(len-1)*100) );
                   }
               })
       }});
}

//main function to populate db
var PopulateDB = function(){
    //$.noConflict();
    // Create tables
    db.transaction(function(transaction){
        transaction.executeSql("CREATE TABLE IF NOT EXISTS ARTISTS (" +
            "name TEXT NOT NULL, genre TEXT NOT NULL, listener INTEGER,"+
            "playcount INTEGER, mbid TEXT);");      
        transaction.executeSql("CREATE TABLE IF NOT EXISTS EVENTS (" +
            "event_id NOT NULL PRIMARY KEY, title TEXT NOT NULL,"+
            "date TEXT NOT NULL, headliner TEXT, venue_id INTEGER NOT NULL,"+
            "image TEXT, cancelled INTEGER);");
        transaction.executeSql("CREATE TABLE IF NOT EXISTS VENUES (" +
            "venue_id NOT NULL PRIMARY KEY, name TEXT NOT NULL,"+
            "city TEXT, postal TEXT, country TEXT, street TEXT, "+
            "lat DOUBLE, long DOUBLE, website TEXT);");
    });
    
    var errCallback = function(){
        console.log("Some error occured during Inserting");
    }

   //lightspeed insert
   BulkInsert('ARTISTS');
   BulkInsert('VENUES');
   BulkInsert('EVENTS');
   
   //Create index for artists table (after insert)
    db.transaction(function(transaction){
        document.getElementById('logInsert').innerHTML='Creating Index'
        transaction.executeSql("CREATE INDEX artist_id on ARTISTS(name);",[],
                            function(){
                                alert("done");
                                //$.noConflict();
                                jQuery.unblockUI();
                                //document.location.reload(true);
                            });
    }); 
}

//Main API to execute sql and return obj list
//no anti injection, so dont try to burn the db@@
function query_db(sql){
    var result_set = [];
    db_con = openDatabase("lastfmDB", "1.0", "music events, artists and venues", 50*1024*1024);
    db_con.transaction(function(transaction){
        transaction.executeSql((sql),[], function(transaction, results){
            $.each(results.rows, function(rowIndex){
                    var row = results.rows.item(rowIndex);
                    result_set.push(row);
                });
            console.log(result_set);
            return result_set;
        }, function(transactoin, error){
            console.log("error processing: "+ sql);
        });             
    });
}

//teaser query:)
//var a = query_db("select count(*), b.city, b.country, c.genre from EVENTS a join VENUES b on a.venue_id = b.venue_id join ARTISTS c on c.name = a.headliner where c.genre='Pop' group by b.city, b.country order by count(*) DESC")
