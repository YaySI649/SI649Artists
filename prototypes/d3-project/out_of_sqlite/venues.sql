CREATE TABLE venues (
	id integer,
	name character varying(263),
	url character varying(313),
	website character varying(218),
	phone character varying(86),
	city character varying(98),
	country character varying(38),
	street character varying(95),
	postal character varying(10),
	lat character varying(10),
	long character varying(11)
);

CREATE TABLE venues (
	id integer not null,
	name character varying(263),
	url character varying(313),
	website character varying(218),
	phone character varying(86),
	city character varying(81),
	country character varying(38),
	street character varying(95),
	postal character varying(10),
	lat character varying(17),
	long character varying(18),
	CONSTRAINT venues_pkey PRIMARY KEY (id)
);
