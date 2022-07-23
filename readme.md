
# Combat Kitchen

_Combat Kitchen_ is a web app for cooking up monster fights in the world's most well-known roleplaying game.

https://combat-kitchen.herokuapp.com/#

## Background Information

_Dungeons & Dragons_ (D&D) is a roleplaying game in which an epic quest is undertaken by a team of fantasy heroes. Most of the players in a game of D&D embody the heroes, and as the game unfolds these players explain how their heroic characters overcome the challenges that they encounter.

One player in a game of D&D has a special role, called “Dungeon Master (DM)” or “Game Master (GM).” The GM’s job is part narrator and part referee. The GM presents obstacles to the heroes and adjudicates the results of their attempts to overcome those obstacles. One type of obstacle that a GM may choose is a monster that the players must defeat.

## Project Audience & Goals

The primary audience for my website is D&D Game Masters who are designing monster encounters for their players. The site allows GMs to browse and filter a database of monsters based on their attributes. GMs are able to build an encounter by choosing combinations of heroes and monsters that can be analyzed for the challenge they pose.

Several online tools exist to assist a GM in planning a monster encounter that will neither be too easy nor too hard for their players to handle. My main inspiration here is [Kobold Fight Club](https://koboldplus.club/#/encounter-builder), though KFC lacks a convenient “monster viewer” (for example, something like can be found at [Open5e](https://open5e.com/monsters/adult-black-dragon)).

My project largely mirrors the functionality of Kobold Fight Club, and extends the functionality to include a monster view. 

## Database

The website stores data in a custom database (see schema below). Data associated with monsters, special abilities, and actions will be pulled from the [D&D 5th Edition API](https://www.dnd5eapi.co/) and stored in the database.

The database also includes information about users to the site, requiring registration, authentication, and password encryption on the server side. Registered users will bel able to modify and save “encounters” (collections of monsters).

![database schema diagram](./db_schema.png)

## Technology Stack

The app's front end uses HTML, CSS, and Javascript at its core, including the jQuery and Boostrap frameworks. The back end is written in Python, using the Flask web app framework and a PostgresSQL database.

## Future Design Goals

- Allow GMs the ability to edit monsters and save their customized monsters for future use. This would bring functionality similar to other online tools, like the flagship D&D product: [D&D Beyond](https://www.dndbeyond.com/monsters).

- Add spells to the model and allow cross-referencing of monsters and spells for easy lookup. Some monsters can cast magic spells, the details of which are not included in the monster statistics. It would be very convenient to enable GMs to quickly reference spells.

## Credits

The favicon is [kitchen knives](https://game-icons.net/1x1/lorc/kitchen-knives.html) by Lorc, available from [game-icons.net](https://game-icons.net/) and used under a [CC-BY 3.0 license](https://creativecommons.org/licenses/by/3.0/).
