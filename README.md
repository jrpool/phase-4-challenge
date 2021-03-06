# Vinyl

A community for record enthusiasts to review their favorite albums.

Part of the application has already been built for you. Your job is to take it to completion.

## Getting Started

Run `$ npm run` to see the list of commands available. To see what each command does, look at `package.json`.

The app uses a basic Express file structure, and includes SQL files to set up the schema and import data.

```sh
src/
  albums.sql          # seed album data
  database.js         # database connection and queries
  package.json        # npm standard
  public/             # static assets go here
  README.md           # you are here
  schema.sql          # define database schema here
  server.js           # web server
  views/              # html templates go here
```

### Setting Up Your Database

Use the following commands to set up and seed your database:

1. Create PostgreSQL database `vinyl`: `$ npm run db:create`
1. Set up database tables from `schema.sql`: `$ npm run db:schema`
1. Load seed data from `albums.sql`: `$ npm run db:seed`

## Implementation Notes

### Disclaimers

This implementation is based on specifications of the Learners Guild Phase 4 Challenge. Per those specifications, this implementation does not adhere, at least not fully, to the following practices:

- Separation of routing functionality into files in a route directory.

- Encryption of passwords.

- Entry of duplicate password for confirmation.

- Footer templates to avoid code repetition.

- Exclusion of logic from routes.

- Singular names of database tables.

- Sessions that persist across server reloads.

- Consistency in use or non-use of ES2015 syntactic innovations.

- Responsive design.

- Delegation of feasible responsibilities to client.

- Dynamic minimal revision of displayed content.

### Deviations

This implementation deliberately deviates from strict adherence to the following requirements:

- “Users can see links to "Sign Up" and "Sign In" when logged out” and “Users can see links to "Profile" and "Sign Out" when logged in”. Those links are suppressed on pages that are identical to the targets of those links.
