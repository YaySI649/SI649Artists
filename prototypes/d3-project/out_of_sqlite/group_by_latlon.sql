select distinct on (slat, slon) lat, long, substring(lat from 1 for 5) as slat, substring(long from 1 for 5) as slon from venues
-- group by slat, slon
