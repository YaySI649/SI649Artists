CREATE TABLE music_data.artists (
	name character varying(35) not null,
	genre character varying(22) not null,
	mbid character varying(36),
	listener integer not null,
	playcount integer not null,
	bio text,
	CONSTRAINT artists_pkey PRIMARY KEY (name)
);

CREATE INDEX artist_name_ucase_index
   ON music_data.artists (upper(name) ASC);
