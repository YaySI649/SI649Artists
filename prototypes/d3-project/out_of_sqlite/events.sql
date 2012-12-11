CREATE TABLE events (
	id integer,
	title character varying(99),
	start_date character varying(19),
	headline_artist character varying(69),
	venue_id integer,
	description text,
	image character varying(50),
	attendance character varying(4),
	reviews character varying(2),
	tag character varying(20),
	url character varying(463),
	website text,
	cancelled boolean
);

CREATE INDEX venue_id_events_index
   ON events (venue_id ASC);


CREATE TABLE events (id integer not null,
	title character varying(99),
	start_date character varying(19),
	headline_artist character varying(69) not null,
	venue_id integer not null,
	description text,
	image character varying(50),
	attendance integer,
	reviews character varying(2),
	tag character varying(20),
	url character varying(463),
	website text,
	cancelled boolean,
	CONSTRAINT events_pkey PRIMARY KEY (id)
);
