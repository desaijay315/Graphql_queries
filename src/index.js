import { GraphQLServer } from 'graphql-yoga';
import uuidv4 from 'uuid/v4';
//realtionships

//array of users

const users = [{
    id:"1234",
    name:"jay desai",
    email: "jay@jay.com",
    age:27
},{
    id:"5678",
    name:"jhon",
    email: "jhon@jhon.com",
    age:27
},
{
    id:"8910",
    name:"ram",
    email: "ram@ram.com",
    age:27
}];

//array of posts
const posts = [{
    id:'123',
    title:'my new blog',
    body:'new blog body',
    published:true,
    author: '8910'
},{
    id:'456',
    title:'blog 2',
    body:'blog body 2',
    published:false,
    author: '1234'
    },
    {
    id:'789',
    title:'blog 3',
    body:'blog body 3',
    published:true,
    author: '5678'
}];

//Custom Types

const typeDefs = `
    type Query {
        greeting(name: String): String!
        users(query: String):[User!]!
        me: User!
        post(query: String):[Post!]!
    }

    type User{
        id: ID!
        name: String!
        email: String!
        age: Int
        posts:[Post!]!
    }

    type Post{
        id:ID!
        title:String!
        body:String!
        published:Boolean!
        author: User!
    }
`

const resolvers = {
    Query:{
        users(parent,args,ctx,info){
            if(!args.query){
                return users
            }
            return users.filter((user)=>{
                return user.name.toLowerCase().includes(args.query.toLowerCase())
            })
        },
        greeting(parent,args,ctx,info){
            if(args.name){
                return `Hello ${args.name}`
            }else{
                return `hello`
            }
        },
        me(){
            return{
                id:'1233',
                name: 'mike',
                email: 'a@a.com',
                age: 10
            }
        },
        post(parent,args,ctx,info){
            if(!args.query){
                return posts;
            }
            return posts.filter((post) => {
                const body =  post.body.toLowerCase().includes(args.query.toLowerCase())
                const title =  post.title.toLowerCase().includes(args.query.toLowerCase())
                return body || title;
            })
        }
    },
    Post:{
        author(parent,args,ctx,info){
            return users.find((user) =>{
                return user.id === parent.author
            })
        }
    },
    User:{
        posts(parent,args,ctx,info){
            return posts.filter((post) =>{
                return post.author === parent.id
            })
        }
    }
}

const server  = new GraphQLServer({
    typeDefs,
    resolvers
})

// since the property name matches up with a variable with the same name, i am using object property shorthand

const options = {
    port: 8005   
  }

server.start(options, ({ port }) =>
  console.log(
    `Server started, listening on port ${port} for incoming requests.`,
  ),
)