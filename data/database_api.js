/*
$(function() {
    $( "#progressbar" ).progressbar("value", 37 );
}); 
*/
var db;
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
    //Open the web SQL db, create if does not exists
    var db = openDatabase("lastfmDB", "1.0", "music events, artists and venues", 50*1024*1024);
    var count = 0;
    //try if table exist, if not, create and populate  
    db.transaction(function(transaction){
        var sql = "SELECT * FROM sqlite_master WHERE type='table' and name='ARTISTS'";
        transaction.executeSql((sql),[], function(transaction, results){
            count = results['rows']['length']
            if (count==0){ 
                alert("populate db");
                //import datasource json
                //import_json('json_artists');
                //import_json('json_venues');
                //import_json('json_events');
                //import_json('sql_artists');
                //import_json('sql_venues');
                PopulateDB();
            }
            else {
                alert("use existing db");
            }
        });             
    });
}

//import datasource json
function load_sql(source, callback){
    var head= document.getElementsByTagName('head')[0];
    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.src= source+'.js';
    script.onreadystatechange = callback;
    script.onload = callback;
    head.appendChild(script);
}

//lightspeed bulk insert based on js file with sql
function BulkInsert(sqls, type){
    db.transaction(function(transaction){
       for (sql in sqls){
           transaction.executeSql((sqls[sql]),[], function(transaction, results){
                document.getElementById('logInsert').innerHTML='Processing '+type;
                $( "#progressbar" ).progressbar("value", Math.round(sql/(sqls.length-1)*100) );
            });  
       }});
}

function PopulateDB(){
    // bockUI to show loading 
    //$.noConflict();
    jQuery.blockUI({ 
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
    
    //Snail speed insert - deprecated
    /*
    //func to insert one artist
    var insert_artist = function (name, genre, listener, playcount, mbid,
                                  i, transaction, successCallback){
        transaction.executeSql(("INSERT INTO ARTISTS"+
                                "(name, genre, listener, playcount, mbid)"+
                                "VALUES (?,?,?,?,?);"),
                                [name, genre, listener, playcount, mbid],
                                function(transaction, results){
                                    successCallback(i);
                                }, errCallback);
    };
    //insert artists
    db.transaction(function(transaction) {
        for (i=0; i<artists.length; i++){
            artist = artists[i]
            insert_artist(artist["name"], artist["genre"], artist["listener"],
                          artist["playcount"], artist['mbid'], i, transaction,
                          //success callback
                          function(insertIndex){
                                //console.log(insertIndex);
                                document.getElementById('logInsert').innerHTML='Processing '
                                        +insertIndex+'/'+ (artists.length-1)+" artists";  
                                if (insertIndex%100==0 || insertIndex == artists.length-1){
                                    $( "#progressbar" ).progressbar("value", Math.round(insertIndex/(artists.length-1)*100) );
                                }
                                
                          })
        }        
    });
    
    //func to insert one venue
    var insert_venue = function (venue_id, name, city, postal, country,
                                 street, lat, lon, website,
                                 i, transaction, successCallback){
        transaction.executeSql(("INSERT INTO VENUES"+
                                "(venue_id, name, city, postal, "+
                                "country, street, lat, long, website)"+
                                "VALUES (?,?,?,?,?,?,?,?,?);"),
                                [venue_id, name, city, postal, country,
                                 street, lat, lon, website],
                                function(transaction, results){
                                    successCallback(i);
                                });
    }; 
    //insert venues       
    db.transaction(function(transaction) {
        for (i=0; i<venues.length; i++){
            venue = venues[i]
            insert_venue(venue["venue_id"], venue["name"], venue["city"], 
                         venue["postal"], venue["country"], venue["street"], 
                         venue["lat"], venue["long"], venue["website"],
                         i, transaction,
                         function(insertIndex){
                                //console.log(insertIndex);
                                document.getElementById('logInsert').innerHTML='Processing '
                                        +insertIndex+'/'+ (venues.length-1)+" venues";
                                if (insertIndex%3000==0 || insertIndex == venues.length-1){
                                    $( "#progressbar" ).progressbar("value", Math.round(insertIndex/(venues.length-1)*100) );
                                }
                          })
        }        
    });
   
    //func to insert one event
    var insert_event = function (event_id, title, date, headliner, 
                                 venue_id, image, cancelled,
                                 i, transaction, successCallback){
        transaction.executeSql(("INSERT INTO EVENTS"+
                                "(event_id, title, date, headliner, "+
                                "venue_id, image, cancelled)"+
                                "VALUES (?,?,?,?,?,?,?);"),
                                [event_id, title, date, headliner, 
                                 venue_id, image, cancelled],
                                function(transaction, results){
                                    successCallback(i);
                                }, errCallback);
    }; 
    //insert events       
    db.transaction(function(transaction) {
        for (i=0; i<events.length; i++){
            event = events[i]
            insert_event(event["event_id"], event["title"], event["date"], 
                         event["headliner"], event["venue_id"], event["image"], 
                         event["cancelled"], i, transaction,
                         function(insertIndex){
                                //console.log(insertIndex);
                                document.getElementById('logInsert').innerHTML='Processing '
                                        +insertIndex+'/'+ (events.length-1)+" events";
                                if (insertIndex%8000==0 || insertIndex == events.length-1){
                                    $( "#progressbar" ).progressbar("value", Math.round(insertIndex/(events.length-1)*100) );
                                }
                                
                                if (insertIndex==events.length-1){
                                    document.getElementById('logInsert').innerHTML='Creating Index'
                                }
                          })
        }        
    });
    
    
    */

   //lightspeed insert
   BulkInsert(sql_artists, 'Artists');
   BulkInsert(sql_venues, 'Venues');
   BulkInsert(sql_events, 'Events');
   
   //Create index for artists (after insert)
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

function query_db(sql){
    var result_set = [];
    db.transaction(function(transaction){
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

//var a = query_db("select count(*), b.city, b.country, c.genre from EVENTS a join VENUES b on a.venue_id = b.venue_id join ARTISTS c on c.name = a.headliner where c.genre='Pop' group by b.city, b.country order by count(*) DESC")
//console.log(a)
