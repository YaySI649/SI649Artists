import csv
import sqlite3
import json

genres = {}
with open('../../../ArtistsGenres.csv', 'r') as f:
	for row in csv.reader(f):
		genres[row[0]] = row[1]
		# print row[0]

conn = sqlite3.connect('../../../lastfmDB.db')
conn.row_factory = sqlite3.Row

cur = conn.cursor()

query = """SELECT * FROM events e
LEFT JOIN venues v ON (v.id = e.venue_id)
LEFT JOIN event_artist ea ON (ea.event_id = e.id)
"""

# print "var artists = ["
count = 0
with open('output.txt', 'w') as f:
	w = csv.writer(f)
	w.writerow(('artist_name', 'genre', 'lat', 'lon'))
	for row in cur.execute(query):
		artist_name, lat, lon = [row[x] for x in ('artist_name', 'lat', 'long')]

		genre = genres.get(artist_name, None)
		if not genre:
			# Clearly, we don't care about them.
			continue

		w.writerow((artist_name, genre, lat, lon))

		count += 1
		if count == 5000:
			break

	# print json.dumps({'artist': artist_name, 'genre': genre, 'lat': lat, 'lon': lon}), ","
# print "];"

conn.close()
