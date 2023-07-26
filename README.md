# Oauth2 with Spotify
The goal of this project was to better understand how oauth2 works with Single Page Applications (SPA). The difficulty with SPA is that it is not secure to store the secret key used for autheticating users inside the application. The correct approach is to use an [authorization code with PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)

The application uses the localstorage to store the session token as well as the time the token was created to refresh the token if necessary.

`npm start` to run the project locally on port 3000
