# Let the scraping fly by multithreading!!
# 

import multiprocessing
from scrape import *

def process_row_init(q):
    """Initializer"""
    # Uncomment following line for downloading event json and db insert
    #query_api.q = q
    # Uncomment following line for downloading event json
    #write_json_for_artist.q = q
    # Uncomment following line for downloading artist info json
    write_json_for_artist.q = q

def unpack(artist):
    write_json_for_artist(artist, 'artist')
    
if __name__ == '__main__':
    
    """
    #Dont need these database operation if you are just writing locol json file
    if len(sys.argv)<2 or (sys.argv[1] not in ['0','1']):
        print "Unrecognized parameter, usage:"
        print "run scrape 1 \t|Create new DB (delete old db) and proceed"
        print "run scrape 0 \t|Connect to existing db"
        print "Add number of pools in the end; defaut thread is 4"
        sys.exit()
    if int(sys.argv[1])==0 and not (os.path.exists('lastfmDB.db')):
        print "Database does not exist, please use run scrape 1"
        sys.exit()
    pool_num = 8
    if len(sys.argv)>2:
        pool_num = int(sys.argv[2])
        
    con = setup_db(int(sys.argv[1]))
    con.close()
    """
    
    #8 process will work simultaneously
    pool_num = 8
    h = open('ArtistsGenres.csv','rb')
    artists = []
    for line in h:
        artist = line.strip().split(',')[0]
        artists.append(artist)
    print "#########\nget %d artists\n#########"%len(artists)
    q = multiprocessing.Queue()
    pool = multiprocessing.Pool(pool_num, process_row_init, [q])
    # Uncomment following line for downloading event json and db insert
    #results = pool.imap(query_api, artists)
    # Uncomment following line for downloading event json
    #results = pool.imap(write_json_for_artist, artists)
    # Uncomment following line for downloading artist info json
    results = pool.imap(unpack, artists)
    pool.close()
    pool.join()
