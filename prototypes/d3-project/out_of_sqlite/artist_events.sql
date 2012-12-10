CREATE TABLE artist_events (
	event_id integer not null,
	artist_name character varying(838) not null,
);

-- CONSTRAINT artist_events_pkey PRIMARY KEY (event_id)

CREATE INDEX artist_events_artist_index
   ON artist_events (artist_name ASC);

CREATE INDEX artist_events_event_index
   ON artist_events (event_id ASC);
