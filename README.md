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


## Code Structure
- [Data Structure Definitions](packages/shared/src)
- [Frontend](apps/frontend)
- [Backend API](apps/api)