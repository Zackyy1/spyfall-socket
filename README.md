# Spyfall

Spyfall web application based on Spyfall table game and various web apps, such as spyfall.crabhat.com and spyfall.adrianocola.com

## How is it different?

My version is expected to be more advanced and more reliable, giving players more enjoyable expirience with simple design, quick game setup and consistency.

## Update log

Quick update log summary starting from 12.06.19

- [x] Working game core :shipit:
- [x] Select labels to "mark" them
- [x] Socket-based engine, full sync for players
- [x] Adjustable game timer
- [x] Multi-language support (English, Russian)
- [x] Quick response time thanks to ReactJS architecture
- [x] Hide/show role for safety reasons
- [ ] Spyfall 2 locations support
- [ ] Estonian language
- [ ] Major UI improvements (First project after all ¯\_(ツ)_/¯)

## Technologies used

This project is made with React, Socket.io as a server and Firebase Firestore database speaks for itself.
If you wonder what is saved in the database, it is every player's entered name, game info. Room entries in database older than 4 hours  are removed as soon as someone creates a new room.
