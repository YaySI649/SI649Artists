import csv
import psycopg2
import json

genres = {}
with open('../../../ArtistsGenres.csv', 'r') as f:
	for row in csv.reader(f):
		genres[row[0]] = row[1]

conn = psycopg2.connect("dbname=music user=Adorack")

cur = conn.cursor()

query = """SELECT DISTINCT ON (v.lat, v.long) e.headline_artist, v.lat, v.long FROM events e, venues v
WHERE v.id = e.venue_id"""

with open('output.txt', 'w') as f:
	w = csv.writer(f)
	w.writerow(('artist_name', 'genre', 'lat', 'lon'))
	
	cur.execute(query)
	for row in cur:
		artist_name, lat, lon = row

		try:
			genre = genres[artist_name]
		except KeyError:
			# Clearly, we don't care about them.
			continue

		w.writerow((artist_name, genre, lat, lon))

conn.close()
