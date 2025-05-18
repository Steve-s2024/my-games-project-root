you can access the program at github page: https://steve-s2024.github.io/my-games-project-root/ChessGame
if you want to contribute instead of playing, you can run it on your local computer by following the instruction below

the project consist of two part
  1. frontend Vus.js
  2. backend Express server & PostgreSQL database

this folder contains both ends

to run the application
  1. go to 'frontend vue.js' folder
  2. open git bash in the folder and execute --> npm run serve
  3. if you see a live server is available on your computer (usually http://localhost:8080), then by access the address with your browser, the game application will show up.
       (of course, you may not be able to use some of the functionalities that require the backend support, such as storing chess game in database)
     
you shouldn't be able to use the backend database since it is configured to only recognized my postgresql databse with my user name and password. so, the project can't really support you to run the backend service.
unless if you have postgreSQL and pgAdmin and know how to configure the database information to suit your case. 
  
  you can open the file '/backend server & database/server.js' 
  locate this part of the code:
          
          const pool = new Pool({
              user: 'postgres',
              host: 'localhost',
              database: 'games_db',
              password: 'S434567056s$',
              port: 5432
          });

  change the information to match your pgAdmin information. port, database, and host information should remain the same

            
if you made the changes, now create the database
  1. enter pgadmin and then create a database called 'games_db'
  2. open the file '/backend server & database/games_db.sql' in your pgAdmin
  3. run the sql script, it will create the database
  4. if the sql script execute successfully, then the database have been created

if you created the database, now turn on the backend server
  1. go back to the root folder, then enter the 'backend server & database' folder
  2. open git bash in the folder and execute --> node server.js
  3. if you see a message 'server running on port 3000', then the backend server is now turned on.
  4. now you can enjoy all the functionalities.

