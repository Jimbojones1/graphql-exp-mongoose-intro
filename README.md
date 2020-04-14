# Graphql-Express-Mongoose-Intro

### What is Grapql? It's Awesome

-  GraphQL is a language, created by facebook. It allows us to declartively communicate anytype of request to a backend dataservice.  Which means we can define what we want and what we want returned.  In order to implement graphql on our server we create a runtime layer (think of it as a controller, at a route), that we can expose to a client that will translate our graphql queires for whatever our data layer/model happens to be.  Since this data layer aka our server can be written in any language this can decouple our clients from our servers because regardless of what en point we are using we can use graphql as the query language to make request to query (get data) or mutate(write data) to our backend data service. This allows our applications to scale independently of each other.  

- It is also a self documenting API, as you will see.

### Setup 

Install the following modules

```
npm install express-graphql graphql graphql-tools
```

1.  [express-grapql](https://www.npmjs.com/package/express-graphql) allows us to create an http-server middleware to be able to accept and read graphql requests
2.  [graphql](https://www.npmjs.com/package/graphql) an implemation of the graphql query language in javascript
3.  [graphql-tools](https://www.npmjs.com/package/graphql-tools) gives us a bunch useful methods to create graphql schemas.

### Future JS in the server

- Notice we are using import in the server we can do this because I set up the server to run with babel, which allows us to run future versions of javascript to do this you need a ```.babelrc``` file which looks like the following,

```
{
  "presets": [
    "env",
    "stage-0"
  ]
}
```

- and our ```start``` command in our package.json will look like the following, 

```
"start": "nodemon ./index.js --exec babel-node -e js"
```

### Lets get started setting up our Schema.  

```data/schema.js
import { makeExecutableSchema } from 'graphql-tools';
import { resolvers } from './resolvers';
const typeDefs = `

  type Dog {
    id: ID
    firstName: String
    lastName: String
    gender: Gender
    email: String
    age: Int
    parents: [Parent]
  }

  type Parent {
    firstName: String
    lastName: String
  }

  type Query {
    getDogs: [Dog]
  }

  enum Gender {
    MALE
    FEMALE
    OTHER
  }


`;


export default makeExecutableSchema({typeDefs, resolvers});
```

- What we are doing here is Creating our schema for our querys.  So you will notice that in our `typeDefs` for our type Dog, it is almost identical to our DB schema, we can choose whatever we want to query, so we can have as many or as little attributes as we want.  

- You will also notice in the `parents` property of the `type Dog` we are using another custom type def `Parent` to define what the data in the array will look like, just like we can in Mongo.  

- We also have a new data type we have encountered here called an enum.  The enum keyword is used to declare an enumeration, a distinct type that consists of a set of named constants called the enumerator list. So our named constants in this case is notice all Capital MALE, FEMALE, or OTHER, so that basically means those are your three choices.  

- We also create a type of `Query` so this is a reserved word in graphql that is defining the name of a query on the schema and what type to return when this `Query` is invoked.  

- We are then creating this schema when we are exporting it, we pass it the the `typeDefs`, which is what our schema looks like, and we also pass it the resolvers, which is where we are going to define what are `Query`'s do, or how they work.  

### Resolvers 

Per the docs 

*When using graphql-tools, you define your field resolvers separately from the schema. Since the schema already describes all of the fields, arguments, and result types, the only thing left is a collection of functions that are called to actually execute these fields.*

- So this basically means this is where we are going to define how our Query's get our data (there is also Mutations, (which is adding, deleting, or updating things in the database.


```data/query.js
import mongoose from 'mongoose';
import Dog from '../models/dog';


export const resolvers = {
  Query: {
    getDogs: async () => {
      try {
        const dogs = await Dog.find();

        return dogs;

      } catch(err){
        return err
      }
    }
  }
}

```

- So like the docs say our resolvers are a group of functions that we define in order to execute the queries define in our schema.  

- You will notice the `getDogs` in the `Query` matches the `type Query` definition in our schema.js which has a query defined as `getDogs`, these have to match. 

### Setting up the server 

- So now we have to setup our grapql endpoint as middleware in order to process all the graphql requests. 

```index.js
import express     from 'express';
import graphqlHTTP from 'express-graphql';
import schema      from './data/schema';
const app = express();

require('./db')

app.get('/', (req, res) => {
  res.send('app is working')
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}));

app.listen(3000, () => {
  console.log('server is running')
});
```

- We import the `express-graphql` function to create our grapql http server. This object as you can see takes an options object, that we will define the `schema` from our schema.  

- `graphiql` when set to true, gives us a playground in order to simulate Querys and Mutations in graphql, that is kind of like postman you will see in a second.  


- Now lets go ahead and start our server by running 

`npm start` - Note do not run nodemon your code will not work, read what is in npm start.  The code needs to be babelified everytime we start the server.  

- then go to `localhost:3000/graphql` to view our server

### Graphiql 

- this is a playground where we can make sample queries and mutations in graphql. To make our first Query, on the left hand side is where we make our queries.  A normal query looks like the following 

```
query{
  getDogs {
 	id
  }
}
```

1.  Define the type of request we are making, in this case `query`, 
2.  Define the query we are making, which remember is defined in our schema, and is executed by a resolver.  
3.  Define the type of fields we want returned

- **Documentation Explorer** On the write hand side will tell you the types of queries and mutations that are availiable and what the should return 


### Mutations

- By convention in graphql any request that is going to make a `write` action to the database (Create, Update, Delete) will be defined by a mutation.  

- lets update are schema to define a mutation
```javascript
  input ParentInput {
    firstName: String
    lastName: String
  }

  input DogInput {
    id: ID
    firstName: String
    lastName: String
    gender: Gender
    email: String
    age: Int
    parents: [ParentInput]
  }

  type Mutation {
    createDog(input: DogInput): Dog
  }
```

- Notice here at the bottom just like the with the `Query` we are defining the name of our mutation which will be defined in our resolver, (what its input will be, aka its argument), and what will be returned `Dog`, which was defined earlier as type `type Dog`.  

- The `input` type in graphql allows us to specify what arguments to our resolvers need to look like.  Just like our queries we can specify inputs inside of inputs like we are doing with `parents: [ParentInput]`.  

### Resolvers with Mutations

data/resolvers.js
```javascript
import mongoose from 'mongoose';
import Dog from '../models/dog';


export const resolvers = {
  Query: {
    getDogs: async () => {
      try {
        const dogs = await Dog.find();

        return dogs;

      } catch(err){
        return err
      }
    }
  },
  Mutation: {
    createDog: async (parent, args) => {
      console.log(args)
      try {
        const newDog = await Dog.create(args.input);

        return newDog

      } catch(err) {
        return err
      }
    }
  }
}
```

- We define a property on our Resolver called `Mutation` which will contain all our functions that perform mutations on our data.  

**ALL GRAPHQL QUERY'S and MUTATIONS** accept four arguments 

1.  parent: The result of the previous resolver call, ours will be nul, but we still have to pass it.
2.  args: The arguments of the resolver’s field (We defined in the Schema).
3.  context: A custom object each resolver can read from/write to. (for example, you can use this to access the session object, so `context.session` or you just change the arguemnt to `req`, so you can use `req.session` if that makes more sense. 
4.  info: Contains information about AST, (stands for Abstract Syntax Tree, which is how graphql parses the query language), which allow our resolves to know which fields to return, we don't really have to worry about this arguemnt. 

- Also remember arguments can be named anything that just live in that order defined above.  

### Sample Mutation in Graphiql

- So on the left hand side just as before, we can define a Mutation like the folloiwng

```graphql
mutation{
  createDog(input: {
    firstName: "Franklin",
    lastName: "Haff",
    gender: MALE,
    age: 5,
    parents:{
      firstName: "Linda",
      lastName: "Haff"
    }
  }) {
 		id
    firstName
    gender
    parents{
      firstName
    }
  }
}
```

- So we defined the type `mutation`, then we define what resolver we are using, in this case `createDog`,  as its argument it takes an 
```graphql
input: {
    firstName: "Franklin",
    lastName: "Haff",
    gender: MALE,
    age: 5,
    parents:{
      firstName: "Linda",
      lastName: "Haff"
    }
  }
  ```
  
  Which is just the fields that you are sending over as an argument to your mutation.   
  
  - Then you can specify WHATEVER return data you want,  
  ```javascript
mutation{
  createDog(input: {
    firstName: "Franklin",
    lastName: "Haff",
    gender: MALE,
    age: 5,
    parents:{
      firstName: "Linda",
      lastName: "Haff"
    }
  }) {
		id
    firstName
    gender
    parents{
      firstName
    }
  }
}
```
- Which is defined with the id, firstName, gender, and so on. 
- Go ahead try others out 

### Reading a single Dog

- Lets update our schema to include a query to that finds a single Dog

```data/schema.js

  type Query {
    getOneDog(id: ID!): Dog
    getDogs: [Dog]
  }
```

- All we have to do is a function name here that takes an `id` as the input, notice the `ID!`, the exclamation point makes the input required, you can do this on any field in the schema.  And we are specifiying that we are returning a dog.  

- Now lets update our resolver

```data/resolvers.js

 Query: {
    getOneDog: async (root, {id}) => {

      try {

        const foundDog = await Dog.findById(id);

        return foundDog;

      } catch(err) {
        console.log(err, ' this is')
        return err
      }

    },
    getDogs: async () => {
      try {
        const dogs = await Dog.find();

        return dogs;

      } catch(err){
        return err
      }
    }
  },
  Mutation: (...rest of mutation code)

```

- Just as before, (I hope you see the pattern now, if not reread this like TWENTY more times), we define a function that has the same name as the query defined in our schema.  Also note instead of writing `args` as the second parameter I'm using javascript to [desctructering](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) the object into variables. 


**Onto the Query**

- Back in our graphiql playground we can make the query like the following, 
note first we have to find an id.  

```graphql
query {
  getOneDog(id: "5bffe94873f05624cd8c6acd") {
	    id
	    firstName
	    lastName
	    parents{
	      lastName
	    }
	}
}
```

- Just as before, we specify the type of query, the arguemnt (in double qoutes) and then specify what we want returned from the query.  


## Further Practice

*Pay attention if you are doing a tutorial if it is Graphql 1.x or 2.x*

- I trust that you can figure out how to delete something and update something (note these will be mutations, because you are changing data), The answers are in a branch on this repo

- [Thinking in Graphs](https://graphql.org/learn/thinking-in-graphs/), I'd recommend reading throught the best practices documentation.  
