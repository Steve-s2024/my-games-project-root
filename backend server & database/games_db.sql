drop table if exists chessGame;

create table chessGame(
	id serial primary key,
	name varchar(50) unique not null,
	side char(5) not null,
	difficulty varchar(10) default null,
	layout jsonb not null
);

select * from chessGame