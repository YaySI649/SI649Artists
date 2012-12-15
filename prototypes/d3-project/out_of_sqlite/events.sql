CREATE TABLE music_data.events (
	id integer not null,
	title character varying(99),
	start_date character varying(19),
	headline_artist character varying(69) not null,
	venue_id integer not null,
	description text,
	image character varying(50),
	attendance integer,
	reviews integer,
	tag character varying(20),
	url character varying(463),
	website text,
	cancelled boolean,
	CONSTRAINT events_pkey PRIMARY KEY (id)
);

CREATE INDEX venue_id_events_index
   ON music_data.events (venue_id ASC);

CREATE INDEX ucase_name_events_index
   ON music_data.events (upper(headline_artist));
