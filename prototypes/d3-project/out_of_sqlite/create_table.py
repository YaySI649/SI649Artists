import csv
from sys import argv, stderr
from os import path

lengths = None
with open(argv[1], 'r') as f:
	r = csv.reader(f)
	fnames = r.next()
	print >>stderr, repr(fnames)

	lengths = [0] * len(fnames)
	for row in r:
		for i in xrange(len(fnames)):
			lengths[i] = max(lengths[i], len(row[i]))

	print repr(lengths)

out = "CREATE TABLE %s (%s)"
tname = path.splitext(argv[1])[0]

cols = ",\n".join("%s character varying(%d)" % (c, l) for c, l in zip(fnames, lengths))

print out % (tname, cols)
