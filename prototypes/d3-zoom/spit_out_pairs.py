import json
import itertools as it

def pairwise(iterable):
	"s -> (s0,s1), (s1,s2), (s2, s3), ..."
	a, b = it.tee(iterable)
	next(b, None)
	return it.izip(a, b)

unformatted_json = None
with open('usher.js', 'r') as f:
	unformatted_json = json.load(f)

venues = [x['venue']['location']['geo:point'] for x in unformatted_json['events']['event']]

geom = [[float(x['geo:long']), float(x['geo:lat'])] for x in venues if x['geo:long']]

output = []
for (a, b) in pairwise(geom):
	output.append([a, b])

print "var in_events = ", json.dumps(output, indent=2)
