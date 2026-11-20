# MTGit
Web application deck editor for the collectable card
game [Magic, the Gathering](https://en.wikipedia.org/wiki/Magic:_The_Gathering). The project is inspired by git
branching principles. It tracks multiple variants of the same deck and allows for their quick comparison and history
tracking.

## Quick Start

Create `apps/api/.env` from `apps/api/.env.example` and set:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
```

```bash
npm install
npm run dev
```

By default, this starts:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`


## Docker

Frontend and API run in one container (the API serves the built frontend). It reads `MONGODB_URI` from
`apps/api/.env` and reaches the recommender of `../mtgit recsys` on the host's port 5000.

```bash
docker compose up -d --build
```

Then open `http://localhost:3000`.

## Code Structure
- [Data Structure Definitions](packages/shared/src)
- [Frontend](apps/frontend)
- [Backend API](apps/api)