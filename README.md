# Matcha
Matcha is an online dating website that allows users to connect with others based on certain mutual criteria.

## Requirements
- NodeJS
- JavaScript
- Bootstrap
- npm package manager

## Installation
###### Download the source code
- ```[https://github.com/Amaquena/matcha_MYSQL](https://github.com/Amaquena/matcha_MYSQL)```
- Once the source code is downloaded, navigate to the cloned folder in VSCode
- Download NodeJS [here](https://nodejs.org/en/download/) and install it
- Open a new terminal in VSCode and run ```npm install``` to install all the necessary modules needed to run the project

###### Set up and configure the database and web server & run the website
- Once all the necessary modules have been installed, starting the server will automatically create and configure the database.
- Do this by running: ```npm run start_local```
- Navigating to ```http://localhost/phpmyadmin```, you will see the matcha database has been created and configured
- The Matcha homepage will load when navigating to ```http://localhost:5000```

## Code Breakdown & File Structure
- Backend (server-side)
    - JavaScript
    - NodeJS
    - Express (framework for Node)
- Frontend (client-side)
    - HTML
    - CSS
    - Bootstrap
- Database Management Systems
    - MySQL
    - phpmyadmin

###### Folder Breakdown
- config
    - contains .js files for:
        - authorization
        - db connection & configuration 
        - file storage
        - location data
- controllers
    - contains .js files for:
        - sockets (chat system)
        - user data capture
- models
    - contains .js files for models of:
        - chat system
        - likes system
        - token system (verification)
        - user information
        - views
        - database tables
- public
    - img folder container images used for style of website
    - socket handler
    - style.css for website design
- routes
- views - contains all .ejs files for frontend technologies
- .env - configuratin file storing environment variables
- app.js - initialisation file for NodeJS apps
- author - author file containing name/s of contributers to the project
- faker.js - used for dummy data (add more users to the database)
- package.json - manages the project's dependencies, scripts, version etc
- server.js - initialisation file for NodeJS apps (uses app.js)

## Testing
Matcha marking sheet can be found [here](https://github.com/wethinkcode-students/web/blob/master/2%20-%20matcha/matcha.markingsheet.pdf)
###### Tests to be conducted & expected outcomes:
1. ***User account creation***
    - Navigating to the sign-up page, you should be able to sign-up, enter credentials and receive an email 
2. ***User login***
    - Navigating to the login page, you should be able to login using the credentials created
    - User should be able to request a new password via email if forgotten
    - Disconnection is possible from any page
3. ***Extended Profile***
    - Contains the following fields:
        - gender
        - sexual orientation (bisexual if left blank)
        - a short bio
        - list of interests in the form of hashtags
        - images (maximum five, including one used as a profile photo)
    - Is modifiable
    - Once filled in, advanced search is available
4. ***Profile Proposals***
    - List of profile suggestions is available once extended profile is completed
    - Suggestions based off sexual orientation
    - Weighted according to
        - same geographical area
        - max common interests
        - max popularity
5. ***Advanced Search**
    - User can search based on:
        - age range
        - popularity score range
        - one or more tags of interest
6. ***Sorting & filters***
    - Profile proposals & Advanced Search Results are sortable & filterable by:
        - age
        - location
        - popularity
        - tags
7. ***Geolocation***
    - User is geolocated regardless of whether they want to be or not 
    - User can manually enter location
8. ***Popularity Rating***
    - Each user has a popularity scored based on views & likes
9. ***Notifications***
    - User is notified in real-time of the following events:
        - a 'like' of their profile
        - someone has viewed their profile
        - a user 'liked' has 'liked' in return
        - a user does not 'like' the current user anymore
10. ***Consultations***
    - User is able to consult people who have viewed their profile
    - History of profile visits & likes
11. ***Profiles of other users***
    - Public profile of user containes all info they have provided except email and password
    - Displays popularity & connection status/last seen
    - Shows if the user has 'liked' the current user
12. ***User Actions***
    - User can 'like' & 'unlike' another user
    - When two users have both 'liked' each other, chat system is available
    - User who does not have a profile photo cannot 'like' another user
13. ***Postponement & Blocking***
    - User can be blocked if suspected of being a false account
    - Blocked user no longer appears in search results or suggestions & no notifications are generated
14. ***Chat***
    - Two logged in users who have 'liked' each other can chat in real-time
    - User can see from any page if a message was recieved
15. ***UI/UX***
    - App is compatible on Firefox & Chrome
    - Mobile layout does not have elements that overlap
16. ***Security***
    - PHPMyAdmin:
        - user's password is encrypted

## Contributors
@ktrout @Deathshadowown
## Final Mark 96/125
